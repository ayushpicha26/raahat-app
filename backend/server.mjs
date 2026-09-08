import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getDB } from './server/db.mjs';
import { authMiddleware } from './server/auth.mjs';
import authRouter from './server/routes/users.mjs';
import caseRouter from './server/routes/cases.mjs';
import { assessRoute, verifyCasteCertificateRoute } from './server/ai.mjs';
import { getGovernmentData } from './server/data/governmentSchemes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);

// Initialize PostgreSQL database
const db = await getDB();
app.locals.db = db;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(authMiddleware);

// API Routes
app.get('/api/health', async (req, res) => {
  let dbOk = false;
  try {
    if (db) {
      await db.query('SELECT 1');
      dbOk = true;
    }
  } catch (err) {
    dbOk = false;
  }

  res.json({
    ok: true,
    dbConnected: dbOk,
    dbType: 'postgresql',
    aiConfigured: false,
    nlpReady: true
  });
});

app.use('/api/auth', authRouter);
app.use('/api/cases', caseRouter);
app.post('/api/ai/assess', assessRoute);
app.post('/api/ai/verify-document', verifyCasteCertificateRoute);
app.get('/api/government-data', getGovernmentData);

// Help Centers API — returns nearby centers sorted by distance
app.get('/api/help-centers', async (req, res) => {
  const { lat, lng, type, limit } = req.query;

  try {
    let query = 'SELECT * FROM help_centers';
    const params = [];

    if (type && type !== 'all') {
      params.push(type);
      query += ` WHERE type = $1`;
    }

    const result = await db.query(query, params);
    let centers = result.rows;

    // If lat/lng provided, calculate distances and sort
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      function haversine(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }

      centers = centers.map(c => ({
        ...c,
        distance_km: Math.round(haversine(userLat, userLng, c.latitude, c.longitude) * 10) / 10
      })).sort((a, b) => a.distance_km - b.distance_km);
    }

    const maxResults = parseInt(limit, 10) || 50;
    res.json({ centers: centers.slice(0, maxResults) });
  } catch (err) {
    console.error('Help centers error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// Serve static build files in production
app.use(express.static(join(__dirname, '..', 'frontend', 'dist')));

// Fallback to index.html for React Router (Single Page Application support)
app.get(/.*/, (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.'
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`RAAHAT Production API Server listening on port ${port} (PostgreSQL)`);
});

/**
 * 4_backend/server.mjs — Server Entry Point (PostgreSQL)
 *
 * Starts the Express application
 * Uses PostgreSQL database + LOCAL ML engine from 5_ml_engine/ — NO Gemini dependency
 */

import 'dotenv/config';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

import getDB from './db/connection.js';
import { authMiddleware } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import caseRouter from './routes/cases.js';
import assessmentRouter from './routes/assessment.js';
import rateLimit from 'express-rate-limit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);

// Configure CORS with restricted origins from env
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : [];
app.use(cors({ origin: allowedOrigins }));

// Security headers via Helmet
app.use(helmet());

// Limit JSON request body size to 1 MiB to prevent abuse
app.use(express.json({ limit: '1mb' }));

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// ── Middlewares ──
app.use(authMiddleware);

// ── Database ──
const db = getDB();
app.locals.db = db;

// Apply PostgreSQL schema
const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.postgresql.sql'), 'utf8');
await db.exec(schema);

// ── API Routes ──
app.get('/api/health', async (req, res) => {
  try {
    const tables = (
      await db.all("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
    ).map(t => t.table_name);

    res.json({
      ok: true,
      dbConnected: Boolean(db),
      databaseType: 'PostgreSQL',
      aiMode: 'local-ml-engine',
      tables
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/users', authRouter);
app.use('/api/cases', caseRouter);
app.use('/api/assessment', assessmentRouter);

// ── Serve Static Files (React Build) ──
const frontendDist = path.join(__dirname, '..', '3_frontend', 'dist');
app.use(express.static(frontendDist));

// ── Fallback to index.html for React Router ──
app.get(/.*/, (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// ── Error Handling ──
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.'
  });
});

// ── Start Server ──
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 RAAHAT Backend Server listening on port ${port}`);
  console.log(`🐘 Database: PostgreSQL (raahat)`);
  console.log(`🧠 ML Engine: LOCAL (no Gemini dependency)`);
});

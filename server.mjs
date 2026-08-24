import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getDB } from './server/db.mjs';
import { authMiddleware } from './server/auth.mjs';
import authRouter from './server/routes/users.mjs';
import caseRouter from './server/routes/cases.mjs';
import { assessRoute } from './server/ai.mjs';
import { getGovernmentData } from './server/data/governmentSchemes.mjs';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);

// Initialize SQLite database
const db = getDB();
app.locals.db = db;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(authMiddleware);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    dbConnected: Boolean(db),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY)
  });
});

app.use('/api/auth', authRouter);
app.use('/api/cases', caseRouter);
app.post('/api/ai/assess', assessRoute);
app.get('/api/government-data', getGovernmentData);

// Serve static build files in production
app.use(express.static(join(__dirname, 'dist')));

// Fallback to index.html for React Router (Single Page Application support)
app.get(/.*/, (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(join(__dirname, 'dist', 'index.html'));
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
  console.log(`RAAHAT Production API Server listening on port ${port}`);
});

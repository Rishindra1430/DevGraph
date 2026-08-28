import './config/env.js'; // Load and validate environment variables first
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ============================================================
// CORS
// Allow the Vite dev server and production frontend to
// call this API. Origins are configurable via CORS_ORIGIN env.
// ============================================================

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, same-origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS: Origin "${origin}" is not allowed.`)
      );
    },
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
  })
);

// ============================================================
// Request parsing
// ============================================================

app.use(express.json());

// ============================================================
// API routes
// ============================================================

app.use('/api', apiRouter);

// ============================================================
// 404 — route not found
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    error: `Route "${req.method} ${req.path}" not found.`
  });
});

// ============================================================
// Centralized error handler
// ============================================================

app.use(errorHandler);

// ============================================================
// Start server
// ============================================================

app.listen(env.port, () => {
  console.log('');
  console.log('DevGraph API Server');
  console.log('─────────────────────────────────────');
  console.log(`Port:      ${env.port}`);
  console.log(`CORS:      ${allowedOrigins.join(', ')}`);
  console.log(`Database:  ${env.neo4jDatabase}`);
  console.log('');
  console.log('Routes mounted:');
  console.log('  GET /api/health');
  console.log('  GET /api/developers');
  console.log('  GET /api/technologies');
  console.log('  GET /api/explore');
  console.log('  GET /api/network');
  console.log('  GET /api/connections');
  console.log('');
  console.log('Server ready.');
  console.log('');
});

export default app;

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import crypto from 'crypto';

import env from './config/env.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import itemRoutes from './routes/item.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import outfitRoutes from './routes/outfit.routes.js';
import wearRoutes from './routes/wear.routes.js';
import statsRoutes from './routes/stats.routes.js';
import suggestionRoutes from './routes/suggestion.routes.js';
import duplicateRoutes from './routes/duplicate.routes.js';

const app = express();
const PORT = process.env.PORT || env.PORT || 4000;

// 1. Security & Proxy Configuration
app.disable('x-powered-by');

if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Enable proxy trust behind Render / reverse proxies
}

// 2. Security headers (before all routes)
app.use(helmet());

// 3. Response compression
app.use(compression());

// 4. Request ID tagging
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
});

// 5. Strict CORS Configuration (no wildcards)
const allowedOrigins = (env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, server-to-server) or matching origin
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

// 6. Request hardening: 100kb payload limit & reject malformed JSON
app.use(express.json({ limit: '100kb' }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON', requestId: req.id });
  }
  next(err);
});

// 7. Cookie Parser
app.use(cookieParser());

// 8. Health check endpoint (does NOT touch the database)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
  });
});

// 9. General Rate Limiter (300 requests per 15 min on /api, skips auth & uploads which have dedicated limits)
app.use('/api', apiLimiter);

// 10. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/outfits', outfitRoutes);
app.use('/api/wear', wearRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/duplicates', duplicateRoutes);

// 11. 404 handler for unknown /api routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// 12. Root fallback endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'OutWear API',
    status: 'online',
    health: '/api/health',
  });
});

// 13. Centralized Error Handler (must be mounted after all routes)
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`OutWear server running on port ${PORT} (0.0.0.0)`);
  console.log(`Health check available at http://0.0.0.0:${PORT}/api/health`);
});

export { app };
export default app;

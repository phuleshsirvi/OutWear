import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import itemRoutes from './routes/item.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (.env in server or root fallback)
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'OutWear server is healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/uploads', uploadRoutes);

// Root fallback endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'OutWear API',
    status: 'online',
    health: '/api/health',
  });
});

// Central Error Handler (must be mounted after all routes)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`OutWear server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
});

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getStats } from '../controllers/stats.controller.js';

const router = Router();

// Protect all stats endpoints with existing auth middleware
router.use(requireAuth);

// GET /api/stats
router.get('/', getStats);

export default router;


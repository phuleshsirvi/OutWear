import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { checkDuplicate } from '../controllers/duplicate.controller.js';

const router = Router();

// Protect all duplicate routes with auth middleware
router.use(requireAuth);

// POST /api/duplicates/check
router.post('/check', checkDuplicate);

export default router;


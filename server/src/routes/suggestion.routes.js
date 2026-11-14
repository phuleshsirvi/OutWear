import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getOutfitSuggestions } from '../controllers/suggestion.controller.js';

const router = Router();

// Protect all suggestion routes with auth middleware
router.use(requireAuth);

// POST /api/suggestions
router.post('/', getOutfitSuggestions);

export default router;


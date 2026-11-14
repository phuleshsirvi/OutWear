import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Public auth routes (rate limited to 10 requests per 15 mins per IP)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);

// Protected auth routes
router.get('/me', requireAuth, getMe);

export default router;

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { uploadImageMiddleware } from '../middleware/upload.middleware.js';
import { uploadImage } from '../controllers/upload.controller.js';
import { uploadLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Protect upload route with authentication middleware
router.use(requireAuth);

// POST /api/uploads/image (rate limited to 30 uploads per hour per user/IP)
router.post('/image', uploadLimiter, uploadImageMiddleware, uploadImage);

export default router;

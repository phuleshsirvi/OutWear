import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { uploadImageMiddleware } from '../middleware/upload.middleware.js';
import { uploadImage } from '../controllers/upload.controller.js';

const router = Router();

// Protect upload route with authentication middleware
router.use(requireAuth);

// POST /api/uploads/image
router.post('/image', uploadImageMiddleware, uploadImage);

export default router;

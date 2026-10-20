import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  createItem,
  getItems,
  getItemById,
} from '../controllers/item.controller.js';

const router = Router();

// Protect all item routes with existing auth middleware
router.use(requireAuth);

// Routes
router.post('/', createItem);
router.get('/', getItems);
router.get('/:id', getItemById);

export default router;

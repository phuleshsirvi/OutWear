import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  createItem,
  getItems,
  getItemFilters,
  getItemById,
} from '../controllers/item.controller.js';

const router = Router();

// Protect all item routes with existing auth middleware
router.use(requireAuth);

// Routes
router.post('/', createItem);
router.get('/', getItems);
// Declared BEFORE /:id so 'filters' is not interpreted as an item ID parameter
router.get('/filters', getItemFilters);
router.get('/:id', getItemById);

export default router;

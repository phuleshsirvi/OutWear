import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  createItem,
  getItems,
  getItemFilters,
  getUnderused,
  getItemById,
  updateItem,
  deleteItem,
} from '../controllers/item.controller.js';

const router = Router();

// Protect all item routes with existing auth middleware
router.use(requireAuth);

// Routes
router.post('/', createItem);
router.get('/', getItems);
// Declared BEFORE /:id so these paths are not treated as an item ID parameter
router.get('/filters', getItemFilters);
router.get('/underused', getUnderused);
router.get('/:id', getItemById);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;

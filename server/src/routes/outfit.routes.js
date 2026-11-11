import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  createOutfit,
  getOutfits,
  getOutfitById,
  updateOutfit,
  deleteOutfit,
} from '../controllers/outfit.controller.js';

const router = Router();

// Protect all outfit routes with existing auth middleware
router.use(requireAuth);

router.post('/', createOutfit);
router.get('/', getOutfits);
router.get('/:id', getOutfitById);
router.put('/:id', updateOutfit);
router.delete('/:id', deleteOutfit);

export default router;


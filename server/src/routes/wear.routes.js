import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  logItemWear,
  logOutfitWear,
  getWearHistory,
  deleteWearLog,
} from '../controllers/wear.controller.js';

const router = Router();

// Protect all wear routes with existing auth middleware
router.use(requireAuth);

router.post('/item/:itemId', logItemWear);
router.post('/outfit/:outfitId', logOutfitWear);
router.get('/history', getWearHistory);
router.delete('/:logId', deleteWearLog);

export default router;


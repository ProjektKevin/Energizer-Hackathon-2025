import express from 'express';
import foodRoutes from './foodRoutes.js';
import aiRoutes from './aiRoute.js';
import trackerRoutes from './trackerRoute.js';

const router = express.Router();

router.use('/foods', foodRoutes);
router.use('/ai', aiRoutes);
router.use('/tracker', trackerRoutes);

export default router;
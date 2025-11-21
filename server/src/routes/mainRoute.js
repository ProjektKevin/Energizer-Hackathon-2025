import express from 'express';
import foodRoutes from './foodRoutes.js';
import mealRoutes from './mealRoutes.js';
import statsRoutes from './statsRoutes.js';

const router = express.Router();

router.use('/foods', foodRoutes);
router.use('/meals', mealRoutes);
router.use('/stats', statsRoutes);

export default router;
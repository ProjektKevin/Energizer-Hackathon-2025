import express from 'express';
import foodRoutes from './foodRoutes.js';
import mealRoutes from './mealRoutes.js';

const router = express.Router();

router.use('/foods', foodRoutes);
router.use('/meals', mealRoutes);

export default router;
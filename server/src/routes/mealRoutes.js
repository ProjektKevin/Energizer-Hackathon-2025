import express from 'express';
import { logMeal } from '../controllers/mealController.js';

const router = express.Router();

router.post('/', logMeal);

export default router;
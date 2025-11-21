import express from 'express';
import { logMeal, getMeals, deleteMealFood } from '../controllers/mealController.js';

const router = express.Router();

router.post('/', logMeal);
router.get('/', getMeals);
router.delete('/food/:mealFoodId', deleteMealFood); 
export default router;
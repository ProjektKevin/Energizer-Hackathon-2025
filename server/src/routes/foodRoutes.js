import express from 'express';
import { getAllFoods, getFoodById } from '../controllers/foodController.js';

const router = express.Router();

router.get('/', getAllFoods);
router.get('/:id', getFoodById);

export default router;
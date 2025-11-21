import express from 'express';
import { getDailyStats } from '../controllers/statsController.js';

const router = express.Router();

router.get('/daily', getDailyStats);

export default router;
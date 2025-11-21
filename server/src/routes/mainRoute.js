import express from 'express';
import foodRoutes from './foodRoutes.js';

const router = express.Router();

router.use('/foods', foodRoutes);

export default router;
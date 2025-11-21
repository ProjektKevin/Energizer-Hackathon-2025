import express from 'express';
import { getProfile, updateProfile, addAllergy, deleteAllergy } from '../controllers/profileController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All profile routes are protected - require login
router.get('/', authMiddleware, getProfile);
router.put('/', authMiddleware, updateProfile);
router.post('/allergies', authMiddleware, addAllergy);
router.delete('/allergies/:id', authMiddleware, deleteAllergy);

export default router;
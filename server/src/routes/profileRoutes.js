import express from 'express';
import { getProfile, updateProfile, addAllergy, deleteAllergy } from '../controllers/profileController.js';

const router = express.Router();

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/allergies', addAllergy);
router.delete('/allergies/:id', deleteAllergy);

export default router;
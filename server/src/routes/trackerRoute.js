import express from 'express';

import * as trackerController from '../controllers/trackerController.js';

const router = express.Router();

// ----- Routes -----
router.post('/:user_id', trackerController.createNewFoodLog);


export default router;
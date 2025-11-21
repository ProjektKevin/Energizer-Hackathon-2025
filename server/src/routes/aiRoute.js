import express from 'express';
import * as aiController from '../controllers/aiController.js';

const router = express.Router();

// ----- Routes -----
router.post('/quickRecordSTT', aiController.upload.single('audio'), aiController.speechToText, aiController.detectFoodAndCalory);
router.post("/process", aiController.processMultimodalRequest);


export default router;
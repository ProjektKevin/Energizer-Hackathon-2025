import express from 'express';

import sampleRoutes from './sampleRoute.js';
import aiRoutes from './aiRoute.js';

// Set up router
const router = express.Router();

router.use('/sample', sampleRoutes);
router.use('/ai', aiRoutes);

// export the router
export default router;
import express from 'express';
import { getHallAvailability } from '../controllers/weddingControllers.js';

const router = express.Router();

// STEP 1: Read hall availability.
router.get('/halls/availability', getHallAvailability);

export default router;

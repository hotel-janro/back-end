import express from 'express';
import { createPoolBooking, listPoolBookings } from '../controllers/poolBookingController.js';

const router = express.Router();

router.get('/', listPoolBookings);
router.post('/', createPoolBooking);

export default router;
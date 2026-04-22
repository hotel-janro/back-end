import express from 'express';
import { createBooking, deleteBookingRequest, getHallAvailability, updateBookingStatus } from '../controllers/weddingControllers.js';

const router = express.Router();

// STEP 1: Read hall availability.
router.get('/halls/availability', getHallAvailability);

// STEP 2: Create booking request.
router.post('/bookings', createBooking);

// STEP 3: Update booking status.
router.put('/bookings/:id/status', updateBookingStatus);

// STEP 4: Delete booking request.
router.delete('/bookings/:id', deleteBookingRequest);

export default router;

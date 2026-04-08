import express from 'express';
import {
    createBooking,
    getBookings,
    getMyBookings,
    getBookingById,
    updateBookingStatus,
    cancelMyBooking
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', createBooking);

router.get('/my', protect, getMyBookings);
router.patch('/:id/cancel', protect, cancelMyBooking);

router.get('/', protect, authorize('admin', 'manager', 'staff'), getBookings);
router.get('/:id', protect, getBookingById);
router.patch('/:id/status', protect, authorize('admin', 'manager', 'staff'), updateBookingStatus);

export default router;

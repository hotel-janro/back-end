import express from 'express';
import {
    getAdminRooms,
    getRoomAdminStats,
    getRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
    restoreRoom,
    updateRoomAvailability
} from '../controllers/roomController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin/list', protect, authorize('admin', 'manager'), getAdminRooms);
router.get('/admin/stats', protect, authorize('admin', 'manager'), getRoomAdminStats);

router.get('/', getRooms);
router.get('/:id', getRoomById);

router.post('/', protect, authorize('admin', 'manager'), createRoom);
router.put('/:id', protect, authorize('admin', 'manager'), updateRoom);
router.patch('/:id/availability', protect, authorize('admin', 'manager'), updateRoomAvailability);
router.patch('/:id/restore', protect, authorize('admin'), restoreRoom);
router.delete('/:id', protect, authorize('admin'), deleteRoom);

export default router;

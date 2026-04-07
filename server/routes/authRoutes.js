import express from 'express';
import { register, login, getMe, updateUserRole, getAllUsers } from '../controllers/authControllers.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (any logged-in user)
router.get('/me', protect, getMe);

// Admin-only routes
router.get('/users', protect, authorize('admin'), getAllUsers);
router.put('/users/:id/role', protect, authorize('admin'), updateUserRole);

// Admin + Manager routes (example)
// router.get('/dashboard', protect, authorize('admin', 'manager'), getDashboard);

export default router;
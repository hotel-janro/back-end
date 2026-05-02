import express from 'express';
import { register, login, refresh, getMe, updateUserRole, getAllUsers, createStaff, updateUser, deleteUser, changePassword } from '../controllers/authControllers.js';

import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);


// Protected routes (any logged-in user)
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

// Admin-only routes
router.get('/users', protect, authorize('admin'), getAllUsers);
router.put('/users/:id/role', protect, authorize('admin'), updateUserRole);
router.post('/users', protect, authorize('admin'), createStaff);
router.put('/users/:id', protect, authorize('admin'), updateUser);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

// Admin + Manager routes (example)
// router.get('/dashboard', protect, authorize('admin', 'manager'), getDashboard);

export default router;
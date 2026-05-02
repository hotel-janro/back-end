import User from '../models/user.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';


// Register new user (always registers as 'customer')
export const register = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, phone } = req.body;

        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, password and confirmPassword'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Create new user (password will be hashed by the pre-save middleware)
        // Role defaults to 'customer' — only admins can assign other roles
        const user = await User.create({
            name,
            email,
            password,
            confirmPassword,
            phone
        });

        // Generate both Access and Refresh tokens
        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id, user.role);


        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: accessToken,
                refreshToken
            }


        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check if user exists and include password field
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        // Compare password
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        // Generate both Access and Refresh tokens
        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id, user.role);


        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: accessToken,
                refreshToken
            }


        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Get current user profile
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create staff user (Admin only)
export const createStaff = async (req, res) => {
    try {
        const { name, email, phone, role, department, salary, joinDate, status } = req.body;

        if (!name || !email) {
            return res.status(400).json({ success: false, message: 'Name and email are required' });
        }

        // Allow all staff roles (admin role cannot be assigned via this endpoint)
        const allowedRoles = ['staff', 'manager', 'receptionist', 'chef', 'waiter', 'housekeeping', 'security', 'maintenance'];
        const assignedRole = (role || 'staff').toLowerCase();
        if (!allowedRoles.includes(assignedRole)) {
            return res.status(400).json({ success: false, message: 'Invalid role for this endpoint' });
        }

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ success: false, message: 'User already exists' });

        // Generate a temporary password for staff — admin should instruct staff to reset
        const tempPassword = `Staff@${Math.random().toString(36).slice(2,8)}`;

        const user = await User.create({
            name,
            email,
            password: tempPassword,
            confirmPassword: tempPassword,
            phone,
            role: assignedRole,
            department,
            salary,
            joinDate,
            status
        });

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                department: user.department,
                salary: user.salary,
                joinDate: user.joinDate,
                status: user.status
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update user role (Admin only)
export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const validRoles = ['customer', 'manager', 'admin', 'staff'];

        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
            });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.role = role;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update user details (Admin only)
export const updateUser = async (req, res) => {
    try {
        const allowed = ['name', 'phone', 'role', 'department', 'salary', 'joinDate', 'status', 'email'];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Prevent demoting the last admin or modifying admin via this route? Keep simple: allow edits but prevent role change to admin here
        if (updates.role && updates.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot assign admin role via this endpoint' });
        }

        Object.assign(user, updates);
        await user.save({ validateBeforeSave: false });

        res.status(200).json({ success: true, data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            department: user.department,
            salary: user.salary,
            joinDate: user.joinDate,
            status: user.status
        }});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete user (Admin only)
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot delete admin users' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Refresh Token Controller - Generates a new Access Token using a valid Refresh Token
export const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Refresh Token is required' });
        }

        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        // Find the user to make sure they still exist
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Generate a new Access Token (15 min)
        const newAccessToken = generateAccessToken(user._id, user.role);

        res.status(200).json({
            success: true,
            token: newAccessToken
        });
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired refresh token. Please login again.' 
        });
    }
};

// Change Password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'Please provide all fields' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'New passwords do not match' });
        }

        // Find user by ID and include password
        const user = await User.findById(req.user._id).select('+password');

        // Check if current password matches
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect current password' });
        }

        // Set new password
        user.password = newPassword;
        user.confirmPassword = confirmPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

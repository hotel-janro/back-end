import User from '../models/user.js';
import { generateToken } from '../utils/generateToken.js';

// Register new user (always registers as 'customer')
export const register = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, phone } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
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

        // Generate token with role
        const token = generateToken(user._id, user.role);

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token
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

        // Generate token with role
        const token = generateToken(user._id, user.role);

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token
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
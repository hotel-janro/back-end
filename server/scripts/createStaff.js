import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.js';
import dns from 'dns';

dotenv.config({ path: './.env' });
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const createStaff = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const staffMembers = [
            {
                name: 'Receptionist',
                email: 'reception@hoteljanro.com',
                password: 'reception123',
                role: 'staff',
                phone: '1111111111'
            },
            {
                name: 'Cashier',
                email: 'cashier@hoteljanro.com',
                password: 'cashier123',
                role: 'staff',
                phone: '2222222222'
            }
        ];

        for (const staff of staffMembers) {
            const existingUser = await User.findOne({ email: staff.email });
            if (existingUser) {
                console.log(`${staff.name} already exists (${staff.email})`);
                continue;
            }

            await User.create({
                ...staff,
                confirmPassword: staff.password
            });
            console.log(`${staff.name} created successfully!`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating staff:', error.message);
        process.exit(1);
    }
};

createStaff();

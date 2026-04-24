import PoolBooking from '../models/poolBooking.js';

const allowedStatuses = new Set(['Confirmed', 'Checked-In', 'Completed', 'Cancelled']);

const parseGuestCount = (value) => {
    const guests = Number.parseInt(value, 10);
    return Number.isFinite(guests) && guests > 0 ? guests : null;
};

const parsePrice = (value) => {
    const price = Number.parseFloat(value);
    return Number.isFinite(price) && price >= 0 ? price : null;
};

export const createPoolBooking = async (req, res) => {
    try {
        const {
            guestName,
            guestEmail,
            roomNumber = '',
            date,
            timeSlot,
            numberOfGuests,
            status = 'Confirmed',
            pricePerPerson
        } = req.body || {};

        if (!guestName || !guestEmail || !date || !timeSlot) {
            return res.status(400).json({
                success: false,
                message: 'guestName, guestEmail, date, and timeSlot are required.'
            });
        }

        const guests = parseGuestCount(numberOfGuests);
        if (!guests) {
            return res.status(400).json({
                success: false,
                message: 'numberOfGuests must be a positive number.'
            });
        }

        const perPersonPrice = parsePrice(pricePerPerson);
        if (perPersonPrice === null) {
            return res.status(400).json({
                success: false,
                message: 'pricePerPerson must be a valid number.'
            });
        }

        const normalizedStatus = allowedStatuses.has(status) ? status : 'Confirmed';
        const totalAmount = Number((perPersonPrice * guests).toFixed(2));

        const booking = await PoolBooking.create({
            guestName,
            guestEmail,
            roomNumber,
            date,
            timeSlot,
            numberOfGuests: guests,
            status: normalizedStatus,
            pricePerPerson: perPersonPrice,
            totalAmount
        });

        return res.status(201).json({
            success: true,
            message: 'Pool booking created successfully.',
            booking
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const listPoolBookings = async (req, res) => {
    try {
        const bookings = await PoolBooking.find().sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            bookings
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
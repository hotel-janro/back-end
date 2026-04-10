import Booking from '../models/booking.js';
import Room from '../models/room.js';
import mongoose from 'mongoose';

const ONE_DAY_MS = 1000 * 60 * 60 * 24;
const CANCELLABLE_BY_USER = ['pending', 'confirmed'];
const HONEYMOON_DECORATION_ITEMS = [
	'Rose petals on bed',
	'Flower bouquet',
	'Scented candles',
	'Heart balloon setup',
	'Chocolate gift box'
];

const STATUS_TRANSITIONS = {
	pending: ['confirmed', 'cancelled'],
	confirmed: ['checked-in', 'cancelled'],
	'checked-in': ['checked-out'],
	'checked-out': [],
	cancelled: ['pending', 'confirmed']
};

const calculateNights = (checkInDate, checkOutDate) => {
	const diff = new Date(checkOutDate).getTime() - new Date(checkInDate).getTime();
	return Math.ceil(diff / ONE_DAY_MS);
};

const isValidStatusTransition = (fromStatus, toStatus) => {
	if (fromStatus === toStatus) {
		return true;
	}

	return (STATUS_TRANSITIONS[fromStatus] || []).includes(toStatus);
};

const sanitizeDecorationItems = (items) => {
	if (!Array.isArray(items)) {
		return [];
	}

	const uniqueItems = [...new Set(items.map((item) => String(item).trim()))];
	return uniqueItems.filter((item) => HONEYMOON_DECORATION_ITEMS.includes(item));
};

export const createBooking = async (req, res) => {
	let session;
	try {
		const {
			roomId,
			checkInDate,
			checkOutDate,
			guests,
			fullName,
			email,
			phone,
			specialRequests
			,
			decorationItems
		} = req.body;

		if (!roomId || !checkInDate || !checkOutDate || !guests || !fullName || !email) {
			return res.status(400).json({
				success: false,
				message: 'Missing required booking fields'
			});
		}

		const nights = calculateNights(checkInDate, checkOutDate);
		if (nights < 1) {
			return res.status(400).json({
				success: false,
				message: 'Check-out date must be after check-in date'
			});
		}

		session = await mongoose.startSession();
		session.startTransaction();

		const room = await Room.findById(roomId).session(session);
		if (!room || !room.isActive) {
			await session.abortTransaction();
			return res.status(404).json({
				success: false,
				message: 'Room not found'
			});
		}

		if (room.availableRooms < 1) {
			await session.abortTransaction();
			return res.status(400).json({
				success: false,
				message: 'Room is currently fully booked'
			});
		}

		const normalizedEmail = String(email).trim().toLowerCase();
		const overlapOrConditions = [{ email: normalizedEmail }];
		if (req.user?._id) {
			overlapOrConditions.push({ user: req.user._id });
		}

		const overlappingBooking = await Booking.findOne({
			room: room._id,
			status: { $ne: 'cancelled' },
			checkInDate: { $lt: new Date(checkOutDate) },
			checkOutDate: { $gt: new Date(checkInDate) },
			$or: overlapOrConditions
		}).session(session);

		if (overlappingBooking) {
			await session.abortTransaction();
			return res.status(409).json({
				success: false,
				message: 'An overlapping booking already exists for these dates'
			});
		}

		room.availableRooms -= 1;
		await room.save({ session });

		const supportsDecorations = String(room.name || '').toLowerCase().includes('honeymoon');
		const sanitizedDecorationItems = supportsDecorations ? sanitizeDecorationItems(decorationItems) : [];

		const totalPrice = room.price * nights;
		const [booking] = await Booking.create(
			[
				{
					room: room._id,
					user: req.user?._id || null,
					fullName,
					email: normalizedEmail,
					phone,
					guests,
					checkInDate,
					checkOutDate,
					nights,
					totalPrice,
					specialRequests,
					decorationItems: sanitizedDecorationItems
				}
			],
			{ session }
		);

		await session.commitTransaction();

		const populatedBooking = await Booking.findById(booking._id).populate('room', 'name price image');

		res.status(201).json({
			success: true,
			data: populatedBooking
		});
	} catch (error) {
		if (session && session.inTransaction()) {
			await session.abortTransaction();
		}
		res.status(400).json({
			success: false,
			message: error.message
		});
	} finally {
		if (session) {
			await session.endSession();
		}
	}
};

export const getBookings = async (req, res) => {
	try {
		const filter = {};
		if (req.query.status) {
			filter.status = req.query.status;
		}

		const bookings = await Booking.find(filter)
			.populate('room', 'name price')
			.populate('user', 'name email role')
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: bookings.length,
			data: bookings
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
};

export const getMonthlyRevenueReport = async (req, res) => {
	try {
		const now = new Date();
		const year = Number.parseInt(req.query.year, 10) || now.getFullYear();
		const month = Number.parseInt(req.query.month, 10) || now.getMonth() + 1;

		if (!Number.isInteger(year) || year < 2000 || year > 3000) {
			return res.status(400).json({
				success: false,
				message: 'Invalid year. Use a value like 2026'
			});
		}

		if (!Number.isInteger(month) || month < 1 || month > 12) {
			return res.status(400).json({
				success: false,
				message: 'Invalid month. Use values 1-12'
			});
		}

		const startDate = new Date(year, month - 1, 1);
		const endDate = new Date(year, month, 1);

		const [result] = await Booking.aggregate([
			{
				$match: {
					status: { $ne: 'cancelled' },
					checkInDate: { $gte: startDate, $lt: endDate }
				}
			},
			{
				$group: {
					_id: null,
					totalRevenue: { $sum: '$totalPrice' },
					totalBookings: { $sum: 1 }
				}
			}
		]);

		res.status(200).json({
			success: true,
			data: {
				year,
				month,
				totalRevenue: result?.totalRevenue || 0,
				totalBookings: result?.totalBookings || 0
			}
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
};

export const getMyBookings = async (req, res) => {
	try {
		const bookings = await Booking.find({ user: req.user._id })
			.populate('room', 'name price image')
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: bookings.length,
			data: bookings
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
};

export const getBookingById = async (req, res) => {
	try {
		const booking = await Booking.findById(req.params.id)
			.populate('room', 'name price image')
			.populate('user', 'name email role');

		if (!booking) {
			return res.status(404).json({
				success: false,
				message: 'Booking not found'
			});
		}

		const canAccessAll = ['admin', 'manager', 'staff'].includes(req.user.role);
		const isOwner = booking.user && booking.user._id.toString() === req.user._id.toString();

		if (!canAccessAll && !isOwner) {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to access this booking'
			});
		}

		res.status(200).json({
			success: true,
			data: booking
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
};

export const updateBookingStatus = async (req, res) => {
	let session;
	try {
		const { status } = req.body;
		const allowedStatuses = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];

		if (!allowedStatuses.includes(status)) {
			return res.status(400).json({
				success: false,
				message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
			});
		}

		session = await mongoose.startSession();
		session.startTransaction();

		const booking = await Booking.findById(req.params.id).session(session);
		if (!booking) {
			await session.abortTransaction();
			return res.status(404).json({
				success: false,
				message: 'Booking not found'
			});
		}

		if (!isValidStatusTransition(booking.status, status)) {
			await session.abortTransaction();
			return res.status(400).json({
				success: false,
				message: `Invalid status transition: ${booking.status} -> ${status}`
			});
		}

		const room = await Room.findById(booking.room).session(session);
		if (!room) {
			await session.abortTransaction();
			return res.status(404).json({
				success: false,
				message: 'Associated room not found'
			});
		}

		if (booking.status !== 'cancelled' && status === 'cancelled') {
			room.availableRooms += 1;
			await room.save({ session });
		}

		if (booking.status === 'cancelled' && status !== 'cancelled') {
			if (room.availableRooms < 1) {
				await session.abortTransaction();
				return res.status(400).json({
					success: false,
					message: 'Cannot reactivate booking: room has no available slots'
				});
			}
			room.availableRooms -= 1;
			await room.save({ session });
		}

		booking.status = status;
		await booking.save({ session });

		await session.commitTransaction();

		const updatedBooking = await Booking.findById(booking._id).populate('room', 'name price image');

		res.status(200).json({
			success: true,
			data: updatedBooking
		});
	} catch (error) {
		if (session && session.inTransaction()) {
			await session.abortTransaction();
		}
		res.status(500).json({
			success: false,
			message: error.message
		});
	} finally {
		if (session) {
			await session.endSession();
		}
	}
};

export const cancelMyBooking = async (req, res) => {
	let session;
	try {
		session = await mongoose.startSession();
		session.startTransaction();

		const booking = await Booking.findById(req.params.id).session(session);
		if (!booking) {
			await session.abortTransaction();
			return res.status(404).json({
				success: false,
				message: 'Booking not found'
			});
		}

		if (!booking.user || booking.user.toString() !== req.user._id.toString()) {
			await session.abortTransaction();
			return res.status(403).json({
				success: false,
				message: 'Not authorized to cancel this booking'
			});
		}

		if (booking.status !== 'cancelled' && !CANCELLABLE_BY_USER.includes(booking.status)) {
			await session.abortTransaction();
			return res.status(400).json({
				success: false,
				message: `Cannot cancel booking in status: ${booking.status}`
			});
		}

		if (booking.status !== 'cancelled') {
			const room = await Room.findById(booking.room).session(session);
			if (room) {
				room.availableRooms += 1;
				await room.save({ session });
			}
			booking.status = 'cancelled';
			await booking.save({ session });
		}

		await session.commitTransaction();

		res.status(200).json({
			success: true,
			message: 'Booking cancelled successfully',
			data: booking
		});
	} catch (error) {
		if (session && session.inTransaction()) {
			await session.abortTransaction();
		}
		res.status(500).json({
			success: false,
			message: error.message
		});
	} finally {
		if (session) {
			await session.endSession();
		}
	}
};

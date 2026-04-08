import Booking from '../models/booking.js';
import Room from '../models/room.js';

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

const calculateNights = (checkInDate, checkOutDate) => {
	const diff = new Date(checkOutDate).getTime() - new Date(checkInDate).getTime();
	return Math.ceil(diff / ONE_DAY_MS);
};

export const createBooking = async (req, res) => {
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

		const room = await Room.findById(roomId);
		if (!room || !room.isActive) {
			return res.status(404).json({
				success: false,
				message: 'Room not found'
			});
		}

		if (room.availableRooms < 1) {
			return res.status(400).json({
				success: false,
				message: 'Room is currently fully booked'
			});
		}

		room.availableRooms -= 1;
		await room.save();

		const totalPrice = room.price * nights;
		const booking = await Booking.create({
			room: room._id,
			user: req.user?._id || null,
			fullName,
			email,
			phone,
			guests,
			checkInDate,
			checkOutDate,
			nights,
			totalPrice,
			specialRequests
		});

		const populatedBooking = await booking.populate('room', 'name price image');

		res.status(201).json({
			success: true,
			data: populatedBooking
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message
		});
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
	try {
		const { status } = req.body;
		const allowedStatuses = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];

		if (!allowedStatuses.includes(status)) {
			return res.status(400).json({
				success: false,
				message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
			});
		}

		const booking = await Booking.findById(req.params.id);
		if (!booking) {
			return res.status(404).json({
				success: false,
				message: 'Booking not found'
			});
		}

		const room = await Room.findById(booking.room);
		if (!room) {
			return res.status(404).json({
				success: false,
				message: 'Associated room not found'
			});
		}

		if (booking.status !== 'cancelled' && status === 'cancelled') {
			room.availableRooms += 1;
			await room.save();
		}

		if (booking.status === 'cancelled' && status !== 'cancelled') {
			if (room.availableRooms < 1) {
				return res.status(400).json({
					success: false,
					message: 'Cannot reactivate booking: room has no available slots'
				});
			}
			room.availableRooms -= 1;
			await room.save();
		}

		booking.status = status;
		await booking.save();

		const updatedBooking = await booking.populate('room', 'name price image');

		res.status(200).json({
			success: true,
			data: updatedBooking
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
};

export const cancelMyBooking = async (req, res) => {
	try {
		const booking = await Booking.findById(req.params.id);
		if (!booking) {
			return res.status(404).json({
				success: false,
				message: 'Booking not found'
			});
		}

		if (!booking.user || booking.user.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to cancel this booking'
			});
		}

		if (booking.status !== 'cancelled') {
			const room = await Room.findById(booking.room);
			if (room) {
				room.availableRooms += 1;
				await room.save();
			}
			booking.status = 'cancelled';
			await booking.save();
		}

		res.status(200).json({
			success: true,
			message: 'Booking cancelled successfully',
			data: booking
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
};

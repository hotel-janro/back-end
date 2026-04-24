import mongoose from 'mongoose';

import Booking from '../models/booking.js';
import Room from '../models/room.js';
import {
	abortTransactionWithResponse,
	calculateNights,
	CANCELLABLE_BY_USER,
	isValidStatusTransition,
	sanitizeDecorationItems
} from './roombookinghekpers.js';

export const createBooking = async (req, res) => {
	let session;
	try {
		// Read booking input from request body.
		const {
			roomId,
			checkInDate,
			checkOutDate,
			guests,
			fullName,
			email,
			phone,
			specialRequests,
			decorationItems
		} = req.body;

		if (!roomId || !checkInDate || !checkOutDate || !guests || !fullName || !email) {
			return res.status(400).json({
				success: false,
				message: 'Missing required booking fields'
			});
		}

		// Calculate total nights and reject invalid date ranges.
		const nights = calculateNights(checkInDate, checkOutDate);
		if (nights < 1) {
			return res.status(400).json({
				success: false,
				message: 'Check-out date must be after check-in date'
			});
		}

		session = await mongoose.startSession();
		session.startTransaction();

		// Lock/check room inside transaction so availability stays consistent.
		const room = await Room.findById(roomId).session(session);
		if (!room || !room.isActive) {
			return await abortTransactionWithResponse(session, res, 404, {
				success: false,
				message: 'Room not found'
			});
		}

		if (room.availableRooms < 1) {
			return await abortTransactionWithResponse(session, res, 400, {
				success: false,
				message: 'Room is currently fully booked'
			});
		}

		const normalizedEmail = String(email).trim().toLowerCase();
		const overlapOrConditions = [{ email: normalizedEmail }];
		if (req.user?._id) {
			overlapOrConditions.push({ user: req.user._id });
		}

		// Prevent duplicate overlapping bookings for same user/email and room.
		const overlappingBooking = await Booking.findOne({
			room: room._id,
			status: { $ne: 'cancelled' },
			checkInDate: { $lt: new Date(checkOutDate) },
			checkOutDate: { $gt: new Date(checkInDate) },
			$or: overlapOrConditions
		}).session(session);

		if (overlappingBooking) {
			return await abortTransactionWithResponse(session, res, 409, {
				success: false,
				message: 'An overlapping booking already exists for these dates'
			});
		}

		room.availableRooms -= 1;
		await room.save({ session });

		// Decorations are allowed only for honeymoon room types.
		const supportsDecorations = String(room.name || '').toLowerCase().includes('honeymoon');
		const sanitizedDecorationItems = supportsDecorations ? sanitizeDecorationItems(decorationItems) : [];

		// Price is room price multiplied by number of nights.
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

export const updateBookingStatus = async (req, res) => {
	let session;
	try {
		const { status } = req.body;
		// Restrict status updates to known values.
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
			return await abortTransactionWithResponse(session, res, 404, {
				success: false,
				message: 'Booking not found'
			});
		}

		if (!isValidStatusTransition(booking.status, status)) {
			return await abortTransactionWithResponse(session, res, 400, {
				success: false,
				message: `Invalid status transition: ${booking.status} -> ${status}`
			});
		}

		const room = await Room.findById(booking.room).session(session);
		if (!room) {
			return await abortTransactionWithResponse(session, res, 404, {
				success: false,
				message: 'Associated room not found'
			});
		}

		// Return room slot when a booking is cancelled.
		if (booking.status !== 'cancelled' && status === 'cancelled') {
			room.availableRooms += 1;
			await room.save({ session });
		}

		// Consume a room slot if reactivating a cancelled booking.
		if (booking.status === 'cancelled' && status !== 'cancelled') {
			if (room.availableRooms < 1) {
				return await abortTransactionWithResponse(session, res, 400, {
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
			return await abortTransactionWithResponse(session, res, 404, {
				success: false,
				message: 'Booking not found'
			});
		}

		if (!booking.user || booking.user.toString() !== req.user._id.toString()) {
			return await abortTransactionWithResponse(session, res, 403, {
				success: false,
				message: 'Not authorized to cancel this booking'
			});
		}

		// Users can cancel only selected statuses.
		if (booking.status !== 'cancelled' && !CANCELLABLE_BY_USER.includes(booking.status)) {
			return await abortTransactionWithResponse(session, res, 400, {
				success: false,
				message: `Cannot cancel booking in status: ${booking.status}`
			});
		}

		// Only first cancellation changes availability and booking status.
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

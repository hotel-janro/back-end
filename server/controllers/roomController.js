import Room from '../models/room.js';

export const getRooms = async (req, res) => {
	try {
		const { minPrice, maxPrice, guests, search, onlyAvailable } = req.query;
		const filters = { isActive: true };

		if (minPrice || maxPrice) {
			filters.price = {};
			if (minPrice) {
				filters.price.$gte = Number(minPrice);
			}
			if (maxPrice) {
				filters.price.$lte = Number(maxPrice);
			}
		}

		if (guests) {
			filters.defaultGuests = { $gte: Number(guests) };
		}

		if (onlyAvailable === 'true') {
			filters.availableRooms = { $gt: 0 };
		}

		if (search) {
			filters.$or = [
				{ name: { $regex: search, $options: 'i' } },
				{ description: { $regex: search, $options: 'i' } }
			];
		}

		const rooms = await Room.find(filters).sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: rooms.length,
			data: rooms
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
};

export const getRoomById = async (req, res) => {
	try {
		const room = await Room.findOne({ _id: req.params.id, isActive: true });

		if (!room) {
			return res.status(404).json({
				success: false,
				message: 'Room not found'
			});
		}

		res.status(200).json({
			success: true,
			data: room
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
};

export const createRoom = async (req, res) => {
	try {
		const room = await Room.create(req.body);

		res.status(201).json({
			success: true,
			data: room
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message
		});
	}
};

export const updateRoom = async (req, res) => {
	try {
		const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true
		});

		if (!room) {
			return res.status(404).json({
				success: false,
				message: 'Room not found'
			});
		}

		res.status(200).json({
			success: true,
			data: room
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message
		});
	}
};

export const deleteRoom = async (req, res) => {
	try {
		const room = await Room.findById(req.params.id);

		if (!room) {
			return res.status(404).json({
				success: false,
				message: 'Room not found'
			});
		}

		room.isActive = false;
		await room.save();

		res.status(200).json({
			success: true,
			message: 'Room deleted successfully'
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
};

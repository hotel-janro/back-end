import WeddingHall from '../models/weddingHall.js';
import WeddingBooking from '../models/weddingBooking.js';

// STEP 1 API: Read hall availability by event date.
// Route: GET /api/wedding/halls/availability?date=YYYY-MM-DD
export const getHallAvailability = async (req, res) => {
    try {
        // Read the date from query string.
        // Example: /availability?date=2026-12-10
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Please provide date query parameter in format YYYY-MM-DD'
            });
        }

        const requestedDate = new Date(date);

        // Validate invalid date values (e.g., 2026-99-99).
        if (Number.isNaN(requestedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD'
            });
        }

        // Build start/end boundaries for that calendar day.
        // This helps us match all bookings on the same day.
        const startOfDay = new Date(requestedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(requestedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Only bookings that are not cancelled/rejected should block availability.
        const blockingBookings = await WeddingBooking.find({
            eventDate: { $gte: startOfDay, $lte: endOfDay },
            bookingStatus: { $in: ['pending', 'confirmed'] }
        }).select('hallId');

        // Convert booked hall IDs into a Set for quick lookup.
        const bookedHallIdSet = new Set(
            blockingBookings.map((booking) => booking.hallId.toString())
        );

        // Fetch all halls to produce a full availability list.
        const halls = await WeddingHall.find();

        // Compute availability hall-by-hall.
        const availability = halls.map((hall) => {
            const hallId = hall._id.toString();
            const alreadyBooked = bookedHallIdSet.has(hallId);
            const hallIsOperational = hall.status === 'available';
            const isAvailable = hallIsOperational && !alreadyBooked;

            return {
                _id: hall._id,
                hallName: hall.hallName,
                capacity: hall.capacity,
                price: hall.price,
                status: hall.status,
                isAvailable,
                reason: isAvailable
                    ? 'Hall is free for this date'
                    : alreadyBooked
                        ? 'Hall already has a booking on this date'
                        : `Hall is currently ${hall.status}`
            };
        });

        return res.status(200).json({
            success: true,
            date,
            count: availability.length,
            data: availability
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

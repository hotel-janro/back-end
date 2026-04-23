const { addPoolBooking, getPoolBookings } = require("../data/poolBookingStore");

const allowedStatuses = new Set(["Confirmed", "Checked-In", "Completed", "Cancelled"]);

function parseGuestCount(value) {
  const guests = Number.parseInt(value, 10);
  return Number.isFinite(guests) && guests > 0 ? guests : null;
}

function parsePrice(value) {
  const price = Number.parseFloat(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function createPoolBooking(req, res) {
  const {
    guestName,
    guestEmail,
    roomNumber = "",
    date,
    timeSlot,
    numberOfGuests,
    status = "Confirmed",
    pricePerPerson,
  } = req.body || {};

  if (!guestName || !guestEmail || !date || !timeSlot) {
    return res.status(400).json({
      message: "guestName, guestEmail, date, and timeSlot are required.",
    });
  }

  const guests = parseGuestCount(numberOfGuests);
  if (!guests) {
    return res.status(400).json({ message: "numberOfGuests must be a positive number." });
  }

  const perPersonPrice = parsePrice(pricePerPerson);
  if (perPersonPrice === null) {
    return res.status(400).json({ message: "pricePerPerson must be a valid number." });
  }

  const normalizedStatus = allowedStatuses.has(status) ? status : "Confirmed";
  const totalAmount = Number((perPersonPrice * guests).toFixed(2));

  const booking = addPoolBooking({
    guestName,
    guestEmail,
    roomNumber,
    date,
    timeSlot,
    numberOfGuests: guests,
    status: normalizedStatus,
    pricePerPerson: perPersonPrice,
    totalAmount,
  });

  return res.status(201).json({
    message: "Pool booking created successfully.",
    booking,
  });
}

function listPoolBookings(req, res) {
  return res.json({ bookings: getPoolBookings() });
}

module.exports = {
  createPoolBooking,
  listPoolBookings,
};
const initialPoolBookings = [
  {
    id: "001",
    guestName: "John Smith",
    guestEmail: "john.smith@email.com",
    roomNumber: "102",
    date: "2026-02-26",
    timeSlot: "Morning (09:00 - 11:00)",
    numberOfGuests: 2,
    status: "Checked-In",
    totalAmount: 50,
    pricePerPerson: 25,
    createdAt: "2026-02-25T10:00:00.000Z",
  },
  {
    id: "002",
    guestName: "Emma Johnson",
    guestEmail: "emma.j@email.com",
    roomNumber: "104",
    date: "2026-02-26",
    timeSlot: "Afternoon (13:00 - 15:00)",
    numberOfGuests: 3,
    status: "Confirmed",
    totalAmount: 60,
    pricePerPerson: 20,
    createdAt: "2026-02-25T11:00:00.000Z",
  },
  {
    id: "003",
    guestName: "Michael Chen",
    guestEmail: "michael.chen@email.com",
    roomNumber: "",
    date: "2026-02-26",
    timeSlot: "Evening (15:00 - 17:00)",
    numberOfGuests: 4,
    status: "Confirmed",
    totalAmount: 45,
    pricePerPerson: 11.25,
    createdAt: "2026-02-25T12:00:00.000Z",
  },
];

let poolBookings = [...initialPoolBookings];

function getNextBookingId() {
  const nextNumber = poolBookings.length + 1;
  return String(nextNumber).padStart(3, "0");
}

function getPoolBookings() {
  return poolBookings.map((booking) => ({ ...booking }));
}

function addPoolBooking(bookingData) {
  const nextBooking = {
    id: getNextBookingId(),
    ...bookingData,
    createdAt: new Date().toISOString(),
  };

  poolBookings = [nextBooking, ...poolBookings];
  return { ...nextBooking };
}

module.exports = {
  getPoolBookings,
  addPoolBooking,
};
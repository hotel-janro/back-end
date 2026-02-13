const weddingHallSchema = new mongoose.Schema({
  hallName: String,
  capacity: Number,
  price: Number,
  status: { type: String, enum: ["Available", "Booked"], default: "Available" }
});

export const WeddingHall = mongoose.model("WeddingHall", weddingHallSchema);


const weddingBookingSchema = new mongoose.Schema({
  hallId: { type: mongoose.Schema.Types.ObjectId, ref: "WeddingHall" },
  eventDate: Date,
  packageType: String,
  guestCount: Number,
  bookingStatus: { type: String, enum: ["pending", "confirmed", "cancelled"] }
}, { timestamps: true });

export const WeddingBooking = mongoose.model("WeddingBooking", weddingBookingSchema);

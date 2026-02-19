const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true, required: true },

  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  guestInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    specialRequests: String
  },

  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },

  checkIn: Date,
  checkOut: Date,

  guests: Number,
  nights: Number,

  subtotal: Number,
  discount: { type: Number, default: 0 },
  total: Number,

  offerCode: String,

  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending"
  },

  paymentMethod: String,
  paymentDate: Date
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);

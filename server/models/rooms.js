const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, unique: true },
  roomType: String,
  pricePerNight: Number,
  status: {
    type: String,
    enum: ["Available", "Booked", "Maintenance"],
    default: "Available"
  }
}, { timestamps: true });

export default mongoose.model("Room", roomSchema);

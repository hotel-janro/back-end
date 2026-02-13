const poolSlotSchema = new mongoose.Schema({
  timeSlot: String,
  capacity: Number,
  status: { type: String, enum: ["Available", "Full"], default: "Available" }
});

export default mongoose.model("PoolSlot", poolSlotSchema);

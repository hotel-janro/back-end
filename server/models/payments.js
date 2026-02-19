const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  amount: Number,
  method: { type: String, enum: ["cash", "card", "online"] },
  status: { type: String, enum: ["paid", "failed", "pending"] }
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);

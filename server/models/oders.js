const orderSchema = new mongoose.Schema({
  orderType: { type: String, enum: ["Dine-in", "Room", "Delivery"] },

  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
    name: String,
    quantity: Number,
    price: Number
  }],

  totalAmount: Number,
  orderStatus: {
    type: String,
    enum: ["pending", "preparing", "ready", "delivered", "cancelled"],
    default: "pending"
  }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);

import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderType: {
      type: String,
      enum: ["Dine-in", "Room", "Delivery"],
      required: true,
    },
    // Newly added fields (filled based on the order type)
    tableNumber: { type: String }, 
    roomNumber: { type: String }, 
    deliveryAddress: { type: String }, 
    contactNumber: { type: String },

    items: [
      {
        menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    orderStatus: {
      type: String,
      enum: ["Pending", "Preparing", "Completed", "Cancelled"],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid"],
      default: "Unpaid",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
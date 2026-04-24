import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    isAvailable: { type: Boolean, default: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("MenuItem", menuItemSchema);
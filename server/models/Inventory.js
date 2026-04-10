import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, default: 0 },
    thresholdLevel: { type: Number, default: 10 },
    unit: { type: String, default: "pcs" },
  },
  { timestamps: true }
);

export default mongoose.model("Inventory", inventorySchema);
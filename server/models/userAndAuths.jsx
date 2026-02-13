import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: {
    type: String,
    enum: ["admin", "staff", "cashier", "customer", "delivery"],
    required: true
  },
  phone: String,
  status: { type: String, enum: ["active", "disabled"], default: "active" }
}, { timestamps: true });

export default mongoose.model("User", userSchema);

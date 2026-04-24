import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true,
      unique: true, // Block Duplicate Food Names
      index: true   // Speed Search
    },
    category: { 
      type: String, 
      required: true, 
      trim: true,
      enum: ["Main Course", "Appetizers", "Desserts", "Beverages", "Breakfast", "Snacks"], 
      index: true   
    },
    price: { 
      type: Number, 
      required: true,
      min: [0, "Price cannot be negative"] 
    },
    isAvailable: { 
      type: Boolean, 
      default: true 
    },
    description: { 
      type: String, 
      trim: true,
      default: "",
      maxlength: [500, "Description is too long"] 
    },
    image: { 
      type: String, 
      default: "" 
    },
  },
  { timestamps: true }
);

export default mongoose.model("MenuItem", menuItemSchema);
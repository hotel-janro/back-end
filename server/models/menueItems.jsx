const menuItemSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  isAvailable: { type: Boolean, default: true }
});

export default mongoose.model("MenuItem", menuItemSchema);

const inventorySchema = new mongoose.Schema({
  itemName: String,
  quantity: Number,
  thresholdLevel: Number
});

export default mongoose.model("Inventory", inventorySchema);

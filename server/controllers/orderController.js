import Order from "../models/order.js";
import MenuItem from "../models/menuitem.js";

export const createOrder = async (req, res) => {
  try {
    const { orderType, items, discount = 0 } = req.body;

    let subtotal = 0;

    // calculate subtotal
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }

    const tax = subtotal * 0.1; // 10% tax
    const totalAmount = subtotal + tax - discount;

    const order = await Order.create({
      orderType,
      items,
      subtotal,
      tax,
      discount,
      totalAmount,
      orderStatus: "Pending",
      paymentStatus: "Unpaid",
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: req.body.orderStatus },
      { new: true }
    );
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
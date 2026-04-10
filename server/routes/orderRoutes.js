import express from "express";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  markOrderPaid,
  deleteOrder,
} from "../controllers/orderController.js";

const router = express.Router();

router.get("/", getOrders);
router.get("/:id", getOrderById);
router.post("/", createOrder);
router.put("/:id", updateOrder);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/paid", markOrderPaid);
router.delete("/:id", deleteOrder);

export default router;
import express from "express";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";

const router = express.Router();

router.get("/", getOrders);
router.post("/", createOrder);
router.put("/:id", updateOrderStatus);
router.delete("/:id", deleteOrder);

export default router;
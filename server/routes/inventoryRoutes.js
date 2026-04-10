import express from "express";
import {
  getInventory,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getLowStockItems,
} from "../controllers/inventoryController.js";

const router = express.Router();

router.get("/", getInventory);
router.get("/low-stock", getLowStockItems);
router.get("/:id", getInventoryItemById);
router.post("/", createInventoryItem);
router.put("/:id", updateInventoryItem);
router.delete("/:id", deleteInventoryItem);

export default router;
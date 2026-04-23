import express from "express";
import {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
} from "../controllers/inventoryController.js";

const router = express.Router();

router.get("/", getInventory);
router.post("/", createInventoryItem);
router.put("/:id", updateInventoryItem);

export default router;
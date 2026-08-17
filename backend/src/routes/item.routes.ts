import { Router } from "express";
import {
  getItem,
  getItemById,
  createItem,
  getCategories,
  getSellerItems,
  updateItemStatus,
  deleteItem
} from "../controllers/item.controller.js";
import { upload } from "../config/cloudinary.js";
import { requireAuthUser } from "../middleware/auth.js";

const router = Router();

// 1. Categories route (Must come before /:id so "categories" isn't treated as an ID parameter)
router.get("/categories", getCategories);

// 2. Item list and individual item details
router.get("/", getItem);
router.get("/me", requireAuthUser, getSellerItems);
router.get("/:id", getItemById);
router.patch("/:id/status", requireAuthUser, updateItemStatus);
router.delete("/:id", requireAuthUser, deleteItem);

// 3. Create listing with image upload middleware & auth protection
router.post("/", requireAuthUser, upload.array("images", 5), createItem);

export default router;

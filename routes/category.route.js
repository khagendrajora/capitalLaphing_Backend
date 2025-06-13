import express from "express";
import { checkAdmin, authenticate } from "../middleware/authMiddleware.js";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategory,
  updateCategory,
} from "../controllers/category.controller.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/category",
  authenticate,
  checkAdmin,
  upload.single("thumb_nail"),
  createCategory
);
router.get("/categories", getCategories);
router.get("/category/:id", getCategory);
router.post(
  "/update-category",
  authenticate,
  checkAdmin,
  upload.single("thumb_nail"),
  updateCategory
);
router.post("/delete-category/:id", authenticate, checkAdmin, deleteCategory);

export default router;

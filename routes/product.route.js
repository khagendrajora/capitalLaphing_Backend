import express from "express";
import { checkAdmin, authenticate } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getFilteredProducts,
  getProductById,
  updateProduct,
} from "../controllers/product.controller.js";

const router = express.Router();

router.post(
  "/product",
  authenticate,
  checkAdmin,
  upload.single("image"),
  createProduct
);
router.get("/products", getAllProducts);
router.get("/product/:id", getProductById);
router.post(
  "/updateproduct",
  authenticate,
  checkAdmin,
  upload.single("image"),
  updateProduct
);
router.post("/deleteproduct/:id", authenticate, checkAdmin, deleteProduct);
router.post("/filterproducts", getFilteredProducts);

export default router;

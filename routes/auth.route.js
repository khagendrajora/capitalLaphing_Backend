import express from "express";
import {
  getOrdersByUser,
  loginUser,
  logout,
  order,
  orders,
  orderStatus,
  paymentStatus,
  registerUser,
  updateOrder,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/orders", orders);
router.get("/myorders/:userId", authenticate, getOrdersByUser);
router.post("/orderupdate", updateOrder);
router.get("/order/:id", authenticate, order);
router.get("/orderstatus", orderStatus);
router.get("/paymentstatus", paymentStatus);
router.post("/logout", logout);

export default router;

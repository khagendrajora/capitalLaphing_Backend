import express from "express";
import { createOrder } from "../controllers/order.controller.js";
// import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/order", createOrder);
// router.post("/payment", authenticate, createPayment);

export default router;

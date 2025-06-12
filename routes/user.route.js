import express from "express";
import {
  getUsers,
  logout,
  sendOrRegenerateOTP,
  updateUser,
  verifyOTP,
} from "../controllers/user.controller.js";
import { authenticate, checkAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/send-otp", sendOrRegenerateOTP);
router.post("/verify-otp", verifyOTP);
router.post("/logout", logout);
router.post("/users", getUsers);
router.put("/userupdate", updateUser);

export default router;

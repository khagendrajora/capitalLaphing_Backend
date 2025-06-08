import express from "express";
import { checkAdmin, authenticate } from "../middleware/authMiddleware.js";
import {
  assignProductsToBranch,
  createBranch,
  deleteBranch,
  getBranches,
  getDailyStats,
  updateBranch,
} from "../controllers/branch.controller.js";
const router = express.Router();

router.post("/branch", authenticate, checkAdmin, createBranch);
router.get("/branches", getBranches);
router.post(
  "/branch/assign-product",
  authenticate,
  checkAdmin,
  assignProductsToBranch
);
router.get(
  "/branch/:branchId/daily-stats",
  authenticate,
  checkAdmin,
  getDailyStats
);

router.post("/updatebranch", authenticate, checkAdmin, updateBranch);
router.post("/deletebranch/:id", authenticate, checkAdmin, deleteBranch);

export default router;

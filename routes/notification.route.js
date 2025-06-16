import express from "express";
import {
  deleteNotification,
  getAllNotifications,
  markNotificationAsRead,
} from "../controllers/notification.controller";

const router = express.Router();

router.get("/getnotification", getAllNotifications);
router.put("/updatenotification/:id", markNotificationAsRead);
router.delete("/deleteNoti/:id", deleteNotification);

export default router;

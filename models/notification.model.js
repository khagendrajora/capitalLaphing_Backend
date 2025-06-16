import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

const notificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: ObjectId,
      ref: "Order",
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      expires: 86400,
    },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);

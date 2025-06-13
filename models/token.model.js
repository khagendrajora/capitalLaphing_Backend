import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      expires: 86400,
    },
  },
  { timestamps: true }
);

export const Token = mongoose.model("Token", tokenSchema);

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    otpRequestedAt: { type: Date },
    name: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    // address: {
    //   type: String,
    //   default: "",
    // },
    // addressLine1: {
    //   type: String,
    //   default: "",
    // },
    // cityOrTownName: {
    //   type: String,
    //   default: "",
    // },
    // stateOrTerritoryOrCounty: {
    //   type: String,
    //   default: "",
    // },

    // postalOrZipCode: {
    //   type: String,
    //   default: "",
    // },

    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);

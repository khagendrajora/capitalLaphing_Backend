import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// OTP Expiration Times
const FIRST_OTP_EXPIRY = 60 * 1000; // 2 minute
const OTP_EXPIRY_DURATION = 60 * 1000; // 2 minutes
const OTP_REQUEST_LIMIT = 10 * 1000; // 10 seconds

export const sendOrRegenerateOTP = async (req, res) => {
  console.log(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  try {
    const { phone } = req.body;

    let user = await User.findOne({ phone });

    const currentTime = Date.now();

    // If user exists, check OTP status
    if (user) {
      const { otp, otpExpiresAt, otpRequestedAt } = user;

      // If OTP is still valid, resend it
      if (otp && otpExpiresAt > currentTime) {
        return res.json({
          message: `OTP already sent. Expires at ${new Date(
            otpExpiresAt
          ).toLocaleTimeString()}`,
        });
      }

      // If OTP requested too soon, prevent spamming
      if (otpRequestedAt && currentTime - otpRequestedAt < OTP_REQUEST_LIMIT) {
        return res
          .status(429)
          .json({ message: "Please wait before requesting a new OTP" });
      }
    } else {
      // If user doesn't exist, create a new user
      user = new User({ phone });
    }

    // Generate a new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000);
    const expiryTime = user.otp ? OTP_EXPIRY_DURATION : FIRST_OTP_EXPIRY; // First OTP expires in 1 min

    // Update user data with new OTP and expiration
    user.otp = newOtp;
    user.otpExpiresAt = currentTime + expiryTime;
    user.otpRequestedAt = currentTime;

    // Send OTP via Twilio
    await twilioClient.messages.create({
      body: `Your OTP is ${newOtp}. It expires in ${
        expiryTime / 60000
      } minutes.`,
      from: process.env.TWILIO_PHONE,
      to: phone,
    });

    await user.save();
    return res.json({ success: true, message: "OTP Sent Successfully", user });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const user = await User.findOne({ phone });

    if (!user) return res.status(400).json({ message: "Invalid otp!" });

    const currentTime = Date.now();

    // Check if OTP is expired
    if (!user.otp || user.otpExpiresAt < currentTime) {
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    // Check if OTP is correct
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Mark user as verified and clear OTP fields
    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    user.otpRequestedAt = null;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true, // Ensures the cookie is not accessible via JavaScript
      secure: true, // Set to true if using https
      maxAge: 3600000, // 1 hour (in milliseconds)
      sameSite: "None", // Helps prevent CSRF attacks
      // httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      // sameSite: "Strict",
      // maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, message: "OTP Verified Successfully", user });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id, name, email, phone } = req.body;

    let updated = await User.findByIdAndUpdate(
      id,
      {
        name,
        email,
        phone,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(200).json({
        success: true,
        message: "Failed to Updated !",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Info updated !",
      user: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).exec();
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  return res
    .status(200)
    .json({ success: true, msg: "Logged out successfully" });
};

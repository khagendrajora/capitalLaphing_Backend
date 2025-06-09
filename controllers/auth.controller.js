import bcrypt from "bcryptjs";
// const bcrypt = require('bcryptjs');
import jwt from "jsonwebtoken";
import { Admin } from "../models/auth.model.js";
import { Order } from "../models/order.model.js";

export const registerUser = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const userExists = await Admin.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Admin({
      email,
      password: hashedPassword,
      name,
    });
    await newUser.save();
    res.status(201).json({
      success: true,
      message: "User registered successfully. Login now !",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Admin.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Account not verified. Please verify your email." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    user.lastLogin = Date.now();
    await user.save();

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true, // Ensures the cookie is not accessible via JavaScript
      secure: process.env.NODE_ENV === "production", // Set to true if using https
      maxAge: 3600000, // 1 hour (in milliseconds)
      sameSite: "Strict", // Helps prevent CSRF attacks
    });

    res.status(200).json({
      success: true,
      message: "Login successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};

// Get all products
export const orders = async (req, res) => {
  const status = req.body.orderStatus;
  const filter = status ? { orderStatus: status } : {};
  try {
    const orders = await Order.find(filter).sort("-createdAt").exec();
    return res.status(201).json(orders);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get order by ID
export const order = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "order not found" });
    }
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const orderStatus = async (req, res) => {
  try {
    const { orderId, orderStatus, deliveryTime } = req.body;
    let updated = await Order.findByIdAndUpdate(
      orderId,
      deliveryTime,
      { orderStatus },
      { new: true }
    ).exec();
    res.status(200).json({
      success: true,
      message: "Order status updated !",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const paymentStatus = async (req, res) => {
  try {
    const { orderId } = req.body;
    let updated = await Order.findByIdAndUpdate(
      orderId,
      { isPaid: true },
      { new: true }
    ).exec();
    res.status(200).json({
      success: true,
      message: "Payment status updated !",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const { orderId, orderStatus, isPaid, deliveryTime } = req.body;

    let updated = await Order.findByIdAndUpdate(orderId, {
      orderStatus,
      isPaid,
      deliveryTime,
    });
    return res.status(200).json({
      success: true,
      message: "Order updated !",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId);
    const orders = await Order.find({ orderdBy: userId })
      .sort("-createdAt")
      .exec();
    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ success: false, msg: "No orders found for this user" });
    }

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
export const deleteAllOrders = async (req, res) => {
  try {
    await Order.deleteMany({}); // This will delete all documents in the Order collection
    return res.status(200).json({
      success: true,
      message: "All orders have been deleted!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

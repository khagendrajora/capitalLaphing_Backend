import bcrypt from "bcryptjs";
// const bcrypt = require('bcryptjs');
import jwt from "jsonwebtoken";
import { Admin } from "../models/auth.model.js";
import { Order } from "../models/order.model.js";
import { Token } from "../models/token.model.js";
import { sendEmail } from "../utils/setEmail.js";

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
  const { email, password } = req.body;
  try {
    const user = await Admin.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    // if (!user.isVerified) {
    //   return res
    //     .status(400)
    //     .json({ message: "Account not verified. Please verify your email." });
    // }
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
      secure: true, // Set to true if using https
      maxAge: 3600000, // 1 hour (in milliseconds)
      sameSite: "None", // Helps prevent CSRF attacks
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
    const { orderId, orderStatus, isPaid } = req.body;

    let updated = await Order.findByIdAndUpdate(orderId, {
      orderStatus,
      // isPaid,
      // deliveryTime,
    });
    if (!updated) {
      return res.status(200).json({
        success: true,
        message: "Failed to Updated !",
      });
    }
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
    const orders = await Order.find({ phone: userId })
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

export const forgetPwd = async (req, res) => {
  const { email } = req.body;
  try {
    const adminEmail = await Admin.findOne({ email });
    if (!adminEmail) {
      return res
        .status(404)
        .json({ success: false, message: "Email not found" });
    }
    if (adminEmail) {
      let token = new Token({
        token: Math.floor(100000 + Math.random() * 900000),
        userId: adminEmail._id,
      });
      token = await token.save();
      if (!token) {
        return res.status(400).json({ message: "Token not generated" });
      }
      const url = `${process.env.FRONTEND_URL}/resetpassword/${token.token}`;
      const api = `${process.env.Backend_URL}`;
      sendEmail({
        from: "capitallaphing@gmail.com",
        to: email,
        subject: "Password Reset Link",
        text: `Reset password USing link below\n\n
    ${api}/resetpassword/${token.token}
    `,
        html: `<div style="font-family: Arial, sans-serif; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="width: 75%; max-width: 600px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);">
        
          <div style="text-align: left;">
            <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 16px;">Reset Your Password</h1>
            <p style="font-size: 14px; margin-bottom: 20px;">
              Incase you forget your account password you can reset it here.
            </p>
            <a href='${url}' style="display: inline-block; background-color: #e6310b; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-size: 14px;">Click to Reset</a>
            <p style="font-size: 12px; color: #888; margin-top: 20px;">
              This link will expire in 24 hours
            </p>
          </div>
        </div>
      </div> `,
      });
      return res.status(200).json({
        success: true,
        message: "Password reset link sent to your email",
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const resetPwd = async (req, res) => {
  const { token, password } = req.body;
  // const newPwd = req.body.password;
  try {
    const data = await Token.findOne({ token });
    if (!data) {
      return res.status(403).json({ message: "Token not found" });
    }
    const adminData = await Admin.findOne({ _id: data.userId });
    if (!adminData) {
      return res.status(404).json({ message: "Token and Email not matched" });
    }

    const isOldPwd = await bcrypt.compare(password, adminData.password);
    if (isOldPwd) {
      return res.status(400).json({ message: "Password Previously Used" });
    } else {
      const salt = await bcrypt.genSalt(5);
      let hashedPwd = await bcrypt.hash(password, salt);
      adminData.password = hashedPwd;
      adminData.save();

      await Token.deleteOne({ _id: data._id });

      return res
        .status(200)
        .json({ success: true, message: "Reset Successful" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

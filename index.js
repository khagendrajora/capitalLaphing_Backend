import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { connectDb } from "./db/connectDb.js";
import userRoutes from "./routes/user.route.js";
import authRoutes from "./routes/auth.route.js";
import categoryRoutes from "./routes/category.route.js";
import productRoutes from "./routes/product.route.js";
import orderRoutes from "./routes/order.route.js";
import branchRoutes from "./routes/branch.route.js";
import Stripe from "stripe";
import { Order } from "./models/order.model.js";

dotenv.config();
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: "2024-04-10",
// });
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const app = express();
const server = http.createServer(app);

const port = process.env.PORT || 5000;
app.use(morgan("dev"));
// app.use(
//   cors({
// origin: ["http://localhost:5173"],
//     origin: ["http://localhost:5000", "http://192.168.1.153:5000"],
//     credentials: true,
//   })
// );
app.use(cors());
// 🚀 Ensure raw body for webhooks
// app.post(
//   "/api/webhook",
//   express.raw({ type: "application/json" }),
//   async (req, res) => {
// c`onsole.log("Request headers:", req.headers);
// console.log("Request body:", req.body);`

// const signature = req.headers["stripe-signature"];
// let event;

// try {
// ✅ Verify Stripe webhook signature
// event = stripe.webhooks.constructEvent(
//   req.body,
//   signature,
//   endpointSecret
// );
// console.log(`🔹 Received event: ${event.type}`);
// } catch (err) {
// console.error("❌ Webhook signature verification failed:", err.message);
//   return res.status(400).send(`Webhook Error: ${err.message}`);
// }

// try {
//   switch (event.type) {
//     case "checkout.session.completed": {
//       const paymentIntent = event.data.object;

//       const { id, currency, amount_total, metadata } = paymentIntent;
//       const orderId = metadata.orderId;
//       const customerEmail = paymentIntent.customer_details.email;

// ✅ Update Order Payment Status in Database
//   if (orderId) {
//     await Order.findByIdAndUpdate(orderId, {
//       isPaid: true,
//       paymentIntent: {
//         paymentIntentId: id,
//         currency: currency,
//         totalAmount: amount_total / 100,
//         customerEmail: customerEmail || "N/A",
//       },
//     });

//     console.log(`✅ Order ${orderId} updated successfully.`);
//   }
//   break;
// }
// default:
// console.log(`ℹ️ Unhandled event type: ${event.type}`);
//   }

//   res.status(200).send("Webhook received");
// } catch (err) {
// console.error("❌ Error handling webhook:", err);
//       res.status(500).send("Internal Server Error");
//     }
//   }
// );

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));
// routes
app.use("/api", userRoutes);
app.use("/api", authRoutes);
app.use("/api", categoryRoutes);
app.use("/api", productRoutes);
app.use("/api", orderRoutes);
app.use("/api", branchRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "./client/dist")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "./", "client", "dist", "index.html"))
  );
} else {
  app.get("/", (req, res) => res.send("Please set to production"));
}

server.listen(port, () => {
  connectDb();
  console.log(`Server is running on port`, port);
});

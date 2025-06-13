import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { Branch } from "../models/branch.model.js";
import { Client, Environment } from "square/legacy";
import { nanoid } from "nanoid";

import twilio from "twilio";
// import Stripe from "stripe";

import dotenv from "dotenv";
dotenv.config();

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const client = new Client({
  environment: Environment.Sandbox,
  accessToken:
    "EAAAl9njsWawCEB3pJ2JpuYf5GKTNP5WLOhaaZ3EtcrDyZ75Q16fyHLtLLL_aXr0",
});

const { paymentsApi, ordersApi } = client;

const { locationsApi } = client;

const locationsResponse = await locationsApi.listLocations();

export const createOrder = async (req, res) => {
  try {
    const {
      cardNonce,
      name,
      email,
      phone,
      discount,
      totalPayable,
      userId,
      deliveryCharge = 0,
    } = req.body;

    const products = req.body.products;

    console.log(products);

    let pickUpLocation = products[0].pickUpLocation || products[0].branchName;
    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Products missing" });
    }

    const user = await User.findOne({ phone });
    // if (user) {
    //   const checkEmail = await User.findOne({ email: user.email });
    //   if (checkEmail) {
    //     return res
    //       .status(400)
    //       .json({ message: "Email and phone Miss-Matched" });
    //   }
    // }
    if (!user) {
      // const checkEmail = await User.findOne({ email });
      // if (checkEmail) {
      //   return res
      //     .status(400)
      //     .json({ message: "Email registered with different phone number" });
      // }
      let newUser = await new User({
        name,
        phone,
        email,
      }).save();
      if (!newUser) {
        return res.status(404).json({ mesage: "Failed to save User Detail" });
      }
    }

    if (isNaN(totalPayable)) {
      return res.status(400).json({
        success: false,
        message: "Invalid total payable amount",
      });
    }

    const branchIds = [...new Set(products.map((p) => p.branchId))];
    const branches = await Branch.find({ _id: { $in: branchIds } });
    console.log(products);

    const lineItems = products.map((product, index) => {
      const title = product.product.title;
      const price = product.product?.assignedPrice;

      if (!price) {
        throw new Error(`Missing price for product: ${title}`);
      }

      return {
        name: title,
        quantity: product.quantity.toString(),
        basePriceMoney: {
          amount: Math.round(Number(price) * 100), // in cents
          currency: "USD",
        },
      };
    });

    const discounts = [];
    if (discount > 0) {
      discounts.push({
        name: "Discount",
        amountMoney: {
          amount: Math.round(discount * 100),
          currency: "USD",
        },
      });
    }

    const orderResponse = await ordersApi.createOrder({
      idempotencyKey: `order-${Date.now()}`,
      order: {
        locationId: process.env.SQUARE_LOCATION_ID,
        fulfillments: [
          {
            type: "PICKUP",
            pickupDetails: {
              recipient: {
                displayName: name,
                emailAddress: email,
                phoneNumber: phone,
              },
              pickupAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            },
          },
        ],
        lineItems: lineItems,
        source: {
          name: pickUpLocation,
        },
      },
    });

    const squareOrder = orderResponse.result.order;

    const paymentResponse = await paymentsApi.createPayment({
      sourceId: cardNonce,
      idempotencyKey: Date.now().toString(),
      amountMoney: {
        amount: squareOrder.totalMoney.amount,
        currency: "USD",
      },
      orderId: squareOrder.id,
      locationId: process.env.SQUARE_LOCATION_ID,
    });
    const paymentResult = paymentResponse.result;

    let orderId = pickUpLocation.slice(0, 3) + nanoid(4);
    orderId = pickUpLocation.slice(0, 3) + customId;
    if (paymentResult.payment.status === "COMPLETED") {
      const newOrder = await new Order({
        products: products,
        orderId: orderId,
        paymentIntent: paymentResult.payment.id,
        // deliveryDetails: {
        //   name: name,
        //   email: email,
        //   phone: phone,
        // },

        totalPayable: totalPayable,
        discount: discount,
        orderdBy: userId,
        name,
        email,
        phone,
        deliveryCharge: deliveryCharge,
        pickUpLocation: pickUpLocation,
      }).save();

      // const user = await User.findById(userId);
      // if (user) {
      //   user.name = name || user.name;
      //   user.email = email || user.email;
      //   user.address = address || user.address;
      //   user.addressLine1 = addressLine1 || user.addressLine1;
      //   user.cityOrTownName = cityOrTownName || user.cityOrTownName;
      //   user.stateOrTerritoryOrCounty =
      //     stateOrTerritoryOrCounty || user.stateOrTerritoryOrCounty;
      //   user.postalOrZipCode = postalOrZipCode || user.postalOrZipCode;
      //   await user.save();
      // }

      res.status(201).json({
        success: true,
        message: "Order placed and payment Done",
        order: newOrder,
        squareOrderId: squareOrder.id,
        squarePaymentId: paymentResult.payment.id,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Payment failed",
      });
    }
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// export const createPayment = async (req, res) => {
//   try {
//     const { userId, orderId, totalAmount } = req.body;
//     if (isNaN(totalAmount) || totalAmount <= 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid total amount" });
//     }
//     const order = await Order.findById(orderId);
//     if (!order) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Order not found" });
//     }

//     const response = await paymentsApi.createPaymentLink(
//       // process.env.SQUARE_LOCATION_ID,
//       {
//         idempotencyKey: new Date().getTime().toString(),
//         order: {
//           order: {
//             locationId: process.env.SQUARE_LOCATION_ID,
//             lineItems: [
//               {
//                 name: "Order Payment",
//                 quantity: "1",
//                 basePriceMoney: {
//                   amount: Math.round(totalAmount * 100),
//                   currency: "USD",
//                 },
//               },
//             ],
//           },
//         },
//         askForShippingAddress: false,
//         // redirectUrl: `${process.env.CLIENT_URL}/user/payment/success`,
//       }
//     );

//     // const session = await stripe.checkout.sessions.create({
//     //   payment_method_types: ["card"],
//     //   line_items: [
//     //     {
//     //       price_data: {
//     //         currency: "usd",
//     //         product_data: { name: "Order Payment" },
//     //         unit_amount: totalAmount * 100,
//     //       },
//     //       quantity: 1,
//     //     },
//     //   ],
//     //   mode: "payment", // Keep this for one-time payments
//     //   payment_intent_data: {
//     //     setup_future_usage: "off_session", // Allows 3D Secure handling
//     //   },
//     //   success_url: `${process.env.CLIENT_URL}/user/payment/success`,
//     //   cancel_url: `${process.env.CLIENT_URL}/user/payment/cancel`,
//     //   metadata: {
//     //     orderId: String(orderId), // Ensure it's a string
//     //     userId: String(userId), // Ensure it's a string
//     //   },
//     // });
//     res.status(200).json({
//       // success: true,
//       // sessionId: session.id,
//       // session: session,
//       // order,
//       success: true,
//       // checkoutUrl: response.result.checkout.checkoutPageUrl,
//       order,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

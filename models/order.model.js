import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema;

const orderSchema = new mongoose.Schema(
  {
    products: [{ type: Object }],
    // branchName: {
    //   type: String,
    //   required: true,
    // },
    paymentIntent: { type: Object },
    orderStatus: {
      type: String,
      default: "Processing",
      enum: ["Processing", "Cancelled", "Completed"],
    },
    // deliveryDetails: {
    //   name: String,
    //   email: String,
    //   phone: String,
    // address: String,
    // addressLine1: String,
    // cityOrTownName: String,
    // stateOrTerritoryOrCounty: String,
    // postalOrZipCode: String,
    // },
    isPaid: { type: Boolean, default: false },
    discount: Number,
    totalPayable: Number,
    deliveryCharge: Number,
    deliveryTime: String,
    isView: { type: Boolean, default: false },
    // orderdBy: {
    //   type: ObjectId,
    // ref: "User",
    //   required: true,
    // },
  },
  { timestamps: true }
);

// Update branch stats after order is placed
orderSchema.post("save", async function (doc) {
  try {
    const branchSalesMap = {};
    const Branch = mongoose.model("Branch");

    // Get all unique branch IDs
    const branchIds = [
      ...new Set(doc.products.map((p) => p.branchId.toString())),
    ];
    const branchCount = branchIds.length || 1;
    const deliveryShare = (doc.deliveryCharge || 0) / branchCount;

    for (const item of doc.products) {
      const { branchId, quantity = 1, product } = item;

      if (!branchId || !product || typeof product.assignedPrice !== "number")
        continue;

      const productTotal = product.assignedPrice * quantity;

      if (branchSalesMap[branchId]) {
        branchSalesMap[branchId] += productTotal;
      } else {
        branchSalesMap[branchId] = productTotal;
      }
    }

    // Add delivery share to each branch’s total
    for (const branchId of Object.keys(branchSalesMap)) {
      branchSalesMap[branchId] += deliveryShare;
    }

    // Update each branch's daily stats
    for (const [branchId, total] of Object.entries(branchSalesMap)) {
      const branch = await Branch.findById(branchId);
      if (branch && typeof branch.updateDailyStats === "function") {
        await branch.updateDailyStats(total);
        console.log(
          `Updated stats for branch: ${branchId} with total: ${total}`
        );
      } else {
        console.warn(
          `Branch not found or missing updateDailyStats: ${branchId}`
        );
      }
    }
  } catch (err) {
    console.error("Error in order post-save hook:", err);
  }
});

export const Order = mongoose.model("Order", orderSchema);

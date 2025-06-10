import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema;

const branchSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true, trim: true },
    available: { type: Boolean, default: true },
    houseNumber: {
      type: String,
      required: true,
    },
    street: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    suburb: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    // deliveryAreas: [
    //   {
    //     postcode: { type: String, required: true },
    //     areaName: { type: String, required: true },
    //   },
    // ],
    openingHours: [
      {
        day: { type: String, required: true },
        openTime: { type: String, required: true },
        closeTime: { type: String, required: true },
      },
    ],
    assignedProducts: [
      {
        product: { type: ObjectId, ref: "Product", required: true },
        price: { type: Number, required: true },
        assignedDate: { type: Date, default: Date.now },
      },
    ],

    dailyStats: [
      {
        date: { type: Date, default: Date.now },
        sales: { type: Number, default: 0 },
        orders: { type: Number, default: 0 },
        earnings: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

// Method to assign a product with branch-specific pricing
branchSchema.methods.assignProduct = async function (productId, price) {
  if (!this.available)
    throw new Error("Branch is not available for assignment.");

  // Check if the product is already assigned
  const existingProduct = this.assignedProducts.find(
    (p) => p.product.toString() === productId.toString()
  );

  if (existingProduct) {
    existingProduct.price = price; // Update price if product already exists
  } else {
    this.assignedProducts.push({
      product: productId,
      price,
      assignedDate: new Date(),
    });
  }

  await this.save();
};

// Branch model
branchSchema.methods.updateDailyStats = async function (orderTotal) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTime = today.getTime();

  const statIndex = this.dailyStats.findIndex(
    (stat) => new Date(stat.date).getTime() === todayTime
  );

  if (statIndex !== -1) {
    this.dailyStats[statIndex].sales += orderTotal;
    this.dailyStats[statIndex].orders += 1;
    this.dailyStats[statIndex].earnings += orderTotal;
  } else {
    this.dailyStats.push({
      date: today,
      sales: orderTotal,
      orders: 1,
      earnings: orderTotal,
    });
  }

  await this.save();
};

// Method to update opening hours
branchSchema.methods.updateOpeningHours = async function (updatedHours) {
  this.openingHours = updatedHours;
  await this.save();
};

// Method to add delivery area
// branchSchema.methods.addDeliveryArea = async function (postcode, areaName) {
//   this.deliveryAreas.push({ postcode, areaName });
//   await this.save();
// };

// Method to remove delivery area
// branchSchema.methods.removeDeliveryArea = async function (postcode) {
//   this.deliveryAreas = this.deliveryAreas.filter(
//     (area) => area.postcode !== postcode
//   );
//   await this.save();
// };

export const Branch = mongoose.model("Branch", branchSchema);

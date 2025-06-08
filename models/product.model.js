import mongoose from "mongoose";
const { ObjectId } = mongoose;
const productSchema = new mongoose.Schema(
  {
    category: {
      type: ObjectId,
      ref: "Category",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    ratings: [
      {
        star: Number,
        postedBy: {
          type: ObjectId,
          ref: "User",
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

productSchema.virtual("actualPrice").get(function () {
  return this.price;
});

productSchema.virtual("finalPrice").get(function () {
  const discountAmount = (this.price * this.discount) / 100;
  return this.price - discountAmount;
});

export const Product = mongoose.model("Product", productSchema);

import { Product } from "../models/product.model.js";
// Create a new product
export const createProduct = async (req, res) => {
  try {
    const { category, title, price, discount, description } = req.body;

    // Create a new product object
    const newProduct = new Product({
      category,
      title,
      price,
      discount,
      description,
    });
    // Handle image upload if present
    if (req.file) {
      newProduct.image = req.file.path;
    }

    await newProduct.save();

    res.status(201).json({
      success: true,
      message: "Food added successfully!",
      food: newProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const foods = await Product.find({})
      .sort({ createdAt: -1 })
      .populate("category")
      .exec();
    res.status(200).json({
      success: true,
      foods,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const food = await Product.findOne({
      _id: req.params.id,
    })
      .populate("category")
      .exec();
    if (!food) {
      return res
        .status(404)
        .json({ success: false, message: "Food not found" });
    }
    res.status(200).json({
      success: true,
      food,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update a product
export const updateProduct = async (req, res) => {
  const { category, title, price, discount, description, id } = req.body;
  try {
    const updateFields = { category, title, price, discount, description };

    const food = await Product.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!food) {
      return res
        .status(404)
        .json({ success: false, message: "Food not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Food updated successfully.",
      data: food,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Delete a product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res.status(200).json({
      success: true,
      message: "Food deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// filter
export const getFilteredProducts = async (req, res) => {
  try {
    const { category, title } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (title) {
      query.title = { $regex: title, $options: "i" }; // Case-insensitive search
    }

    const foods = await Product.find(query);

    if (foods.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No foods found.",
      });
    }

    res.status(200).json({
      success: true,
      foods,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

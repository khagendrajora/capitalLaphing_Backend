import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
// create
const createCategory = async (req, res) => {
  const { title } = req.body;
  const categoryExists = await Category.findOne({ title });
  if (categoryExists) {
    return res
      .status(404)
      .json({ success: false, message: "Menu aleady exists." });
  }
  const category = new Category({
    title,
  });
  if (req.file) {
    category.thumb_nail = req.file.path;
  }
  await category.save();
  return res.status(201).json({
    success: true,
    message: "Menu added Successfully!",
    category,
  });
};

const getCategories = async (req, res) => {
  const categories = await Category.find({}).sort({ createdAt: -1 }).exec();
  if (categories) {
    return res.status(201).json(categories);
  } else {
    return res
      .status(404)
      .json({ success: false, message: "Internal Server error" });
  }
};

const getCategory = async (req, res) => {
  const category = await Category.findOne({
    _id: req.params.id,
  }).exec();
  if (category) {
    return res.status(201).json(category);
  } else {
    return res
      .status(404)
      .json({ success: false, message: "Internal Server error" });
  }
};

const updateCategory = async (req, res) => {
  const { title, id, isActive } = req.body;
  try {
    const updateFields = {
      title,
      id,
      isActive,
    };
    if (req.file) {
      updateFields.thumb_nail = req.file.path;
    }

    const category = await Category.findByIdAndUpdate(id, updateFields, {
      new: true,
    });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }
    return res.status(200).json({
      success: true,
      message: "Category updated successfully.",
    });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
};

const deleteCategory = async (req, res) => {
  const id = req.params.id;
  try {
    const categoryFoods = await Category.findOne({
      _id: id,
    });
    if (!categoryFoods) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }

    // Check if the category has any associated products
    const products = await Product.find({ category: id });

    if (products.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete. Products are associated with this category. Please remove the products first.",
      });
    }
    const category = await Category.findOneAndDelete({
      _id: id,
    });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Failed to delete category." });
    }
    return res.status(201).json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};
export {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};

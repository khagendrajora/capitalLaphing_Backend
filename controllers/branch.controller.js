import { Branch } from "../models/branch.model.js";

// Create a new branch
export const createBranch = async (req, res) => {
  try {
    const {
      title,
      // deliveryAreas,
      openingHours,
      houseNumber,
      street,
      suburb,
      postalCode,
      state,
    } = req.body;
    const branch = new Branch({
      title,
      houseNumber,
      street,
      suburb,
      postalCode,
      state,
      // deliveryAreas,
      openingHours,
    });
    await branch.save();
    res.status(201).json({
      success: true,
      message: "Branch added successfully!",
      branch,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find({})
      .sort({ createdAt: -1 })
      .populate({
        path: "assignedProducts.product",
        model: "Product",
        select: "-price",
        populate: {
          path: "category",
          model: "Category",
        },
      })
      .exec();

    res.status(200).json({
      success: true,
      branches,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Assign products to a branch with different prices
export const assignProductsToBranch = async (req, res) => {
  try {
    const { branchId, products } = req.body;
    const branch = await Branch.findById(branchId);
    if (!branch)
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });

    branch.assignedProducts.push(
      ...products.map(({ productId, price }) => ({
        product: productId,
        price,
      }))
    );

    const savedBranch = await branch.save();
    if (!savedBranch) {
      return res
        .status(400)
        .json({ success: false, message: "Failed to save" });
    } else {
      return res.status(200).json({
        success: true,
        branch,
        message: "Products assigned successfully.",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateProductsToBranch = async (req, res) => {
  try {
    const { branchId, products } = req.body;
    // console.log(branchId);
    // console.log(products);
    if (!branchId || !Array.isArray(products)) {
      return res.status(400).json({ message: "Invalid payload." });
    }
    const branch = await Branch.findById(branchId);
    // console.log(branch);
    if (!branch)
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });

    let updatedCount = 0;

    products.forEach(({ productId, isActive, price }) => {
      const assignment = branch.assignedProducts.find(
        (ap) => ap.product.toString() === productId
      );
      if (assignment) {
        assignment.isActive = isActive;
        assignment.price = price;
        updatedCount++;
      }
    });

    const savedBranch = await branch.save();
    if (!savedBranch) {
      return res
        .status(400)
        .json({ success: false, message: "Failed to save" });
    } else {
      return res.status(200).json({
        success: true,
        branch,
        message: "Products Updated successfully.",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update branch details
export const updateBranch = async (req, res) => {
  try {
    const {
      id,
      title,
      // deliveryAreas,
      openingHours,
      houseNumber,
      street,
      suburb,
      postalCode,
      state,
    } = req.body;
    const branch = await Branch.findByIdAndUpdate(
      id,
      {
        title,
        // deliveryAreas,
        openingHours,
        houseNumber,
        street,
        suburb,
        postalCode,
        state,
      },
      { new: true }
    );

    if (!branch)
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });

    res
      .status(200)
      .json({ success: true, message: "Branch updated successfully.", branch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get daily statistics
export const getDailyStats = async (req, res) => {
  try {
    const { branchId } = req.params;
    const branch = await Branch.findById(branchId);
    if (!branch) return res.status(404).json({ error: "Branch not found" });

    res.status(200).json({ success: true, dailyStats: branch.dailyStats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete a branch
export const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch)
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });

    res
      .status(200)
      .json({ success: true, message: "Branch deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

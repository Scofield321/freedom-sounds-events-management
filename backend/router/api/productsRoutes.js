const express = require("express");
const multer = require("multer");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts,
  getAnalytics,
} = require("../../controllers/productsController");

const { adminAuth } = require("../../middleware/authMiddleware");

// -----------------------------
// Public routes
// -----------------------------
router.get("/", getProducts); // Get all products
router.get("/search", searchProducts); // Search products
router.get("/category/:category", getProductsByCategory); // Filter by category

// -----------------------------
// Admin protected routes
// -----------------------------
router.get("/analytics", adminAuth, getAnalytics); // Analytics must come BEFORE /:id
router.post("/", adminAuth, upload.array("images"), createProduct);
router.put("/:id", adminAuth, upload.array("images"), updateProduct);
router.delete("/:id", adminAuth, deleteProduct);

// -----------------------------
// Dynamic route (must come last)
// -----------------------------
router.get("/:id", getProductById); // Get product by ID

module.exports = router;

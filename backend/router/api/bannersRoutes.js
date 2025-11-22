const express = require("express");
const multer = require("multer");
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

const {
  createBanner,
  getBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
} = require("../../controllers/bannersController");

const { adminAuth } = require("../../middleware/authMiddleware");

// PUBLIC
router.get("/", getBanners);
router.get("/:id", getBannerById);

// ADMIN ONLY
router.post("/", adminAuth, upload.array("banners"), createBanner);
router.put("/:id", adminAuth, upload.array("banners"), updateBanner);
router.delete("/:id", adminAuth, deleteBanner);

module.exports = router;

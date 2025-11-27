const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const {
  createAdvertising,
  getAdvertising,
  getAdvertisingById,
  deleteAdvertising,
  updateAdvertising,
} = require("../../controllers/advertisingController");

const { adminAuth } = require("../../middleware/authMiddleware");

// Public routes
router.get("/", getAdvertising);
router.post("/", adminAuth, upload.array("files"), createAdvertising);
router.get("/:id", getAdvertisingById);

// Admin routes
router.put("/:id", upload.array("files"), updateAdvertising);
router.delete("/:id", adminAuth, deleteAdvertising);

module.exports = router;

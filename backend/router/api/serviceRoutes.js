const express = require("express");
const multer = require("multer");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const {
  createService,
  getServices,
  getServiceById,
  deleteService,
  updateService,
} = require("../../controllers/servicesController");

const { adminAuth } = require("../../middleware/authMiddleware");

// Public
router.get("/", getServices);
router.get("/:id", getServiceById);

// Admin
router.post("/", adminAuth, upload.array("images"), createService);
router.put("/:id", upload.array("images"), updateService);
router.delete("/:id", adminAuth, deleteService);

module.exports = router;

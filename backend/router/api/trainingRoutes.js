const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const {
  createTraining,
  getTraining,
  getTrainingById,
  deleteTraining,
  updateTraining,
} = require("../../controllers/trainingController");

const { adminAuth } = require("../../middleware/authMiddleware");

// Public
router.get("/", getTraining);
router.get("/:id", getTrainingById);

// Admin
router.post("/", adminAuth, upload.array("images"), createTraining);
router.put("/:id", upload.array("images"), updateTraining);
router.delete("/:id", adminAuth, deleteTraining);

module.exports = router;

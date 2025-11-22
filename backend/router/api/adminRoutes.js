const express = require("express");
const { login, createAdmin } = require("../../controllers/authController");
const { adminAuth } = require("../../middleware/authMiddleware");

const router = express.Router();

// -------------------------
// Admin authentication
// -------------------------

// Admin login
router.post("/login", login);

// Optional: seed/create admin (one-time, protected by secret in controller)
router.post("/create", createAdmin);

router.get("/dashboard", adminAuth, (req, res) => {
  res.json({ message: "Welcome to the admin dashboard", admin: req.admin });
});

module.exports = router;

const express = require("express");
const router = express.Router();

// Admin routes (login, dashboard, product management)
router.use("/admin", require("./adminRoutes"));

// Public routes
router.use("/products", require("./productsRoutes"));
router.use("/banners", require("./bannersRoutes"));
router.use("/services", require("./serviceRoutes"));
router.use("/training", require("./trainingRoutes"));
router.use("/advertising", require("./advertisingRoutes"));

module.exports = router;

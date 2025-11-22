require("dotenv").config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});

const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const pool = require("./config/db");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

const server = http.createServer(app);

// -------------------------
// Middlewares
// -------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "https://freedom-sounds-events-management.vercel.app",
  "http://127.0.0.1:5500",
  "http://localhost:5000",
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("CORS not allowed"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// -------------------------
// Serve static uploads (if needed)
// -------------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -------------------------
// Root route
// -------------------------
app.get("/", (req, res) => res.json({ message: "Store backend running!" }));

// -------------------------
// API Routes
// -------------------------
app.use("/api", require("./router/api"));

// -------------------------
// 404 Handler
// -------------------------
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// -------------------------
// Global Error Handler
// -------------------------
app.use(errorHandler);

// -------------------------
// Start server
// -------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

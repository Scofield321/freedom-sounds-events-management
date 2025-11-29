require("dotenv").config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});

const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const pool = require("./config/db");
const { errorHandler } = require("./middleware/errorHandler");
const allowedOrigins = [
  "https://freedom-sounds-events-management.vercel.app",
  "http://127.0.0.1:5500",
  "http://localhost:5000",
];

const app = express();

const server = http.createServer(app);

// -------------------------
// Socket.IO Setup
// -------------------------
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make IO available globally in routes
app.set("io", io);

// -------------------------
// Middlewares
// -------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow server-to-server / tools
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS not allowed"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    preflightContinue: false,
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
server.listen(PORT, () =>
  console.log(`Server running with Socket.IO on port ${PORT}`)
);

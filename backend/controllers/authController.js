const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { ADMIN_CREATION_SECRET, JWT_SECRET } = process.env;

// -----------------------------
// Login admin
// -----------------------------
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch admin by email
    const result = await pool.query("SELECT * FROM admins WHERE email = $1", [
      email,
    ]);
    const admin = result.rows[0];

    if (!admin) return res.status(400).json({ error: "Invalid credentials" });

    // Compare password
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign({ id: admin.id, role: "admin" }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin.id,
        first_name: admin.first_name,
        last_name: admin.last_name,
        email: admin.email,
        role: "admin",
      },
    });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Seed admin (one-time creation)
// -----------------------------
const createAdmin = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, secret } = req.body;

    if (secret !== ADMIN_CREATION_SECRET)
      return res.status(403).json({ msg: "Not authorized" });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Insert admin with UUID
    const result = await pool.query(
      `INSERT INTO admins (first_name, last_name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, first_name, last_name, email`,
      [first_name, last_name, email, hashed]
    );

    const admin = result.rows[0];

    // Generate JWT token
    const token = jwt.sign({ id: admin.id, role: "admin" }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ success: true, token, admin });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ msg: "Email already exists" });
    }
    next(err);
  }
};

module.exports = { login, createAdmin };

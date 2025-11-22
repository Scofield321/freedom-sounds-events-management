const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ msg: "No token provided" });

  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin")
      return res.status(403).json({ msg: "Forbidden" });

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
}

module.exports = { adminAuth };

const jwt = require("jsonwebtoken");
const Caregiver = require("../models/Caregiver");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const caregiver = await Caregiver.findById(decoded.id).select("-passwordHash");
    if (!caregiver) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.caregiver = caregiver;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token expired or invalid" });
  }
};

module.exports = authMiddleware;

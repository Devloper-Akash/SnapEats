import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const requireAdmin = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: "Sign in to continue." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await User.findById(decoded.userId).select("fullName email role adminRole isBlocked");
    if (!admin || admin.role !== "admin" || !admin.adminRole || admin.isBlocked) {
      return res.status(403).json({ message: "Admin access required." });
    }

    req.admin = admin;
    req.userId = admin._id;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Your session is invalid or has expired." });
  }
};

export default requireAdmin;

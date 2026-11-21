import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import genToken from "../utils/token.js";

const cookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.RENDER;
  return { secure: isProduction, sameSite: isProduction ? "none" : "lax", maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true };
};

const attempts = new Map();
const rateLimitAdminLogin = (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return next();
  }
  if (current.count >= 5) {
    res.set("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ message: "Too many sign-in attempts. Please try again in a few minutes." });
  }
  current.count += 1;
  return next();
};

export const signInAdmin = [rateLimitAdminLogin, async (req, res) => {
  try {
    const normalizedEmail = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!normalizedEmail || !password || normalizedEmail.length > 254 || password.length > 200) {
      return res.status(400).json({ message: "Enter a valid email and password." });
    }
    const user = await User.findOne({ email: normalizedEmail });
    const validPassword = user?.password ? await bcrypt.compare(password, user.password) : false;
    if (!user || !validPassword || user.role !== "admin" || !user.adminRole || user.isBlocked) {
      return res.status(401).json({ message: "Email or password is incorrect, or this account is not an active admin." });
    }
    const token = await genToken(user._id);
    if (!token) return res.status(500).json({ message: "Could not create an admin session." });
    const key = req.ip || req.socket.remoteAddress || "unknown";
    attempts.delete(key);
    res.cookie("token", token, cookieOptions());
    return res.json({ admin: { _id: user._id, fullName: user.fullName, email: user.email, adminRole: user.adminRole }, token });
  } catch (error) {
    console.error("Admin sign-in error:", error);
    return res.status(500).json({ message: "Unable to sign in right now." });
  }
}];

export const signOutAdmin = (_req, res) => {
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.RENDER;
  res.clearCookie("token", { httpOnly: true, secure: isProduction, sameSite: isProduction ? "none" : "lax" });
  return res.json({ message: "Signed out." });
};

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDb from "../config/db.js";
import User from "../models/user.model.js";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const fullName = process.env.ADMIN_NAME?.trim() || "SnapEats Admin";
const mobile = process.env.ADMIN_MOBILE?.trim() || "0000000000";

if (!email || !password || password.length < 12) {
  console.error("Set ADMIN_EMAIL and an ADMIN_PASSWORD with at least 12 characters before seeding.");
  process.exit(1);
}

try {
  await connectDb();
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (existingUser.role === "admin" && existingUser.adminRole === "superadmin") {
      console.log("A superadmin already exists for that email; no changes made.");
      process.exitCode = 0;
    } else {
      throw new Error("That email already belongs to a non-superadmin account. Choose a new ADMIN_EMAIL.");
    }
  } else {
    const hashedPassword = await bcrypt.hash(password, 12);
    await User.create({ fullName, email, mobile, password: hashedPassword, role: "admin", adminRole: "superadmin" });
    console.log(`Created superadmin account for ${email}.`);
  }
} catch (error) {
  console.error(`Unable to seed superadmin: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

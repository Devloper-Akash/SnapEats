import mongoose from "mongoose";
import AdminAudit from "../models/adminAudit.model.js";
import Coupon from "../models/coupon.model.js";
import { CouponError, quoteCoupon } from "../services/coupon.service.js";

class CouponInputError extends Error {}

const publicCoupon = (coupon) => ({
  _id: coupon._id,
  code: coupon.code,
  title: coupon.title,
  description: coupon.description,
  discountType: coupon.discountType,
  discountValue: coupon.discountValue,
  minOrderAmount: coupon.minOrderAmount,
  maxDiscount: coupon.maxDiscount,
  startsAt: coupon.startsAt,
  endsAt: coupon.endsAt,
  firstOrderOnly: coupon.firstOrderOnly,
  freeDelivery: coupon.freeDelivery,
  applicableShops: coupon.applicableShops,
  applicableCategories: coupon.applicableCategories,
  fundingSource: coupon.fundingSource,
  isActive: coupon.isActive,
  usageLimit: coupon.usageLimit,
  usedCount: coupon.usedCount,
  perUserLimit: coupon.perUserLimit,
});

const normalizeOptionalNumber = (value) => value === "" || value === null || value === undefined ? null : Number(value);

const parsePayload = (body) => {
  const startsAt = new Date(body.startsAt);
  const endsAt = new Date(body.endsAt);
  const discountType = String(body.discountType || "");
  const discountValue = Number(body.discountValue);
  const minOrderAmount = Number(body.minOrderAmount || 0);
  const maxDiscount = normalizeOptionalNumber(body.maxDiscount);
  const usageLimit = normalizeOptionalNumber(body.usageLimit);
  const perUserLimit = Number(body.perUserLimit || 1);
  const applicableShops = Array.isArray(body.applicableShops) ? body.applicableShops.map(String).filter(Boolean) : String(body.applicableShops || "").split(",").map((value) => value.trim()).filter(Boolean);
  const applicableCategories = Array.isArray(body.applicableCategories) ? body.applicableCategories.map(String) : String(body.applicableCategories || "").split(",");

  const freeDelivery = Boolean(body.freeDelivery);
  if (!/^[a-zA-Z0-9_-]{3,32}$/.test(String(body.code || "").trim())) throw new CouponInputError("Code must be 3–32 letters, numbers, hyphens or underscores.");
  if (!String(body.title || "").trim()) throw new CouponInputError("Offer name is required.");
  if (!["percentage", "flat"].includes(discountType)) throw new CouponInputError("Choose percentage or flat discount.");
  if (!Number.isFinite(discountValue) || discountValue < 0 || (!freeDelivery && discountValue === 0) || (discountType === "percentage" && discountValue > 100)) throw new CouponInputError("Discount value is outside the allowed range.");
  if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) throw new CouponInputError("Minimum order must be zero or more.");
  if (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount < 0)) throw new CouponInputError("Maximum discount must be zero or more.");
  if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1)) throw new CouponInputError("Total usage limit must be a positive whole number.");
  if (!Number.isInteger(perUserLimit) || perUserLimit < 1) throw new CouponInputError("Per-customer limit must be a positive whole number.");
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || startsAt >= endsAt) throw new CouponInputError("Choose a valid offer start and end time.");
  if (applicableShops.some((id) => !mongoose.isValidObjectId(id))) throw new CouponInputError("Enter valid restaurant IDs, separated by commas.");

  return {
    code: String(body.code).trim().toUpperCase(),
    title: String(body.title).trim(),
    description: String(body.description || "").trim(),
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscount,
    usageLimit,
    perUserLimit,
    startsAt,
    endsAt,
    firstOrderOnly: Boolean(body.firstOrderOnly),
    freeDelivery,
    applicableShops,
    applicableCategories: applicableCategories.map((category) => category.trim()).filter(Boolean),
    fundingSource: body.fundingSource === "shop" ? "shop" : "admin",
    isActive: body.isActive !== false,
  };
};

export const getAdminCoupons = async (_req, res) => {
  try {
    const coupons = await Coupon.find().select("-redemptions").sort({ createdAt: -1 }).limit(200).lean();
    return res.json({ coupons });
  } catch (error) {
    console.error("Admin coupons error:", error);
    return res.status(500).json({ message: "Unable to load offers." });
  }
};

export const createAdminCoupon = async (req, res) => {
  try {
    const payload = parsePayload(req.body || {});
    const coupon = await Coupon.create(payload);
    await AdminAudit.create({ actor: req.admin._id, action: "coupon.created", targetType: "Coupon", targetId: coupon._id, details: { code: coupon.code } });
    return res.status(201).json({ coupon: publicCoupon(coupon) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "That offer code is already in use." });
    if (error instanceof CouponInputError || error.name === "ValidationError") return res.status(400).json({ message: error.message || "Offer details are invalid." });
    console.error("Create coupon error:", error);
    return res.status(500).json({ message: "Unable to create offer." });
  }
};

export const updateAdminCoupon = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.couponId)) return res.status(400).json({ message: "Invalid offer id." });
    const current = await Coupon.findById(req.params.couponId);
    if (!current) return res.status(404).json({ message: "Offer not found." });
    const payload = parsePayload({ ...current.toObject(), ...req.body });
    const coupon = await Coupon.findByIdAndUpdate(current._id, { $set: payload }, { new: true, runValidators: true });
    await AdminAudit.create({ actor: req.admin._id, action: "coupon.updated", targetType: "Coupon", targetId: coupon._id, details: { code: coupon.code, isActive: coupon.isActive } });
    return res.json({ coupon: publicCoupon(coupon) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "That offer code is already in use." });
    if (error instanceof CouponInputError || error.name === "ValidationError") return res.status(400).json({ message: error.message || "Offer details are invalid." });
    console.error("Update coupon error:", error);
    return res.status(500).json({ message: "Unable to update offer." });
  }
};

export const disableAdminCoupon = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.couponId)) return res.status(400).json({ message: "Invalid offer id." });
    const coupon = await Coupon.findByIdAndUpdate(req.params.couponId, { $set: { isActive: false } }, { new: true });
    if (!coupon) return res.status(404).json({ message: "Offer not found." });
    await AdminAudit.create({ actor: req.admin._id, action: "coupon.disabled", targetType: "Coupon", targetId: coupon._id, details: { code: coupon.code } });
    return res.json({ coupon: publicCoupon(coupon) });
  } catch (error) {
    console.error("Disable coupon error:", error);
    return res.status(500).json({ message: "Unable to disable offer." });
  }
};

export const getPublicCoupons = async (_req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({ isActive: true, startsAt: { $lte: now }, endsAt: { $gte: now }, $or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }] })
      .select("code title description discountType discountValue minOrderAmount maxDiscount startsAt endsAt firstOrderOnly freeDelivery fundingSource applicableShops applicableCategories")
      .sort({ createdAt: -1 }).limit(20).lean();
    return res.json({ coupons });
  } catch (error) {
    console.error("Public coupons error:", error);
    return res.status(500).json({ message: "Unable to load current offers." });
  }
};

export const validatePublicCoupon = async (req, res) => {
  try {
    const quote = await quoteCoupon({ userId: req.userId, code: req.body?.code, cartItems: req.body?.cartItems });
    return res.json({
      coupon: { code: quote.coupon.code, title: quote.coupon.title, discountType: quote.coupon.discountType, discountValue: quote.coupon.discountValue, freeDelivery: quote.coupon.freeDelivery },
      subtotal: quote.subtotal,
      discountAmount: quote.discountAmount,
      deliveryFee: quote.deliveryFee,
      deliverySavings: quote.deliverySavings,
      totalSavings: quote.totalSavings,
      totalAmount: quote.totalAmount,
    });
  } catch (error) {
    if (error instanceof CouponError) return res.status(error.status).json({ message: error.message });
    console.error("Validate coupon error:", error);
    return res.status(500).json({ message: "Unable to validate this offer." });
  }
};

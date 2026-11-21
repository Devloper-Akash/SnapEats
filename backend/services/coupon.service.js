import mongoose from "mongoose";
import Coupon from "../models/coupon.model.js";
import Item from "../models/item.model.js";
import Order from "../models/order.model.js";

export class CouponError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export const quoteCoupon = async ({ userId, code, cartItems }) => {
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (!normalizedCode) throw new CouponError("Enter an offer code.");
  if (!Array.isArray(cartItems) || cartItems.length === 0) throw new CouponError("Your cart is empty.");
  if (cartItems.length > 50) throw new CouponError("Your cart has too many line items.");

  const coupon = await Coupon.findOne({ code: normalizedCode, isActive: true });
  if (!coupon) throw new CouponError("That offer code is not active.");
  const now = new Date();
  if (now < coupon.startsAt) throw new CouponError("This offer is not available yet.");
  if (now > coupon.endsAt) throw new CouponError("This offer has expired.");
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) throw new CouponError("This offer has reached its usage limit.");

  const personalUseCount = coupon.redemptions.filter((entry) => String(entry.user) === String(userId)).length;
  if (personalUseCount >= coupon.perUserLimit) throw new CouponError("You have already used this offer the maximum number of times.");
  if (coupon.firstOrderOnly && await Order.exists({ user: userId })) throw new CouponError("This offer is for your first order only.");

  const normalizedItems = cartItems.map((item) => ({
    id: String(item.id || item.item || ""),
    quantity: Number(item.quantity),
    shop: item.shop ? String(item.shop) : "",
  }));
  if (normalizedItems.some((item) => !mongoose.isValidObjectId(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 50)) {
    throw new CouponError("Your cart has an invalid item or quantity.");
  }

  const ids = normalizedItems.map((item) => item.id);
  if (new Set(ids).size !== ids.length) throw new CouponError("Remove duplicate cart lines and try again.");
  const databaseItems = await Item.find({ _id: { $in: ids } }).select("name image price shop category").lean();
  if (databaseItems.length !== ids.length) throw new CouponError("One or more dishes are no longer available.");
  const byId = new Map(databaseItems.map((item) => [String(item._id), item]));
  let subtotal = 0;
  let eligibleSubtotal = 0;
  const verifiedItems = normalizedItems.map((cartItem) => {
    const item = byId.get(cartItem.id);
    const shopId = String(item.shop);
    if (cartItem.shop && cartItem.shop !== shopId) throw new CouponError("A dish has moved to a different restaurant. Refresh your cart.");
    const lineTotal = Number(item.price) * cartItem.quantity;
    subtotal += lineTotal;
    const matchesShop = coupon.applicableShops.length > 0 && coupon.applicableShops.some((shop) => String(shop) === shopId);
    const matchesCategory = coupon.applicableCategories.length > 0 && coupon.applicableCategories.some((category) => category.toLowerCase() === String(item.category || "").toLowerCase());
    const hasScope = coupon.applicableShops.length > 0 || coupon.applicableCategories.length > 0;
    if (!hasScope || matchesShop || matchesCategory) eligibleSubtotal += lineTotal;
    return { id: cartItem.id, name: item.name, image: item.image, price: Number(item.price), shop: shopId, category: item.category, quantity: cartItem.quantity };
  });

  if (subtotal < coupon.minOrderAmount) throw new CouponError(`Add ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(coupon.minOrderAmount - subtotal)} more to use this offer.`);
  if (eligibleSubtotal <= 0) throw new CouponError("This offer does not apply to the dishes in your cart.");

  let discountAmount = coupon.discountType === "percentage"
    ? eligibleSubtotal * coupon.discountValue / 100
    : Math.min(eligibleSubtotal, coupon.discountValue);
  if (coupon.maxDiscount != null) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
  discountAmount = Math.min(eligibleSubtotal, Math.round(discountAmount * 100) / 100);
  const standardDeliveryFee = subtotal > 500 ? 0 : 40;
  const deliveryFee = coupon.freeDelivery ? 0 : standardDeliveryFee;
  const deliverySavings = standardDeliveryFee - deliveryFee;
  const totalAmount = Math.max(0, Math.round((subtotal + deliveryFee - discountAmount) * 100) / 100);

  return { coupon, items: verifiedItems, subtotal, eligibleSubtotal, discountAmount, standardDeliveryFee, deliveryFee, deliverySavings, totalAmount, totalSavings: discountAmount + deliverySavings };
};

export const reserveCouponUse = async ({ coupon, userId, orderId }) => {
  const now = new Date();
  const filter = {
    _id: coupon._id,
    isActive: true,
    startsAt: { $lte: now },
    endsAt: { $gte: now },
    $expr: {
      $lt: [
        { $size: { $filter: { input: { $ifNull: ["$redemptions", []] }, as: "redemption", cond: { $eq: ["$$redemption.user", userId] } } } },
        coupon.perUserLimit,
      ],
    },
  };
  if (coupon.usageLimit != null) filter.usedCount = { $lt: coupon.usageLimit };
  return Coupon.findOneAndUpdate(filter, {
    $inc: { usedCount: 1 },
    $push: { redemptions: { user: userId, order: orderId, redeemedAt: now } },
  }, { new: true });
};

export const releaseCouponUse = async ({ couponId, orderId }) => {
  if (!couponId || !orderId) return;
  try {
    await Coupon.updateOne(
      { _id: couponId },
      {
        $inc: { usedCount: -1 },
        $pull: { redemptions: { order: orderId } },
      }
    );
  } catch (err) {
    console.error("Error releasing coupon use:", err);
  }
};

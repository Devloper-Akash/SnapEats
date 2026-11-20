import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true, uppercase: true, minlength: 3, maxlength: 32, index: true },
  title: { type: String, required: true, trim: true, maxlength: 90 },
  description: { type: String, trim: true, maxlength: 240, default: "" },
  discountType: { type: String, enum: ["percentage", "flat"], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, min: 0, default: 0 },
  maxDiscount: { type: Number, min: 0, default: null },
  usageLimit: { type: Number, min: 1, default: null },
  usedCount: { type: Number, min: 0, default: 0 },
  perUserLimit: { type: Number, min: 1, default: 1 },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  firstOrderOnly: { type: Boolean, default: false },
  freeDelivery: { type: Boolean, default: false },
  applicableShops: [{ type: mongoose.Schema.Types.ObjectId, ref: "Shop" }],
  applicableCategories: [{ type: String, trim: true }],
  fundingSource: { type: String, enum: ["admin", "shop"], default: "admin" },
  isActive: { type: Boolean, default: true, index: true },
  redemptions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    redeemedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

couponSchema.index({ isActive: 1, startsAt: 1, endsAt: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;

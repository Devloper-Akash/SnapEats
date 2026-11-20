import express from "express";
import requireAdmin from "../middlewares/requireAdmin.js";
import { getAdminDashboard, getAdminShops, updateAdminShop } from "../controllers/admin.controllers.js";
import { createAdminCoupon, disableAdminCoupon, getAdminCoupons, updateAdminCoupon } from "../controllers/coupon.controllers.js";

const adminRouter = express.Router();

// Every endpoint mounted under /api/admin is protected by this middleware.
adminRouter.use(requireAdmin);

adminRouter.get("/me", (req, res) => {
  res.json({ admin: req.admin });
});
adminRouter.get("/dashboard", getAdminDashboard);
adminRouter.get("/shops", getAdminShops);
adminRouter.patch("/shops/:shopId", updateAdminShop);
adminRouter.get("/coupons", getAdminCoupons);
adminRouter.post("/coupons", createAdminCoupon);
adminRouter.patch("/coupons/:couponId", updateAdminCoupon);
adminRouter.delete("/coupons/:couponId", disableAdminCoupon);

export default adminRouter;

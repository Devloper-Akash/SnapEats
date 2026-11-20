import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { getPublicCoupons, validatePublicCoupon } from "../controllers/coupon.controllers.js";

const couponRouter = express.Router();
couponRouter.get("/active", getPublicCoupons);
couponRouter.post("/validate", isAuth, validatePublicCoupon);

export default couponRouter;

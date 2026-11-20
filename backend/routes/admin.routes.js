import express from "express";
import requireAdmin from "../middlewares/requireAdmin.js";
import { getAdminDashboard, getAdminShops, updateAdminShop } from "../controllers/admin.controllers.js";

const adminRouter = express.Router();

// Every endpoint mounted under /api/admin is protected by this middleware.
adminRouter.use(requireAdmin);

adminRouter.get("/me", (req, res) => {
  res.json({ admin: req.admin });
});
adminRouter.get("/dashboard", getAdminDashboard);
adminRouter.get("/shops", getAdminShops);
adminRouter.patch("/shops/:shopId", updateAdminShop);

export default adminRouter;

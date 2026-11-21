import mongoose from "mongoose";
import AdminAudit from "../models/adminAudit.model.js";
import DeliveryAssignment from "../models/deliveryAssignment.model.js";
import Order from "../models/order.model.js";
import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";

export const getAdminDashboard = async (_req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);
    const validOrderMatch = {
      $or: [
        { paymentMethod: "cod" },
        { paymentMethod: "online", payment: true },
      ],
    };
    const [orderCount, orderTotals, commissionTotals, shopCount, pendingShops, onlineCouriers, userCount, recentOrders, salesTrend, statusCounts, topShops, topDeliveryBoys, activeAssignments] = await Promise.all([
      Order.countDocuments(validOrderMatch),
      Order.aggregate([{ $match: validOrderMatch }, { $group: { _id: null, gmv: { $sum: "$totalAmount" } } }]),
      Order.aggregate([
        { $match: validOrderMatch },
        { $unwind: "$shopOrders" },
        { $lookup: { from: "shops", localField: "shopOrders.shop", foreignField: "_id", as: "shopInfo" } },
        { $set: { commissionRate: { $ifNull: [{ $first: "$shopInfo.commissionRate" }, 10] } } },
        { $group: { _id: null, commission: { $sum: { $multiply: ["$shopOrders.subTotal", { $divide: ["$commissionRate", 100] }] } } } },
      ]),
      Shop.countDocuments({ approvalStatus: "approved", isSuspended: { $ne: true } }),
      Shop.countDocuments({ $or: [{ approvalStatus: "pending" }, { approvalStatus: { $exists: false } }] }),
      User.countDocuments({ role: "deliveryBoy", isOnline: true, isBlocked: { $ne: true } }),
      User.countDocuments({ role: "user", createdAt: { $gte: since } }),
      Order.find(validOrderMatch).sort({ createdAt: -1 }).limit(7).populate("user", "fullName").populate("shopOrders.shop", "name").lean(),
      Order.aggregate([{ $match: { ...validOrderMatch, createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, orders: { $sum: 1 }, sales: { $sum: "$totalAmount" } } }, { $sort: { _id: 1 } }]),
      Order.aggregate([{ $match: validOrderMatch }, { $unwind: "$shopOrders" }, { $group: { _id: "$shopOrders.status", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Order.aggregate([{ $match: validOrderMatch }, { $unwind: "$shopOrders" }, { $group: { _id: "$shopOrders.shop", orders: { $sum: 1 }, sales: { $sum: "$shopOrders.subTotal" } } }, { $sort: { sales: -1 } }, { $limit: 5 }, { $lookup: { from: "shops", localField: "_id", foreignField: "_id", as: "shop" } }, { $unwind: { path: "$shop", preserveNullAndEmptyArrays: true } }, { $project: { name: { $ifNull: ["$shop.name", "Unknown shop"] }, orders: 1, sales: 1 } }]),
      Order.aggregate([{ $match: validOrderMatch }, { $unwind: "$shopOrders" }, { $match: { "shopOrders.status": "delivered", "shopOrders.assignedDeliveryBoy": { $ne: null } } }, { $group: { _id: "$shopOrders.assignedDeliveryBoy", deliveries: { $sum: 1 } } }, { $sort: { deliveries: -1 } }, { $limit: 5 }, { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "courier" } }, { $unwind: { path: "$courier", preserveNullAndEmptyArrays: true } }, { $project: { fullName: { $ifNull: ["$courier.fullName", "Delivery partner"] }, deliveries: 1 } }]),
      DeliveryAssignment.countDocuments({ status: { $in: ["brodcasted", "assigned"] } }),
    ]);

    const trendMap = new Map(salesTrend.map((day) => [day._id, day]));
    const trend = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(since);
      date.setDate(date.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      return { date: key, orders: trendMap.get(key)?.orders || 0, sales: trendMap.get(key)?.sales || 0 };
    });
    const totals = { gmv: orderTotals[0]?.gmv || 0, commission: commissionTotals[0]?.commission || 0 };

    return res.json({
      metrics: { totalOrders: orderCount, gmv: totals.gmv, commissionEarned: totals.commission, activeShops: shopCount, onlineDeliveryBoys: onlineCouriers, newUsers: userCount, pendingApprovals: pendingShops, activeDeliveries: activeAssignments },
      salesTrend: trend,
      ordersByStatus: statusCounts,
      topShops,
      topDeliveryBoys,
      recentOrders,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return res.status(500).json({ message: "Unable to load admin dashboard." });
  }
};

export const getAdminShops = async (req, res) => {
  try {
    const { status = "all", search = "", page = "1", limit = "10" } = req.query;
    const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 10));
    const filter = {};
    if (status === "pending") filter.$or = [{ approvalStatus: "pending" }, { approvalStatus: { $exists: false } }];
    else if (["approved", "rejected"].includes(status)) filter.approvalStatus = status;
    else if (status === "suspended") filter.isSuspended = true;
    const query = search.trim();
    if (query) {
      const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matchingOwners = await User.find({ fullName: { $regex: safeQuery, $options: "i" } }).distinct("_id");
      const searchFilter = { $or: [
        { name: { $regex: safeQuery, $options: "i" } },
        { city: { $regex: safeQuery, $options: "i" } },
        { owner: { $in: matchingOwners } },
      ] };
      if (filter.$or) {
        filter.$and = [filter.$or, searchFilter];
        delete filter.$or;
      } else Object.assign(filter, searchFilter);
    }
    const shops = Shop.find(filter).sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize).populate("owner", "fullName email mobile").lean();
    const [items, total, counts] = await Promise.all([
      shops,
      Shop.countDocuments(filter),
      Promise.all([
        Shop.countDocuments({ $or: [{ approvalStatus: "pending" }, { approvalStatus: { $exists: false } }] }),
        Shop.countDocuments({ approvalStatus: "approved" }),
        Shop.countDocuments(),
        Shop.countDocuments({ isSuspended: true }),
      ]),
    ]);
    return res.json({ shops: items, counts: { pending: counts[0], approved: counts[1], all: counts[2], suspended: counts[3] }, pagination: { page: pageNumber, limit: pageSize, total, pages: Math.ceil(total / pageSize) } });
  } catch (error) {
    console.error("Admin shops error:", error);
    return res.status(500).json({ message: "Unable to load shops." });
  }
};

export const updateAdminShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { approvalStatus, isSuspended, commissionRate, rejectionReason } = req.body;
    if (!mongoose.isValidObjectId(shopId)) return res.status(400).json({ message: "Invalid shop id." });
    const update = {};
    if (approvalStatus !== undefined) {
      if (!["approved", "rejected"].includes(approvalStatus)) return res.status(400).json({ message: "Approval status must be approved or rejected." });
      if (approvalStatus === "rejected" && !String(rejectionReason || "").trim()) return res.status(400).json({ message: "Add a reason when rejecting a shop." });
      update.approvalStatus = approvalStatus;
      update.rejectionReason = approvalStatus === "rejected" ? String(rejectionReason).trim().slice(0, 500) : "";
    }
    if (isSuspended !== undefined) {
      if (typeof isSuspended !== "boolean") return res.status(400).json({ message: "Suspension must be true or false." });
      update.isSuspended = isSuspended;
    }
    if (commissionRate !== undefined) {
      if (!["superadmin", "finance"].includes(req.admin.adminRole)) return res.status(403).json({ message: "Only superadmin or finance admins can change commission rates." });
      const rate = Number(commissionRate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) return res.status(400).json({ message: "Commission must be between 0 and 100." });
      update.commissionRate = rate;
    }
    if ((approvalStatus !== undefined || isSuspended !== undefined) && !["superadmin", "manager"].includes(req.admin.adminRole)) {
      return res.status(403).json({ message: "Only superadmin or manager admins can review or suspend shops." });
    }
    const shop = await Shop.findByIdAndUpdate(shopId, { $set: update }, { new: true, runValidators: true }).populate("owner", "fullName email mobile");
    if (!shop) return res.status(404).json({ message: "Shop not found." });
    await AdminAudit.create({ actor: req.admin._id, action: "shop.updated", targetType: "Shop", targetId: shop._id, details: update });
    return res.json({ shop });
  } catch (error) {
    console.error("Admin shop update error:", error);
    return res.status(500).json({ message: "Unable to update shop." });
  }
};

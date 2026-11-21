import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import Item from "../models/item.model.js";
import deliveryAssignment from "../models/deliveryAssignment.model.js";
import mongoose from "mongoose";
import { sendDeliveryOtpMail } from "../utils/mail.js";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import { CouponError, quoteCoupon, reserveCouponUse, releaseCouponUse } from "../services/coupon.service.js";

dotenv.config();

let instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const formatOwnerOrder = (order, ownerId) => ({
  _id: order._id,
  paymentMethod: order.paymentMethod,
  payment: order.payment,
  user: order.user,
  shopOrders: order.shopOrders.find(
    (o) => (o.owner?._id || o.owner)?.toString() == ownerId.toString(),
  ),
  createdAt: order.createdAt,
  deliveryAddress: order.deliveryAddress,
});

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const placeOrder = async (req, res) => {
  try {
    const { cartItems, paymentMethod, deliveryAddress, totalAmount, couponCode } = req.body;
    if (!cartItems?.length) {
      return res.status(400).json({ message: "Cart is Empty" });
    }
    if (
      !deliveryAddress.text ||
      !deliveryAddress.latitude ||
      !deliveryAddress.longitude
    ) {
      return res
        .status(400)
        .json({ message: "Send Complete Delivery Address" });
    }

    let couponQuote = null;
    let itemsForOrder = cartItems;
    if (couponCode) {
      try {
        couponQuote = await quoteCoupon({ userId: req.userId, code: couponCode, cartItems });
        itemsForOrder = couponQuote.items;
      } catch (error) {
        if (error instanceof CouponError) return res.status(error.status).json({ message: error.message });
        throw error;
      }
    }

    const groupItemsByShop = {};

    itemsForOrder.forEach((item) => {
      const shopId = item.shop;
      if (!groupItemsByShop[shopId]) {
        groupItemsByShop[shopId] = [];
      }
      groupItemsByShop[shopId].push(item);
    });

    // Validate each shop and check city/delivery distance
    for (const shopId of Object.keys(groupItemsByShop)) {
      const shop = await Shop.findById(shopId).populate("owner");
      if (!shop) {
        return res.status(400).json({ message: "Shop Not Found" });
      }

      // Check city delivery matching if deliveryAddress.city is provided
      const deliveryCity = (deliveryAddress.city || "").trim().toLowerCase();
      const shopCity = (shop.city || "").trim().toLowerCase();
      if (deliveryCity && shopCity && !shopCity.includes(deliveryCity) && !deliveryCity.includes(shopCity)) {
        return res.status(400).json({
          message: `${shop.name} is in ${shop.city} and only delivers within ${shop.city}. Your selected location is in ${deliveryAddress.city}. Please select a delivery address in ${shop.city}.`,
        });
      }

      // Check distance if shop owner location coordinates are recorded
      const ownerCoords = shop.owner?.location?.coordinates;
      if (
        Array.isArray(ownerCoords) &&
        ownerCoords.length === 2 &&
        (ownerCoords[0] !== 0 || ownerCoords[1] !== 0) &&
        Number.isFinite(Number(deliveryAddress.latitude)) &&
        Number.isFinite(Number(deliveryAddress.longitude))
      ) {
        const [shopLon, shopLat] = ownerCoords;
        const distKm = calculateDistanceKm(
          shopLat,
          shopLon,
          Number(deliveryAddress.latitude),
          Number(deliveryAddress.longitude),
        );
        const MAX_DELIVERY_RADIUS_KM = 30; // 30 km max radius
        if (distKm > MAX_DELIVERY_RADIUS_KM) {
          return res.status(400).json({
            message: `${shop.name} only delivers within ${MAX_DELIVERY_RADIUS_KM} km of the restaurant. Your selected location is ${Math.round(distKm)} km away. Please choose a delivery address closer to ${shop.name}.`,
          });
        }
      }
    }

    const shopOrders = await Promise.all(
      Object.keys(groupItemsByShop).map(async (shopId) => {
        const shop = await Shop.findById(shopId).populate("owner");
        if (!shop) {
          return res.status(400).json({ message: "Shop Not Found" });
        }
        const items = groupItemsByShop[shopId];
        const subtotal = items.reduce(
          (sum, i) => sum + Number(i.price) * Number(i.quantity),
          0,
        );
        return {
          shop: shop._id,
          owner: shop.owner._id,
          subTotal: subtotal,
          shopOrderItems: items.map((i) => ({
            item: i.id,
            price: i.price,
            quantity: i.quantity,
            name: i.name,
          })),
        };
      }),
    );

    const finalTotal = couponQuote ? couponQuote.totalAmount : totalAmount;
    const couponDetails = couponQuote ? {
      couponId: couponQuote.coupon._id,
      code: couponQuote.coupon.code,
      discountAmount: couponQuote.discountAmount,
      deliverySavings: couponQuote.deliverySavings,
      totalSavings: couponQuote.totalSavings,
    } : undefined;

    if (paymentMethod === "online") {
      const razorOrder = await instance.orders.create({
        amount: Math.round(finalTotal * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });

      const order = await Order.create({
        user: req.userId,
        paymentMethod,
        deliveryAddress,
        totalAmount: finalTotal,
        shopOrders,
        ...(couponDetails && { coupon: couponDetails }),
        razorpayOrderId: razorOrder.id,
        payment: false,
      });

      if (couponQuote) {
        const reserved = await reserveCouponUse({ coupon: couponQuote.coupon, userId: req.userId, orderId: order._id });
        if (!reserved) {
          await Order.deleteOne({ _id: order._id });
          return res.status(409).json({ message: "This offer was just used up. Please remove it and try again." });
        }
      }

      return res.status(201).json({
        razorOrder,
        orderID: order._id,
      });
    }

    const order = await Order.create({
      user: req.userId,
      paymentMethod,
      deliveryAddress,
      totalAmount: finalTotal,
      shopOrders,
      ...(couponDetails && { coupon: couponDetails }),
    });

    if (couponQuote) {
      const reserved = await reserveCouponUse({ coupon: couponQuote.coupon, userId: req.userId, orderId: order._id });
      if (!reserved) {
        await Order.deleteOne({ _id: order._id });
        return res.status(409).json({ message: "This offer was just used up. Please remove it and try again." });
      }
    }

    await order.populate("shopOrders.shopOrderItems.item", "name image price");
    await order.populate("shopOrders.shop", "name");
    await order.populate("shopOrders.owner", "name socketId");
    await order.populate("user", "name email mobile location");

    const io = req.app.get("io");

    if (io) {
      order.shopOrders.forEach((shopOrder) => {
        const ownerSocketId = shopOrder.owner?.socketId;
        const ownerId = (shopOrder.owner?._id || shopOrder.owner).toString();
        const payload = {
          _id: order._id,
          paymentMethod: order.paymentMethod,
          user: order.user,
          shopOrders: shopOrder,
          createdAt: order.createdAt,
          deliveryAddress: order.deliveryAddress,
          totalAmount: order.totalAmount,
          payment: order.payment,
          ownerId,
        };

        if (ownerSocketId) {
          io.to(ownerSocketId).emit("newOrder", payload);
        }
        io.to(ownerId).emit("newOrder", payload);
        io.emit("newOrderNotification", payload);
      });
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: `Place Order Error ${error}` });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const paymentId =
      req.body.razorpay_payment_id || req.body.razorpayPaymentId;
    const { orderId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ message: "Payment ID is required" });
    }

    const payment = await instance.payments.fetch(paymentId);
    if (
      !payment ||
      (payment.status !== "captured" && payment.status !== "authorized")
    ) {
      return res.status(400).json({ message: "Payment Not Captured" });
    }

    if (payment.status === "authorized") {
      try {
        await instance.payments.capture(paymentId, payment.amount);
      } catch (captureErr) {
        console.log("Auto-capture notice:", captureErr.message);
      }
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order Not Found" });
    }
    order.payment = true;
    order.razorpayPaymentId = paymentId;
    await order.save();

    await order.populate("shopOrders.shopOrderItems.item", "name image price");
    await order.populate("shopOrders.shop", "name");
    await order.populate("shopOrders.owner", "name socketId");
    await order.populate("user", "name email mobile location");

    const io = req.app.get("io");

    if (io) {
      order.shopOrders.forEach((shopOrder) => {
        const ownerSocketId = shopOrder.owner?.socketId;
        const ownerId = (shopOrder.owner?._id || shopOrder.owner).toString();
        const payload = {
          _id: order._id,
          paymentMethod: order.paymentMethod,
          user: order.user,
          shopOrders: shopOrder,
          createdAt: order.createdAt,
          deliveryAddress: order.deliveryAddress,
          totalAmount: order.totalAmount,
          payment: order.payment,
          ownerId,
        };

        if (ownerSocketId) {
          io.to(ownerSocketId).emit("newOrder", payload);
        }
        io.to(ownerId).emit("newOrder", payload);
        io.emit("newOrderNotification", payload);
      });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error("Verify payment error:", error);
    res
      .status(500)
      .json({ message: `Verify Payment Error ${error.message || error}` });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const validOrderMatch = {
      $or: [
        { paymentMethod: "cod" },
        { paymentMethod: "online", payment: true },
      ],
    };

    if (user.role == "user") {
      const orders = await Order.find({ user: req.userId, ...validOrderMatch })
        .sort({ createdAt: -1 })
        .populate("shopOrders.shop", "name")
        .populate("shopOrders.owner", "name email mobile")
        .populate("shopOrders.shopOrderItems.item", "name image price")
        .populate("shopOrders.assignedDeliveryBoy", "fullName email mobile");

      return res.status(200).json(orders);
    } else if (user.role == "owner") {
      const orders = await Order.find({ "shopOrders.owner": req.userId, ...validOrderMatch })
        .sort({ createdAt: -1 })
        .populate("shopOrders.shop", "name")
        .populate("user")
        .populate("shopOrders.assignedDeliveryBoy", "fullName email mobile")
        .populate({
          path: "shopOrders.assignment",
          populate: {
            path: "brodcastedTo",
            select: "fullName mobile location",
          },
        })
        .populate("shopOrders.shopOrderItems.item", "name image price");

      const filteredOrders = orders.map((order) =>
        formatOwnerOrder(order, req.userId),
      );

      return res.status(200).json(filteredOrders);
    }
  } catch (error) {
    res.status(500).json({ message: `Get User Orders Error ${error}` });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, shopOrderId } = req.params;
    const { status } = req.body;
    const allowedStatuses = [
      "pending",
      "preparing",
      "out for delivery",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const user = await User.findById(req.userId);
    if (!user || user.role !== "owner") {
      return res
        .status(403)
        .json({ message: "Only owners can update order status" });
    }

    const order = await Order.findOne({
      _id: orderId,
      "shopOrders._id": shopOrderId,
      "shopOrders.owner": req.userId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const shopOrder = order.shopOrders.id(shopOrderId);
    shopOrder.status = status;
    if (
      shopOrder.assignment &&
      (status === "delivered" || status === "cancelled")
    ) {
      await deliveryAssignment.findByIdAndUpdate(shopOrder.assignment, {
        status: "completed",
      });
    }
    let deliveryBoysPayload = [];
    if (status === "out for delivery" && !shopOrder.assignment) {
      const { longitude, latitude } = order.deliveryAddress;
      let nearByDeliveryBoys = [];
      if (longitude && latitude) {
        nearByDeliveryBoys = await User.find({
          role: "deliveryBoy",
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [Number(longitude), Number(latitude)],
              },
              $maxDistance: 5000,
            },
          },
        });
      }

      if (!nearByDeliveryBoys || nearByDeliveryBoys.length === 0) {
        nearByDeliveryBoys = await User.find({ role: "deliveryBoy" });
      }

      const nearByIds = nearByDeliveryBoys.map((b) => b._id);
      const busyIds = await deliveryAssignment
        .find({
          assignTo: { $in: nearByIds },
          status: { $nin: ["brodcasted", "completed"] },
        })
        .distinct("assignTo");

      const busyIdSet = new Set(busyIds.map((id) => String(id)));
      const availableBoys = nearByDeliveryBoys.filter(
        (b) => !busyIdSet.has(String(b._id)),
      );
      const candidates = availableBoys.map((b) => b._id);

      if (candidates.length > 0) {
        const newAssignment = await deliveryAssignment.create({
          order: order._id,
          shop: shopOrder.shop,
          shopOrderId: shopOrder._id,
          brodcastedTo: candidates,
          status: "brodcasted",
        });

        shopOrder.assignedDeliveryBoy = newAssignment.assignTo;
        shopOrder.assignment = newAssignment._id;
        deliveryBoysPayload = availableBoys.map((b) => ({
          id: b._id,
          fullName: b.fullName,
          longitude: b.location.coordinates?.[0],
          latitude: b.location.coordinates?.[1],
          mobile: b.mobile,
        }));

        await newAssignment.populate("order");
        await newAssignment.populate("shop");

        const io = req.app.get("io");
        if (io) {
          availableBoys.forEach((boy) => {
            const boySocketId = boy.socketId;
            if (boySocketId) {
              io.to(boySocketId).emit("newAssignment", {
                assignmentId: newAssignment._id,
                orderId: newAssignment.order._id,
                shopName: newAssignment.shop.name,
                deliveryAddress: newAssignment.order.deliveryAddress,
                items:
                  newAssignment.order.shopOrders.find((so) =>
                    so._id.equals(newAssignment.shopOrderId),
                  )?.shopOrderItems || [],
                subtotal: newAssignment.order.shopOrders.find((so) =>
                  so._id.equals(newAssignment.shopOrderId),
                )?.subTotal,
                sentTo: boy._id,
              });
            }
          });
        }
      }
    }
    await order.save();

    const updatedOrder = await Order.findById(orderId)
      .populate("shopOrders.shop", "name")
      .populate("user")
      .populate("shopOrders.assignedDeliveryBoy", "fullName email mobile")
      .populate({
        path: "shopOrders.assignment",
        populate: {
          path: "brodcastedTo",
          select: "fullName mobile location",
        },
      })
      .populate("shopOrders.shopOrderItems.item", "name image price");

    const updatedShopOrder = updatedOrder.shopOrders.id(shopOrderId);

    const io = req.app.get("io");
    if (io) {
      if (updatedOrder.user?.socketId) {
        io.to(updatedOrder.user.socketId).emit("update-status", {
          orderId: updatedOrder._id,
          shopId: updatedShopOrder.shop._id || updatedShopOrder.shop,
          shopOrderId: updatedShopOrder._id,
          status: updatedShopOrder.status,
          userId: updatedOrder.user._id,
        });
      }
      io.emit("order-status-updated", {
        orderId: updatedOrder._id,
        shopId: updatedShopOrder.shop._id || updatedShopOrder.shop,
        shopOrderId: updatedShopOrder._id,
        status: updatedShopOrder.status,
        userId: updatedOrder.user._id,
      });
    }

    return res.status(200).json({
      order: formatOwnerOrder(updatedOrder, req.userId),
      shopOrder: updatedShopOrder,
      assignedDeliveryBoy: updatedShopOrder?.assignedDeliveryBoy || null,
      availableBoys: deliveryBoysPayload,
      assignment: updatedShopOrder?.assignment || null,
    });
  } catch (error) {
    res.status(500).json({ message: `Update Order Status Error ${error}` });
  }
};

export const getDeliveryBoyAssignment = async (req, res) => {
  try {
    const deliveryBoyId = req.userId;
    const assignments = await deliveryAssignment
      .find({
        brodcastedTo: deliveryBoyId,
        status: "brodcasted",
      })
      .populate("order")
      .populate("shop");

    const validAssignments = assignments.filter((a) => a.order && a.shop);

    const formated = validAssignments.map((a) => {
      const shopOrder = a.order.shopOrders?.find((so) =>
        so._id.equals(a.shopOrderId),
      );
      return {
        assignmentId: a._id,
        orderId: a.order._id,
        shopName: a.shop.name,
        deliveryAddress: a.order.deliveryAddress,
        items: shopOrder?.shopOrderItems || [],
        subtotal: shopOrder?.subTotal || 0,
      };
    });
    return res.status(200).json(formated);
  } catch (error) {
    return res.status(500).json({ message: `Get Assignment error ${error}` });
  }
};

export const acceptOrder = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await deliveryAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    if (
      assignment.status !== "brodcasted" &&
      !(
        assignment.status === "assigned" &&
        assignment.assignTo?.equals(req.userId)
      )
    ) {
      return res.status(400).json({ message: "Assignment is expired" });
    }

    let alreadyAssigned = await deliveryAssignment.findOne({
      _id: { $ne: assignment._id },
      assignTo: req.userId,
      status: { $nin: ["brodcasted", "completed"] },
    });

    if (alreadyAssigned) {
      const existingOrder = await Order.findById(alreadyAssigned.order);
      const existingShopOrder = existingOrder?.shopOrders?.id(
        alreadyAssigned.shopOrderId,
      );
      if (
        !existingOrder ||
        !existingShopOrder ||
        existingShopOrder.status === "delivered" ||
        existingShopOrder.status === "cancelled"
      ) {
        alreadyAssigned.status = "completed";
        await alreadyAssigned.save();
        alreadyAssigned = null;
      }
    }

    if (alreadyAssigned) {
      return res
        .status(400)
        .json({ message: "You have already assigned to another order" });
    }

    const alreadyAcceptedByThisDriver = assignment.status === "assigned" && String(assignment.assignTo) === String(req.userId);
    const orderBeforeAccept = await Order.findById(assignment.order);
    const shopOrderBeforeAccept = orderBeforeAccept?.shopOrders.id(assignment.shopOrderId);
    if (
      !orderBeforeAccept ||
      !shopOrderBeforeAccept ||
      ["cancelled", "delivered"].includes(shopOrderBeforeAccept.status) ||
      ["processing", "cancelled"].includes(orderBeforeAccept.cancellationStatus)
    ) {
      return res.status(409).json({ message: "This order has already been cancelled or completed." });
    }

    if (!alreadyAcceptedByThisDriver) {
      const claimedAssignment = await deliveryAssignment.findOneAndUpdate(
        { _id: assignment._id, status: "brodcasted", assignTo: null },
        { $set: { assignTo: req.userId, status: "assigned", acceptedAt: new Date() } },
        { new: true },
      );
      if (!claimedAssignment) {
        return res.status(409).json({ message: "This delivery offer is no longer available." });
      }
    }

    const orderAssignment = await Order.updateOne(
      {
        _id: assignment.order,
        cancellationStatus: { $nin: ["processing", "cancelled"] },
        shopOrders: { $elemMatch: {
          _id: assignment.shopOrderId,
          status: { $nin: ["cancelled", "delivered"] },
          assignedDeliveryBoy: { $in: [null, req.userId] },
        } },
      },
      { $set: { "shopOrders.$.assignedDeliveryBoy": req.userId } },
    );
    if (!orderAssignment.modifiedCount) {
      const existingAssignment = await Order.exists({
        _id: assignment.order,
        cancellationStatus: { $nin: ["processing", "cancelled"] },
        shopOrders: { $elemMatch: { _id: assignment.shopOrderId, assignedDeliveryBoy: req.userId, status: { $nin: ["cancelled", "delivered"] } } },
      });
      if (!existingAssignment) {
        await deliveryAssignment.updateOne({ _id: assignment._id, assignTo: req.userId }, { $set: { status: "completed" } });
        return res.status(409).json({ message: "This order has already been cancelled or assigned." });
      }
    }

    const order = await Order.findById(assignment.order);
    if (!order) {
      return res.status(404).json({ message: "Assignment is expired" });
    }

    const shopOrder = order.shopOrders.id(assignment.shopOrderId);

    const deliveryBoy = await User.findById(req.userId).select(
      "fullName mobile email location"
    );
    await order.populate("user", "socketId");

    const io = req.app.get("io");
    if (io) {
      const payload = {
        orderId: order._id,
        shopOrderId: assignment.shopOrderId,
        assignedDeliveryBoy: deliveryBoy,
      };

      if (order.user?.socketId) {
        io.to(order.user.socketId).emit("order-accepted", payload);
      }
      if (order.user?._id) {
        io.to(order.user._id.toString()).emit("order-accepted", payload);
      }
      io.emit("order-accepted", payload);
    }

    return res.status(200).json({ message: "Order Accepted Successfully" });
  } catch (error) {
    return res.status(500).json({ message: `Accept Order Error ${error}` });
  }
};

export const getCurrentOrder = async (req, res) => {
  try {
    const assignment = await deliveryAssignment
      .findOne({
        assignTo: req.userId,
        status: "assigned",
      })
      .populate("shop", "name")
      .populate("assignTo", "fullName email mobile location")
      .populate({
        path: "order",
        populate: [
          { path: "user", select: "fullName email location mobile" },
          { path: "shopOrders.shop", select: "name" },
        ],
      });

    if (!assignment || !assignment.order) {
      return res.status(200).json(null);
    }

    const shopOrder = assignment.order.shopOrders?.find(
      (so) => String(so._id) == String(assignment.shopOrderId),
    );

    if (!shopOrder) {
      return res.status(200).json(null);
    }

    let deliveryBoyLocation = { lat: null, lon: null };
    if (assignment.assignTo?.location?.coordinates?.length == 2) {
      deliveryBoyLocation.lat = assignment.assignTo.location.coordinates[1];
      deliveryBoyLocation.lon = assignment.assignTo.location.coordinates[0];
    }

    let customerLocation = { lat: null, lon: null };
    if (assignment.order.deliveryAddress) {
      customerLocation.lat = assignment.order.deliveryAddress?.latitude;
      customerLocation.lon = assignment.order.deliveryAddress?.longitude;
    }

    return res.status(200).json({
      _id: assignment.order._id,
      user: assignment.order.user,
      shopOrder,
      deliveryAddress: assignment.order.deliveryAddress,
      deliveryBoyLocation,
      customerLocation,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Get Current Order Error ${error}` });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate("user")
      .populate({
        path: "shopOrders.shop",
        model: "Shop",
      })
      .populate({
        path: "shopOrders.assignedDeliveryBoy",
        model: "User",
      })
      .populate({
        path: "shopOrders.shopOrderItems.item",
        model: "Item",
      })
      .lean();

    if (!order || (order.paymentMethod === "online" && !order.payment)) {
      return res.status(404).json({ message: "Order Not Found" });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: `Get Order By Id Error ${error}` });
  }
};

export const cancelUnpaidOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }
    const order = await Order.findOne({
      _id: orderId,
      user: req.userId,
      paymentMethod: "online",
      payment: false,
    });
    if (!order) {
      return res.status(200).json({ message: "No unpaid order to cancel" });
    }

    if (order.coupon?.couponId) {
      await releaseCouponUse({
        couponId: order.coupon.couponId,
        orderId: order._id,
      });
    }

    await Order.deleteOne({ _id: order._id });

    return res.status(200).json({ message: "Unpaid order cancelled successfully" });
  } catch (error) {
    console.error("Cancel unpaid order error:", error);
    return res.status(500).json({ message: `Cancel unpaid order error: ${error.message || error}` });
  }
};

export const cancelCustomerOrder = async (req, res) => {
  let orderId;
  try {
    const user = await User.findById(req.userId).select("role");
    if (!user) {
      return res.status(401).json({ message: "Please log in to cancel your order." });
    }

    orderId = String(req.body.orderId || "");
    const reason = String(req.body.reason || "").trim();
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ message: "A valid order is required." });
    }
    if (reason.length < 3 || reason.length > 500) {
      return res.status(400).json({ message: "Please provide a cancellation reason (up to 500 characters)." });
    }

    const order = await Order.findOne({ _id: orderId, user: req.userId });
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (order.cancellationStatus === "cancelled" || order.shopOrders.every((shopOrder) => shopOrder.status === "cancelled")) {
      return res.status(409).json({ message: "This order has already been cancelled." });
    }

    // Allow re-claiming if a prior cancellation attempt crashed or is older than 30 seconds
    const isStaleLock =
      order.cancellationStatus === "processing" &&
      order.cancellationRequestedAt &&
      Date.now() - new Date(order.cancellationRequestedAt).getTime() > 30000;

    if (order.cancellationStatus === "processing" && !isStaleLock) {
      return res.status(409).json({ message: "Your cancellation is already being processed. Please wait a moment." });
    }

    if (order.shopOrders.some((shopOrder) => shopOrder.status === "delivered")) {
      return res.status(409).json({ message: "This order can no longer be cancelled because it has already been delivered." });
    }
    if (order.shopOrders.some((shopOrder) => Boolean(shopOrder.assignedDeliveryBoy))) {
      return res.status(409).json({ message: "A delivery partner has already been assigned, so this order can no longer be cancelled." });
    }

    const shopOrderIds = order.shopOrders.map((shopOrder) => shopOrder._id);
    const activeAssignment = await deliveryAssignment.exists({
      order: order._id,
      shopOrderId: { $in: shopOrderIds },
      status: "assigned",
      assignTo: { $ne: null },
    });
    if (activeAssignment) {
      return res.status(409).json({ message: "A delivery partner has already been assigned, so this order can no longer be cancelled." });
    }

    // Atomically claim the order for cancellation
    const claimedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        user: req.userId,
        $or: [
          { cancellationStatus: { $in: ["none", null] } },
          { cancellationStatus: "processing", cancellationRequestedAt: { $lt: new Date(Date.now() - 30000) } },
        ],
        $and: [
          { shopOrders: { $not: { $elemMatch: { assignedDeliveryBoy: { $exists: true, $ne: null } } } } },
          { shopOrders: { $not: { $elemMatch: { status: "delivered" } } } },
        ],
      },
      { $set: { cancellationStatus: "processing", cancelReason: reason, cancellationRequestedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!claimedOrder) {
      return res.status(409).json({ message: "A delivery partner was assigned or the order changed. This order can no longer be cancelled." });
    }

    let refund = null;
    let refundNote = "";
    if (order.paymentMethod === "online" && order.payment && order.razorpayPaymentId) {
      const receipt = `cancel_${order._id}`;
      try {
        if (!instance) {
          instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
          });
        }
        refund = await instance.payments.refund(order.razorpayPaymentId, {
          receipt,
          notes: { order_id: String(order._id), reason: reason.slice(0, 500) },
        });
      } catch (refundErr) {
        console.warn("Razorpay refund initial error:", refundErr?.message || refundErr);
        try {
          if (typeof instance?.payments?.fetchMultipleRefund === "function") {
            const previousRefunds = await instance.payments.fetchMultipleRefund(order.razorpayPaymentId);
            refund = previousRefunds?.items?.find((entry) => entry.receipt === receipt) || null;
          }
        } catch (fetchErr) {
          console.warn("Razorpay fetchMultipleRefund error:", fetchErr?.message || fetchErr);
        }

        if (!refund) {
          const errMsg = String(refundErr?.message || refundErr?.description || "");
          if (errMsg.toLowerCase().includes("already refunded")) {
            refundNote = "Payment was already refunded.";
          } else {
            console.error("Online refund error for cancelled order:", order._id, refundErr);
            refundNote = "Automatic refund will be processed manually by our team.";
          }
        }
      }
    }

    claimedOrder.shopOrders.forEach((shopOrder) => {
      if (shopOrder.status !== "delivered") {
        shopOrder.status = "cancelled";
      }
    });
    claimedOrder.cancellationStatus = "cancelled";
    claimedOrder.cancelledAt = new Date();
    claimedOrder.refundId = refund?.id || "";
    claimedOrder.refundStatus = refund?.status || (refundNote ? "pending_manual" : "");
    await claimedOrder.save();

    // Clean up broadcasted delivery assignments
    const assignmentsToCancel = await deliveryAssignment.find({
      order: order._id,
      shopOrderId: { $in: shopOrderIds },
      status: "brodcasted",
    });

    await deliveryAssignment.updateMany(
      { order: order._id, shopOrderId: { $in: shopOrderIds }, status: "brodcasted" },
      { $set: { status: "completed" } },
    );
    if (order.coupon?.couponId) {
      await releaseCouponUse({ couponId: order.coupon.couponId, orderId: order._id });
    }

    await claimedOrder.populate("shopOrders.shop", "name address");
    await claimedOrder.populate("shopOrders.shopOrderItems.item", "name image price");
    await claimedOrder.populate("shopOrders.assignedDeliveryBoy", "fullName email mobile");

    const io = req.app.get("io");
    if (io) {
      // Notify broadcasted delivery boys so the broadcast disappears from their screen immediately
      assignmentsToCancel.forEach((assignment) => {
        assignment.brodcastedTo?.forEach((deliveryBoyId) => {
          io.to(String(deliveryBoyId)).emit("assignmentCancelled", {
            assignmentId: assignment._id,
            orderId: order._id,
          });
        });
      });

      claimedOrder.shopOrders.forEach((shopOrder) => {
        const ownerId = (shopOrder.owner?._id || shopOrder.owner)?.toString();
        const payload = {
          orderId: claimedOrder._id,
          shopId: shopOrder._id,
          shopOrderId: shopOrder._id,
          status: "cancelled",
          userId: req.userId,
          cancelReason: reason,
        };
        if (ownerId) io.to(ownerId).emit("update-status", payload);
        io.to(String(req.userId)).emit("update-status", payload);
        io.emit("order-status-updated", payload);
      });
    }

    const message = refund
      ? "Order cancelled. Your refund has been started."
      : refundNote
      ? `Order cancelled. ${refundNote}`
      : "Order cancelled successfully.";

    return res.status(200).json({
      message,
      order: claimedOrder,
    });
  } catch (error) {
    if (orderId) {
      await Order.updateOne({ _id: orderId, user: req.userId, cancellationStatus: "processing" }, {
        $set: { cancellationStatus: "none", cancelReason: "", cancellationRequestedAt: null },
      }).catch(() => {});
    }
    console.error("Cancel customer order error:", error);
    return res.status(500).json({
      message: error?.message ? `Failed to cancel order: ${error.message}` : "We couldn’t cancel this order. Please try again.",
    });
  }
};

export const sendDeliveryOtp = async (req, res) => {
  try {
    const { orderId, shopOrderId } = req.body;
    if (!orderId || !shopOrderId) {
      return res.status(400).json({ message: "orderId and shopOrderId are required" });
    }
    const deliveryBoy = await User.findById(req.userId).select("role");
    if (deliveryBoy?.role !== "deliveryBoy") {
      return res.status(403).json({ message: "Only a delivery boy can request a delivery OTP" });
    }
    const order = await Order.findById(orderId).populate("user");
    if (!order) {
      return res.status(404).json({ message: "Order Not Found" });
    }
    const shopOrder = order.shopOrders.id
      ? order.shopOrders.id(shopOrderId)
      : order.shopOrders?.find((so) => String(so._id) === String(shopOrderId));
    if (!shopOrder) {
      return res
        .status(400)
        .json({ message: "Enter valid order/shopOrder Id" });
    }
    const assignment = await deliveryAssignment.findOne({
      order: order._id,
      shopOrderId: shopOrder._id,
      assignTo: req.userId,
      status: "assigned",
    });
    if (
      String(shopOrder.assignedDeliveryBoy) !== String(req.userId) &&
      (!assignment || String(assignment.assignTo) !== String(req.userId))
    ) {
      return res.status(403).json({ message: "This order is not actively assigned to you" });
    }
    if (shopOrder.status?.toLowerCase() !== "out for delivery") {
      return res.status(400).json({ message: "Order must be out for delivery to send delivery OTP" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    shopOrder.deliveryOtp = otp;
    shopOrder.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await order.save();

    let emailSent = false;
    try {
      await sendDeliveryOtpMail(order.user, otp);
      emailSent = true;
    } catch (error) {
      console.warn("sendDeliveryOtpMail failed or timed out:", error?.message || error);
    }

    const io = req.app.get("io");
    if (io) {
      const customerUserId = (order.user?._id || order.user)?.toString();
      const customerSocketId = order.user?.socketId;
      const otpPayload = {
        orderId: order._id,
        shopOrderId: shopOrder._id,
        deliveryOtp: otp,
        message: "Your delivery OTP has arrived.",
      };
      if (customerSocketId) {
        io.to(customerSocketId).emit("delivery-otp-received", otpPayload);
      }
      if (customerUserId) {
        io.to(customerUserId).emit("delivery-otp-received", otpPayload);
      }
    }

    return res
      .status(200)
      .json({
        success: true,
        message: emailSent
          ? `Delivery OTP sent successfully to ${order?.user?.fullName || "customer"}'s email.`
          : `OTP generated successfully. Ask the customer for the OTP shown on their screen.`,
        emailSent,
      });
  } catch (error) {
    console.error("Send Delivery OTP Error:", error);
    return res
      .status(500)
      .json({ message: `Send Delivery OTP Error ${error.message || error}` });
  }
};

export const verifyDeliveryOtp = async (req, res) => {
  try {
    const { orderId, shopOrderId, otp } = req.body;
    if (!orderId || !shopOrderId || !otp) {
      return res.status(400).json({ message: "orderId, shopOrderId and OTP are required" });
    }
    const deliveryBoy = await User.findById(req.userId).select("role");
    if (deliveryBoy?.role !== "deliveryBoy") {
      return res.status(403).json({ message: "Only a delivery boy can verify a delivery OTP" });
    }
    const order = await Order.findById(orderId).populate("user");
    if (!order) {
      return res.status(404).json({ message: "Order Not Found" });
    }
    const shopOrder = order.shopOrders.id
      ? order.shopOrders.id(shopOrderId)
      : order.shopOrders?.find((so) => String(so._id) === String(shopOrderId));
    if (!shopOrder) {
      return res
        .status(400)
        .json({ message: "Enter valid order/shopOrder Id" });
    }
    const assignment = await deliveryAssignment.findOne({
      order: order._id,
      shopOrderId: shopOrder._id,
      assignTo: req.userId,
      status: "assigned",
    });
    if (
      String(shopOrder.assignedDeliveryBoy) !== String(req.userId) ||
      !assignment ||
      shopOrder.status !== "out for delivery"
    ) {
      return res.status(403).json({ message: "This order is not actively assigned to you" });
    }
    if (
      String(shopOrder.deliveryOtp).trim() !== String(otp).trim() ||
      !shopOrder.otpExpires ||
      new Date(shopOrder.otpExpires).getTime() < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or Expired OTP" });
    }

    if (!shopOrder.assignedDeliveryBoy) {
      shopOrder.assignedDeliveryBoy = req.userId;
    }
    shopOrder.status = "delivered";
    shopOrder.deliveredAt = new Date();
    await order.save();
    assignment.status = "completed";
    await assignment.save();

    const io = req.app.get("io");
    if (io) {
      if (order.user?.socketId) {
        io.to(order.user.socketId).emit("update-status", {
          orderId: order._id,
          shopId: shopOrder.shop,
          shopOrderId: shopOrder._id,
          status: "delivered",
          userId: order.user._id,
        });
      }
      io.emit("order-status-updated", {
        orderId: order._id,
        shopId: shopOrder.shop,
        shopOrderId: shopOrder._id,
        status: "delivered",
        userId: order.user?._id || order.user,
      });
    }

    return res.status(200).json({ message: `Order Delivered Successfully` });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Verify Delivery OTP Error ${error}` });
  }
};

export const getTodayDeliveries = async (req, res) => {
  try {
    const deliveryBoyId = req.userId;
    const startsOfDay = new Date();
    startsOfDay.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      "shopOrders.assignedDeliveryBoy": deliveryBoyId,
      "shopOrders.status": "delivered",
    }).lean();

    let todayDeliveries = [];

    orders.forEach((o) => {
      o.shopOrders?.forEach((shopOrder) => {
        if (
          String(shopOrder.assignedDeliveryBoy) === String(deliveryBoyId) &&
          shopOrder.status === "delivered" &&
          shopOrder.deliveredAt &&
          new Date(shopOrder.deliveredAt) >= startsOfDay
        ) {
          todayDeliveries.push(shopOrder);
        }
      });
    });

    let stats = {};

    todayDeliveries.forEach((delivery) => {
      const hour = new Date(delivery.deliveredAt).getHours();
      stats[hour] = (stats[hour] || 0) + 1;
    });

    let formattedStats = Object.keys(stats).map((hour) => ({
      hour: parseInt(hour),
      count: stats[hour],
    }));

    formattedStats.sort((a, b) => a.hour - b.hour);

    return res.status(200).json(formattedStats);
  } catch (error) {
    return res.status(500).json({ message: `Get Today Deliveries Error ${error}` });
  }
};

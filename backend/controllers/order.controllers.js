import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import Item from "../models/item.model.js";
import deliveryAssignment from "../models/deliveryAssignment.model.js";
import mongoose from "mongoose";
import { sendDeliveryOtpMail } from "../utils/mail.js";
import Razorpay from "razorpay";
import dotenv from "dotenv";

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

export const placeOrder = async (req, res) => {
  try {
    const { cartItems, paymentMethod, deliveryAddress, totalAmount } = req.body;
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

    const groupItemsByShop = {};

    cartItems.forEach((item) => {
      const shopId = item.shop;
      if (!groupItemsByShop[shopId]) {
        groupItemsByShop[shopId] = [];
      }
      groupItemsByShop[shopId].push(item);
    });

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

    if (paymentMethod === "online") {
      const razorOrder = await instance.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });

      const order = await Order.create({
        user: req.userId,
        paymentMethod,
        deliveryAddress,
        totalAmount,
        shopOrders,
        razorpayOrderId: razorOrder.id,
        payment: false,
      });

      return res.status(201).json({
        razorOrder,
        orderID: order._id,
      });
    }

    const order = await Order.create({
      user: req.userId,
      paymentMethod,
      deliveryAddress,
      totalAmount,
      shopOrders,
    });

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
    if (user.role == "user") {
      const orders = await Order.find({ user: req.userId })
        .sort({ createdAt: -1 })
        .populate("shopOrders.shop", "name")
        .populate("shopOrders.owner", "name email mobile")
        .populate("shopOrders.shopOrderItems.item", "name image price")
        .populate("shopOrders.assignedDeliveryBoy", "fullName email mobile");

      return res.status(200).json(orders);
    } else if (user.role == "owner") {
      const orders = await Order.find({ "shopOrders.owner": req.userId })
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

    assignment.assignTo = req.userId;
    assignment.status = "assigned";
    assignment.acceptedAt = new Date();
    await assignment.save();

    const order = await Order.findById(assignment.order);
    if (!order) {
      return res.status(404).json({ message: "Assignment is expired" });
    }

    const shopOrder = order.shopOrders.id(assignment.shopOrderId);
    if (shopOrder) {
      shopOrder.assignedDeliveryBoy = req.userId;
      await order.save();
    }

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

    if (!order) {
      return res.status(404).json({ message: "Order Not Found" });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: `Get Order By Id Error ${error}` });
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

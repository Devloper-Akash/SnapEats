import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { placeOrder, getMyOrders, updateOrderStatus, getDeliveryBoyAssignment, acceptOrder, getCurrentOrder, getOrderById , sendDeliveryOtp , verifyDeliveryOtp , getTodayDeliveries, verifyPayment, cancelUnpaidOrder } from "../controllers/order.controllers.js";

const orderRouter = express.Router();

orderRouter.post("/place-order",isAuth,placeOrder);
orderRouter.post("/verify-payment",isAuth,verifyPayment);
orderRouter.post("/cancel-unpaid-order",isAuth,cancelUnpaidOrder);
orderRouter.get("/my-orders",isAuth,getMyOrders)
orderRouter.get("/get-assignments",isAuth,getDeliveryBoyAssignment)
orderRouter.post("/send-delivery-otp",isAuth,sendDeliveryOtp);
orderRouter.post("/verify-delivery-otp",isAuth,verifyDeliveryOtp);
orderRouter.get("/get-current-order",isAuth,getCurrentOrder)
orderRouter.patch("/update-status/:orderId/:shopOrderId",isAuth,updateOrderStatus)
orderRouter.get("/accept-order/:assignmentId",isAuth,acceptOrder)
orderRouter.get("/get-order-by-id/:orderId",isAuth,getOrderById)
orderRouter.get("/get-today-deliveries",isAuth,getTodayDeliveries)


export default orderRouter 

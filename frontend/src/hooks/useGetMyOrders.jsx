import { useEffect } from "react";
import { serverUrl } from "../App";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import {
  setMyOrders,
  addMyOrder,
  updateRealtimeOrderStatus,
  orderAssignedDeliveryBoy,
} from "../redux/userSlice";

const useGetMyOrders = () => {
  const dispatch = useDispatch();
  const { userData, socket } = useSelector((state) => state.user);

  useEffect(() => {
    if (!userData) return;
    const fetchOrders = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/order/my-orders`, {
          withCredentials: true,
        });
        dispatch(setMyOrders(result.data));
      } catch (error) {
        console.log(error);
      }
    };
    fetchOrders();
  }, [userData]);

  useEffect(() => {
    if (!socket || !userData) return;

    const handleNewOrder = (data) => {
      const ownerId =
        data?.shopOrders?.owner?._id ||
        data?.shopOrders?.owner ||
        data?.ownerId;
      if (
        userData.role === "owner" &&
        (!ownerId || String(ownerId) === String(userData._id))
      ) {
        dispatch(addMyOrder(data));
      }
    };

    const handleStatusUpdate = ({
      orderId,
      shopId,
      shopOrderId,
      status,
    }) => {
      dispatch(
        updateRealtimeOrderStatus({
          orderId,
          shopId: shopId || shopOrderId,
          status,
        })
      );
    };

    const handleOrderAccepted = ({
      orderId,
      shopOrderId,
      assignedDeliveryBoy,
    }) => {
      dispatch(
        orderAssignedDeliveryBoy({
          orderId,
          shopOrderId,
          assignedDeliveryBoy,
        })
      );
    };

    socket.on("newOrder", handleNewOrder);
    socket.on("newOrderNotification", handleNewOrder);
    socket.on("update-status", handleStatusUpdate);
    socket.on("order-status-updated", handleStatusUpdate);
    socket.on("order-accepted", handleOrderAccepted);

    return () => {
      socket.off("newOrder", handleNewOrder);
      socket.off("newOrderNotification", handleNewOrder);
      socket.off("update-status", handleStatusUpdate);
      socket.off("order-status-updated", handleStatusUpdate);
      socket.off("order-accepted", handleOrderAccepted);
    };
  }, [socket, userData?._id, userData?.role, dispatch]);
};

export default useGetMyOrders;

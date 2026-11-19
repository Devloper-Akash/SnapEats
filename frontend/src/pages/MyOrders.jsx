import React from "react";
import { useSelector } from "react-redux";
import { MoveLeftIcon } from "@animateicons/react/lucide";
import { useNavigate } from "react-router-dom";
import UserOrderCard from "@/components/UserOrderCard";
import OwnerOrderCard from "@/components/OwnerOrderCard";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { addMyOrder, updateRealtimeOrderStatus } from "@/redux/userSlice";

const MyOrders = () => {
  const { userData, myOrders, socket } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleNewOrder = (data) => {
      const ownerId =
        data?.shopOrders?.owner?._id ||
        data?.shopOrders?.owner ||
        data?.ownerId;
      if (!ownerId || String(ownerId) === String(userData?._id)) {
        dispatch(addMyOrder(data));
      }
    };

    socket?.on("newOrder", handleNewOrder);

    socket?.on("update-status", ({ orderId, shopId, status, userId }) => {
      if (userId == userData?._id) {
        dispatch(updateRealtimeOrderStatus({ orderId, shopId, status }));
      }
    });

    return () => {
      socket?.off("newOrder", handleNewOrder);
      socket?.off("update-status");
    };
  }, [socket, userData?._id, dispatch]);

  return (
    <div className="min-h-screen bg-[#fff9f6] flex justify-center p-6">
      <div className="w-full max-w-[800px]">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full hover:bg-orange-100 transition-colors cursor-pointer"
            onClick={() => navigate(-1)}
          >
            <MoveLeftIcon size={24} duration={1} color="#ff4d2d" />
          </div>
          <h1 className="text-2xl font-bold text-[#ff4d2d]">My Orders</h1>
        </div>
        {myOrders?.length > 0 ? (
          <div className="space-y-5">
            {myOrders.map((order, index) =>
              userData.role === "user" ? (
                <UserOrderCard data={order} key={order._id || index} />
              ) : userData.role === "owner" ? (
                <OwnerOrderCard data={order} key={order._id || index} />
              ) : null
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-lg text-center">No orders yet.</p>
        )}
      </div>
    </div>
  );
};

export default MyOrders;

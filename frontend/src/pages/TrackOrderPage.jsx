import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { MoveLeftIcon } from "@animateicons/react/lucide";
import DeliveryBoyTracking from "@/components/DeliveryBoyTracking";
import { updateRealtimeOrderStatus } from "@/redux/userSlice";

const TrackOrderPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { socket } = useSelector((state) => state.user);
  const [liveLocations, setLiveLocations] = useState({});
  const [customerLiveLocation, setCustomerLiveLocation] = useState(null);
  const { orderId } = useParams();
  const [currentOrder, setCurrentOrder] = useState();
  const [loading, setLoading] = useState(true);

  const handleGetOrder = async () => {
    try {
      setLoading(true);
      const result = await axios.get(
        `${serverUrl}/api/order/get-order-by-id/${orderId}`,
        { withCredentials: true },
      );
      setCurrentOrder(result.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleStatusUpdate = ({
      orderId: updatedOrderId,
      shopId,
      shopOrderId,
      status,
    }) => {
      dispatch(
        updateRealtimeOrderStatus({
          orderId: updatedOrderId,
          shopId: shopId || shopOrderId,
          status,
        })
      );
      if (String(updatedOrderId) === String(orderId)) {
        setCurrentOrder((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            shopOrders: prev.shopOrders?.map((so) => {
              if (
                !shopOrderId ||
                String(so._id) === String(shopOrderId) ||
                String(so.shop?._id || so.shop) === String(shopId)
              ) {
                return { ...so, status: status || "delivered" };
              }
              return so;
            }),
          };
        });
      }
    };

    const handleOrderAccepted = ({
      orderId: acceptedOrderId,
      shopOrderId,
      assignedDeliveryBoy,
    }) => {
      if (String(acceptedOrderId) === String(orderId)) {
        setCurrentOrder((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            shopOrders: prev.shopOrders?.map((so) => {
              if (!shopOrderId || String(so._id) === String(shopOrderId)) {
                return {
                  ...so,
                  assignedDeliveryBoy,
                };
              }
              return so;
            }),
          };
        });
      }
    };

    const handleDeliveryOtpReceived = ({
      orderId: updatedOrderId,
      shopOrderId: updatedShopOrderId,
      deliveryOtp,
    }) => {
      if (String(updatedOrderId) === String(orderId)) {
        setCurrentOrder((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            shopOrders: prev.shopOrders?.map((so) => {
              if (
                !updatedShopOrderId ||
                String(so._id) === String(updatedShopOrderId)
              ) {
                return { ...so, deliveryOtp };
              }
              return so;
            }),
          };
        });
      }
    };

    socket?.on("update-status", handleStatusUpdate);
    socket?.on("order-status-updated", handleStatusUpdate);
    socket?.on("order-accepted", handleOrderAccepted);
    socket?.on("delivery-otp-received", handleDeliveryOtpReceived);

    return () => {
      socket?.off("update-status", handleStatusUpdate);
      socket?.off("order-status-updated", handleStatusUpdate);
      socket?.off("order-accepted", handleOrderAccepted);
      socket?.off("delivery-otp-received", handleDeliveryOtpReceived);
    };
  }, [socket, orderId, dispatch]);

  useEffect(() => {
    const handleUpdate = ({ deliveryBoyId, lat, lon }) => {
      if (deliveryBoyId && lat != null && lon != null) {
        setLiveLocations((prev) => ({
          ...prev,
          [String(deliveryBoyId)]: { lat: Number(lat), lon: Number(lon) },
        }));
      }
    };

    socket?.on("updateDeliveryLocation", handleUpdate);
    return () => {
      socket?.off("updateDeliveryLocation", handleUpdate);
    };
  }, [socket]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCustomerLiveLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      (err) => console.log(err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    handleGetOrder();
  }, [orderId]);

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Go back"
          className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full text-[#ff4d2d] hover:bg-orange-100 transition-colors cursor-pointer"
          onClick={() => navigate("/")}
        >
          <MoveLeftIcon size={24} duration={1} />
        </button>
        <h1 className="text-2xl font-bold md:text-center">Track Order</h1>
      </div>
      {loading ? (
        <div className="bg-white p-8 rounded-2xl shadow-md border border-orange-100 text-center text-gray-500">
          Loading order details...
        </div>
      ) : !currentOrder ? (
        <div className="bg-white p-8 rounded-2xl shadow-md border border-orange-100 text-center text-gray-500">
          Order not found.
        </div>
      ) : currentOrder?.shopOrders?.length > 0 ? (
        currentOrder.shopOrders.map((shopOrder, index) => {
          const isDelivered = shopOrder?.status?.toLowerCase() === "delivered";
          return (
            <div
              className="bg-white p-4 rounded-2xl shadow-md border border-orange-100 space-y-4"
              key={index}
            >
              <div>
                <p className="text-lg font-bold mb-2 text-[#ff4d2d]">
                  {shopOrder.shop.name}
                </p>
                <p className="text-gray-600 font-semibold">
                  <span>Order Details : </span>
                  {shopOrder?.shopOrderItems.map((i) => i.name).join(", ")}
                </p>
                <p className="text-gray-600 font-semibold">
                  <span>{isDelivered ? "Total Paid : " : "SubTotal : "}</span>₹{shopOrder?.subTotal?.toFixed(2)}
                </p>
                <p className="text-gray-600 mt-2">
                  <span>Delivery Address : </span>
                  {currentOrder?.deliveryAddress?.text}
                </p>
              </div>
              {isDelivered ? (
                <p className="text-green-600 font-bold">Delivered</p>
              ) : (
                <>
                  {shopOrder.deliveryOtp && (
                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#ff4d2d] uppercase">Delivery OTP</p>
                        <p className="text-xs text-gray-500">Share this OTP with your delivery boy to receive your order</p>
                      </div>
                      <span className="text-2xl font-black tracking-widest text-[#ff4d2d] bg-white px-3 py-1 rounded-lg border border-orange-200 shadow-sm">
                        {shopOrder.deliveryOtp}
                      </span>
                    </div>
                  )}
                  <h2>Delivery Boy</h2>
                  {shopOrder?.assignedDeliveryBoy ? (
                    <div className="bg-[#ff4d2d]/10 p-2 rounded-xl space-y-1">
                      <p className="font-bold">
                        <span>Name : </span>
                        {shopOrder.assignedDeliveryBoy.fullName}
                      </p>
                      <p className="text-gray-600 font-semibold">
                        <span>Mobile : </span>
                        {shopOrder.assignedDeliveryBoy.mobile}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Delivery boy not assigned yet</p>
                  )}

                  {shopOrder.assignedDeliveryBoy && (
                    <div className="h-[300px] w-full rounded-2xl overflow-hidden shadow-md border border-orange-100">
                      <DeliveryBoyTracking
                        data={{
                          deliveryBoyLocation: 
                            liveLocations[String(shopOrder.assignedDeliveryBoy._id || shopOrder.assignedDeliveryBoy)] || {
                              lat: shopOrder.assignedDeliveryBoy?.location
                                ?.coordinates?.[1],
                              lon: shopOrder.assignedDeliveryBoy?.location
                                ?.coordinates?.[0],
                            },
                          customerLocation: customerLiveLocation || {
                            lat: currentOrder?.deliveryAddress?.latitude,
                            lon: currentOrder?.deliveryAddress?.longitude,
                          },
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })
      ) : (
        <div className="bg-white p-8 rounded-2xl shadow-md border border-orange-100 text-center text-gray-500">
          No shop orders found.
        </div>
      )}
    </div>
  );
};

export default TrackOrderPage;

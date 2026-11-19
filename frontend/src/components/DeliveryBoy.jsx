import React, { useEffect } from "react";
import Nav from "./Nav";
import { useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "@/App";
import { useState } from "react";
import DeliveryBoyTracking from "./DeliveryBoyTracking";
import { ResponsiveContainer } from "recharts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ClipLoader } from "react-spinners";

const DeliveryBoy = () => {
  const { userData, socket } = useSelector((state) => state.user);
  const [currentOrder, setCurrentOrder] = useState();
  const [showOtpBox, setShowOtpBox] = useState(false);
  const [availableAssignments, setAvailableAssignments] = useState(null);
  const [otp, setOtp] = useState("");
  const [todayDeliveries, setTodayDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [myLocation, setMyLocation] = useState(null);

  useEffect(() => {
    let watchId;

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          setMyLocation({ lat: latitude, lon: longitude });
          if (socket && userData?._id) {
            socket.emit("updateLocation", {
              lat: latitude,
              lon: longitude,
              userId: userData._id,
            });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        {
          enableHighAccuracy: true,
        }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [socket, userData?._id]);

    const ratePerDelivery = 50;
    const totalEarnings = (todayDeliveries || []).reduce((sum, d) => sum + ((d?.count || 0) * ratePerDelivery), 0);

  const getAssignments = async () => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/order/get-assignments?t=${Date.now()}`,
        { withCredentials: true },
      );
      setAvailableAssignments(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getCurrentOrder = async () => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/order/get-current-order`,
        { withCredentials: true },
      );
      setCurrentOrder(result.data || null);
    } catch (error) {
      setCurrentOrder(null);
    }
  };

  const acceptOrder = async (assignmentId) => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/order/accept-order/${assignmentId}`,
        { withCredentials: true },
      );
      console.log(result.data);
      getAssignments();
      await getCurrentOrder();
    } catch (error) {
      console.log(error?.response?.data?.message || error);
    }
  };

  const sendOtp = async () => {
    if (!currentOrder?._id || !currentOrder?.shopOrder?._id) {
      setDeliveryError("No active order found. Please refresh and try again.");
      return;
    }

    setLoading(true);
    setDeliveryError("");
    setDeliveryMessage("");
    try {
      const result = await axios.post(
        `${serverUrl}/api/order/send-delivery-otp`,
        { orderId: currentOrder._id, shopOrderId: currentOrder.shopOrder._id },
        { withCredentials: true }
      );
      setShowOtpBox(true);
      setOtp("");
      setDeliveryError("");
      setDeliveryMessage(result.data?.message || "OTP generated successfully. Ask customer for the OTP.");
    } catch (error) {
      console.error(error);
      setDeliveryError(error?.response?.data?.message || "Failed to send the delivery OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      setDeliveryError("Enter the OTP sent to the customer.");
      return;
    }
    setLoading(true);
    setDeliveryError("");
    try {
      await axios.post(
        `${serverUrl}/api/order/verify-delivery-otp`,
        {
          orderId: currentOrder?._id,
          shopOrderId: currentOrder?.shopOrder?._id,
          otp: otp.trim(),
        },
        { withCredentials: true }
      );
      setShowOtpBox(false);
      setOtp("");
      setCurrentOrder(null);
      await Promise.all([handleTodayDeliveries(), getAssignments()]);
    } catch (error) {
      console.error(error);
      setDeliveryError(error?.response?.data?.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTodayDeliveries = async () => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/order/get-today-deliveries?t=${Date.now()}`,
        { withCredentials: true },
      );
      console.log(result.data);
      setTodayDeliveries(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.log(error?.response?.data?.message || error);
    }
  };

  useEffect(() => {
    const handleNewAssignment = (data) => {
      if (!data.sentTo || data.sentTo == userData?._id) {
        setAvailableAssignments((prev) => (prev ? [...prev, data] : [data]));
      }
    };
    const handleStatusUpdate = (data) => {
      if (data?.status === "delivered") {
        handleTodayDeliveries();
      }
    };
    socket?.on("newAssignment", handleNewAssignment);
    socket?.on("order-status-updated", handleStatusUpdate);

    return () => {
      socket?.off("newAssignment", handleNewAssignment);
      socket?.off("order-status-updated", handleStatusUpdate);
    };
  }, [socket, userData?._id]);

  useEffect(() => {
    getAssignments();
    getCurrentOrder();
    handleTodayDeliveries();
    const interval = setInterval(getAssignments, 5000);
    return () => clearInterval(interval);
  }, [userData]);
  return (
    <div className="w-screen min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-y-auto pt-[100px]">
      <Nav />
      <div className="w-full max-w-[800px] flex flex-col gap-5 items-center ">
        <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col justify-start items-center w-[90%] border border-orange-100 text-center gap-3">
          <h1 className="text-lg md:text-xl font-bold text-[#ff4d2d] w-full truncate px-2">
            Welcome, {userData?.fullName}
          </h1>
          <p className="text-[#ff4d2d]">
            <span className="font-semibold">Latitude :</span>{" "}
            {myLocation?.lat ?? userData?.location?.coordinates?.[1] ?? 0},{" "}
            <span className="font-semibold">Longitude :</span>{" "}
            {myLocation?.lon ?? userData?.location?.coordinates?.[0] ?? 0}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col justify-start items-center w-[90%] border border-orange-100 text-center gap-3">
          <h1 className="text-lg md:text-xl font-bold text-[#ff4d2d] w-full truncate px-2">Today's Deliveries</h1>

          <ResponsiveContainer width="100%" height={200} minWidth={100} minHeight={200}>
            <BarChart data={todayDeliveries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tickFormatter={(value) => (value != null ? `${value}:00` : "")} />
              <YAxis dataKey="count" allowDecimals={false} />
              <Tooltip formatter={(value) => [value, "Orders"]} labelFormatter={(value) => `Hour: ${value}`} />
              <Bar dataKey="count" fill="#ff4d2d" />
            </BarChart>
          </ResponsiveContainer>

          <div>
            <p className="text-green-600 font-semibold">Total Deliveries: {(todayDeliveries || []).reduce((sum, d) => sum + (d?.count || 0), 0)}</p>
            <p className="text-green-600 font-semibold">Total Earnings: ₹{totalEarnings}</p>
          </div>

        </div>

        {!currentOrder && (
          <div className="bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100">
            <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
              Available Orders
            </h1>

            <div className="space-y-4">
              {availableAssignments?.length > 0 ? (
                availableAssignments.map((a, index) => (
                  <div
                    className="border rounded-lg p-4 flex justify-between items-center"
                    key={index}
                  >
                    <div>
                      <p className="text-sm font-semibold">{a?.shopName}</p>
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold">
                          Delivery Address :{" "}
                        </span>
                        {a?.deliveryAddress?.text}
                      </p>
                      <p className="text-xs text-gray-400">
                        {a?.items?.length || 0} items | ₹{a?.subtotal || 0}
                      </p>
                    </div>
                    <button
                      className="bg-orange-500 text-white px-4 py-1 rounded-lg text-sm hover:bg-orange-600"
                      onClick={() => acceptOrder(a?.assignmentId)}
                    >
                      Accept
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No Available Orders</p>
              )}
            </div>
          </div>
        )}

        {currentOrder && (
          <div className="bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100">
            <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
              &#128230;Current Order
            </h2>
            <div className="border rounded-lg p-4 flex flex-col gap-2">
              <p className="text-sm font-semibold">
                {currentOrder?.shopOrder?.shop?.name || currentOrder?.shopOrder?.shop}
              </p>
              <p className="text-sm text-gray-500">
                {currentOrder?.deliveryAddress?.text}
              </p>
              <p className="text-xs text-gray-400">
                {currentOrder?.shopOrder?.shopOrderItems?.length || 0} items | ₹
                {currentOrder?.shopOrder?.subTotal || 0}
              </p>
            </div>
            <DeliveryBoyTracking
              data={{
                ...currentOrder,
                deliveryBoyLocation:
                  myLocation || currentOrder?.deliveryBoyLocation,
              }}
            />
            {deliveryMessage && (
              <p role="status" className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                {deliveryMessage}
              </p>
            )}
            {deliveryError && (
              <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {deliveryError}
              </p>
            )}
            {!showOtpBox ? (
              <button
                className="mt-4 w-full bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 active:scale-95 transition-all duration-300 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                onClick={sendOtp}
                disabled={loading}
              >
                {loading ? <ClipLoader color="#fff" size={20} /> : "Send OTP"}
              </button>
            ) : (
              <div className="mt-4 rounded-xl border bg-gray-50 p-4">
                <label htmlFor="delivery-otp" className="mb-2 block text-sm font-semibold">
                  Enter the OTP provided by the customer
                </label>
                <input
                  id="delivery-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={4}
                  placeholder="4-digit OTP"
                  className="w-full rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  value={otp}
                  disabled={loading}
                />
                <button
                  className="mt-2 w-full bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 active:scale-95 transition-all duration-300 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  onClick={verifyOtp}
                  disabled={loading}
                >
                  {loading ? <ClipLoader color="#fff" size={20} /> : "Confirm Delivery"}
                </button>
                <button
                  className="mt-2 w-full rounded-lg px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                  onClick={sendOtp}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryBoy;

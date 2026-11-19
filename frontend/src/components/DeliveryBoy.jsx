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
    const totalEarnings = (todayDeliveries || []).reduce((sum, d) => sum + (d.count * ratePerDelivery), 0);

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
      alert("No active order found to deliver.");
      return;
    }
    setLoading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/order/send-delivery-otp`,
        { orderId: currentOrder._id, shopOrderId: currentOrder.shopOrder._id },
        { withCredentials: true }
      );
      setShowOtpBox(true);
      getAssignments();
      await getCurrentOrder();
    } catch (error) {
      console.error(error);
      const errMsg = error?.response?.data?.message || "Failed to send delivery OTP. Please try again.";
      alert(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      alert("Please enter the OTP");
      return;
    }
    setLoading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/order/verify-delivery-otp`,
        {
          orderId: currentOrder?._id,
          shopOrderId: currentOrder?.shopOrder?._id,
          otp: otp.trim(),
        },
        { withCredentials: true }
      );
      console.log(result.data);
      setShowOtpBox(false);
      setOtp("");
      await handleTodayDeliveries();
      getAssignments();
      await getCurrentOrder();
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Invalid or Expired OTP");
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

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={todayDeliveries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tickFormatter={(value) => `${value}:00`} />
              <YAxis dataKey="count" allowDecimals={false} />
              <Tooltip formatter={(value) => [value, "Orders"]} labelFormatter={(value) => `Hour: ${value}`} />
              <Bar dataKey="count" fill="#ff4d2d" />
            </BarChart>
          </ResponsiveContainer>

          <div>
            <p className="text-green-600 font-semibold">Total Deliveries: {(todayDeliveries || []).reduce((sum, d) => sum + d.count, 0)}</p>
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
            {!showOtpBox ? (
              <button
                className="mt-4 w-full bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 active:scale-95 transition-all duration-300 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                onClick={sendOtp}
                disabled={loading}
              >
                {loading ? <ClipLoader color="#fff" size={20} /> : "Mark as Delivered"}
              </button>
            ) : (
              <div className="mt-4 p-4 border rounded-xl bg-gray-50">
                <p className="text-sm font-semibold mb-2">
                  Enter OTP Sent To{" "}
                  <span className="text-orange-500">
                    {currentOrder?.user?.fullName}
                  </span>{" "}
                </p>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  onChange={(e) => setOtp(e.target.value)}
                  value={otp}
                />
                <button
                  className="mt-2 w-full bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 active:scale-95 transition-all duration-300 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  onClick={verifyOtp}
                  disabled={loading}
                >
                  {loading ? <ClipLoader color="#fff" size={20} /> : "Submit OTP"}
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

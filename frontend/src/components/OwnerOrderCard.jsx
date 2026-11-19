import React, { useState } from "react";
import { MdLocationOn, MdPhone } from "react-icons/md";
import { FaClock, FaMoneyBillWave, FaUtensils } from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "@/App";
import { useDispatch } from "react-redux";
import { updateMyOrder } from "@/redux/userSlice";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "preparing", label: "Preparing" },
  { value: "out for delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function OwnerOrderCard({ data, compact = false }) {
  const dispatch = useDispatch();
  const [availableBoys, setAvailableBoys] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const shopOrder = Array.isArray(data?.shopOrders)
    ? data.shopOrders[0]
    : data?.shopOrders;
  const displayedAvailableBoys = shopOrder?.assignedDeliveryBoy
    ? []
    : availableBoys.length
      ? availableBoys
      : shopOrder?.assignment?.brodcastedTo || [];
  const orderItems = shopOrder?.shopOrderItems || [];
  const rawStatus = shopOrder?.status || "pending";
  const currentStatus =
    rawStatus === "prepering"
      ? "preparing"
      : rawStatus === "out of delivery"
        ? "out for delivery"
        : rawStatus;

  const getStatusColor = (status) => {
    const value = status?.toLowerCase();
    if (value === "delivered")
      return "text-green-600 bg-green-50 border-green-200";
    if (value === "prepering" || value === "preparing")
      return "text-orange-600 bg-orange-50 border-orange-200";
    if (value === "out of delivery" || value === "out for delivery")
      return "text-blue-600 bg-blue-50 border-blue-200";
    if (value === "cancelled") return "text-red-600 bg-red-50 border-red-200";
    return "text-[#ff4d2d] bg-[#ff4d2d]/10 border-[#ff4d2d]/20";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr.slice(0, 10);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!data?._id || !shopOrder?._id || newStatus === currentStatus) return;

    try {
      setIsUpdating(true);
      const result = await axios.patch(
        `${serverUrl}/api/order/update-status/${data._id}/${shopOrder._id}`,
        { status: newStatus },
        { withCredentials: true },
      );
      console.log("Updated Order:", result.data.order);
      dispatch(updateMyOrder(result.data.order));
      if (newStatus === "out for delivery") {
        const { shopOrder, assignedDeliveryBoy, availableBoys, assignment } =
          result.data;
        console.log("Shop Order:", shopOrder);
        console.log("Assigned Delivery Boy:", assignedDeliveryBoy);
        console.log("Available Boys:", availableBoys);
        console.log("Assignment:", assignment);
      }
      setAvailableBoys(result.data.availableBoys || []);
    } catch (error) {
      console.log(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const isTerminal =
    currentStatus === "delivered" || currentStatus === "cancelled";

  return (
    <div className="w-full bg-white rounded-2xl shadow border border-[#ff4d2d]/20 overflow-hidden transition-all duration-300 hover:border-orange-200 hover:shadow-lg">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#ff4d2d] text-white text-sm font-bold flex items-center justify-center shrink-0">
              {data?.user?.fullName?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-gray-800">
                {data?.user?.fullName || "Customer"}
              </h2>
              <p className="truncate text-xs text-gray-500">
                {data?.user?.email}
              </p>
            </div>
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <MdPhone className="shrink-0 text-[#ff4d2d]" />
            <span>{data?.user?.mobile || "No mobile number"}</span>
          </p>
          {data.paymentMethod == "online" ? (
            <p className="gap-2 text-sm text-gray-600">Payment : {data.payment ? "Paid" : "Not Paid"}</p>
          ) : (
            <p className="gap-2 text-sm text-gray-600">Payment Method: {data?.paymentMethod || "Not specified"}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
            <FaClock size={12} />
            {formatDate(data?.createdAt)}
          </span>
          <span
            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusColor(currentStatus)}`}
          >
            {currentStatus}
          </span>
        </div>
      </div>

      <div className="px-4 py-3 sm:px-5">
        <div className="flex items-start gap-2 rounded-xl border border-orange-100 bg-[#fff9f6] p-3 text-sm text-gray-600">
          <MdLocationOn className="mt-0.5 shrink-0 text-[#ff4d2d]" size={18} />
          <div className="min-w-0">
            <p className="line-clamp-2">{data?.deliveryAddress?.text}</p>
            {!compact && (
              <p className="mt-1 text-xs text-gray-500">
                lat: {data?.deliveryAddress?.latitude}, lon:{" "}
                {data?.deliveryAddress?.longitude}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <FaUtensils className="text-[#ff4d2d]" />
            Order Items
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {orderItems.map((item, index) => (
              <div
                key={item?._id || index}
                className="w-36 shrink-0 overflow-hidden rounded-xl border border-[#ff4d2d]/20 bg-white sm:w-40"
              >
                <div className="relative h-24 w-full bg-gray-50 sm:h-28">
                  <img
                    src={item?.item?.image}
                    alt={item?.name}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute right-1.5 top-1.5 rounded-lg bg-[#ff4d2d] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    x{item?.quantity}
                  </span>
                </div>
                <div className="p-2">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {item?.name}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Rs.{item?.price} x {item?.quantity}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-[#ff4d2d]">
                    Rs.{Number(item?.price || 0) * Number(item?.quantity || 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#ff4d2d]/10 text-[#ff4d2d] flex items-center justify-center">
            <FaMoneyBillWave size={16} />
          </div>
          <div>
            <p className="text-xs text-gray-500">
              {data?.paymentMethod?.toUpperCase() || "COD"}
            </p>
            <p className="text-lg font-bold text-gray-800">
              Rs.{shopOrder?.subTotal || 0}
            </p>
          </div>
        </div>
        {isTerminal ? (
          <span
            className={`w-full rounded-xl border px-5 py-2.5 text-center text-sm font-semibold capitalize sm:w-auto ${getStatusColor(currentStatus)}`}
          >
            {currentStatus}
          </span>
        ) : (
          <select
            className="w-full rounded-xl border border-[#ff4d2d]/30 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition-colors hover:border-[#ff4d2d] focus:border-[#ff4d2d] focus:ring-2 focus:ring-[#ff4d2d]/20 disabled:cursor-not-allowed disabled:bg-gray-100 sm:w-auto"
            value={currentStatus}
            disabled={isUpdating}
            onChange={(e) => handleStatusUpdate(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>
      {currentStatus === "out for delivery" && (
        <div className="border-t border-gray-100 px-4 py-3 sm:px-5">
          {shopOrder?.assignedDeliveryBoy?.fullName ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
              Assigned Delivery Boy:
            </p>
          ) : (
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
              🛵 Available Delivery Boys:
            </p>
          )}
          {displayedAvailableBoys.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {displayedAvailableBoys.map((b) => (
                <div
                  key={b.id || b._id}
                  className="flex items-center justify-between rounded-lg border border-[#ff4d2d]/15 bg-[#fff9f6] px-3 py-2"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {b.fullName}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <MdPhone className="text-[#ff4d2d]" />
                    {b.mobile}
                  </span>
                </div>
              ))}
            </div>
          ) : shopOrder?.assignedDeliveryBoy ? (
            <div>
              {shopOrder.assignedDeliveryBoy.fullName} -{" "}
              {shopOrder.assignedDeliveryBoy.mobile}
            </div>
          ) : (
            <p className="rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-700">
              ⏳ Waiting for a delivery boy to accept...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default OwnerOrderCard;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Check, Clock3, CreditCard, MapPin, PackageCheck, Star, Store } from "lucide-react";
import { serverUrl } from "../App";

function UserOrderCard({ data }) {
  const navigate = useNavigate();
  const [selectedRating, setSelectedRating] = useState({});
  const shopOrders = Array.isArray(data.shopOrders) ? data.shopOrders : data.shopOrders ? [data.shopOrders] : [];
  const orderStatus = shopOrders[0]?.status || "Pending";
  const total = Number(data.totalAmount || 0);

  const getStatusStyle = (status) => {
    const value = status?.toLowerCase();
    if (value === "delivered") return "border-[#cfe7d5] bg-[#edf7ef] text-[#34794b]";
    if (value === "cancelled") return "border-[#f2ceca] bg-[#fff0ee] text-[#bd4b40]";
    if (value === "preparing") return "border-[#f3dfb9] bg-[#fff8e9] text-[#a66a15]";
    if (value === "out for delivery") return "border-[#d8e4f2] bg-[#eff6ff] text-[#456e9b]";
    return "border-[#f2d9cf] bg-[#fff4ec] text-[#bd5a3b]";
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr?.slice(0, 10) || "";
    }
  };

  const handleRating = async (itemId, rating) => {
    try {
      await axios.post(`${serverUrl}/api/item/rating`, { itemId, rating }, { withCredentials: true });
      setSelectedRating((previous) => ({ ...previous, [itemId]: rating }));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <article className="overflow-hidden rounded-[26px] border border-[#f0e2d9] bg-white shadow-[0_12px_35px_-28px_rgba(75,39,23,0.42)] transition hover:border-[#f0c9b7] hover:shadow-[0_20px_40px_-28px_rgba(75,39,23,0.4)]">
      <header className="flex flex-col justify-between gap-3 border-b border-[#f2e8e1] bg-gradient-to-r from-[#fffaf6] to-white px-4 py-4 sm:flex-row sm:items-center sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff0e7] text-[#e64b2e]"><PackageCheck size={20} /></span>
          <div>
            <h2 className="text-sm font-extrabold text-[#302923] sm:text-base">Order <span className="text-[#bf6543]">#{data._id?.slice(-6)}</span></h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#8b8078]"><Clock3 size={12} /> Placed {formatDate(data.createdAt)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-14 sm:pl-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eee4de] bg-white px-3 py-1.5 text-[11px] font-bold text-[#73685f]">
            <CreditCard size={13} /> {data.paymentMethod === "cod" ? "Cash on delivery" : data.payment ? "Paid online" : "Online payment"}
          </span>
          <span className={`rounded-full border px-3 py-1.5 text-[11px] font-bold capitalize ${getStatusStyle(orderStatus)}`}>{orderStatus}</span>
        </div>
      </header>

      <div className="space-y-4 p-3.5 sm:p-5">
        {shopOrders.map((shopOrder, index) => (
          <section key={shopOrder._id || index} className="overflow-hidden rounded-[20px] border border-[#f0e3da] bg-[#fffaf6]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0e3da] px-3.5 py-3 sm:px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#e64b2e] shadow-sm"><Store size={17} /></span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-extrabold text-[#302923]">{shopOrder.shop?.name || "Restaurant"}</span>
                  {shopOrder.shop?.address && <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-[#8b8078]"><MapPin size={11} />{shopOrder.shop.address}</span>}
                </span>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize ${getStatusStyle(shopOrder.status)}`}>{shopOrder.status || "Pending"}</span>
            </div>

            {shopOrder.status?.toLowerCase() === "out for delivery" && shopOrder.deliveryOtp && (
              <div className="mx-3.5 mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#f2dfba] bg-[#fff8e9] px-3 py-2.5 sm:mx-4">
                <span className="text-xs font-semibold text-[#8d621e]">Share this delivery code with your courier</span>
                <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-extrabold tracking-[0.22em] text-[#a66a15]">{shopOrder.deliveryOtp}</span>
              </div>
            )}

            <div className="divide-y divide-[#f1e7e0] px-3.5 sm:px-4">
              {shopOrder.shopOrderItems?.map((item, itemIndex) => {
                const itemId = item.item?._id || item.item;
                const currentRating = selectedRating[itemId] || 0;
                const itemPrice = Number(item.price || 0);
                const quantity = Number(item.quantity || 0);
                return (
                  <div key={item._id || itemIndex} className="flex items-center gap-3 py-3.5">
                    <div className="size-[62px] shrink-0 overflow-hidden rounded-xl bg-[#fff0e7] sm:size-[72px]">
                      {item.item?.image && <img src={item.item.image} alt={item.name} className="size-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-[#302923]">{item.name}</h3>
                      <p className="mt-1 text-xs text-[#8b8078]">₹{itemPrice.toFixed(2)} <span className="px-1 text-[#c7b7ad]">·</span> Qty {quantity}</p>
                      {shopOrder.status?.toLowerCase() === "delivered" && (
                        <div className="mt-1.5 flex items-center gap-0.5" aria-label={`Rate ${item.name}`}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              aria-label={`Rate ${item.name} ${star} stars`}
                              onClick={() => handleRating(itemId, star)}
                              className={`p-0.5 transition hover:scale-110 ${star <= currentRating ? "text-[#e9a82c]" : "text-[#d6c9bf] hover:text-[#e9a82c]"}`}
                            >
                              <Star size={15} fill={star <= currentRating ? "currentColor" : "none"} />
                            </button>
                          ))}
                          {currentRating > 0 && <span className="ml-1 text-[10px] font-medium text-[#84786f]">Thanks for rating</span>}
                        </div>
                      )}
                    </div>
                    <strong className="shrink-0 text-sm font-extrabold text-[#51473f]">₹{(itemPrice * quantity).toFixed(2)}</strong>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-[#f0e3da] bg-white/75 px-3.5 py-3 sm:px-4">
              <span className="text-xs font-medium text-[#81766e]">Restaurant subtotal</span>
              <strong className="text-sm font-extrabold text-[#302923]">₹{Number(shopOrder.subTotal || 0).toFixed(2)}</strong>
            </div>
          </section>
        ))}
      </div>

      <footer className="flex flex-col items-stretch justify-between gap-3 border-t border-[#f1e7e0] bg-[#fffdfa] px-4 py-4 sm:flex-row sm:items-center sm:px-5">
        <div>
          <span className="block text-xs font-semibold text-[#887c73]">Order total</span>
          <strong className="mt-0.5 block text-2xl font-extrabold tracking-tight text-[#e64b2e]">₹{total.toFixed(2)}</strong>
        </div>
        {orderStatus.toLowerCase() !== "cancelled" && (
          <button
            type="button"
            onClick={() => navigate(`/track-order/${data._id}`)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#ff4d2d] px-5 text-sm font-bold text-white shadow-[0_8px_20px_-12px_rgba(255,77,45,0.8)] transition hover:-translate-y-0.5 hover:bg-[#e94325]"
          >
            {orderStatus.toLowerCase() === "delivered" ? <><Check size={16} /> View order</> : <>Track order <ArrowRight size={16} /></>}
          </button>
        )}
      </footer>
    </article>
  );
}

export default UserOrderCard;

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AlertTriangle, ArrowRight, Check, Clock3, CreditCard, MapPin, PackageCheck, Star, Store, X } from "lucide-react";
import { serverUrl } from "../App";
import { updateMyOrder } from "../redux/userSlice";

const cancellationReasons = [
  "Ordered by mistake",
  "Need to change my order",
  "Delivery is taking too long",
  "Payment issue",
  "Other",
];

function UserOrderCard({ data }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [selectedRating, setSelectedRating] = useState({});
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState("");
  const [customCancelReason, setCustomCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const shopOrders = Array.isArray(data.shopOrders) ? data.shopOrders : data.shopOrders ? [data.shopOrders] : [];
  const isOrderCancelled =
    data.cancellationStatus === "cancelled" ||
    (shopOrders.length > 0 && shopOrders.every((shopOrder) => String(shopOrder.status || "").toLowerCase() === "cancelled"));
  const orderStatus = isOrderCancelled ? "cancelled" : (shopOrders[0]?.status || "Pending");
  const total = Number(data.totalAmount || 0);
  const hasAssignedDeliveryPerson = shopOrders.some((shopOrder) => Boolean(shopOrder.assignedDeliveryBoy));
  const canCancel =
    !isOrderCancelled &&
    shopOrders.length > 0 &&
    shopOrders.every(
      (shopOrder) =>
        !["delivered", "cancelled"].includes(String(shopOrder.status || "").toLowerCase()) &&
        !shopOrder.assignedDeliveryBoy,
    );

  const submitCancellation = async () => {
    const extraReason = customCancelReason.trim();
    const reason = selectedCancelReason === "Other"
      ? extraReason
      : [selectedCancelReason, extraReason].filter(Boolean).join(": ");
    if (!selectedCancelReason) {
      setCancelError("Choose a reason for cancelling your order.");
      return;
    }
    if (selectedCancelReason === "Other" && !extraReason) {
      setCancelError("Please tell us why you’re cancelling.");
      return;
    }
    if (reason.length > 500) {
      setCancelError("Keep the cancellation reason under 500 characters.");
      return;
    }

    setCancelling(true);
    setCancelError("");
    try {
      const result = await axios.post(
        `${serverUrl}/api/order/cancel-order`,
        { orderId: data._id, reason },
        { withCredentials: true },
      );
      dispatch(updateMyOrder(result.data.order));
      setShowCancelDialog(false);
      setSelectedCancelReason("");
      setCustomCancelReason("");
    } catch (error) {
      setCancelError(
        error.response?.data?.message ||
        error.message ||
        "We couldn’t cancel this order. Please try again."
      );
    } finally {
      setCancelling(false);
    }
  };

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
    <>
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
            <CreditCard size={13} /> {data.paymentMethod === "cod" ? "Cash on delivery" : data.payment ? "Paid online" : "Payment incomplete"}
          </span>
          <span className={`rounded-full border px-3 py-1.5 text-[11px] font-bold capitalize ${getStatusStyle(orderStatus)}`}>{orderStatus}</span>
        </div>
      </header>

      {orderStatus.toLowerCase() === "cancelled" && data.cancelReason && <div className="border-b border-[#f1e7e0] bg-[#fff5f2] px-4 py-2.5 text-xs text-[#8b5b4f] sm:px-5"><strong>Cancellation reason:</strong> {data.cancelReason}</div>}

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
        <div className="flex flex-col gap-2 sm:flex-row">
          {!canCancel && hasAssignedDeliveryPerson && orderStatus.toLowerCase() !== "cancelled" && <p className="self-center text-center text-[11px] text-[#8b746a] sm:mr-2">Delivery partner assigned · cancellation unavailable</p>}
          {canCancel && <button type="button" onClick={() => { setShowCancelDialog(true); setCancelError(""); }} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#f0cfc5] bg-white px-4 text-sm font-bold text-[#b34d3a] transition hover:bg-[#fff2ee]"><X size={15} /> Cancel order</button>}
          {orderStatus.toLowerCase() !== "cancelled" && (data.paymentMethod === "cod" || data.payment) && (
            <button
              type="button"
              onClick={() => navigate(`/track-order/${data._id}`)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#ff4d2d] px-5 text-sm font-bold text-white shadow-[0_8px_20px_-12px_rgba(255,77,45,0.8)] transition hover:-translate-y-0.5 hover:bg-[#e94325]"
            >
              {orderStatus.toLowerCase() === "delivered" ? <><Check size={16} /> View order</> : <>Track order <ArrowRight size={16} /></>}
            </button>
          )}
        </div>
      </footer>
    </article>
    {showCancelDialog && <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-[#21150f]/55 p-4 backdrop-blur-[2px]">
      <button type="button" aria-label="Close cancellation dialog" className="absolute inset-0 cursor-default" onClick={() => !cancelling && setShowCancelDialog(false)} />
      <section role="dialog" aria-modal="true" aria-labelledby={`cancel-order-title-${data._id}`} className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-[26px] border border-[#f0dfd5] bg-[#fffaf7] p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#fff0eb] text-[#bd4b40]"><AlertTriangle size={19} /></span><h2 id={`cancel-order-title-${data._id}`} className="mt-3 text-xl font-extrabold text-[#302923]">Cancel this order?</h2><p className="mt-1 text-sm leading-5 text-[#81766e]">Choose a reason. Orders can’t be cancelled after a delivery partner is assigned.</p></div>
          <button type="button" aria-label="Close cancellation dialog" disabled={cancelling} onClick={() => setShowCancelDialog(false)} className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#eadfd8] bg-white text-[#6f625a] disabled:opacity-50"><X size={17} /></button>
        </div>

        <fieldset className="mt-5">
          <legend className="mb-2 text-xs font-bold text-[#51473f]">Why are you cancelling?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {cancellationReasons.map((reason) => <button key={reason} type="button" aria-pressed={selectedCancelReason === reason} onClick={() => { setSelectedCancelReason(reason); setCancelError(""); }} className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${selectedCancelReason === reason ? "border-[#e76a4b] bg-[#fff0e9] text-[#a9432c]" : "border-[#eee2db] bg-white text-[#6e625a] hover:border-[#e9b8a5]"}`}>{reason}</button>)}
          </div>
        </fieldset>

        <label className="mt-4 block text-xs font-bold text-[#51473f]">Tell us more {selectedCancelReason === "Other" ? <span className="text-[#c65336]">(required)</span> : <span className="font-medium text-[#9a8e85]">(optional)</span>}
          <textarea value={customCancelReason} onChange={(event) => { setCustomCancelReason(event.target.value); setCancelError(""); }} maxLength={500} rows={3} placeholder="Add a few details about the cancellation…" className="mt-2 w-full resize-y rounded-xl border border-[#eadfd8] bg-white px-3 py-2.5 text-sm font-normal text-[#40362f] outline-none placeholder:text-[#aa9d94] focus:border-[#e99070]" />
        </label>
        {cancelError && <p role="alert" className="mt-3 rounded-xl border border-[#f1d0c9] bg-[#fff1ed] px-3 py-2 text-xs text-[#a94436]">{cancelError}</p>}
        {data.paymentMethod === "online" && data.payment && <p className="mt-3 text-[11px] leading-4 text-[#8b7c72]">Your refund will be requested to your original payment method if cancellation is accepted.</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" disabled={cancelling} onClick={() => setShowCancelDialog(false)} className="h-10 rounded-full border border-[#eadfd8] bg-white px-4 text-sm font-semibold text-[#6f625a] disabled:opacity-50">Keep order</button>
          <button type="button" disabled={cancelling || !selectedCancelReason} onClick={submitCancellation} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#c84e3a] px-5 text-sm font-bold text-white transition hover:bg-[#ae3f2e] disabled:cursor-not-allowed disabled:opacity-50">{cancelling ? "Cancelling…" : "Confirm cancellation"}</button>
        </div>
      </section>
    </div>}
    </>
  );
}

export default UserOrderCard;

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import DeliveryBoyTracking from "@/components/DeliveryBoyTracking";
import { updateRealtimeOrderStatus } from "@/redux/userSlice";
import { ArrowLeft, ArrowRight, Bike, Check, Clock3, CreditCard, MapPin, PackageCheck, Sparkles, Store, Truck } from "lucide-react";

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

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "";
    }
  };

  const progressSteps = [
    { key: "pending", label: "Received", icon: PackageCheck },
    { key: "preparing", label: "Preparing", icon: Clock3 },
    { key: "out for delivery", label: "On the way", icon: Bike },
    { key: "delivered", label: "Delivered", icon: Check },
  ];

  const getStatusTone = (status) => {
    const normalized = status?.toLowerCase();
    if (normalized === "delivered") return "border-[#cfe7d5] bg-[#edf7ef] text-[#34794b]";
    if (normalized === "cancelled") return "border-[#f2ceca] bg-[#fff0ee] text-[#bd4b40]";
    if (normalized === "preparing") return "border-[#f3dfb9] bg-[#fff8e9] text-[#a66a15]";
    if (normalized === "out for delivery") return "border-[#d8e4f2] bg-[#eff6ff] text-[#456e9b]";
    return "border-[#f2d9cf] bg-[#fff4ec] text-[#bd5a3b]";
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff9f6] text-[#302923]">
      <div className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full bg-[#ffc49e]/20 blur-3xl" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-5 sm:px-6 sm:pt-7 lg:px-8">
        <header className="flex items-center justify-between border-b border-[#f1e3da] pb-4">
          <a href="/" aria-label="SnapEats home" className="flex items-center gap-2.5">
            <span className="logo-smoke-mark flex size-9 items-center justify-center rounded-[14px] text-white shadow-sm sm:size-10 sm:rounded-2xl"><Bike size={20} strokeWidth={2.5} /></span>
            <span className="logo-smoke text-xl font-extrabold tracking-tight">SnapEats</span>
          </a>
          <button type="button" onClick={() => navigate(-1)} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#eedfd5] bg-white/85 px-3.5 text-sm font-semibold text-[#695e56] shadow-sm transition hover:border-[#f2c6b3] hover:bg-white hover:text-[#d84628] sm:px-4">
            <ArrowLeft size={16} /> Back to orders
          </button>
        </header>

        {loading ? (
          <section className="mt-8 animate-pulse rounded-[28px] border border-[#f0e2d9] bg-white p-6 shadow-sm sm:p-8">
            <div className="h-4 w-32 rounded-full bg-[#f4e6dd]" />
            <div className="mt-4 h-8 w-64 max-w-full rounded-lg bg-[#f4e6dd]" />
            <div className="mt-8 h-20 rounded-2xl bg-[#fff5ee]" />
            <div className="mt-6 h-64 rounded-2xl bg-[#f4e6dd]" />
          </section>
        ) : !currentOrder ? (
          <section className="mx-auto mt-8 flex max-w-2xl flex-col items-center rounded-[28px] border border-[#f0e2d9] bg-white px-6 py-12 text-center shadow-sm">
            <span className="flex size-16 items-center justify-center rounded-[22px] bg-[#fff0e7] text-[#f05235]"><PackageCheck size={28} /></span>
            <h1 className="mt-5 text-2xl font-extrabold text-[#302923]">We couldn’t find that order</h1>
            <p className="mt-2 text-sm text-[#81766e]">Return to your orders to choose another order to track.</p>
            <button type="button" onClick={() => navigate("/my-orders")} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#ff4d2d] px-5 text-sm font-bold text-white transition hover:bg-[#e94325]">My orders <ArrowRight size={16} /></button>
          </section>
        ) : currentOrder?.shopOrders?.length > 0 ? (
          <>
            <section className="relative mt-6 overflow-hidden rounded-[30px] border border-[#f1dfd4] bg-gradient-to-br from-white via-[#fffaf6] to-[#ffede2] p-5 shadow-[0_18px_45px_-38px_rgba(94,48,27,0.5)] sm:mt-8 sm:p-8 lg:p-9">
              <div className="pointer-events-none absolute -right-10 -top-12 size-56 rounded-full border-[28px] border-white/35" />
              <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#f1ddcf] bg-white/75 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#bf6543]"><Sparkles size={13} /> Your order is in good hands</div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#29231f] sm:text-4xl">Track your order<span className="text-[#ff4d2d]">.</span></h1>
                  <p className="mt-2 text-sm text-[#796e66] sm:text-base">Order <span className="font-bold text-[#51473f]">#{orderId?.slice(-6)}</span>{currentOrder.createdAt ? ` · Placed ${formatDate(currentOrder.createdAt)}` : ""}</p>
                </div>
                <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/90 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-sm">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#fff0e7] text-[#f05235]"><CreditCard size={18} /></span>
                  <span><span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#a3978e]">Payment</span><span className="mt-0.5 block text-sm font-bold text-[#403832]">{currentOrder.paymentMethod === "cod" ? "Cash on delivery" : currentOrder.payment ? "Paid online" : "Online payment"}</span></span>
                </div>
              </div>
            </section>

            <div className="mt-7 space-y-5">
              {currentOrder.shopOrders.map((shopOrder, index) => {
                const status = shopOrder?.status?.toLowerCase() || "pending";
                const isDelivered = status === "delivered";
                const isCancelled = status === "cancelled";
                const activeStep = Math.max(0, progressSteps.findIndex((step) => step.key === status));
                const subtotal = Number(shopOrder?.subTotal || 0);
                const courier = shopOrder.assignedDeliveryBoy;
                const deliveryLocation = liveLocations[String(courier?._id || courier)] || {
                  lat: courier?.location?.coordinates?.[1],
                  lon: courier?.location?.coordinates?.[0],
                };

                return (
                  <article key={shopOrder._id || index} className="overflow-hidden rounded-[26px] border border-[#f0e2d9] bg-white shadow-[0_12px_35px_-28px_rgba(75,39,23,0.42)]">
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f2e8e1] bg-gradient-to-r from-[#fffaf6] to-white px-4 py-4 sm:px-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff0e7] text-[#e64b2e]"><Store size={20} /></span>
                        <div className="min-w-0"><h2 className="truncate text-base font-extrabold text-[#302923] sm:text-lg">{shopOrder.shop?.name || "Restaurant"}</h2><p className="mt-0.5 text-xs text-[#81766e]">{shopOrder.shopOrderItems?.length || 0} {shopOrder.shopOrderItems?.length === 1 ? "dish" : "dishes"} in this delivery</p></div>
                      </div>
                      <span className={`rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getStatusTone(status)}`}>{status}</span>
                    </header>

                    <div className="space-y-5 p-4 sm:p-5">
                      {isCancelled ? (
                        <div className="rounded-2xl border border-[#f2ceca] bg-[#fff0ee] px-4 py-3 text-sm font-semibold text-[#a8433a]">This order was cancelled.</div>
                      ) : (
                        <div className="rounded-2xl border border-[#f1e5dc] bg-[#fffdfa] px-3 py-4 sm:px-5">
                          <div className="grid grid-cols-4 gap-2">
                            {progressSteps.map((step, stepIndex) => {
                              const StepIcon = step.icon;
                              const completed = isDelivered || stepIndex < activeStep;
                              const current = stepIndex === activeStep && !isDelivered;
                              return (
                                <div key={step.key} className="relative flex flex-col items-center text-center">
                                  {stepIndex < progressSteps.length - 1 && <span className={`absolute left-1/2 top-4 h-0.5 w-full ${stepIndex < activeStep || isDelivered ? "bg-[#ff9d79]" : "bg-[#eadfd7]"}`} />}
                                  <span className={`relative z-10 flex size-8 items-center justify-center rounded-full border-2 ${completed ? "border-[#ff4d2d] bg-[#ff4d2d] text-white" : current ? "border-[#ff4d2d] bg-white text-[#e64b2e] ring-4 ring-[#ff4d2d]/10" : "border-[#e5d8cf] bg-white text-[#a3978e]"}`}>
                                    {completed ? <Check size={15} strokeWidth={2.5} /> : <StepIcon size={14} />}
                                  </span>
                                  <span className={`mt-2 text-[10px] font-semibold sm:text-xs ${completed || current ? "text-[#51473f]" : "text-[#a3978e]"}`}>{step.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {shopOrder.deliveryOtp && !isDelivered && (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f2dfba] bg-[#fff8e9] p-4">
                          <div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#a66a15]">Delivery code</p><p className="mt-1 text-xs text-[#8d621e]">Share this code with your courier when the food arrives.</p></div>
                          <span className="rounded-xl border border-[#f3e2c2] bg-white px-4 py-2 text-xl font-black tracking-[0.22em] text-[#a66a15]">{shopOrder.deliveryOtp}</span>
                        </div>
                      )}

                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
                        <section className="rounded-2xl border border-[#f0e3da] bg-[#fffaf6] p-4">
                          <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#302923]"><PackageCheck size={17} className="text-[#e64b2e]" /> Order details</div>
                          <div className="space-y-3">
                            {shopOrder.shopOrderItems?.map((item, itemIndex) => (
                              <div key={item._id || itemIndex} className="flex items-center gap-3">
                                <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-[#fff0e7]">{item.item?.image && <img src={item.item.image} alt="" className="size-full object-cover" />}<span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-[#302923] text-[10px] font-bold text-white">{item.quantity}</span></div>
                                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#51473f]">{item.name}</span>
                                <span className="shrink-0 text-sm font-bold text-[#302923]">₹{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex items-center justify-between border-t border-[#eee2d9] pt-3 text-sm"><span className="font-medium text-[#81766e]">Restaurant subtotal</span><strong className="font-extrabold text-[#302923]">₹{subtotal.toFixed(2)}</strong></div>
                        </section>

                        <section className="rounded-2xl border border-[#f0e3da] bg-white p-4">
                          <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#302923]"><MapPin size={17} className="text-[#e64b2e]" /> Delivery address</div>
                          <p className="text-sm leading-6 text-[#6f645c]">{currentOrder?.deliveryAddress?.text || "Address not available"}</p>
                          <div className="mt-4 border-t border-[#f1e7e0] pt-3">
                            <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#302923]"><Truck size={17} className="text-[#e64b2e]" /> Delivery partner</div>
                            {courier ? (
                              <div className="flex items-center justify-between gap-3 rounded-xl bg-[#fff8f3] px-3 py-2.5">
                                <div><p className="text-sm font-bold text-[#51473f]">{courier.fullName || "Your courier"}</p><p className="mt-0.5 text-xs text-[#81766e]">On the way with your order</p></div>
                                {courier.mobile && <a href={`tel:${courier.mobile}`} className="rounded-full border border-[#f1d8cb] bg-white px-3 py-1.5 text-xs font-bold text-[#b85738]">Call</a>}
                              </div>
                            ) : <p className="rounded-xl bg-[#fff8f3] px-3 py-2.5 text-xs text-[#81766e]">A courier will be assigned as your order is prepared.</p>}
                          </div>
                        </section>
                      </div>

                      {courier && !isDelivered && (
                        <section className="overflow-hidden rounded-2xl border border-[#f0e3da] bg-white">
                          <div className="flex items-center justify-between gap-3 border-b border-[#f2e8e1] bg-[#fffaf6] px-4 py-3">
                            <div><h3 className="text-sm font-extrabold text-[#302923]">Live delivery map</h3><p className="mt-0.5 text-xs text-[#81766e]">Courier and delivery point update in real time.</p></div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf7ef] px-2.5 py-1 text-[10px] font-bold text-[#34794b]"><span className="size-1.5 rounded-full bg-[#45a866]" /> Live</span>
                          </div>
                          <div className="h-[320px] sm:h-[360px]">
                            <DeliveryBoyTracking data={{
                              deliveryBoyLocation: deliveryLocation,
                              customerLocation: customerLiveLocation || {
                                lat: currentOrder?.deliveryAddress?.latitude,
                                lon: currentOrder?.deliveryAddress?.longitude,
                              },
                            }} />
                          </div>
                        </section>
                      )}

                      {isDelivered && <div className="flex items-center gap-2 rounded-2xl border border-[#cfe7d5] bg-[#edf7ef] px-4 py-3 text-sm font-bold text-[#34794b]"><Check size={17} /> Delivered successfully. Enjoy your meal!</div>}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <section className="mx-auto mt-8 flex max-w-2xl flex-col items-center rounded-[28px] border border-[#f0e2d9] bg-white px-6 py-12 text-center shadow-sm">
            <span className="flex size-16 items-center justify-center rounded-[22px] bg-[#fff0e7] text-[#f05235]"><PackageCheck size={28} /></span>
            <h1 className="mt-5 text-2xl font-extrabold text-[#302923]">No restaurant orders found</h1>
            <p className="mt-2 text-sm text-[#81766e]">Your order details will appear here once available.</p>
            <button type="button" onClick={() => navigate("/my-orders")} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#ff4d2d] px-5 text-sm font-bold text-white transition hover:bg-[#e94325]">My orders <ArrowRight size={16} /></button>
          </section>
        )}
      </div>
    </main>
  );
};

export default TrackOrderPage;

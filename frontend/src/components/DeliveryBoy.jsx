import React, { useEffect, useState } from "react";
import Nav from "./Nav";
import { useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "@/App";
import DeliveryBoyTracking from "./DeliveryBoyTracking";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ClipLoader } from "react-spinners";
import {
  ArrowRight,
  Bike,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  MapPin,
  Navigation,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Store,
  UtensilsCrossed,
} from "lucide-react";

const DeliveryBoy = () => {
  const { userData, socket } = useSelector((state) => state.user);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [showOtpBox, setShowOtpBox] = useState(false);
  const [availableAssignments, setAvailableAssignments] = useState(null);
  const [otp, setOtp] = useState("");
  const [todayDeliveries, setTodayDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acceptingAssignmentId, setAcceptingAssignmentId] = useState(null);
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
        (error) => console.error("Error getting location:", error),
        { enableHighAccuracy: true },
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [socket, userData?._id]);

  const ratePerDelivery = 50;
  const totalDeliveries = (todayDeliveries || []).reduce((sum, item) => sum + (item?.count || 0), 0);
  const totalEarnings = totalDeliveries * ratePerDelivery;

  const getAssignments = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-assignments?t=${Date.now()}`, {
        withCredentials: true,
      });
      setAvailableAssignments(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.log(error?.response?.data?.message || error);
      setAvailableAssignments((previous) => previous || []);
    }
  };

  const getCurrentOrder = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-current-order`, {
        withCredentials: true,
      });
      setCurrentOrder(result.data || null);
      if (!result.data) setShowOtpBox(false);
    } catch {
      setCurrentOrder(null);
    }
  };

  const acceptOrder = async (assignmentId) => {
    if (!assignmentId) return;
    setAcceptingAssignmentId(assignmentId);
    setDeliveryError("");
    try {
      await axios.get(`${serverUrl}/api/order/accept-order/${assignmentId}`, {
        withCredentials: true,
      });
      await Promise.all([getAssignments(), getCurrentOrder()]);
    } catch (error) {
      setDeliveryError(error?.response?.data?.message || "We couldn’t accept this delivery. Please try again.");
    } finally {
      setAcceptingAssignmentId(null);
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
        { withCredentials: true },
      );
      setShowOtpBox(true);
      setOtp("");
      setDeliveryMessage(result.data?.message || "OTP sent. Ask the customer for their delivery code.");
    } catch (error) {
      console.error(error);
      setDeliveryError(error?.response?.data?.message || "Couldn’t send the delivery OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTodayDeliveries = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-today-deliveries?t=${Date.now()}`, {
        withCredentials: true,
      });
      setTodayDeliveries(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.log(error?.response?.data?.message || error);
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
        { withCredentials: true },
      );
      setShowOtpBox(false);
      setOtp("");
      setCurrentOrder(null);
      setDeliveryMessage("Delivery confirmed. Great work!");
      await Promise.all([handleTodayDeliveries(), getAssignments()]);
    } catch (error) {
      console.error(error);
      setDeliveryError(error?.response?.data?.message || "That OTP is invalid or expired. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleNewAssignment = (data) => {
      if (!data.sentTo || data.sentTo == userData?._id) {
        setAvailableAssignments((previous) => previous ? [...previous, data] : [data]);
      }
    };
    const handleStatusUpdate = (data) => {
      if (data?.status === "delivered") handleTodayDeliveries();
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

  const activeShopName = currentOrder?.shopOrder?.shop?.name || currentOrder?.shopOrder?.shop || "Restaurant";
  const currentAddress = currentOrder?.deliveryAddress?.text || "Delivery address unavailable";
  const locationLat = myLocation?.lat ?? userData?.location?.coordinates?.[1];
  const locationLon = myLocation?.lon ?? userData?.location?.coordinates?.[0];

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#fff9f6] pt-[100px] text-[#302923]">
      <Nav />
      <div className="pointer-events-none absolute -right-28 top-16 size-80 rounded-full bg-[#ffc49e]/25 blur-3xl" />
      <div className="pointer-events-none absolute -left-36 top-[680px] size-80 rounded-full bg-[#ffe2ca]/30 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <section className="relative isolate overflow-hidden rounded-[30px] bg-[#362119] p-5 text-white shadow-[0_24px_65px_-42px_rgba(67,35,20,0.6)] sm:p-8 lg:p-9">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_88%_0%,rgba(255,111,71,0.42),transparent_32%),linear-gradient(115deg,#352019,#663421_64%,#9a452d)]" />
          <div className="absolute -right-8 -top-20 -z-10 size-64 rounded-full border-[30px] border-white/5 sm:size-80" />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffd5c4]"><Sparkles size={13} /> Delivery partner dashboard</span>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Welcome, {userData?.fullName?.split(" ")[0] || "partner"}<span className="text-[#ff805c]">.</span></h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/75 sm:text-base">Your next delivery is just around the corner. Stay ready and keep the neighborhood moving.</p>
            </div>
            <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[#ff805c] text-white"><Bike size={22} /></span>
              <div>
                <p className="text-sm font-extrabold text-white">{myLocation ? "Location is live" : "Finding your location"}</p>
                <p className="mt-0.5 text-xs text-white/65">{myLocation ? "Ready for nearby orders" : "Allow location access to get started"}</p>
              </div>
              <span className={`ml-1 size-2.5 rounded-full ${myLocation ? "animate-pulse bg-[#8be1a1]" : "bg-[#ffd080]"}`} />
            </div>
          </div>
          <div className="relative mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-xs text-white/70">
            <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-[#ffb293]" />{locationLat != null && locationLon != null ? `${Number(locationLat).toFixed(4)}, ${Number(locationLon).toFixed(4)}` : "Location permission needed"}</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#ffb293]" />Customer OTP protects every handoff</span>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Deliveries today", value: totalDeliveries, note: "Completed handoffs", icon: <PackageCheck size={19} />, tone: "bg-[#edf6ed] text-[#4c8755]" },
            { label: "Today’s earnings", value: `₹${totalEarnings}`, note: `₹${ratePerDelivery} per delivery`, icon: <CircleDollarSign size={19} />, tone: "bg-[#fff1e7] text-[#e95334]" },
            { label: currentOrder ? "On your route" : "Orders nearby", value: currentOrder ? 1 : (availableAssignments?.length ?? "—"), note: currentOrder ? "Active delivery" : "Available to accept", icon: <Navigation size={19} />, tone: "bg-[#fff3d9] text-[#b57926]" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 rounded-[22px] border border-[#f0e2d9] bg-white p-4 shadow-[0_10px_30px_-28px_rgba(75,39,23,0.5)] sm:p-5">
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${stat.tone}`}>{stat.icon}</span>
              <div className="min-w-0"><p className="text-2xl font-black leading-none text-[#302923]">{stat.value}</p><p className="mt-1 text-sm font-bold text-[#51463e]">{stat.label}</p><p className="mt-0.5 text-xs text-[#9a8e85]">{stat.note}</p></div>
            </div>
          ))}
        </section>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[28px] border border-[#f0e1d8] bg-white p-4 shadow-[0_16px_45px_-38px_rgba(75,39,23,0.55)] sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45e40]">Your day so far</span><h2 className="mt-1 text-xl font-black text-[#302923] sm:text-2xl">Delivery activity</h2><p className="mt-1 text-xs text-[#8f837a]">Completed deliveries by hour.</p></div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff0e7] text-[#e95334]"><ClipboardList size={18} /></span>
            </div>

            {todayDeliveries.length ? (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={180}>
                  <BarChart data={todayDeliveries} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="#f0e7e1" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="hour" tickFormatter={(value) => value != null ? `${value}:00` : ""} axisLine={false} tickLine={false} tick={{ fill: "#968a81", fontSize: 11 }} />
                    <YAxis dataKey="count" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#968a81", fontSize: 11 }} />
                    <Tooltip cursor={{ fill: "#fff4ed" }} contentStyle={{ borderRadius: 14, border: "1px solid #f0e1d8", boxShadow: "0 12px 30px -20px rgba(75,39,23,.4)" }} formatter={(value) => [value, "Deliveries"]} labelFormatter={(value) => `Hour: ${value}`} />
                    <Bar dataKey="count" fill="#ff6846" radius={[7, 7, 2, 2]} maxBarSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[220px] flex-col items-center justify-center rounded-[20px] bg-[#fffaf7] text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-[#e95334] shadow-sm"><Clock3 size={21} /></span>
                <p className="mt-3 text-sm font-bold text-[#51463e]">Your first delivery is waiting</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-[#958980]">Once a delivery is completed, your hourly activity will show here.</p>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#f0e4dc] bg-[#fffaf7] px-4 py-3">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#756960]"><PackageCheck size={17} className="text-[#4c8755]" /> Deliveries completed</span>
              <span className="text-lg font-black text-[#302923]">{totalDeliveries}</span>
            </div>
          </section>

          {currentOrder ? (
            <section className="overflow-hidden rounded-[28px] border border-[#f0e1d8] bg-white shadow-[0_16px_45px_-38px_rgba(75,39,23,0.55)]">
              <div className="flex flex-col justify-between gap-3 border-b border-[#f2e7e0] bg-gradient-to-r from-white to-[#fff8f3] p-4 sm:flex-row sm:items-center sm:p-6">
                <div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45e40]">Your active delivery</span><h2 className="mt-1 text-xl font-black text-[#302923] sm:text-2xl">On the way</h2></div>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#f3d7c8] bg-[#fff0e7] px-3 py-1.5 text-xs font-bold text-[#bf5537]"><Bike size={14} /> In progress</span>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-[#f0e5de] bg-[#fffdfb] p-3.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#fff0e7] text-[#e95334]"><Store size={17} /></span>
                    <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9a8e85]">Pickup from</p><p className="mt-1 truncate text-sm font-extrabold text-[#423831]">{activeShopName}</p></div>
                  </div>
                  <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-[#f0e5de] bg-[#fffdfb] p-3.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#fff0e7] text-[#e95334]"><MapPin size={17} /></span>
                    <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9a8e85]">Deliver to</p><p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-[#62564e]">{currentAddress}</p></div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#f0e5de] bg-[#fffaf7] px-4 py-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#766b63]"><UtensilsCrossed size={14} />{currentOrder?.shopOrder?.shopOrderItems?.length || 0} items</span>
                  <span className="font-bold text-[#7f736a]">Order total <strong className="ml-1 text-sm text-[#302923]">₹{currentOrder?.shopOrder?.subTotal || 0}</strong></span>
                </div>

                <div className="mt-4 overflow-hidden rounded-[20px] border border-[#eee2da] bg-[#f8f6f3] p-1">
                  <DeliveryBoyTracking data={{ ...currentOrder, deliveryBoyLocation: myLocation || currentOrder?.deliveryBoyLocation }} />
                </div>

                {deliveryMessage && <p role="status" className="mt-3 flex items-start gap-2 rounded-xl border border-[#d7ead9] bg-[#f1f8f0] px-3.5 py-2.5 text-sm text-[#3d7547]"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />{deliveryMessage}</p>}
                {deliveryError && <p role="alert" className="mt-3 rounded-xl border border-[#f0d3cc] bg-[#fff2ef] px-3.5 py-2.5 text-sm leading-5 text-[#a74335]">{deliveryError}</p>}

                {!showOtpBox ? (
                  <button type="button" className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff4d2d] px-4 text-sm font-extrabold text-white transition hover:bg-[#e94325] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60" onClick={sendOtp} disabled={loading}>
                    {loading ? <ClipLoader color="#fff" size={19} /> : <><ShieldCheck size={18} /> Send delivery OTP <ArrowRight size={16} /></>}
                  </button>
                ) : (
                  <div className="mt-4 rounded-[22px] border border-[#f0dfd4] bg-[#fffaf7] p-4 sm:p-5">
                    <div className="mb-3 flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#e95334] shadow-sm"><ShieldCheck size={19} /></span><div><h3 className="text-sm font-extrabold text-[#423831]">Confirm the handoff</h3><p className="mt-0.5 text-xs leading-5 text-[#867a71]">Ask the customer for their 4-digit delivery OTP.</p></div></div>
                    <input id="delivery-otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={4} placeholder="Enter 4-digit OTP" className="h-12 w-full rounded-xl border border-[#eadfd8] bg-white px-4 text-center text-lg font-extrabold tracking-[0.45em] text-[#302923] outline-none transition placeholder:tracking-normal placeholder:text-sm placeholder:font-medium placeholder:text-[#aaa098] focus:border-[#ff4d2d] focus:ring-4 focus:ring-[#ff4d2d]/10" onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} value={otp} disabled={loading} />
                    <button type="button" className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#438255] px-4 text-sm font-extrabold text-white transition hover:bg-[#367147] disabled:cursor-not-allowed disabled:opacity-60" onClick={verifyOtp} disabled={loading}>{loading ? <ClipLoader color="#fff" size={18} /> : <><CheckCircle2 size={17} /> Confirm delivery</>}</button>
                    <button type="button" className="mt-2 h-9 w-full rounded-full text-xs font-bold text-[#a95739] transition hover:bg-[#fff0e7] disabled:opacity-50" onClick={sendOtp} disabled={loading}>Resend OTP</button>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className="rounded-[28px] border border-[#f0e1d8] bg-white p-4 shadow-[0_16px_45px_-38px_rgba(75,39,23,0.55)] sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45e40]">Ready when you are</span><h2 className="mt-1 text-xl font-black text-[#302923] sm:text-2xl">Available deliveries</h2><p className="mt-1 text-xs text-[#8f837a]">New offers appear here as they come in.</p></div>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff0e7] text-[#e95334]"><Bike size={19} /></span>
              </div>

              {deliveryError && <p role="alert" className="mb-3 rounded-xl border border-[#f0d3cc] bg-[#fff2ef] px-3.5 py-2.5 text-sm leading-5 text-[#a74335]">{deliveryError}</p>}
              {deliveryMessage && <p role="status" className="mb-3 flex items-center gap-2 rounded-xl border border-[#d7ead9] bg-[#f1f8f0] px-3.5 py-2.5 text-sm text-[#3d7547]"><CheckCircle2 size={16} />{deliveryMessage}</p>}

              {availableAssignments === null ? (
                <div className="flex items-center justify-center gap-3 rounded-[22px] bg-[#fffaf7] py-12 text-sm font-semibold text-[#80746c]"><ClipLoader color="#ff4d2d" size={19} /> Checking for nearby orders…</div>
              ) : availableAssignments.length ? (
                <div className="space-y-3">
                  {availableAssignments.map((assignment, index) => {
                    const assignmentKey = assignment?.assignmentId || assignment?._id || index;
                    const isAccepting = acceptingAssignmentId === assignment?.assignmentId;
                    return (
                      <article key={assignmentKey} className="rounded-[22px] border border-[#f0e4dc] bg-[#fffdfb] p-4 transition hover:border-[#f2c5b2] hover:shadow-[0_12px_28px_-24px_rgba(75,39,23,0.48)] sm:p-5">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-3">
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0e7] text-[#e95334]"><Store size={18} /></span>
                              <div className="min-w-0"><h3 className="truncate text-base font-extrabold text-[#302923]">{assignment?.shopName || "Restaurant pickup"}</h3><p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-[#81766e]"><MapPin size={13} className="mt-1 shrink-0 text-[#e95334]" />{assignment?.deliveryAddress?.text || "Customer address unavailable"}</p></div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 pl-[52px]">
                              <span className="rounded-full bg-[#f7f1ed] px-2.5 py-1 text-[11px] font-semibold text-[#756960]">{assignment?.items?.length || 0} items</span>
                              <span className="rounded-full bg-[#f7f1ed] px-2.5 py-1 text-[11px] font-semibold text-[#756960]">Order value ₹{assignment?.subtotal || 0}</span>
                            </div>
                          </div>
                          <button type="button" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#ff4d2d] px-5 text-sm font-extrabold text-white transition hover:bg-[#e94325] disabled:cursor-not-allowed disabled:opacity-65 sm:min-w-[124px]" onClick={() => acceptOrder(assignment?.assignmentId)} disabled={Boolean(acceptingAssignmentId)}>
                            {isAccepting ? <ClipLoader color="#fff" size={17} /> : <>Accept delivery <ArrowRight size={15} /></>}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center rounded-[22px] border border-dashed border-[#ead8cd] bg-[#fffaf7] px-5 py-10 text-center">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-[#e95334] shadow-sm"><Clock3 size={21} /></span>
                  <h3 className="mt-3 text-sm font-extrabold text-[#443a34]">No deliveries nearby right now</h3>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-[#8f837a]">We’ll let you know as soon as a new order is ready for pickup.</p>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
};

export default DeliveryBoy;

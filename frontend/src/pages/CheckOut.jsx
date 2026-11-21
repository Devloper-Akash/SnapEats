import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Bike, Check, CreditCard, LocateFixed, MapPin, Search, ShieldCheck, ShoppingBag, Sparkles, Wallet } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useDispatch, useSelector } from "react-redux";
import "leaflet/dist/leaflet.css";
import { setLocation, setAddress, setManualSelection } from "@/redux/mapSlice";
import {
  setCurrentAddress,
  setCurrentCity,
  setCurrentState,
} from "@/redux/userSlice";
import { useMap } from "react-leaflet";
import axios from "axios";
import { serverUrl } from "@/App";
import { addMyOrder, clearCart } from "@/redux/userSlice";

function RecenterMap({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location.lat && location.lon) {
      map.setView([location.lat, location.lon], 16, { animate: true });
    }
  }, [location.lat, location.lon, map]);
  return null;
}

function CheckOut() {
  const { location, address } = useSelector((state) => state.map);
  const { cartItems, totalAmount, userData, currentCity, currentState } = useSelector((state) => state.user);
  const [addressInput, setAddressInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [locationMessage, setLocationMessage] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponQuote, setCouponQuote] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponCelebration, setCouponCelebration] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const subtotal = Number(totalAmount || 0);
  const cartKey = cartItems.map((item) => `${item.id}:${item.quantity}`).sort().join("|");
  const appliedCoupon = couponQuote?.cartKey === cartKey ? couponQuote : null;
  const deliveryFee = appliedCoupon?.deliveryFee ?? (subtotal > 500 ? 0 : 40);
  const amountWithDeliveryFee = appliedCoupon?.totalAmount ?? subtotal + deliveryFee;

  const applyCoupon = async (code = couponInput) => {
    if (!String(code || "").trim()) {
      setCouponMessage("Enter an offer code first.");
      return;
    }
    setCouponBusy(true);
    setCouponMessage("");
    try {
      const result = await axios.post(`${serverUrl}/api/coupon/validate`, { code, cartItems }, { withCredentials: true });
      setCouponQuote({ ...result.data, cartKey });
      setCouponInput(result.data.coupon.code);
      setCouponMessage(`${result.data.coupon.code} applied — you save ₹${Number(result.data.totalSavings).toFixed(2)}.`);
      setCouponCelebration(true);
      window.setTimeout(() => setCouponCelebration(false), 1300);
    } catch (error) {
      setCouponQuote(null);
      setCouponMessage(error.response?.data?.message || "Could not check this offer. Try again.");
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = () => {
    setCouponQuote(null);
    setCouponInput("");
    setCouponMessage("Offer removed.");
  };

  const apiKey = import.meta.env.VITE_GEOAPIKEY;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const onDragEnd = (e) => {
    console.log(e.target._latlng);
    const { lat, lng } = e.target._latlng;
    dispatch(setManualSelection(true));
    dispatch(setLocation({ lat, lon: lng }));
    getAddressByLatLng(lat, lng);
  };

  const getAddressByLatLng = async (lat, lng) => {
    try {
      const result = await axios.get(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${apiKey}`,
      );
      const place = result?.data?.results?.[0];
      if (!place) return false;
      dispatch(setAddress(place?.formatted ?? null));
      dispatch(setCurrentCity(place?.city ?? null));
      dispatch(setCurrentState(place?.state ?? null));
      dispatch(
        setCurrentAddress(place?.address_line1 || place?.address_line2 || null),
      );
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const getCurrentLocation = () => {
    setLocationMessage("Finding your current location...");

    if (!navigator.geolocation) {
      setLocationMessage(
        "Geolocation not supported. Please enter your address.",
      );
      return;
    }

    // Try without high accuracy first (works better on desktops without GPS)
    navigator.geolocation.getCurrentPosition(
      (position) => handlePosition(position),
      () => {
        // Retry with high accuracy as second attempt
        navigator.geolocation.getCurrentPosition(
          (position) => handlePosition(position),
          () =>
            setLocationMessage(
              "Could not get location. Please enter your address or drag the pin.",
            ),
          { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 },
        );
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 5000 },
    );
  };

  const handlePosition = async (position) => {
    try {
      const { latitude, longitude } = position.coords;
      dispatch(setManualSelection(false));
      dispatch(setLocation({ lat: latitude, lon: longitude }));
      const addressFound = await getAddressByLatLng(latitude, longitude);
      setLocationMessage(
        addressFound
          ? "Current location updated."
          : "Location found, but address could not be loaded.",
      );
    } catch {
      setLocationMessage("Could not find the address for this location.");
    }
  };

  const getLatlngByAddress = async () => {
    try {
      const result = await axios.get(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(addressInput)}&apiKey=${apiKey}`,
      );
      const { lat, lon } = result.data.features[0].properties;
      dispatch(setManualSelection(true));
      dispatch(setLocation({ lat, lon }));
      await getAddressByLatLng(lat, lon);
    } catch (error) {
      console.log(error);
    }
  };

  const handlePlaceOrder = async () => {
    if (isPlacingOrder) return;
    setOrderError("");
    setIsPlacingOrder(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/order/place-order`,
        {
          paymentMethod,
          deliveryAddress: {
            text: addressInput,
            latitude: location.lat,
            longitude: location.lon,
            city: currentCity,
            state: currentState,
          },
          totalAmount: amountWithDeliveryFee,
          cartItems,
          couponCode: appliedCoupon?.coupon.code,
        },
        { withCredentials: true },
      );

      if (paymentMethod == "cod") {
        dispatch(clearCart());
        dispatch(addMyOrder(result.data));
        navigate("/order-placed");
      } else {
        const orderId = result.data.orderID;
        const razorOrder = result.data.razorOrder;
        openRazorpayWindow(orderId, razorOrder);
      }
    } catch (error) {
      console.log(error.response?.data || error.message);
      if (error.response?.status === 401) {
        setOrderError("Your session has expired. Please sign in again to place your order.");
      } else {
        setOrderError(error.response?.data?.message || "Your order could not be placed. Please try again.");
      }
    } finally {
      if (paymentMethod === "cod") {
        setIsPlacingOrder(false);
      }
    }
  };

  const openRazorpayWindow = (orderId, razorOrder) => {
    let paymentSuccess = false;
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || import.meta.env.VITE_RAZORPAY_KEY,
      amount: razorOrder.amount,
      currency: "INR",
      name: "SnapEats",
      description: "Food Order Payment",
      order_id: razorOrder.id,
      prefill: {
        name: userData?.fullName || "",
        email: userData?.email || "",
        contact: userData?.mobile || "",
      },
      config: {
        display: {
          blocks: {
            upi: {
              name: "Pay using UPI / QR / UPI ID",
              instruments: [
                {
                  method: "upi",
                  flows: ["qr", "intent", "collect"],
                },
              ],
            },
          },
          sequence: ["block.upi", "block.other"],
          preferences: {
            show_default_blocks: true,
          },
        },
      },
      theme: {
        color: "#ff4d2d",
      },
      modal: {
        ondismiss: async function () {
          setIsPlacingOrder(false);
          if (!paymentSuccess) {
            try {
              await axios.post(
                `${serverUrl}/api/order/cancel-unpaid-order`,
                { orderId },
                { withCredentials: true },
              );
            } catch (e) {
              console.error("Failed to cancel unpaid order", e);
            }
            setOrderError("Payment was not completed. Your order was not placed.");
          }
        },
      },
      handler: async function (response) {
        paymentSuccess = true;
        try {
          const result = await axios.post(
            `${serverUrl}/api/order/verify-payment`,
            {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            },
            { withCredentials: true },
          );
          if (result.data) {
            dispatch(clearCart());
            dispatch(addMyOrder(result.data));
          }
          navigate("/order-placed");
        } catch (error) {
          console.error("Payment verification error:", error.response?.data || error.message);
          setOrderError(error.response?.data?.message || "Payment verification failed. Please check your orders.");
        } finally {
          setIsPlacingOrder(false);
        }
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", async function (response) {
      setIsPlacingOrder(false);
      if (!paymentSuccess) {
        try {
          await axios.post(
            `${serverUrl}/api/order/cancel-unpaid-order`,
            { orderId },
            { withCredentials: true },
          );
        } catch (e) {
          console.error("Failed to cancel unpaid order", e);
        }
        setOrderError(response.error?.description || "Payment failed. Your order was not placed.");
      }
    });
    rzp.open();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAddressInput(address);
  }, [address]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff9f6] text-[#302923]">
      <div className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full bg-[#ffc49e]/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-28 top-[460px] size-72 rounded-full bg-[#ff4d2d]/[0.06] blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-5 sm:px-6 sm:pt-7 lg:px-8">
        <header className="flex items-center justify-between border-b border-[#f1e3da] pb-4">
          <Link to="/" aria-label="SnapEats home" className="flex items-center gap-2.5">
            <span className="logo-smoke-mark flex size-9 items-center justify-center rounded-[14px] text-white shadow-sm sm:size-10 sm:rounded-2xl">
              <Bike size={20} strokeWidth={2.5} />
            </span>
            <span className="logo-smoke text-xl font-extrabold tracking-tight">SnapEats</span>
          </Link>
          <button
            type="button"
            aria-label="Return to cart"
            onClick={() => navigate("/cart")}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[#eedfd5] bg-white/85 px-3.5 text-sm font-semibold text-[#695e56] shadow-sm transition hover:border-[#f2c6b3] hover:bg-white hover:text-[#d84628] sm:px-4"
          >
            <ArrowLeft size={16} /> <span>Back to cart</span>
          </button>
        </header>

        <section className="relative mt-6 overflow-hidden rounded-[30px] border border-[#f1dfd4] bg-gradient-to-br from-white via-[#fffaf6] to-[#ffede2] p-5 shadow-[0_18px_45px_-38px_rgba(94,48,27,0.5)] sm:mt-8 sm:p-8 lg:p-9">
          <div className="pointer-events-none absolute -right-10 -top-12 size-56 rounded-full border-[28px] border-white/35" />
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#f1ddcf] bg-white/75 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#bf6543]">
                <Sparkles size={13} /> One last step
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#29231f] sm:text-4xl">Make it yours<span className="text-[#ff4d2d]">.</span></h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#796e66] sm:text-base">Confirm where to deliver, choose how to pay, and we’ll get your order started.</p>
            </div>
            <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/90 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-sm">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#fff0e7] text-[#f05235]"><MapPin size={19} /></span>
              <span className="max-w-[230px]">
                <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#a3978e]">Delivering to</span>
                <span className="mt-0.5 block truncate text-sm font-bold text-[#403832]">{address || "Choose a delivery address"}</span>
              </span>
            </div>
          </div>
        </section>

        {cartItems?.length ? (
          <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
            <div className="space-y-6">
              <section className="overflow-hidden rounded-[26px] border border-[#f0e2d9] bg-white shadow-[0_12px_35px_-30px_rgba(75,39,23,0.4)]">
                <div className="border-b border-[#f2e7e0] bg-gradient-to-r from-[#fff5ee] to-white px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-white text-[#e64b2e] shadow-sm"><MapPin size={19} /></span>
                    <div>
                      <h2 className="text-lg font-extrabold text-[#302923]">Delivery location</h2>
                      <p className="mt-0.5 text-xs text-[#81766e]">Search an address or move the pin to your door.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="relative min-w-0 flex-1">
                      <MapPin size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#e64b2e]" />
                      <input
                        type="text"
                        placeholder="House number, street, neighborhood"
                        aria-label="Enter your delivery address"
                        className="h-12 w-full rounded-xl border border-[#eadfd8] bg-[#fffdfa] pl-10 pr-3.5 text-sm text-[#302923] outline-none transition placeholder:text-[#a3978e] focus:border-[#ff4d2d] focus:ring-4 focus:ring-[#ff4d2d]/10"
                        value={addressInput || ""}
                        onChange={(e) => setAddressInput(e.target.value)}
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label="Search this address on the map"
                        onClick={getLatlngByAddress}
                        className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#ff4d2d] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#e94325] sm:flex-none"
                      >
                        <Search size={17} /><span>Find address</span>
                      </button>
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[#f0d9cc] bg-[#fff4ec] px-3.5 text-sm font-semibold text-[#b85738] transition hover:bg-[#ffeadf] sm:flex-none"
                      >
                        <LocateFixed size={17} /><span className="sm:hidden">Current location</span><span className="hidden sm:inline">Use current location</span>
                      </button>
                    </div>
                  </div>
                  {locationMessage && (
                    <p role="status" className="mt-2.5 text-sm text-[#796e66]">{locationMessage}</p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-[#fff8f3] px-3.5 py-2.5 text-xs text-[#81766e]">
                    <span>Drag the map pin to fine-tune the delivery point.</span>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 font-semibold text-[#b85738]">Map pin</span>
                  </div>
                  <div className="mt-3 h-56 overflow-hidden rounded-2xl border border-[#eadfd8] bg-[#f5ece6] sm:h-64">
                    <MapContainer
                      className="h-full w-full"
                      center={[Number(location?.lat) || 20.5937, Number(location?.lon) || 78.9629]}
                      zoom={location?.lat && location?.lon ? 15 : 5}
                      scrollWheelZoom
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <RecenterMap location={location} />
                      {location?.lat != null && location?.lon != null && (
                        <Marker
                          position={[Number(location.lat), Number(location.lon)]}
                          draggable
                          eventHandlers={{ dragend: onDragEnd }}
                        />
                      )}
                    </MapContainer>
                  </div>
                </div>
              </section>

              <section className="rounded-[26px] border border-[#f0e2d9] bg-white p-4 shadow-[0_12px_35px_-30px_rgba(75,39,23,0.4)] sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#fff0e7] text-[#e64b2e]"><Wallet size={19} /></span>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#302923]">Payment method</h2>
                    <p className="mt-0.5 text-xs text-[#81766e]">Choose whichever works best for you.</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    aria-pressed={paymentMethod === "cod"}
                    onClick={() => setPaymentMethod("cod")}
                    className={`flex min-w-0 items-center gap-3 rounded-2xl border p-4 text-left transition ${paymentMethod === "cod" ? "border-[#ff4d2d]/60 bg-[#fff4ec] shadow-[0_8px_20px_-18px_rgba(255,77,45,0.8)]" : "border-[#eee4de] bg-white hover:border-[#f0c7b5] hover:bg-[#fffaf6]"}`}
                  >
                    <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${paymentMethod === "cod" ? "bg-white text-[#e64b2e]" : "bg-[#f5f2ee] text-[#756a62]"}`}><Bike size={20} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-[#302923]">Cash on delivery</span>
                      <span className="mt-1 block text-xs text-[#81766e]">Pay when your food arrives</span>
                    </span>
                    <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${paymentMethod === "cod" ? "border-[#ff4d2d] bg-[#ff4d2d] text-white" : "border-[#d9ccc3] text-transparent"}`}><Check size={12} /></span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={paymentMethod === "online"}
                    onClick={() => setPaymentMethod("online")}
                    className={`flex min-w-0 items-center gap-3 rounded-2xl border p-4 text-left transition ${paymentMethod === "online" ? "border-[#ff4d2d]/60 bg-[#fff4ec] shadow-[0_8px_20px_-18px_rgba(255,77,45,0.8)]" : "border-[#eee4de] bg-white hover:border-[#f0c7b5] hover:bg-[#fffaf6]"}`}
                  >
                    <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${paymentMethod === "online" ? "bg-white text-[#e64b2e]" : "bg-[#f5f2ee] text-[#756a62]"}`}><CreditCard size={20} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-[#302923]">UPI or card</span>
                      <span className="mt-1 block text-xs text-[#81766e]">Secure online payment</span>
                    </span>
                    <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${paymentMethod === "online" ? "border-[#ff4d2d] bg-[#ff4d2d] text-white" : "border-[#d9ccc3] text-transparent"}`}><Check size={12} /></span>
                  </button>
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-6">
              <section className="overflow-hidden rounded-[26px] border border-[#f0dfd5] bg-white shadow-[0_14px_38px_-30px_rgba(75,39,23,0.45)]">
                <div className="bg-gradient-to-r from-[#fff1e7] to-[#fffaf6] px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-extrabold text-[#302923]">Order summary</h2>
                      <p className="mt-0.5 text-xs text-[#887c73]">A quick look at your order</p>
                    </div>
                    <span className="flex size-10 items-center justify-center rounded-xl bg-white text-[#e64b2e] shadow-sm"><ShoppingBag size={18} /></span>
                  </div>
                </div>
                <div className="space-y-3 p-5">
                  <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-[#fff2e9]">
                          {item.image && <img src={item.image} alt="" className="size-full object-cover" />}
                          <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-[#302923] text-[10px] font-bold text-white">{item.quantity}</span>
                        </div>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#51473f]">{item.name}</span>
                        <span className="shrink-0 text-sm font-bold text-[#302923]">₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-dashed border-[#eadbd1]" />
                  <div className="flex items-center justify-between text-sm text-[#756a62]">
                    <span>Items subtotal</span><span className="font-semibold text-[#302923]">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-[#756a62]">
                    <span>Delivery fee</span><span className="font-semibold text-[#302923]">{deliveryFee === 0 ? <span className="text-[#3c8a58]">Free</span> : `₹${deliveryFee.toFixed(2)}`}</span>
                  </div>
                  {deliveryFee === 0 && <div className="rounded-xl bg-[#edf7ef] px-3 py-2 text-xs font-semibold text-[#34794b]">You’ve unlocked free delivery.</div>}
                  <div className="relative rounded-2xl border border-[#f0e2d9] bg-[#fffaf6] p-3.5">
                    {couponCelebration && <div className="coupon-fireworks" aria-hidden="true"><span className="coupon-firework coupon-firework-one">{Array.from({ length: 8 }, (_, index) => <i key={index} style={{ "--angle": `${index * 45}deg` }} />)}</span><span className="coupon-firework coupon-firework-two">{Array.from({ length: 8 }, (_, index) => <i key={index} style={{ "--angle": `${index * 45 + 22.5}deg` }} />)}</span></div>}
                    <div className="mb-2 flex items-center justify-between gap-2"><span className="text-xs font-bold text-[#51473f]">Have an offer code?</span>{appliedCoupon && <button type="button" onClick={removeCoupon} className="text-[11px] font-bold text-[#c25b40]">Remove</button>}</div>
                    {appliedCoupon ? <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2"><span className="font-extrabold tracking-wide text-[#c65336]">{appliedCoupon.coupon.code}</span><span className="text-xs font-bold text-[#3c8a58]">−₹{Number(appliedCoupon.totalSavings).toFixed(2)}</span></div> : <div className="flex gap-2"><input aria-label="Offer code" value={couponInput} onChange={(event) => setCouponInput(event.target.value.toUpperCase())} onKeyDown={(event) => { if (event.key === "Enter") applyCoupon(); }} placeholder="Enter code" className="h-10 min-w-0 flex-1 rounded-xl border border-[#eadfd8] bg-white px-3 text-sm font-bold uppercase tracking-wide text-[#51473f] outline-none placeholder:font-medium placeholder:normal-case placeholder:tracking-normal focus:border-[#e99070]" /><button type="button" disabled={couponBusy} onClick={() => applyCoupon()} className="h-10 rounded-xl bg-[#34231b] px-4 text-xs font-bold text-white transition hover:bg-[#553526] disabled:opacity-60">{couponBusy ? "Checking…" : "Apply"}</button></div>}
                    {(couponMessage || (couponQuote && !appliedCoupon)) && <p role="status" className={`mt-2 text-[11px] leading-4 ${appliedCoupon ? "text-[#3c8a58]" : "text-[#a85a43]"}`}>{couponQuote && !appliedCoupon ? "Your cart changed. Apply the offer again." : couponMessage}</p>}
                  </div>
                  {appliedCoupon && Number(appliedCoupon.discountAmount) > 0 && <div className="flex items-center justify-between text-sm text-[#3c8a58]"><span>Offer discount</span><span className="font-bold">−₹{Number(appliedCoupon.discountAmount).toFixed(2)}</span></div>}
                  <div className="border-t border-[#f0e4dc]" />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-[#51473f]">Total to pay</span>
                    <strong className="text-2xl font-extrabold tracking-tight text-[#e64b2e]">₹{amountWithDeliveryFee.toFixed(2)}</strong>
                  </div>
                  <button
                    type="button"
                    disabled={isPlacingOrder}
                    onClick={handlePlaceOrder}
                    className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff4d2d] px-5 text-sm font-bold text-white shadow-[0_8px_20px_-12px_rgba(255,77,45,0.8)] transition hover:-translate-y-0.5 hover:bg-[#e94325] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {isPlacingOrder
                      ? "Processing..."
                      : paymentMethod === "cod"
                      ? "Place order"
                      : "Pay & place order"}
                    <ArrowRight size={17} />
                  </button>
                  {orderError && (
                    <div role="alert" className="rounded-xl border border-[#f5c6cb] bg-[#fff1ed] p-3 text-xs text-[#b24d39]">
                      <p className="font-semibold">{orderError}</p>
                      {orderError.includes("sign in again") && (
                        <Link
                          to="/signin"
                          className="mt-1.5 inline-block font-bold text-[#b83824] underline hover:text-[#8d2a17]"
                        >
                          Sign in to continue &rarr;
                        </Link>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2 pt-1 text-xs font-medium text-[#887c73]">
                    <ShieldCheck size={15} className="text-[#5c9a70]" /> Secure payment and order details
                  </div>
                </div>
              </section>
            </aside>
          </div>
        ) : (
          <section className="mx-auto mt-7 flex max-w-2xl flex-col items-center rounded-[28px] border border-[#f0e2d9] bg-white px-6 py-12 text-center shadow-sm sm:py-16">
            <span className="flex size-16 items-center justify-center rounded-[22px] bg-[#fff0e7] text-[#f05235]"><ShoppingBag size={28} /></span>
            <h2 className="mt-5 text-2xl font-extrabold text-[#302923]">Your cart is empty</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#81766e]">Add a dish from a nearby restaurant before checking out.</p>
            <button type="button" onClick={() => navigate("/")} className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#ff4d2d] px-6 text-sm font-bold text-white transition hover:bg-[#e94325]">Explore restaurants <ArrowRight size={17} /></button>
          </section>
        )}
      </div>
    </main>
  );
}

export default CheckOut;

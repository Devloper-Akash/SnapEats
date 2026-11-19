import React, { useEffect, useState } from "react";
import { MoveLeftIcon } from "@animateicons/react/lucide";
import { useNavigate } from "react-router-dom";
import { MapPinIcon } from "@animateicons/react/lucide";
import { SearchIcon } from "@animateicons/react/huge";
import { TbCurrentLocationFilled } from "react-icons/tb";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useDispatch, useSelector } from "react-redux";
import "leaflet/dist/leaflet.css";
import { setLocation, setAddress } from "@/redux/mapSlice";
import {
  setCurrentAddress,
  setCurrentCity,
  setCurrentState,
} from "@/redux/userSlice";
import { MdDeliveryDining } from "react-icons/md";
import { CiMobile1 } from "react-icons/ci";
import { FaCreditCard } from "react-icons/fa";
import { useMap } from "react-leaflet";
import axios from "axios";
import { serverUrl } from "@/App";
import { addMyOrder } from "@/redux/userSlice";

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
  const { cartItems, totalAmount, userData } = useSelector((state) => state.user);
  const [addressInput, setAddressInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [locationMessage, setLocationMessage] = useState("");

  const deliveryFee = totalAmount > 500 ? 0 : 40;
  const amountWithDeliveryFee = totalAmount + deliveryFee;

  const apiKey = import.meta.env.VITE_GEOAPIKEY;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const onDragEnd = (e) => {
    console.log(e.target._latlng);
    const { lat, lng } = e.target._latlng;
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
      dispatch(setLocation({ lat, lon }));
      await getAddressByLatLng(lat, lon);
    } catch (error) {
      console.log(error);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      const result = await axios.post(
        `${serverUrl}/api/order/place-order`,
        {
          paymentMethod,
          deliveryAddress: {
            text: addressInput,
            latitude: location.lat,
            longitude: location.lon,
          },
          totalAmount: amountWithDeliveryFee,
          cartItems,
        },
        { withCredentials: true },
      );

      if (paymentMethod == "cod") {
        dispatch(addMyOrder(result.data));
        navigate("/order-placed");
      } else {
        const orderId = result.data.orderID;
        const razorOrder = result.data.razorOrder;
        openRazorpayWindow(orderId, razorOrder);
      }
    } catch (error) {
      console.log(error.response?.data || error.message);
    }
  };

  const openRazorpayWindow = (orderId, razorOrder) => {
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
      handler: async function (response) {
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
            dispatch(addMyOrder(result.data));
          }
          navigate("/order-placed");
        } catch (error) {
          console.error("Payment verification error:", error.response?.data || error.message);
          alert(error.response?.data?.message || "Payment verification failed. Please check your orders.");
        }
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  useEffect(() => {
    setAddressInput(address);
  }, [address]);

  return (
    <div className="relative min-h-screen bg-[#fff9f6] p-6 flex items-center justify-center">
      <button
        type="button"
        aria-label="Go back"
        className="absolute top-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-[#ff4d2d] transition-all duration-200 hover:-translate-x-0.5 hover:bg-orange-100 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d2d] focus-visible:ring-offset-2 sm:top-6 sm:left-6 sm:h-11 sm:w-11"
        onClick={() => navigate(-1)}
      >
        <MoveLeftIcon size={24} duration={1} />
      </button>
      <div className="w-full max-w-[900px] bg-white rounded-lg shadow-lg p-6 sm:p-8 space-y-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Checkout</h1>

        <section>
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 mb-2">
            <MapPinIcon size={20} duration={1} color="#ff4d2d" />
            Delivery Location
          </h2>
          <div className="gap-2 flex mb-3">
            <input
              type="text"
              placeholder="Enter your delivery address"
              className=" flex-1 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#ff4d2d] focus:ring-offset-2"
              value={addressInput}
              onChange={(e) => {
                setAddressInput(e.target.value);
              }}
            />
            <button
              className="bg-[#ff4d2d] text-white py-2 px-3 rounded-md hover:bg-[#ff3a1a] transition-colors items-center justify-center"
              onClick={getLatlngByAddress}
            >
              <SearchIcon size={20} duration={1} />
            </button>
            <button
              type="button"
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center justify-center"
              onClick={getCurrentLocation}
            >
              <TbCurrentLocationFilled size={20} />
            </button>
          </div>
          {locationMessage && (
            <p className="text-sm text-gray-600 mb-3">{locationMessage}</p>
          )}
          <div className="rounded-xl border overflow-hidden">
            <div className="h-64 w-full flex items-center justify-center">
              <MapContainer
                className={"h-full w-full"}
                center={[location?.lat, location?.lon]}
                zoom={13}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <RecenterMap location={location} />
                <Marker
                  position={location}
                  draggable
                  eventHandlers={{ dragend: onDragEnd }}
                ></Marker>
              </MapContainer>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3 text-gray-800">
            Payment Method
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${paymentMethod === "cod" ? "border-[#ff4d2d] bg-orange-50 shadow" : "border-gray-200 hover:border-gray-300"}`}
              onClick={() => setPaymentMethod("cod")}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full         bg-green-100">
                <MdDeliveryDining className="text-green-600 text-xl" />
              </span>
              <div>
                <p className="font-medium text-gray-800">Cash On Delivery</p>
                <p className="text-xs text-gray-500">
                  Pay when your food arrives
                </p>
              </div>
            </div>
            <div
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${paymentMethod === "online" ? "border-[#ff4d2d] bg-orange-50 shadow" : "border-gray-200 hover:border-gray-300"}`}
              onClick={() => setPaymentMethod("online")}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <CiMobile1 className="text-purple-700 text-lg" />
              </span>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <FaCreditCard className="text-blue-700 text-lg" />
              </span>
              <div>
                <p className="font-medium text-gray-800">
                  UPI / Credit / Debit Card
                </p>
                <p className="text-xs text-gray-500">Pay Securely Online</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3 text-gray-800">
            Order Summary
          </h2>
          <div className="rounded-xl border bg-gray-50 p-4 space-y-2">
            {cartItems.map((item, index) => (
              <div
                key={index}
                className="flex justify-between text-sm text-gray-700"
              >
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
            <hr className="border-gray-200 my-2"></hr>
            <div className="flex justify-between font-medium text-gray-800">
              <span>Subtotal</span>
              <span>₹{totalAmount}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Delivery Fee</span>
              <span>{deliveryFee == 0 ? "Free" : `₹${deliveryFee}`}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-[#ff4d2d] pt-2">
              <span>Total</span>
              <span>₹{amountWithDeliveryFee}</span>
            </div>
          </div>
        </section>
        <button
          className="w-full bg-[#ff4d2d] hover:bg-[#e64526] text-white py-3 rounded-xl font-semibold"
          onClick={handlePlaceOrder}
        >
          {paymentMethod == "cod" ? "Place Order" : "Pay & Place Order"}
        </button>
      </div>
    </div>
  );
}

export default CheckOut;

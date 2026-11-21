import React, { useRef, useState } from "react";
import { MapPinIcon } from "@animateicons/react/lucide";
import { ShoppingCartIcon } from "@animateicons/react/lucide";
import { ArrowDown, Bike, LoaderCircle, Search, Sparkles } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { XIcon } from "@animateicons/react/lucide";
import axios from "axios";
import { serverUrl } from "@/App";
import { setUserData, setSearchItems } from "@/redux/userSlice";
import { setMyShopData } from "@/redux/ownerSlice";
import { PlusIcon } from "@animateicons/react/lucide";
import { IoReceipt } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import LocationPicker from "./LocationPicker";

const Nav = () => {
  const { userData, currentCity, currentAddress, cartItems, myOrders, searchItems } =
    useSelector((state) => state.user);
  const locationLabel =
    currentAddress || currentCity || "Getting current location...";
  const { myShopData } = useSelector((state) => state.owner);
  const incomingOrderCount = (myOrders || []).filter(
    (order) => order?.shopOrders?.status !== "delivered",
  ).length;
  const [showInfo, setShowInfo] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [query, setQuery] = useState("");
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/signout`, {
        withCredentials: true,
      });
    } catch (error) {
      console.log(error);
    } finally {
      localStorage.removeItem("token");
      dispatch(setUserData(null));
    }
  };

  useEffect(() => {
    const searchText = query.trim();
    if (!searchText || !currentCity) {
      dispatch(setSearchItems(null));
      setSearchLoading(false);
      return;
    }

    let ignore = false;
    setSearchLoading(true);
    const timeout = window.setTimeout(async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/item/search-items?query=${encodeURIComponent(searchText)}&city=${encodeURIComponent(currentCity)}`,
          { withCredentials: true },
        );
        if (!ignore) dispatch(setSearchItems(result.data));
      } catch {
        if (!ignore) dispatch(setSearchItems([]));
      } finally {
        if (!ignore) setSearchLoading(false);
      }
    }, 220);

    return () => {
      ignore = true;
      window.clearTimeout(timeout);
    };
  }, [query, currentCity, dispatch]);

  useEffect(() => {
    const handleSpotlightShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (window.matchMedia("(max-width: 767px)").matches) {
          setShowSearch(true);
          window.setTimeout(() => mobileSearchRef.current?.focus(), 0);
        } else {
          desktopSearchRef.current?.focus();
        }
      }
      if (event.key === "Escape") setSearchFocused(false);
    };

    window.addEventListener("keydown", handleSpotlightShortcut);
    return () => window.removeEventListener("keydown", handleSpotlightShortcut);
  }, []);

  useEffect(() => {
    if (showSearch) {
      mobileSearchRef.current?.focus();
      setSearchFocused(true);
    }
  }, [showSearch]);

  const renderSearchPanel = () => (
    <div
      className={`absolute left-0 right-0 top-full z-[10000] mt-3 rounded-2xl border border-[#f1e1d7] bg-[#fffaf6] p-4 shadow-[0_22px_60px_-28px_rgba(75,39,23,0.35)] backdrop-blur-2xl transition ${searchFocused ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`}
      onMouseDown={(event) => event.preventDefault()}
    >
      {!query.trim() ? (
        <>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#a35a38]">
            <Sparkles size={14} /> Popular right now
          </div>
          <div className="flex flex-wrap gap-2">
            {["Burgers", "Pizza", "Momos", "North Indian"].map((term) => (
              <button
                key={term}
                type="button"
                className="rounded-full border border-orange-100 bg-white px-3 py-1.5 text-sm font-medium text-[#625b55] transition hover:border-[#ff4d2d]/30 hover:bg-[#fff0e7] hover:text-[#d83e22]"
                onClick={() => {
                  setQuery(term);
                  setSearchFocused(false);
                  mobileSearchRef.current?.blur();
                  desktopSearchRef.current?.blur();
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </>
      ) : searchLoading ? (
        <div className="flex items-center gap-2 py-2 text-sm text-[#746b64]">
          <LoaderCircle size={16} className="animate-spin text-[#ff4d2d]" />
          Finding something delicious…
        </div>
      ) : searchItems?.length ? (
        <>
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#a39a93]">
            Matching dishes
          </div>
          <div className="space-y-1">
            {searchItems.slice(0, 5).map((item, index) => (
              <button
                key={item._id || `${item.name}-${index}`}
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-[#fff0e7]"
                onClick={() => {
                  setQuery(item.name || query);
                  setSearchFocused(false);
                  mobileSearchRef.current?.blur();
                  desktopSearchRef.current?.blur();
                }}
              >
                <span className="truncate text-sm font-semibold text-[#35302c]">{item.name}</span>
                <ArrowDown size={14} className="ml-3 shrink-0 -rotate-45 text-[#a39a93]" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="py-2 text-sm text-[#746b64]">No matching dishes found. Try another search.</p>
      )}
      <p className="mt-3 border-t border-[#f1e7e0] pt-3 text-xs text-[#a39a93]">
        Search menus and restaurants in {currentCity || "your area"}
        <kbd className="float-right rounded-md border border-[#eee1d8] bg-white px-1.5 py-0.5 font-sans">Esc</kbd>
      </p>
    </div>
  );

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] flex h-[82px] w-full items-center justify-between gap-3 overflow-visible border-b border-orange-100/80 bg-[#fff9f6]/95 px-3 shadow-[0_8px_28px_-24px_rgba(94,48,27,0.42)] backdrop-blur-xl sm:gap-5 sm:px-5 lg:gap-7 lg:px-8">
      {showSearch && userData.role == "user" && (
        <div className="fixed left-[5%] top-[80px] z-[10000] flex h-[66px] w-[90%] items-center rounded-2xl border border-[#f1e1d7] bg-white/95 shadow-[0_14px_38px_-24px_rgba(75,39,23,0.35)] backdrop-blur-xl md:hidden">
          <button
            type="button"
            aria-label={`Change delivery location. Current location: ${locationLabel}`}
            className="flex h-full w-[43%] shrink-0 items-center gap-2 overflow-hidden rounded-l-2xl px-2 text-left transition hover:bg-[#fff8f3]"
            onClick={() => setShowLocationPicker(true)}
          >
            <MapPinIcon size={24} duration={1} color="#ff4d2d" />
            <span className="min-w-0 flex-1 truncate text-[11px] text-[#625b55]">{locationLabel}</span>
          </button>
          <div className="relative flex h-full min-w-0 flex-1 items-center gap-2 border-l border-[#f1e7e0] px-2">
            <Search size={19} className="shrink-0 text-[#ff4d2d]" />
            <input
              ref={mobileSearchRef}
              type="text"
              placeholder="Search food"
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-[#35302c] outline-none placeholder:text-[#a39a93]"
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
              onKeyDown={(event) => event.key === "Escape" && setSearchFocused(false)}
              value={query}
            />
          </div>
          {renderSearchPanel()}
        </div>
      )}

      <a href="/" aria-label="SnapEats home" className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        <span className="logo-smoke-mark flex size-9 items-center justify-center rounded-[14px] text-white shadow-sm sm:size-10 sm:rounded-2xl">
          <Bike size={19} strokeWidth={2.5} className="sm:hidden" />
          <Bike size={21} strokeWidth={2.5} className="hidden sm:block" />
        </span>
        <span className="logo-smoke text-lg font-extrabold tracking-tight sm:text-xl">SnapEats</span>
      </a>
      {userData.role == "user" && (
        <div className="relative hidden h-[68px] items-center rounded-2xl border border-[#f1e1d7] bg-white/90 shadow-[0_14px_38px_-24px_rgba(75,39,23,0.35)] backdrop-blur-xl transition focus-within:border-[#ff4d2d]/35 focus-within:shadow-[0_18px_42px_-24px_rgba(116,63,38,0.42)] md:flex md:w-[60%] lg:w-[40%]">
          <button
            type="button"
            aria-label={`Change delivery location. Current location: ${locationLabel}`}
            className="flex h-full w-[43%] shrink-0 items-center gap-2 overflow-hidden rounded-l-2xl px-3 text-left transition hover:bg-[#fff8f3]"
            onClick={() => setShowLocationPicker(true)}
          >
            <MapPinIcon size={25} duration={1} color="#ff4d2d" />
            <span className="min-w-0 flex-1 truncate text-sm text-[#625b55]">{locationLabel}</span>
            <span className="shrink-0 text-xs font-medium text-[#ff4d2d]">Change</span>
          </button>
          <div className="flex h-full min-w-0 flex-1 items-center gap-3 border-l border-[#f1e7e0] px-4">
            <Search size={21} className="shrink-0 text-[#ff4d2d]" />
            <input
              ref={desktopSearchRef}
              type="text"
              placeholder="Search dishes or restaurants"
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-[#35302c] outline-none placeholder:text-[#a39a93]"
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
              onKeyDown={(event) => event.key === "Escape" && setSearchFocused(false)}
              value={query}
            />
            <kbd className="hidden shrink-0 rounded-lg border border-[#eee1d8] bg-[#fffaf6] px-2 py-1 text-[10px] font-medium text-[#8f857d] lg:block">⌘ K</kbd>
          </div>
          {renderSearchPanel()}
        </div>
      )}

      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {userData.role == "user" && (
          <button
            type="button"
            aria-label={`Change delivery location. Current location: ${locationLabel}`}
            title="Change delivery location"
            className="flex size-10 items-center justify-center rounded-xl border border-orange-100 bg-white text-[#ff4d2d] shadow-sm transition hover:border-orange-200 hover:bg-[#fff0e7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d2d]/30 md:hidden"
            onClick={() => setShowLocationPicker(true)}
          >
            <MapPinIcon size={24} duration={1} color="#ff4d2d" />
          </button>
        )}
        {userData.role == "user" &&
          (showSearch ? (
            <button
              type="button"
              aria-label="Close search"
              className="flex size-10 items-center justify-center rounded-xl border border-orange-100 bg-white text-[#ff4d2d] shadow-sm transition hover:border-orange-200 hover:bg-[#fff0e7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d2d]/30 md:hidden"
              onClick={() => {
                setShowSearch(false);
                setSearchFocused(false);
              }}
            >
              <XIcon size={21} color="#ff4d2d" isAnimated duration={1} />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Search food"
              className="flex size-10 items-center justify-center rounded-xl border border-orange-100 bg-white text-[#ff4d2d] shadow-sm transition hover:border-orange-200 hover:bg-[#fff0e7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d2d]/30 md:hidden"
              onClick={() => setShowSearch(true)}
            >
              <Search size={21} />
            </button>
          ))}
        {userData.role == "owner" ? (
          <>
            {myShopData && (
              <>
                <button
                  type="button"
                  className="hidden h-10 items-center gap-2 rounded-full bg-[#ff4d2d] px-4 text-sm font-bold text-white shadow-[0_8px_20px_-14px_rgba(230,75,46,0.85)] transition hover:-translate-y-0.5 hover:bg-[#e94325] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d2d]/35 md:flex"
                  onClick={() => navigate("/add-item")}
                >
                  <PlusIcon size={19} duration={1} color="white" />
                  <span>Add a dish</span>
                </button>

                <button
                  type="button"
                  aria-label="Add a dish"
                  title="Add a dish"
                  className="flex size-10 items-center justify-center rounded-xl border border-[#ff4d2d]/15 bg-[#ff4d2d] text-white shadow-sm transition hover:bg-[#e94325] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d2d]/35 md:hidden"
                  onClick={() => navigate("/add-item")}
                >
                  <PlusIcon
                    size={21}
                    duration={1}
                    color="white"
                  />
                </button>
              </>
            )}

            <button
              type="button"
              className="hidden h-10 items-center gap-2 rounded-xl border border-orange-100 bg-white px-3.5 text-sm font-bold text-[#625b55] shadow-sm transition hover:border-orange-200 hover:bg-[#fff0e7] hover:text-[#d83e22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d2d]/30 md:inline-flex"
              onClick={() => navigate("/my-orders")}
            >
              <span className="flex size-6 items-center justify-center rounded-lg bg-[#fff0e7] text-[#ff4d2d]"><IoReceipt size={15} /></span>
              My Orders
              <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-[#ff4d2d] px-1.5 text-[10px] font-extrabold leading-5 text-white">{incomingOrderCount}</span>
            </button>
            <button
              type="button"
              aria-label={`Open incoming orders, ${incomingOrderCount} active`}
              title="My Orders"
              className="relative flex size-10 items-center justify-center rounded-xl border border-orange-100 bg-white text-[#e64b2e] shadow-sm transition hover:border-orange-200 hover:bg-[#fff0e7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d2d]/30 md:hidden"
              onClick={() => navigate("/my-orders")}
            >
              <IoReceipt size={19} />
              <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full border-2 border-[#fff9f6] bg-[#ff4d2d] px-1 text-[10px] font-extrabold leading-4 text-white">{incomingOrderCount}</span>
            </button>
          </>
        ) : (
          <>
            {userData.role == "user" && (
              <button
                type="button"
                aria-label={`Open cart, ${cartItems.length} items`}
                className="relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-white text-[#ff4d2d] shadow-sm transition hover:border-orange-200 hover:bg-[#fff0e7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d2d]/35"
                onClick={() => navigate("/cart")}
              >
                <ShoppingCartIcon size={25} duration={1} color="#ff4d2d" />
                <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full border-2 border-[#fff9f6] bg-[#ff4d2d] px-1 text-[10px] font-bold leading-4 text-white">
                  {cartItems.length}
                </span>
              </button>
            )}

            <button
              type="button"
              className="hidden h-10 items-center gap-2 rounded-xl border border-orange-100 bg-white px-3.5 text-sm font-semibold text-[#625b55] shadow-sm transition hover:border-orange-200 hover:bg-[#fff0e7] hover:text-[#d83e22] md:flex"
              onClick={() => navigate("/my-orders")}
            >
              <IoReceipt size={17} className="text-[#ff4d2d]" />
              My Orders
            </button>
          </>
        )}

        <button
          type="button"
          aria-label="Open account menu"
          aria-expanded={showInfo}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#ff4d2d] text-base font-bold text-white shadow-sm ring-2 ring-[#ff4d2d]/10 transition hover:ring-[#ff4d2d]/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ff4d2d]/25"
          onClick={() => setShowInfo((prev) => !prev)}
        >
          {userData?.fullName?.slice(0, 1) || "D"}
        </button>
        {showInfo && (
          <div
            className="fixed right-3 top-[76px] z-[10000] flex w-56 flex-col gap-1 rounded-2xl border border-orange-100 bg-[#fffdfa] p-2 shadow-[0_18px_48px_-24px_rgba(75,39,23,0.4)] sm:right-5"
          >
            <div className="rounded-xl bg-[#fff5ee] px-3 py-2.5">
              <div className="truncate text-sm font-bold text-[#26221f]">{userData?.fullName || "User"}</div>
              <div className="mt-0.5 text-xs font-medium capitalize text-[#a35a38]">{userData?.role === "deliveryBoy" ? "Delivery partner" : userData?.role}</div>
            </div>

            {userData.role == "user" && (
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#625b55] transition hover:bg-[#fff0e7] hover:text-[#d83e22] md:hidden"
                onClick={() => navigate("/my-orders")}
              >
                My Orders
              </button>
            )}

            <button
              type="button"
              className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#d83e22] transition hover:bg-[#fff0e7]"
              onClick={handleLogOut}
            >
              Log Out
            </button>
          </div>
        )}
      </div>
      <LocationPicker
        open={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
      />
    </div>
  );
};

export default Nav;

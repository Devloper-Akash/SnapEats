import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import UserOrderCard from "@/components/UserOrderCard";
import OwnerOrderCard from "@/components/OwnerOrderCard";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { addMyOrder, updateRealtimeOrderStatus } from "@/redux/userSlice";
import { ArrowLeft, ArrowRight, Bike, ClipboardList, Sparkles } from "lucide-react";

const MyOrders = () => {
  const { userData, myOrders, socket } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const orders = myOrders || [];

  useEffect(() => {
    const handleNewOrder = (data) => {
      const ownerId =
        data?.shopOrders?.owner?._id ||
        data?.shopOrders?.owner ||
        data?.ownerId;
      if (!ownerId || String(ownerId) === String(userData?._id)) {
        dispatch(addMyOrder(data));
      }
    };

    socket?.on("newOrder", handleNewOrder);

    socket?.on("update-status", ({ orderId, shopId, status, userId }) => {
      if (userId == userData?._id) {
        dispatch(updateRealtimeOrderStatus({ orderId, shopId, status }));
      }
    });

    return () => {
      socket?.off("newOrder", handleNewOrder);
      socket?.off("update-status");
    };
  }, [socket, userData?._id, dispatch]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff9f6] text-[#302923]">
      <div className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full bg-[#ffc49e]/20 blur-3xl" />
      <div className="relative mx-auto w-full max-w-5xl px-4 pb-12 pt-5 sm:px-6 sm:pt-7 lg:px-8">
        <header className="flex items-center justify-between border-b border-[#f1e3da] pb-4">
          <a href="/" aria-label="SnapEats home" className="flex items-center gap-2.5">
            <span className="logo-smoke-mark flex size-9 items-center justify-center rounded-[14px] text-white shadow-sm sm:size-10 sm:rounded-2xl">
              <Bike size={20} strokeWidth={2.5} />
            </span>
            <span className="logo-smoke text-xl font-extrabold tracking-tight">SnapEats</span>
          </a>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[#eedfd5] bg-white/85 px-3.5 text-sm font-semibold text-[#695e56] shadow-sm transition hover:border-[#f2c6b3] hover:bg-white hover:text-[#d84628] sm:px-4"
          >
            <ArrowLeft size={16} /> <span>Back</span>
          </button>
        </header>

        <section className="relative mt-6 overflow-hidden rounded-[30px] border border-[#f1dfd4] bg-gradient-to-br from-white via-[#fffaf6] to-[#ffede2] p-5 shadow-[0_18px_45px_-38px_rgba(94,48,27,0.5)] sm:mt-8 sm:p-8 lg:p-9">
          <div className="pointer-events-none absolute -right-10 -top-12 size-56 rounded-full border-[28px] border-white/35" />
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#f1ddcf] bg-white/75 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#bf6543]">
                <Sparkles size={13} /> From our kitchen to you
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#29231f] sm:text-4xl">Your orders<span className="text-[#ff4d2d]">.</span></h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#796e66] sm:text-base">See what’s on the way and revisit the meals you’ve enjoyed.</p>
            </div>
            <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/90 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-sm">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#fff0e7] text-[#f05235]"><ClipboardList size={19} /></span>
              <span>
                <span className="block text-xl font-extrabold leading-5 text-[#302923]">{orders.length}</span>
                <span className="mt-1 block text-xs font-semibold text-[#8d8178]">{orders.length === 1 ? "order" : "orders"}</span>
              </span>
            </div>
          </div>
        </section>

        {orders.length > 0 ? (
          <section className="mt-7">
            <div className="mb-4 flex items-end justify-between gap-3 px-1">
              <div>
                <h2 className="text-xl font-extrabold text-[#302923] sm:text-2xl">Order history</h2>
                <p className="mt-1 text-sm text-[#81766e]">Your latest orders and delivery updates.</p>
              </div>
              <span className="hidden rounded-full border border-[#f1dfd4] bg-white/80 px-3 py-1.5 text-xs font-bold text-[#8b6a58] sm:block">Live status updates</span>
            </div>
            <div className="space-y-4 sm:space-y-5">
              {orders.map((order, index) =>
                userData?.role === "user" ? (
                  <UserOrderCard data={order} key={order._id || index} />
                ) : userData?.role === "owner" ? (
                  <OwnerOrderCard data={order} key={order._id || index} />
                ) : null
              )}
            </div>
          </section>
        ) : (
          <section className="mx-auto mt-7 flex max-w-2xl flex-col items-center rounded-[28px] border border-[#f0e2d9] bg-white px-6 py-12 text-center shadow-sm sm:py-16">
            <span className="flex size-16 items-center justify-center rounded-[22px] bg-[#fff0e7] text-[#f05235]"><ClipboardList size={28} /></span>
            <h2 className="mt-5 text-2xl font-extrabold text-[#302923]">Your next favorite is still out there</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#81766e]">Once you place an order, you’ll find its progress and details here.</p>
            <button type="button" onClick={() => navigate("/")} className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#ff4d2d] px-6 text-sm font-bold text-white transition hover:bg-[#e94325]">Explore restaurants <ArrowRight size={17} /></button>
          </section>
        )}
      </div>
    </main>
  );
};

export default MyOrders;

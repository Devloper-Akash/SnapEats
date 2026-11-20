import React from "react";
import { ArrowLeft, ArrowRight, Bike, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import CartItemCard from "@/components/CartItemCard";

function CartPage() {
  const navigate = useNavigate();
  const { cartItems = [], totalAmount = 0 } = useSelector((state) => state.user);
  const itemCount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const subtotal = Number(totalAmount || 0);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff9f6] text-[#302923]">
      <div className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full bg-[#ffc49e]/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-28 top-[420px] size-72 rounded-full bg-[#ff4d2d]/[0.06] blur-3xl" />

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
            onClick={() => navigate("/")}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[#eedfd5] bg-white/85 px-3.5 text-sm font-semibold text-[#695e56] shadow-sm transition hover:border-[#f2c6b3] hover:bg-white hover:text-[#d84628] sm:px-4"
          >
            <ArrowLeft size={16} /> <span>Continue shopping</span>
          </button>
        </header>

        <section className="relative mt-6 overflow-hidden rounded-[30px] border border-[#f1dfd4] bg-gradient-to-br from-white via-[#fffaf6] to-[#ffede2] p-5 shadow-[0_18px_45px_-38px_rgba(94,48,27,0.5)] sm:mt-8 sm:p-8 lg:p-9">
          <div className="pointer-events-none absolute -right-10 -top-12 size-56 rounded-full border-[28px] border-white/35" />
          <div className="pointer-events-none absolute right-12 top-10 hidden size-20 rounded-full bg-[#ffb582]/15 blur-xl sm:block" />
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#f1ddcf] bg-white/75 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#bf6543]">
                <Sparkles size={13} /> Your meal is taking shape
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#29231f] sm:text-4xl">Your cart<span className="text-[#ff4d2d]">.</span></h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#796e66] sm:text-base">
                A few delicious choices, ready when you are. Review your picks and head to checkout.
              </p>
            </div>
            <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/90 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-sm">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#fff0e7] text-[#f05235]"><ShoppingBag size={19} /></span>
              <span>
                <span className="block text-xl font-extrabold leading-5 text-[#302923]">{itemCount}</span>
                <span className="mt-1 block text-xs font-semibold text-[#8d8178]">{itemCount === 1 ? "item" : "items"} in your bag</span>
              </span>
            </div>
          </div>
        </section>

        {cartItems.length === 0 ? (
          <section className="mx-auto mt-8 flex max-w-2xl flex-col items-center rounded-[28px] border border-[#f0e2d9] bg-white px-6 py-12 text-center shadow-sm sm:py-16">
            <span className="flex size-16 items-center justify-center rounded-[22px] bg-[#fff0e7] text-[#f05235]"><ShoppingBag size={28} /></span>
            <h2 className="mt-5 text-2xl font-extrabold text-[#302923]">Your bag is waiting for something delicious</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#81766e]">Explore nearby restaurants and add a dish you love. Your picks will be right here.</p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#ff4d2d] px-6 text-sm font-bold text-white shadow-[0_8px_20px_-12px_rgba(255,77,45,0.8)] transition hover:-translate-y-0.5 hover:bg-[#e94325]"
            >
              Explore restaurants <ArrowRight size={17} />
            </button>
          </section>
        ) : (
          <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
            <section>
              <div className="mb-4 flex items-end justify-between gap-3 px-1">
                <div>
                  <h2 className="text-xl font-extrabold text-[#302923] sm:text-2xl">Your selected dishes</h2>
                  <p className="mt-1 text-sm text-[#81766e]">Change quantities or remove a dish anytime.</p>
                </div>
                <span className="hidden rounded-full bg-[#fff0e7] px-3 py-1.5 text-xs font-bold text-[#bd5a3b] sm:block">{cartItems.length} {cartItems.length === 1 ? "dish" : "dishes"}</span>
              </div>
              <div className="space-y-3.5">
                {cartItems.map((item) => <CartItemCard key={item.id} data={item} />)}
              </div>
            </section>

            <aside className="lg:sticky lg:top-6">
              <div className="overflow-hidden rounded-[26px] border border-[#f0dfd5] bg-white shadow-[0_14px_38px_-30px_rgba(75,39,23,0.45)]">
                <div className="bg-gradient-to-r from-[#fff1e7] to-[#fffaf6] px-5 py-4">
                  <h2 className="text-lg font-extrabold text-[#302923]">Order summary</h2>
                  <p className="mt-0.5 text-xs text-[#887c73]">The finishing touches before checkout</p>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between text-sm text-[#756a62]">
                    <span>Items subtotal <span className="text-[#a3978e]">({itemCount} items)</span></span>
                    <span className="font-semibold text-[#302923]">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-[#756a62]">
                    <span>Delivery fee</span>
                    <span className="font-medium text-[#9b8e85]">Calculated at checkout</span>
                  </div>
                  <div className="my-4 border-t border-dashed border-[#eadbd1]" />
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <span className="block text-sm font-bold text-[#51473f]">Subtotal</span>
                      <span className="mt-1 block text-[11px] text-[#9b8e85]">Delivery added at checkout</span>
                    </div>
                    <strong className="text-2xl font-extrabold tracking-tight text-[#e64b2e]">₹{subtotal.toFixed(2)}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/checkout")}
                    className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff4d2d] px-5 text-sm font-bold text-white shadow-[0_8px_20px_-12px_rgba(255,77,45,0.8)] transition hover:-translate-y-0.5 hover:bg-[#e94325]"
                  >
                    Continue to checkout <ArrowRight size={17} />
                  </button>
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-[#887c73]">
                    <ShieldCheck size={15} className="text-[#5c9a70]" /> Secure checkout, fresh food ahead
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

export default CartPage;

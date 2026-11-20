import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bike,
  ClipboardList,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  ShoppingBag,
  Sparkles,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import Nav from "./Nav.jsx";
import OwnerItemCard from "./OwnerItemCard.jsx";
import OwnerOrderCard from "./OwnerOrderCard.jsx";

const OwnerDashboard = () => {
  const { myShopData } = useSelector((state) => state.owner);
  const { myOrders } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const menuItems = myShopData?.items || [];
  const orders = myOrders || [];
  const incomingOrders = orders.filter((order) => {
    const shopOrder = Array.isArray(order?.shopOrders) ? order.shopOrders[0] : order?.shopOrders;
    return !["delivered", "cancelled"].includes(String(shopOrder?.status || "").toLowerCase());
  });

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#fff9f6] text-[#302923]">
      <Nav />
      <div className="pointer-events-none absolute -right-24 top-28 size-80 rounded-full bg-[#ffc49e]/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-36 top-[600px] size-80 rounded-full bg-[#ffe2ca]/35 blur-3xl" />

      {!myShopData ? (
        <div className="relative mx-auto flex w-full max-w-6xl flex-col px-4 pb-14 pt-[108px] sm:px-6 lg:px-8">
          <section className="relative isolate overflow-hidden rounded-[32px] bg-[#342019] px-6 py-12 text-white shadow-[0_28px_70px_-44px_rgba(67,35,20,0.65)] sm:px-10 sm:py-16 lg:px-16">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_15%,rgba(255,112,72,0.5),transparent_32%),linear-gradient(115deg,#342019,#57301f_60%,#a3462d)]" />
            <div className="absolute -right-8 -top-12 -z-10 size-60 rounded-full border-[32px] border-white/5 sm:size-80" />
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#ffd5c4]">
                <Sparkles size={14} /> Your kitchen starts here
              </span>
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">Bring your food to the neighborhood<span className="text-[#ff805c]">.</span></h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 sm:text-base">Set up your restaurant once, then share your menu with nearby customers and manage every order from one place.</p>
              <button onClick={() => navigate("/create-edit-shop")} className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-[#ff4d2d] px-6 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#f04a2b]">
                Set up your restaurant <ArrowRight size={17} />
              </button>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:absolute lg:bottom-10 lg:right-10 lg:mt-0 lg:w-[340px] lg:grid-cols-1">
              {[
                [<Store size={18} />, "Create your restaurant profile"],
                [<UtensilsCrossed size={18} />, "Add your signature dishes"],
                [<Bike size={18} />, "Start receiving local orders"],
              ].map(([icon, label]) => <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 backdrop-blur-sm"><span className="text-[#ffb293]">{icon}</span>{label}</div>)}
            </div>
          </section>
        </div>
      ) : (
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-14 pt-[108px] sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#c45e40]"><Sparkles size={14} /> Restaurant studio</span>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#302923] sm:text-4xl">Good to see you<span className="text-[#ff4d2d]">.</span></h1>
              <p className="mt-1.5 text-sm text-[#81766e]">Here’s what’s happening at {myShopData.name} today.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button onClick={() => navigate("/create-edit-shop")} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#eadbd2] bg-white px-4 text-sm font-bold text-[#6b5e55] transition hover:border-[#f3bba5] hover:text-[#df4c2d]"><Pencil size={15} /> Edit restaurant</button>
              <button onClick={() => navigate("/add-item")} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#ff4d2d] px-4 text-sm font-bold text-white transition hover:bg-[#e94325]"><Plus size={17} /> Add dish</button>
            </div>
          </header>

          <section className="relative isolate overflow-hidden rounded-[30px] border border-[#f0ddd1] bg-[#39231a] shadow-[0_24px_60px_-42px_rgba(75,39,23,0.58)]">
            {myShopData.image && <img src={myShopData.image} alt={myShopData.name} className="absolute inset-0 -z-20 size-full object-cover" />}
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#23150f]/90 via-[#23150f]/66 to-[#23150f]/15" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#23150f]/40 to-transparent" />
            <div className="flex min-h-[250px] flex-col justify-end gap-6 p-6 sm:p-8 lg:min-h-[290px] lg:flex-row lg:items-end lg:justify-between lg:p-10">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm"><Store size={13} className="text-[#ffb08e]" /> Your restaurant</span>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white drop-shadow-sm sm:text-4xl">{myShopData.name}</h2>
                <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-white/80"><MapPin size={16} className="mt-1 shrink-0 text-[#ffb08e]" /><span>{[myShopData.address, myShopData.city, myShopData.state].filter(Boolean).join(", ")}</span></p>
              </div>
              <button onClick={() => navigate("/create-edit-shop")} className="inline-flex h-11 w-fit items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/25"><Pencil size={15} /> Update details</button>
            </div>
          </section>

          <section className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Active orders", value: incomingOrders.length, note: "Need your attention", icon: <ClipboardList size={19} />, tone: "bg-[#fff0e7] text-[#e95334]" },
              { label: "Menu dishes", value: menuItems.length, note: "Available in your menu", icon: <UtensilsCrossed size={19} />, tone: "bg-[#f1f7ec] text-[#5c8a4c]" },
              { label: "All orders", value: orders.length, note: "Orders received", icon: <ShoppingBag size={19} />, tone: "bg-[#fff3d9] text-[#b57926]" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-4 rounded-[22px] border border-[#f0e2d9] bg-white p-4 shadow-[0_10px_30px_-28px_rgba(75,39,23,0.5)] sm:p-5">
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${stat.tone}`}>{stat.icon}</span>
                <div className="min-w-0"><p className="text-2xl font-black leading-none text-[#302923]">{stat.value}</p><p className="mt-1 text-sm font-bold text-[#51463e]">{stat.label}</p><p className="mt-0.5 text-xs text-[#9a8e85]">{stat.note}</p></div>
              </div>
            ))}
          </section>

          <div className="mt-6 grid items-start gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <section className="rounded-[28px] border border-[#f0e1d8] bg-white p-4 shadow-[0_16px_45px_-38px_rgba(75,39,23,0.55)] sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45e40]">Kitchen queue</span><h2 className="mt-1 text-xl font-black text-[#302923] sm:text-2xl">Incoming orders</h2><p className="mt-1 text-xs text-[#8f837a]">Keep each order moving smoothly.</p></div>
                <button onClick={() => navigate("/my-orders")} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#f0ddd2] bg-[#fffaf7] px-3 text-xs font-bold text-[#c65336] transition hover:bg-[#fff0e7]">View all <ArrowRight size={14} /></button>
              </div>
              {incomingOrders.length ? (
                <div className="space-y-3">{incomingOrders.slice(0, 3).map((order, index) => <OwnerOrderCard data={order} key={order._id || index} compact />)}</div>
              ) : (
                <div className="rounded-[22px] border border-dashed border-[#ead8cd] bg-[#fffaf7] px-5 py-9 text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-[#e95334] shadow-sm"><Clock3 size={21} /></span>
                  <h3 className="mt-3 text-sm font-extrabold text-[#443a34]">Your kitchen is all caught up</h3>
                  <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#8f837a]">New customer orders will appear here as soon as they arrive.</p>
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-[#f0e1d8] bg-white p-4 shadow-[0_16px_45px_-38px_rgba(75,39,23,0.55)] sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45e40]">Your dishes</span><h2 className="mt-1 text-xl font-black text-[#302923] sm:text-2xl">Menu items</h2><p className="mt-1 text-xs text-[#8f837a]">Manage the food you’re serving.</p></div>
                <button onClick={() => navigate("/add-item")} aria-label="Add a dish" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#ff4d2d] text-white transition hover:rotate-90 hover:bg-[#e94325]"><Plus size={19} /></button>
              </div>
              {menuItems.length ? (
                <div className="space-y-3">{menuItems.slice(0, 5).map((item, index) => <OwnerItemCard data={item} key={item._id || index} />)}</div>
              ) : (
                <div className="rounded-[22px] border border-dashed border-[#ead8cd] bg-[#fffaf7] px-5 py-9 text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-[#e95334] shadow-sm"><UtensilsCrossed size={21} /></span>
                  <h3 className="mt-3 text-sm font-extrabold text-[#443a34]">Add your first dish</h3>
                  <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#8f837a]">Give customers something delicious to discover.</p>
                  <button onClick={() => navigate("/add-item")} className="mt-4 inline-flex h-9 items-center gap-2 rounded-full bg-[#ff4d2d] px-4 text-xs font-bold text-white transition hover:bg-[#e94325]"><Plus size={15} /> Add a dish</button>
                </div>
              )}
              {menuItems.length > 5 && <button onClick={() => navigate("/add-item")} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#c65336] hover:text-[#e64b2e]">Manage full menu <ArrowRight size={14} /></button>}
            </section>
          </div>
        </div>
      )}
    </main>
  );
};

export default OwnerDashboard;

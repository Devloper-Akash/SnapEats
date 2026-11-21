import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  ArrowLeft,
  Bike,
  Camera,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  MapPinned,
  Sparkles,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { serverUrl } from "@/App";
import { setMyShopData } from "@/redux/ownerSlice";

const CreateEditShop = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const imageInputRef = useRef(null);
  const { myShopData } = useSelector((state) => state.owner);
  const { currentCity, currentState, currentAddress } = useSelector((state) => state.user);
  const [name, setName] = useState(myShopData?.name || "");
  const [address, setAddress] = useState(myShopData?.address || currentAddress || "");
  const [city, setCity] = useState(myShopData?.city || currentCity || "");
  const [state, setState] = useState(myShopData?.state || currentState || "");
  const [frontendImage, setFrontendImage] = useState(myShopData?.image || null);
  const [backendImage, setBackendImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!frontendImage?.startsWith("blob:")) return undefined;
    return () => URL.revokeObjectURL(frontendImage);
  }, [frontendImage]);

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBackendImage(file);
    setFrontendImage(URL.createObjectURL(file));
    setFeedback(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("city", city.trim());
      formData.append("state", state.trim());
      formData.append("address", address.trim());
      if (backendImage) formData.append("image", backendImage);

      const result = await axios.post(`${serverUrl}/api/shop/create-edit`, formData, {
        withCredentials: true,
      });
      dispatch(setMyShopData(result.data));
      setFeedback({ type: "success", text: "Restaurant details saved successfully! Redirecting…" });
      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "We couldn’t save your restaurant details. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff9f6] px-4 py-6 text-[#302923] sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute -right-32 -top-32 size-[450px] rounded-full bg-[#ffc49e]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 size-[420px] rounded-full bg-[#ffe4d2]/45 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl">
        <header className="mb-6 flex items-center justify-between border-b border-[#f1e3da] pb-4">
          <a href="/" aria-label="SnapEats home" className="flex items-center gap-2.5">
            <span className="logo-smoke-mark flex size-9 items-center justify-center rounded-[14px] text-white shadow-sm sm:size-10 sm:rounded-2xl"><Bike size={20} strokeWidth={2.5} /></span>
            <span className="logo-smoke text-xl font-extrabold tracking-tight">SnapEats</span>
          </a>
          <button type="button" onClick={() => navigate("/")} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#eedfd5] bg-white/85 px-3.5 text-sm font-semibold text-[#695e56] shadow-sm transition hover:border-[#f2c6b3] hover:text-[#d84628] sm:px-4">
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Back to dashboard</span><span className="sm:hidden">Back</span>
          </button>
        </header>

        <section className="relative isolate mb-6 overflow-hidden rounded-[30px] bg-[#352019] px-6 py-7 text-white shadow-[0_24px_65px_-42px_rgba(67,35,20,0.62)] sm:px-9 sm:py-9">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_88%_0%,rgba(255,111,71,0.45),transparent_34%),linear-gradient(115deg,#352019,#663421_65%,#9a452d)]" />
          <div className="absolute -right-5 -top-20 -z-10 size-64 rounded-full border-[30px] border-white/5" />
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.19em] text-[#ffd5c4]"><Sparkles size={13} /> Restaurant profile</span>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{myShopData ? "Make it yours" : "Set your table"}<span className="text-[#ff805c]">.</span></h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/75 sm:text-base">Add the details customers need to discover your kitchen and find their next favorite meal.</p>
            </div>
            <span className="flex w-fit items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-semibold text-white/85 backdrop-blur-sm"><Store size={17} className="text-[#ffb293]" /> {myShopData ? "Edit restaurant" : "New restaurant"}</span>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="grid items-start gap-5 lg:grid-cols-[1.12fr_0.88fr]">
          <section className="rounded-[28px] border border-[#f0e1d8] bg-white p-5 shadow-[0_18px_48px_-40px_rgba(75,39,23,0.55)] sm:p-7">
            <div className="mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.19em] text-[#c45e40]">The essentials</span>
              <h2 className="mt-1 text-xl font-black text-[#302923] sm:text-2xl">Restaurant details</h2>
              <p className="mt-1 text-sm text-[#81766e]">Keep these up to date so guests know where to order from.</p>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#443a34]">Restaurant name</span>
                <input type="text" required maxLength={80} placeholder="e.g. The Little Curry House" value={name} onChange={(event) => { setName(event.target.value); setFeedback(null); }} className="h-12 w-full rounded-2xl border border-[#eadfd7] bg-[#fffdfb] px-4 text-sm font-medium text-[#302923] outline-none transition placeholder:text-[#ad9f96] focus:border-[#f18b6c] focus:ring-4 focus:ring-[#ff4d2d]/10" />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#443a34]">Street address</span>
                <span className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#eadfd7] bg-[#fffdfb] px-4 transition focus-within:border-[#f18b6c] focus-within:ring-4 focus-within:ring-[#ff4d2d]/10">
                  <MapPin size={17} className="shrink-0 text-[#e64b2e]" />
                  <input type="text" required maxLength={180} placeholder="Building, street, and area" value={address} onChange={(event) => { setAddress(event.target.value); setFeedback(null); }} className="h-12 w-full bg-transparent text-sm font-medium text-[#302923] outline-none placeholder:text-[#ad9f96]" />
                </span>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#443a34]">City</span>
                  <span className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#eadfd7] bg-[#fffdfb] px-4 transition focus-within:border-[#f18b6c] focus-within:ring-4 focus-within:ring-[#ff4d2d]/10">
                    <MapPinned size={17} className="shrink-0 text-[#e64b2e]" />
                    <input type="text" required maxLength={80} placeholder="Your city" value={city} onChange={(event) => { setCity(event.target.value); setFeedback(null); }} className="h-12 w-full bg-transparent text-sm font-medium text-[#302923] outline-none placeholder:text-[#ad9f96]" />
                  </span>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#443a34]">State</span>
                  <input type="text" required maxLength={80} placeholder="Your state" value={state} onChange={(event) => { setState(event.target.value); setFeedback(null); }} className="h-12 w-full rounded-2xl border border-[#eadfd7] bg-[#fffdfb] px-4 text-sm font-medium text-[#302923] outline-none transition placeholder:text-[#ad9f96] focus:border-[#f18b6c] focus:ring-4 focus:ring-[#ff4d2d]/10" />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#f0e1d8] bg-white p-5 shadow-[0_18px_48px_-40px_rgba(75,39,23,0.55)] sm:p-6">
            <div className="mb-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.19em] text-[#c45e40]">First impressions</span>
              <h2 className="mt-1 text-xl font-black text-[#302923]">Restaurant photo</h2>
              <p className="mt-1 text-sm leading-5 text-[#81766e]">Choose a bright, appetizing image of your place or food.</p>
            </div>

            <div className="group relative aspect-[1.45] overflow-hidden rounded-[22px] border border-[#efded3] bg-[linear-gradient(135deg,#fff2e8,#f4d9cb)]">
              {frontendImage ? (
                <img src={frontendImage} alt={`${name || "Restaurant"} preview`} className="size-full object-cover transition duration-500 group-hover:scale-[1.025]" />
              ) : (
                <div className="flex size-full flex-col items-center justify-center px-5 text-center">
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-white/85 text-[#e64b2e] shadow-sm"><UtensilsCrossed size={25} /></span>
                  <span className="mt-3 text-sm font-bold text-[#654c3e]">Your restaurant photo goes here</span>
                  <span className="mt-1 text-xs text-[#987b69]">A great image helps customers find you</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#23150f]/75 to-transparent p-4 pt-12">
                <p className="truncate text-base font-extrabold text-white">{name || "Your restaurant"}</p>
                <p className="mt-0.5 truncate text-xs text-white/80">{[city, state].filter(Boolean).join(", ") || "Your neighborhood"}</p>
              </div>
            </div>

            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImage} className="sr-only" aria-label="Choose restaurant photo" />
            <button type="button" onClick={() => imageInputRef.current?.click()} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#efdcd1] bg-[#fff9f5] text-sm font-bold text-[#a64f34] transition hover:border-[#f2b79f] hover:bg-[#fff2e9]">
              <Camera size={17} /> {frontendImage ? "Change restaurant photo" : "Upload restaurant photo"}
            </button>
            <p className="mt-2 text-center text-[11px] leading-5 text-[#9a8e85]">JPG, PNG, or WebP. Use a clear landscape photo for the best look.</p>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#f2e5d8] bg-[#fffaf3] p-3.5">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#d67b48] shadow-sm"><MapPin size={15} /></span>
              <p className="text-xs leading-5 text-[#7e6d5f]">Your address and location help nearby customers discover your restaurant.</p>
            </div>
          </section>

          <div className="lg:col-span-2">
            {feedback && (
              <div role="status" className={`mb-4 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${feedback.type === "success" ? "border-[#d8ead8] bg-[#f1f8f0] text-[#3d7547]" : "border-[#f0d3cc] bg-[#fff2ef] text-[#a74335]"}`}>
                <CheckCircle2 size={17} className="shrink-0" /> {feedback.text}
              </div>
            )}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => navigate("/")} className="h-12 rounded-full border border-[#eadbd2] bg-white px-6 text-sm font-bold text-[#74685f] transition hover:bg-[#fffaf7]">Cancel</button>
              <button type="submit" disabled={loading} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#ff4d2d] px-7 text-sm font-extrabold text-white shadow-[0_8px_20px_-14px_rgba(230,75,46,0.9)] transition hover:-translate-y-0.5 hover:bg-[#e94325] disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? <><LoaderCircle size={17} className="animate-spin" /> Saving details…</> : <><Store size={17} /> {myShopData ? "Save restaurant details" : "Create restaurant"}</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
};

export default CreateEditShop;

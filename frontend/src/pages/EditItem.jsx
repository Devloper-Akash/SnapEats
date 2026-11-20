import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Camera,
  ChefHat,
  CircleDollarSign,
  Drumstick,
  Leaf,
  LoaderCircle,
  Plus,
  Sparkles,
} from "lucide-react";
import { serverUrl } from "@/App";
import { setMyShopData } from "@/redux/ownerSlice";
import dishPlaceholder from "../assets/image1.jpg";

const CATEGORIES = [
  "Snacks",
  "Main Course",
  "Deserts",
  "Pizza",
  "Burgers",
  "Sandwich",
  "South Indian",
  "North Indian",
  "Chinese",
  "Fast Food",
  "Bevarages",
  "Others",
];

const EditItem = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const imageInputRef = useRef(null);
  const { itemId } = useParams();
  const { myShopData } = useSelector((state) => state.owner);
  const [currentItem, setCurrentItem] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [foodType, setFoodType] = useState("Veg");
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!frontendImage?.startsWith("blob:")) return undefined;
    return () => URL.revokeObjectURL(frontendImage);
  }, [frontendImage]);

  useEffect(() => {
    let isActive = true;
    const handleGetItemById = async () => {
      setLoadingItem(true);
      setError("");
      try {
        const result = await axios.get(`${serverUrl}/api/item/get-by-id/${itemId}`, {
          withCredentials: true,
        });
        if (isActive) setCurrentItem(result.data);
      } catch (requestError) {
        if (isActive) setError(requestError.response?.data?.message || "We couldn’t load this dish. Please return to your dashboard and try again.");
      } finally {
        if (isActive) setLoadingItem(false);
      }
    };
    handleGetItemById();
    return () => { isActive = false; };
  }, [itemId]);

  useEffect(() => {
    if (!currentItem) return;
    setName(currentItem.name || "");
    setPrice(currentItem.price ?? "");
    setCategory(currentItem.category || "");
    setFoodType(currentItem.foodType || "Veg");
    setFrontendImage(currentItem.image || null);
  }, [currentItem]);

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBackendImage(file);
    setFrontendImage(URL.createObjectURL(file));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("category", category);
      formData.append("price", price);
      formData.append("foodType", foodType);
      if (backendImage) formData.append("image", backendImage);

      const result = await axios.post(`${serverUrl}/api/item/edit-item/${itemId}`, formData, {
        withCredentials: true,
      });
      dispatch(setMyShopData(result.data));
      navigate("/");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn’t save your changes. Please check the details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fff1e8] p-3 text-[#26221f] sm:p-5 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white shadow-[0_24px_80px_-44px_rgba(94,48,27,0.36)] sm:min-h-[calc(100vh-2.5rem)] sm:grid-cols-[0.82fr_1fr] sm:rounded-[2rem] lg:min-h-[calc(100vh-4rem)]">
        <aside className="relative min-h-[250px] overflow-hidden bg-[#9a4b2e] sm:min-h-[740px]">
          <img src={frontendImage || dishPlaceholder} alt={name ? `${name} dish` : "Food from your menu"} className="absolute inset-0 size-full object-cover transition duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#21150f]/90 via-[#21150f]/20 to-[#21150f]/15" />
          <div className="relative flex h-full min-h-[250px] flex-col justify-between p-5 text-white sm:min-h-[740px] sm:p-7 lg:p-9">
            <Link to="/" className="inline-flex w-fit items-center gap-2.5 rounded-full bg-white/15 px-3 py-2 backdrop-blur-md sm:hidden">
              <span className="logo-smoke-mark flex size-8 items-center justify-center rounded-xl text-white"><Bike size={18} strokeWidth={2.5} /></span>
              <span className="text-lg font-extrabold tracking-tight">SnapEats</span>
            </Link>

            <div className="max-w-sm">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm sm:mb-4 sm:text-xs"><Sparkles size={13} /> Made fresh nearby</span>
              <h2 className="text-3xl font-black leading-[1.02] tracking-tight sm:text-4xl lg:text-5xl">Keep your menu looking its best.</h2>
              <p className="mt-3 max-w-xs text-sm leading-6 text-white/80 sm:mt-4 sm:text-base">Refresh the details, update the photo, and keep this kitchen favorite ready for your neighbors.</p>
              <div className="mt-5 inline-flex max-w-full items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white/90 backdrop-blur-sm"><ChefHat size={17} className="shrink-0 text-[#ffc2a8]" /><span className="truncate">{myShopData?.name || currentItem?.shop?.name || "Your restaurant kitchen"}</span></div>
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center bg-gradient-to-br from-[#fffdfb] via-[#fff8f3] to-[#ffefe5] px-5 py-7 sm:px-7 sm:py-9 lg:px-10 lg:py-10">
          <div className="w-full max-w-md">
            <div className="mb-6 flex w-full items-center justify-between gap-3 sm:mb-7">
              <Link to="/" aria-label="SnapEats home" className="hidden shrink-0 items-center gap-2.5 sm:inline-flex">
                <span className="logo-smoke-mark flex size-9 items-center justify-center rounded-xl text-white"><Bike size={19} strokeWidth={2.5} /></span>
                <span className="logo-smoke text-xl font-extrabold tracking-tight">SnapEats</span>
              </Link>
              <button type="button" onClick={() => navigate("/")} className="ml-auto inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-[#eadfd8] bg-white/75 px-3.5 text-xs font-semibold whitespace-nowrap text-[#746b64] transition hover:border-[#f2c6b3] hover:bg-white hover:text-[#e64b2e] sm:h-10 sm:px-4 sm:text-sm">
                <ArrowLeft size={15} /> Back to dashboard
              </button>
            </div>

            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a35a38]">Your menu, polished</p>
              <h1 className="mt-1.5 text-3xl font-black tracking-tight text-[#26221f] sm:text-4xl">Edit food item<span className="text-[#ff4d2d]">.</span></h1>
              <p className="mt-2 text-sm leading-6 text-[#746b64]">Update the details of <span className="font-semibold text-[#51463e]">{name || "your dish"}</span>.</p>
            </div>

            {loadingItem ? (
              <div className="flex flex-col items-center rounded-2xl border border-[#eadfd8] bg-white/70 px-5 py-12 text-center">
                <LoaderCircle size={27} className="animate-spin text-[#ff4d2d]" />
                <p className="mt-3 text-sm font-semibold text-[#695e56]">Loading dish details…</p>
              </div>
            ) : error && !currentItem ? (
              <div className="rounded-2xl border border-[#f0d3cc] bg-[#fff2ef] px-4 py-4">
                <p role="alert" className="text-sm leading-6 text-[#a74335]">{error}</p>
                <button type="button" onClick={() => navigate("/")} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#bd4c36]"><ArrowLeft size={15} /> Back to dashboard</button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-[#433c37]">Dish name</span>
                  <input type="text" maxLength={100} placeholder="e.g. Crispy masala samosas" className="h-11 w-full rounded-xl border border-[#eadfd8] bg-white/80 px-3.5 text-sm outline-none transition placeholder:text-[#a39a93] focus:border-[#ff4d2d] focus:ring-4 focus:ring-[#ff4d2d]/10" value={name} onChange={(event) => { setName(event.target.value); setError(""); }} required />
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-[#433c37]">Price</span>
                    <span className="flex h-11 items-center gap-2 rounded-xl border border-[#eadfd8] bg-white/80 px-3.5 transition focus-within:border-[#ff4d2d] focus-within:ring-4 focus-within:ring-[#ff4d2d]/10">
                      <CircleDollarSign size={16} className="text-[#e64b2e]" /><span className="text-sm font-semibold text-[#8c8077]">₹</span>
                      <input type="number" min="0" step="0.01" placeholder="0.00" className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#a39a93]" value={price} onChange={(event) => { setPrice(event.target.value); setError(""); }} required />
                    </span>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-[#433c37]">Category</span>
                    <select className="h-11 w-full rounded-xl border border-[#eadfd8] bg-white/80 px-3.5 text-sm text-[#433c37] outline-none transition focus:border-[#ff4d2d] focus:ring-4 focus:ring-[#ff4d2d]/10" value={category} onChange={(event) => { setCategory(event.target.value); setError(""); }} required>
                      <option value="">Choose category</option>
                      {CATEGORIES.map((itemCategory) => <option key={itemCategory} value={itemCategory}>{itemCategory}</option>)}
                    </select>
                  </label>
                </div>

                <fieldset>
                  <legend className="mb-1.5 block text-sm font-semibold text-[#433c37]">Dish type</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ value: "Veg", icon: <Leaf size={16} />, active: "border-[#a9d0aa] bg-[#f2f9f1] text-[#367144]" }, { value: "Non Veg", icon: <Drumstick size={16} />, active: "border-[#e9b8af] bg-[#fff4f1] text-[#b34a3f]" }].map((option) => (
                      <button key={option.value} type="button" aria-pressed={foodType === option.value} onClick={() => setFoodType(option.value)} className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition ${foodType === option.value ? option.active : "border-[#eadfd8] bg-white/70 text-[#8b8179] hover:bg-white"}`}>
                        {option.icon}{option.value}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label htmlFor="edit-dish-image" className="text-sm font-semibold text-[#433c37]">Dish photo</label>
                    {backendImage && <span className="text-[11px] font-semibold text-[#4c8755]">New photo selected</span>}
                  </div>
                  <input ref={imageInputRef} id="edit-dish-image" type="file" accept="image/*" onChange={handleImage} className="sr-only" />
                  <button type="button" onClick={() => imageInputRef.current?.click()} className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-[#e9cbbd] bg-white/65 p-3 text-left transition hover:border-[#f08c6d] hover:bg-white">
                    {frontendImage ? <img src={frontendImage} alt="Dish photo preview" className="size-16 shrink-0 rounded-xl object-cover" /> : <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-[#fff0e7] text-[#e64b2e]"><Camera size={21} /></span>}
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-[#51463e]">{backendImage ? "Change selected photo" : "Change dish photo"}</span><span className="mt-1 block text-xs leading-5 text-[#958980]">The current dish photo is shown on the left.</span></span>
                    <Plus size={17} className="shrink-0 text-[#d76a49] transition group-hover:rotate-90" />
                  </button>
                </div>

                {error && <p role="alert" className="rounded-xl border border-[#f0d3cc] bg-[#fff2ef] px-3.5 py-2.5 text-xs font-medium leading-5 text-[#a74335]">{error}</p>}

                <button type="submit" disabled={loading} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff4d2d] px-6 text-sm font-extrabold text-white shadow-[0_8px_20px_-14px_rgba(230,75,46,0.9)] transition hover:-translate-y-0.5 hover:bg-[#e94325] disabled:cursor-not-allowed disabled:opacity-70">
                  {loading ? <><LoaderCircle size={17} className="animate-spin" /> Saving changes…</> : <>Save dish changes <ArrowRight size={17} /> </>}
                </button>
              </form>
            )}

            <p className="mt-4 text-center text-xs text-[#9a8e85]">Your menu stays fresh when dish details are up to date.</p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default EditItem;

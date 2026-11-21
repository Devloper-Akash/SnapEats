import { ArrowDown, ArrowRight, Bike, Clock3, MapPin, Star, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { categories } from "../category.js";
import heroFood from "../assets/image1.jpg";
import burgerFood from "../assets/image5.jpg";
import pizzaFood from "../assets/image4.avif";
import momoFood from "../assets/momo.svg";

const featuredCategories = categories.filter(({ category }) =>
  ["Snacks", "Main Course", "Pizzas", "Burgers", "Chinese", "South Indian"].includes(category),
);

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen overflow-hidden bg-[#fff9f6] text-[#26221f]">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <a href="/" aria-label="SnapEats home" className="flex items-center gap-2.5">
          <span className="logo-smoke-mark flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-lg shadow-orange-200">
            <Bike size={22} strokeWidth={2.5} />
          </span>
          <span className="logo-smoke text-[1.55rem] font-extrabold tracking-tight">
            SnapEats
          </span>
        </a>

        <nav aria-label="Main navigation" className="hidden items-center gap-9 text-sm font-semibold text-[#625b55] md:flex">
          <a className="transition hover:text-[#ff4d2d]" href="#discover">Discover</a>
          <a className="transition hover:text-[#ff4d2d]" href="#how-it-works">How it works</a>
          <a className="transition hover:text-[#ff4d2d]" href="#footer">Contact</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button className="rounded-full px-3 py-2 text-sm font-bold text-[#433c37] transition hover:bg-orange-50 sm:px-4" onClick={() => navigate("/signin")}>Log in</button>
          <Button variant="destructive" onClick={() => navigate("/signup")}>
            Sign up
          </Button>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-14 pt-7 sm:px-8 md:pb-20 lg:grid-cols-[0.93fr_1.07fr] lg:gap-5 lg:px-12 lg:pb-24 lg:pt-12">
        <div className="relative z-[1] max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/80 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#a35a38] shadow-sm sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-[#ff4d2d]" />
            Your neighborhood, on a plate
          </div>
          <h1 className="max-w-[650px] text-[3.25rem] font-black leading-[0.99] tracking-[-0.065em] text-[#26221f] sm:text-6xl lg:text-[4.65rem]">
            Big cravings.
            <br />
            <span className="relative inline-block text-[#ff4d2d]">
              Happy plates.
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 340 14" fill="none" aria-hidden="true">
                <path d="M4 9.5C95 2.5 236 2 336 8" stroke="#FFC28E" strokeWidth="7" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-[#746b64] sm:text-lg sm:leading-8">
            Your favorite local meals, made fresh and brought right to your door. Find something delicious for whatever kind of day it is.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              variant="destructive"
              size="xl"
              className="group gap-3"
              rightIcon={<ArrowRight size={18} className="transition group-hover:translate-x-1" />}
              onClick={() => navigate("/signup")}
            >
              Find your next favorite
            </Button>
            <a href="#discover" className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-4 text-sm font-bold text-[#625b55] transition hover:bg-white">
              See what’s cooking <ArrowDown size={16} />
            </a>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[#746b64]">
            <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-[#ff4d2d]"><Clock3 size={16} /></span><span><strong className="text-[#26221f]">Fast delivery</strong><br />right to your door</span></div>
            <span className="hidden h-9 w-px bg-orange-100 sm:block" />
            <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-[#ff4d2d]"><Star size={16} fill="currentColor" /></span><span><strong className="text-[#26221f]">Local favorites</strong><br />made fresh nearby</span></div>
            <span className="hidden h-9 w-px bg-orange-100 sm:block" />
            <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-[#ff4d2d]"><Bike size={16} /></span><span><strong className="text-[#26221f]">Order with ease</strong><br />follow it to your door</span></div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[650px] lg:ml-auto">
          <div className="absolute -right-6 top-10 h-56 w-56 rounded-full bg-[#ffd8bd] blur-3xl sm:h-72 sm:w-72" />
          <div className="absolute -bottom-8 left-2 h-40 w-40 rounded-full bg-[#ffe9bf] blur-3xl" />
          <div className="food-float absolute -right-1 top-1 z-[2] w-[92px] sm:-right-2 sm:top-3 sm:w-[124px]" style={{ animationDelay: "-1.2s" }}>
            <div className="rotate-[8deg] rounded-[22px] border-[5px] border-white bg-white p-1 shadow-xl shadow-[#784b2c]/15 sm:rounded-[28px] sm:border-[6px]">
              <img src={burgerFood} alt="Juicy burger" className="aspect-square w-full rounded-[16px] object-cover sm:rounded-[21px]" />
            </div>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[10px] font-extrabold text-[#51453d] shadow-md sm:text-xs">Burger</span>
          </div>
          <div className="food-float absolute -left-5 bottom-3 z-[2] w-[88px] sm:-left-16 sm:bottom-7 sm:w-[118px] lg:-left-10" style={{ animationDelay: "-3.1s" }}>
            <div className="-rotate-[9deg] rounded-[22px] border-[5px] border-white bg-white p-1 shadow-xl shadow-[#784b2c]/15 sm:rounded-[28px] sm:border-[6px]">
              <img src={pizzaFood} alt="Freshly baked pizza" className="aspect-square w-full rounded-[16px] object-cover sm:rounded-[21px]" />
            </div>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[10px] font-extrabold text-[#51453d] shadow-md sm:text-xs">Pizza</span>
          </div>
          <div className="food-float absolute -right-1 bottom-[27%] z-[2] w-[82px] sm:-right-3 sm:bottom-[31%] sm:w-[108px]" style={{ animationDelay: "-2.2s" }}>
            <div className="rotate-[6deg] rounded-[20px] border-[5px] border-white bg-white p-1 shadow-xl shadow-[#784b2c]/15 sm:rounded-[26px] sm:border-[6px]">
              <img src={momoFood} alt="Steamed momos with chili chutney" className="aspect-square w-full rounded-[14px] object-cover sm:rounded-[19px]" />
            </div>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[10px] font-extrabold text-[#51453d] shadow-md sm:text-xs">Momos</span>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border-[10px] border-white bg-[#f3d4b4] shadow-[0_28px_70px_-28px_rgba(119,64,31,0.35)] sm:rounded-[2.5rem] sm:border-[14px]">
            <img src={heroFood} alt="Freshly prepared samosas served with chutney" className="h-[340px] w-full object-cover sm:h-[460px] lg:h-[510px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#231710]/45 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 sm:bottom-7 sm:left-7 sm:right-7">
              <div className="ml-6 text-white drop-shadow-sm sm:ml-8">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/80">Made for your moment</p>
                <p className="mt-1 text-2xl font-extrabold sm:text-3xl">A little joy, delivered.</p>
              </div>
              <div className="hidden shrink-0 rounded-2xl bg-white/95 px-4 py-3 shadow-lg sm:block">
                <div className="flex items-center gap-1 text-sm font-extrabold"><Star size={15} fill="#ffb126" stroke="#ffb126" /> 4.8</div>
                <p className="mt-1 text-xs text-[#746b64]">Loved by locals</p>
              </div>
            </div>
          </div>

        </div>

        <div className="relative z-[1] mt-2 min-w-0 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#302923]"><span className="flex size-8 items-center justify-center rounded-xl bg-white text-[#ff4d2d] shadow-sm"><Utensils size={16} /></span>Start with a craving</div>
            <span className="text-[11px] font-semibold text-[#9a8b81] sm:text-xs">A taste of what’s on the menu</span>
          </div>
          <div className="flex snap-x gap-3 overflow-x-auto pb-2">
            {featuredCategories.map((item) => <article key={item.category} className="group flex min-w-[145px] snap-start items-center gap-3 rounded-2xl border border-[#f1e2d9] bg-white/90 p-2.5 shadow-[0_10px_25px_-22px_rgba(75,39,23,0.45)] transition hover:-translate-y-0.5 hover:shadow-md sm:min-w-[170px] sm:p-3">
              <img src={item.image} alt="" className="size-12 shrink-0 rounded-xl object-cover sm:size-14" />
              <div className="min-w-0"><p className="truncate text-xs font-extrabold text-[#3d332d] sm:text-sm">{item.category}</p><p className="mt-0.5 text-[10px] text-[#94877d]">Made fresh nearby</p></div>
            </article>)}
          </div>
        </div>
      </section>

      <section id="discover" className="border-y border-orange-100/80 bg-white/70">
        <div className="mx-auto grid max-w-7xl gap-7 px-5 py-9 sm:grid-cols-3 sm:gap-6 sm:px-8 lg:px-12">
          <div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff0e7] text-[#ff4d2d]"><MapPin size={21} /></span><div><h2 className="font-extrabold">Made around you</h2><p className="mt-1 text-sm leading-6 text-[#746b64]">Discover the neighborhood kitchens you’ll want to come back to.</p></div></div>
          <div id="how-it-works" className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff0e7] text-[#ff4d2d]"><Clock3 size={21} /></span><div><h2 className="font-extrabold">Simple from the first tap</h2><p className="mt-1 text-sm leading-6 text-[#746b64]">Pick a craving, place your order, and we’ll take it from there.</p></div></div>
          <div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff0e7] text-[#ff4d2d]"><Star size={21} /></span><div><h2 className="font-extrabold">Good food, good mood</h2><p className="mt-1 text-sm leading-6 text-[#746b64]">Freshly prepared favorites for lunch, dinner, and every snack break.</p></div></div>
        </div>
      </section>

      <footer id="footer" className="bg-[#26221f] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-9 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <div>
            <a href="/" className="logo-smoke text-2xl font-extrabold tracking-tight">SnapEats</a>
            <p className="mt-2 max-w-sm text-sm leading-6 text-white/60">A little closer to your next favorite meal.</p>
          </div>
          <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-white/75">
            <a className="transition hover:text-white" href="#discover">Discover</a>
            <a className="transition hover:text-white" href="#how-it-works">How it works</a>
            <button className="transition hover:text-white" onClick={() => navigate("/signin")}>Log in</button>
            <button className="transition hover:text-white" onClick={() => navigate("/signup")}>Create account</button>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-4 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
            <span>© {new Date().getFullYear()} SnapEats. Made for good food days.</span>
            <span>Fresh meals. Friendly delivery. Right around the corner.</span>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Welcome;

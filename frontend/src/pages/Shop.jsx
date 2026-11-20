import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Leaf,
  MapPin,
  Search,
  Sparkles,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import useGetShopDetails from '../hooks/useGetShopDetails';
import FoodCard from '../components/FoodCard';
import Nav from '../components/Nav';

const Shop = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { shop, items, loading, error } = useGetShopDetails(shopId);
  const [activeCategory, setActiveCategory] = useState('All');
  const [foodTypeFilter, setFoodTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(
    () => ['All', ...new Set(items.map((item) => item.category).filter(Boolean))],
    [items]
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesType = foodTypeFilter === 'All' || item.foodType === foodTypeFilter;
      const matchesSearch = !query || item.name?.toLowerCase().includes(query) || item.category?.toLowerCase().includes(query);
      return matchesCategory && matchesType && matchesSearch;
    });
  }, [items, activeCategory, foodTypeFilter, searchQuery]);

  const vegCount = items.filter((item) => item.foodType === 'Veg').length;
  const nonVegCount = items.filter((item) => item.foodType !== 'Veg').length;

  const resetFilters = () => {
    setActiveCategory('All');
    setFoodTypeFilter('All');
    setSearchQuery('');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fff9f6] pt-[100px] text-[#302923]">
        <Nav />
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-28 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[#fff0e7] text-[#f05235]"><Store size={26} /></div>
          <div className="size-9 animate-spin rounded-full border-[3px] border-[#ff4d2d]/20 border-t-[#ff4d2d]" />
          <p className="font-semibold text-[#665b53]">Setting the table…</p>
          <p className="text-sm text-[#998d84]">We’re bringing this restaurant’s menu to you.</p>
        </div>
      </main>
    );
  }

  if (error || !shop) {
    return (
      <main className="min-h-screen bg-[#fff9f6] pt-[100px] text-[#302923]">
        <Nav />
        <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-[#fff0e7] text-[#f05235]"><Store size={28} /></span>
          <p className="mt-5 text-2xl font-extrabold">We couldn’t find that restaurant</p>
          <p className="mt-2 text-sm leading-6 text-[#81766e]">{error || 'This restaurant may no longer be available.'}</p>
          <button onClick={() => navigate('/')} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#ff4d2d] px-5 text-sm font-bold text-white transition hover:bg-[#e94325]">
            <ArrowLeft size={16} /> Back to restaurants
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff9f6] pt-[100px] text-[#302923]">
      <Nav />
      <div className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="group mb-5 inline-flex items-center gap-2 rounded-full border border-[#f0e1d8] bg-white/80 px-3.5 py-2 text-sm font-semibold text-[#74685f] transition hover:border-[#f3c9b7] hover:text-[#e64b2e]"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Back to restaurants
        </button>

        <section className="relative isolate overflow-hidden rounded-[30px] border border-[#efdcd0] bg-[#3a2119] shadow-[0_22px_60px_-42px_rgba(75,39,23,0.65)]">
          {shop.image && <img src={shop.image} alt={shop.name} className="absolute inset-0 -z-20 size-full object-cover" />}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#23150f]/90 via-[#23150f]/65 to-[#23150f]/20" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#23150f]/50 via-transparent to-transparent" />

          <div className="grid min-h-[290px] items-end gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center lg:p-11">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
                <Sparkles size={13} /> Local favorite
              </span>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white drop-shadow-sm sm:text-4xl lg:text-5xl">{shop.name}</h1>
              <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-white/85 sm:text-base">
                <MapPin size={17} className="mt-1 shrink-0 text-[#ffb08e]" />
                <span>{[shop.address, shop.city, shop.state].filter(Boolean).join(', ')}</span>
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm">
                  <UtensilsCrossed size={14} className="text-[#ffb08e]" /> {items.length} {items.length === 1 ? 'dish' : 'dishes'} on the menu
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm">
                  <Clock3 size={14} className="text-[#ffb08e]" /> Made fresh nearby
                </span>
              </div>
            </div>
            <div className="hidden rounded-[24px] border border-white/20 bg-white/15 p-5 text-white backdrop-blur-md lg:block">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-[#ed4c2e]"><Store size={22} /></div>
              <p className="mt-4 text-sm font-bold">A good meal, close by</p>
              <p className="mt-1 max-w-[190px] text-xs leading-5 text-white/75">Explore the menu and add your favorites to the bag.</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-[#f0e1d8] bg-white p-4 shadow-[0_16px_45px_-38px_rgba(75,39,23,0.55)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d45b3d]">From this kitchen</span>
              <h2 className="mt-1.5 text-2xl font-black tracking-tight text-[#302923] sm:text-3xl">Explore the menu<span className="text-[#ff4d2d]">.</span></h2>
              <p className="mt-1 text-sm text-[#81766e]">Choose something delicious, made fresh nearby.</p>
            </div>
            <label className="flex h-12 w-full items-center gap-3 rounded-2xl border border-[#eddfd6] bg-[#fffaf7] px-4 transition focus-within:border-[#f39a7e] focus-within:ring-4 focus-within:ring-[#ff4d2d]/10 lg:max-w-[340px]">
              <Search size={18} className="shrink-0 text-[#e64b2e]" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search dishes in this menu"
                className="w-full bg-transparent text-sm text-[#302923] outline-none placeholder:text-[#a99c93]"
              />
              {searchQuery && <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear dish search" className="text-xs font-bold text-[#b45a38] hover:text-[#e64b2e]">Clear</button>}
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-4 border-t border-[#f3e9e3] pt-5">
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((category) => {
                const selected = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    aria-pressed={selected}
                    className={`rounded-full border px-4 py-2 text-xs font-bold transition ${selected ? 'border-[#ff4d2d] bg-[#ff4d2d] text-white shadow-sm' : 'border-[#eee1d9] bg-white text-[#665b53] hover:border-[#f4b19b] hover:text-[#e64b2e]'}`}
                  >
                    {category === 'All' ? `All dishes · ${items.length}` : category}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-semibold text-[#958a82]">Dietary:</span>
              {[
                { label: 'All', count: items.length, icon: null },
                { label: 'Veg', count: vegCount, icon: <Leaf size={13} /> },
                { label: 'Non Veg', count: nonVegCount, icon: <span className="size-2.5 rounded-full bg-[#bf5041]" /> },
              ].map(({ label, count, icon }) => {
                const selected = foodTypeFilter === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setFoodTypeFilter(label)}
                    aria-pressed={selected}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${selected ? 'border-[#efd2c3] bg-[#fff1e8] text-[#c54e30]' : 'border-transparent bg-[#faf6f3] text-[#766b63] hover:border-[#eadbd2]'}`}
                  >
                    {icon}{label}<span className="text-[10px] opacity-70">{count}</span>{selected && <Check size={12} />}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-7" aria-live="polite">
          <div className="mb-4 flex items-center justify-between gap-4 px-1">
            <p className="text-sm font-semibold text-[#776b63]">Showing <span className="text-[#302923]">{filteredItems.length}</span> {filteredItems.length === 1 ? 'dish' : 'dishes'}</p>
            <span className="hidden items-center gap-1.5 text-xs font-medium text-[#9a8e85] sm:inline-flex"><Leaf size={13} className="text-[#51875c]" /> Veg and non-veg options</span>
          </div>
          {filteredItems.length > 0 ? (
            <div className="grid w-full grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => <FoodCard key={item._id} data={item} shopName={shop.name} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-[28px] border border-dashed border-[#e9d7cc] bg-white/70 px-5 py-14 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-[#fff0e7] text-[#e64b2e]"><Search size={23} /></span>
              <h3 className="mt-4 text-lg font-extrabold text-[#302923]">No dishes match those filters</h3>
              <p className="mt-1 max-w-sm text-sm leading-6 text-[#81766e]">Try another category or clear the filters to see the full menu.</p>
              <button onClick={resetFilters} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#ff4d2d] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#e94325]">
                Show all dishes <ArrowRight size={16} />
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Shop;

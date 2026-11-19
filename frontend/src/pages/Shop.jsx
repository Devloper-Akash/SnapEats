import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, Store, UtensilsCrossed, Clock } from 'lucide-react';
import useGetShopDetails from '../hooks/useGetShopDetails';
import FoodCard from '../components/FoodCard';
import Nav from '../components/Nav';

const CATEGORIES = [
  'All',
  'Snacks',
  'Main Course',
  'Deserts',
  'Pizza',
  'Burgers',
  'Sandwich',
  'South Indian',
  'North Indian',
  'Chinese',
  'Fast Food',
  'Bevarages',
  'Others',
];

const Shop = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { shop, items, loading, error } = useGetShopDetails(shopId);
  const [activeCategory, setActiveCategory] = useState('All');
  const [foodTypeFilter, setFoodTypeFilter] = useState('All');

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (activeCategory !== 'All') {
      filtered = filtered.filter((item) => item.category === activeCategory);
    }

    if (foodTypeFilter !== 'All') {
      filtered = filtered.filter((item) => item.foodType === foodTypeFilter);
    }

    return filtered;
  }, [items, activeCategory, foodTypeFilter]);

  // Get unique categories from this shop's items for highlighting available ones
  const availableCategories = useMemo(() => {
    const cats = new Set(items.map((item) => item.category));
    return cats;
  }, [items]);

  if (loading) {
    return (
      <div className="w-[100vw] min-h-[100vh] flex flex-col items-center bg-[#fff9f6] pt-[100px]">
        <Nav />
        <div className="flex flex-col items-center justify-center gap-4 mt-20">
          <div className="w-12 h-12 border-4 border-[#ff4d2d]/20 border-t-[#ff4d2d] rounded-full animate-spin" />
          <p className="text-gray-500 text-lg">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="w-[100vw] min-h-[100vh] flex flex-col items-center bg-[#fff9f6] pt-[100px]">
        <Nav />
        <div className="flex flex-col items-center justify-center gap-4 mt-20">
          <Store size={48} className="text-gray-300" />
          <p className="text-gray-500 text-lg">{error || 'Restaurant not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-[#ff4d2d] text-white rounded-full font-medium hover:bg-[#e0421f] transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[100vw] min-h-[100vh] flex flex-col items-center bg-[#fff9f6] pt-[100px]">
      <Nav />

      <div className="w-full max-w-6xl px-4 sm:px-6 pb-10">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-[#ff4d2d] transition-colors mb-5 group cursor-pointer"
        >
          <ArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="font-medium">Back to Home</span>
        </button>

        {/* ── Shop Banner ── */}
        <div className="w-full rounded-3xl overflow-hidden bg-white shadow-lg border border-orange-100 mb-8">
          <div className="relative h-48 sm:h-64 md:h-72 overflow-hidden">
            <img
              src={shop.image}
              alt={shop.name}
              className="w-full h-full object-cover"
            />
            {/* gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* shop info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                {shop.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-white/90 text-sm sm:text-base">
                  <MapPin size={16} className="shrink-0" />
                  <span>{shop.address}, {shop.city}</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/90 text-sm sm:text-base">
                  <UtensilsCrossed size={16} className="shrink-0" />
                  <span>{items.length} {items.length === 1 ? 'item' : 'items'} available</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Filters Section ── */}
        <div className="mb-6 flex flex-col gap-4">
          {/* Veg / Non-Veg toggle */}
          <div className="flex items-center gap-3">
            {['All', 'Veg', 'Non Veg'].map((type) => (
              <button
                key={type}
                onClick={() => setFoodTypeFilter(type)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer border
                  ${
                    foodTypeFilter === type
                      ? type === 'Veg'
                        ? 'bg-green-600 text-white border-green-600 shadow-md'
                        : type === 'Non Veg'
                          ? 'bg-red-600 text-white border-red-600 shadow-md'
                          : 'bg-[#ff4d2d] text-white border-[#ff4d2d] shadow-md'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((category) => {
              const isAvailable =
                category === 'All' || availableCategories.has(category);
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  disabled={!isAvailable}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer border
                    ${
                      activeCategory === category
                        ? 'bg-[#ff4d2d] text-white border-[#ff4d2d] shadow-md scale-105'
                        : isAvailable
                          ? 'bg-white text-gray-700 border-gray-200 hover:border-[#ff4d2d] hover:text-[#ff4d2d]'
                          : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                    }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Items Grid ── */}
        {filteredItems.length > 0 ? (
          <div className="w-full flex flex-wrap gap-5 justify-center sm:justify-start">
            {filteredItems.map((item) => (
              <FoodCard key={item._id} data={item} />
            ))}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center justify-center py-16 gap-4">
            <UtensilsCrossed size={48} className="text-gray-200" />
            <p className="text-gray-400 text-lg font-medium">
              No items found
              {activeCategory !== 'All' ? ` in "${activeCategory}"` : ''}
              {foodTypeFilter !== 'All' ? ` (${foodTypeFilter})` : ''}
            </p>
            <button
              onClick={() => {
                setActiveCategory('All');
                setFoodTypeFilter('All');
              }}
              className="px-5 py-2 text-sm font-medium text-[#ff4d2d] border border-[#ff4d2d] rounded-full hover:bg-[#ff4d2d] hover:text-white transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
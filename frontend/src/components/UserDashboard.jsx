import React, { useEffect } from 'react'
import {categories} from '../category.js';
import CategoryCard from './CategoryCard';
import ShopCard from './ShopCard';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSelector } from 'react-redux';
import FoodCard from './FoodCard.jsx';
import { useState } from 'react';



const UserDashboard = () => {
  const {currentCity,shopsInMyCity,itemsInMyCity,searchItems} = useSelector(state=>state.user)
  const cateScrollRef = React.useRef();
  const shopScrollRef = React.useRef();
  const [showCateLeftButton,setShowCateLeftButton] = React.useState(false);
  const [showCateRightButton,setShowCateRightButton] = React.useState(false);
  const [showShopLeftButton,setShowShopLeftButton] = React.useState(false);
  const [showShopRightButton,setShowShopRightButton] = React.useState(false);
  const [updatedItemsList,setUpdatedItemsList] = useState(itemsInMyCity);
  const [activeCategory, setActiveCategory] = useState(null);

  const handleFilterByCategory = (category)=>{
    setActiveCategory(category);
    if(category === "All"){
      setUpdatedItemsList(itemsInMyCity);
    }else{
      const filteredList = itemsInMyCity.filter(i=>i.category === category);
      setUpdatedItemsList(filteredList);
    }
  }


  useEffect(()=>{
    setUpdatedItemsList(itemsInMyCity);
  },[itemsInMyCity]);

  const updateButton=(ref,setLeftButton,setRightButton)=>{
    const element = ref.current;
    if(element){
      setLeftButton(element.scrollLeft > 0);
      setRightButton(element.scrollWidth > element.clientWidth + element.scrollLeft);
    }
  }

  const scrollHandler = (ref,direction)=>{
    if(ref.current){
      ref.current.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth'
      })
    }
  }


  useEffect(() => {
    const cateEl = cateScrollRef.current;
    const shopEl = shopScrollRef.current;

    const handleCateScroll = () => {
      updateButton(cateScrollRef, setShowCateLeftButton, setShowCateRightButton);
    };
    const handleShopScroll = () => {
      updateButton(shopScrollRef, setShowShopLeftButton, setShowShopRightButton);
    };

    if (cateEl) {
      updateButton(cateScrollRef, setShowCateLeftButton, setShowCateRightButton);
      cateEl.addEventListener('scroll', handleCateScroll);
    }
    if (shopEl) {
      updateButton(shopScrollRef, setShowShopLeftButton, setShowShopRightButton);
      shopEl.addEventListener('scroll', handleShopScroll);
    }

    return () => {
      cateEl?.removeEventListener('scroll', handleCateScroll);
      shopEl?.removeEventListener('scroll', handleShopScroll);
    };
  }, [categories, shopsInMyCity]);

  return (
    <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]'>
      {searchItems && searchItems.length > 0 && (
        <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-[10px] bg-[#fff9f6] rounded-lg shadow-md mt-4'>
          <h1 className='text-gray-800 text-2xl sm:text-3xl font-semibold border-b-[1px] border-gray-300 pb-2 w-full'>
            Search Result
          </h1>
          <div className='w-full h-auto flex flex-wrap gap-[20px] justify-center sm:justify-start'>
            {searchItems.map((item)=>(
              <FoodCard data={item} key={item._id}/>
            ))}
          </div>
        </div>
      )}
      <section className="relative w-full overflow-hidden rounded-[28px] border border-[#f2dfd3] bg-gradient-to-br from-white via-[#fffaf6] to-[#fff0e7] p-5 shadow-[0_16px_42px_-34px_rgba(110,56,31,0.42)] sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-[#ffb383]/15 blur-3xl" />
        <div className="relative mb-5 flex items-end justify-between gap-4 sm:mb-7">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#c66a42]">
              <span className="size-2 rounded-full bg-[#ff4d2d]" /> Pick your mood
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#28231f] sm:text-3xl">What are you craving today?</h1>
            <p className="mt-1.5 text-sm text-[#81766e] sm:text-base">Fresh picks from the kitchens around {currentCity || "you"}.</p>
          </div>
          <div className="hidden shrink-0 rounded-full border border-[#f1dfd4] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#8b6a58] sm:block">
            {categories.length} categories
          </div>
        </div>

        <div className="relative">
          {showCateLeftButton && <button
            type="button"
            aria-label="Scroll categories left"
            className="absolute -left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#f0ddd1] bg-white text-[#d84628] shadow-lg transition hover:scale-105 hover:bg-[#ff4d2d] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]/30 sm:-left-4"
            onClick={()=>scrollHandler(cateScrollRef,"left")}
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>}

          <div className="flex w-full gap-3 overflow-x-auto px-1 pb-2 pt-1 sm:gap-4" ref={cateScrollRef} style={{ scrollbarWidth: "none" }}>
            {categories.map((cate,index)=>(
              <CategoryCard
                name={cate.category}
                image={cate.image}
                key={index}
                active={activeCategory === cate.category}
                onClick={()=>handleFilterByCategory(cate.category)}
              />
            ))}
          </div>

          {showCateRightButton && <button
            type="button"
            aria-label="Scroll categories right"
            className="absolute -right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#f0ddd1] bg-white text-[#d84628] shadow-lg transition hover:scale-105 hover:bg-[#ff4d2d] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]/30 sm:-right-4"
            onClick={()=>scrollHandler(cateScrollRef,"right")}
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>}
        </div>
      </section>

      <section className="w-full rounded-[28px] border border-[#f0e2d9] bg-white/75 p-4 shadow-[0_12px_35px_-30px_rgba(75,39,23,0.4)] sm:p-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#c66a42]">Around your neighborhood</div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#302923] sm:text-3xl">Local favorites in {currentCity || "your area"}</h2>
            <p className="mt-1.5 text-sm text-[#81766e] sm:text-base">Discover restaurants and the dishes people come back for.</p>
          </div>
          {shopsInMyCity?.length > 0 && (
            <span className="hidden shrink-0 rounded-full border border-[#f1dfd4] bg-[#fffaf6] px-3 py-1.5 text-xs font-bold text-[#8b6a58] sm:block">
              {shopsInMyCity.length} {shopsInMyCity.length === 1 ? "restaurant" : "restaurants"}
            </span>
          )}
        </div>
        {shopsInMyCity?.length ? (
          <div className="relative">
            {showShopLeftButton && <button
              type="button"
              aria-label="Scroll restaurants left"
              className="absolute -left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#f0ddd1] bg-white text-[#d84628] shadow-lg transition hover:scale-105 hover:bg-[#ff4d2d] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]/30 sm:-left-4"
              onClick={()=>scrollHandler(shopScrollRef,"left")}
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>}
            <div className="flex w-full gap-4 overflow-x-auto px-1 pb-3 pt-1 sm:gap-5" ref={shopScrollRef} style={{ scrollbarWidth: "none" }}>
              {shopsInMyCity.map((shop,index)=><ShopCard shop={shop} key={shop._id || index}/>) }
            </div>
            {showShopRightButton && <button
              type="button"
              aria-label="Scroll restaurants right"
              className="absolute -right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#f0ddd1] bg-white text-[#d84628] shadow-lg transition hover:scale-105 hover:bg-[#ff4d2d] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]/30 sm:-right-4"
              onClick={()=>scrollHandler(shopScrollRef,"right")}
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#fff8f3] px-5 py-8 text-center text-sm font-medium text-[#81766e]">No restaurants are listed in this area yet.</div>
        )}
      </section>

      <section className="w-full rounded-[28px] border border-[#f0e2d9] bg-gradient-to-br from-[#fffaf6] to-[#fff2e9] p-4 sm:p-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#c66a42]">Made fresh nearby</div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#302923] sm:text-3xl">{activeCategory && activeCategory !== "All" ? `${activeCategory} picks` : "Suggested food items"}</h2>
            <p className="mt-1.5 text-sm text-[#81766e] sm:text-base">Good things to eat, chosen from local menus.</p>
          </div>
          {updatedItemsList?.length > 0 && (
            <span className="hidden shrink-0 rounded-full border border-[#f1dfd4] bg-white/80 px-3 py-1.5 text-xs font-bold text-[#8b6a58] sm:block">
              {updatedItemsList.length} {updatedItemsList.length === 1 ? "dish" : "dishes"}
            </span>
          )}
        </div>
        {updatedItemsList?.length ? (
          <div className="grid w-full grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-4">
            {updatedItemsList.map((item,index)=>{
              const itemShopId = typeof item.shop === "object" ? item.shop?._id : item.shop;
              const restaurantName = shopsInMyCity?.find((shop) => String(shop._id) === String(itemShopId))?.name;
              return <FoodCard key={item._id || index} data={item} shopName={restaurantName}/>;
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#e8d5c9] bg-white/65 px-5 py-10 text-center">
            <p className="font-semibold text-[#554b44]">No dishes to show here yet.</p>
            <p className="mt-1 text-sm text-[#81766e]">Try another category or check back soon.</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default UserDashboard

import React, { useEffect } from 'react'
import {categories} from '../category.js';
import CategoryCard from './CategoryCard';
import ShopCard from './ShopCard';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { setCurrentCity } from '../redux/userSlice';
import FoodCard from './FoodCard.jsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from './Nav.jsx';



const UserDashboard = () => {
  const {currentCity,shopsInMyCity,itemsInMyCity,searchItems} = useSelector(state=>state.user)
  const cateScrollRef = React.useRef();
  const shopScrollRef = React.useRef();
  const navigate = useNavigate()

  const [showCateLeftButton,setShowCateLeftButton] = React.useState(false);
  const [showCateRightButton,setShowCateRightButton] = React.useState(false);
  const [showShopLeftButton,setShowShopLeftButton] = React.useState(false);
  const [showShopRightButton,setShowShopRightButton] = React.useState(false);
  const [updatedItemsList,setUpdatedItemsList] = useState(itemsInMyCity);

  const handleFilterByCategory = (category)=>{
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


  useEffect(()=>{
    if(cateScrollRef.current){
      updateButton(cateScrollRef,setShowCateLeftButton,setShowCateRightButton);
      updateButton(shopScrollRef,setShowShopLeftButton,setShowShopRightButton);
      cateScrollRef.current.addEventListener('scroll',()=>{
        updateButton(cateScrollRef,setShowCateLeftButton,setShowCateRightButton);
      });
      shopScrollRef.current.addEventListener('scroll',()=>{
        updateButton(shopScrollRef,setShowShopLeftButton,setShowShopRightButton);
      });
    }

    return()=>{cateScrollRef?.current?.removeEventListener('scroll',()=>{
      updateButton(cateScrollRef,setShowCateLeftButton,setShowCateRightButton);
    });
    shopScrollRef?.current?.removeEventListener('scroll',()=>{
      updateButton(shopScrollRef,setShowShopLeftButton,setShowShopRightButton);
    })};
  },[categories]);

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
      <h1 className='text-gray-800 text-2xl sm:text-3xl'>Inspiration for your first order</h1>
      <div className='w-full relative'>

        {showCateLeftButton &&  <button
          type="button"
          aria-label="Scroll categories left"
          className="absolute left-0 sm:-left-4 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#ff4d2d]/15 bg-white text-[#ff4d2d] shadow-md transition-all duration-200 hover:bg-[#ff4d2d] hover:text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]/30" onClick={()=>scrollHandler(cateScrollRef,"left")}
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>}
       
        <div className='w-full flex gap-4 overflow-x-auto pb-2' ref={cateScrollRef}>
          {categories.map((cate,index)=>{
            return <CategoryCard name={cate.category} image={cate.image} key={index} onClick={()=>handleFilterByCategory(cate.category)}/>
          })}
        </div>
        {showCateRightButton && <button
          type="button"
          aria-label="Scroll categories right"
          className="absolute right-0 sm:-right-4 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#ff4d2d]/15 bg-white text-[#ff4d2d] shadow-md transition-all duration-200 hover:bg-[#ff4d2d] hover:text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]/30" onClick={()=>scrollHandler(cateScrollRef,"right")}
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>}
        
      </div>

      <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]'>
          <h1 className='text-gray-800 text-2xl sm:text-3xl'>Best Shop in {currentCity}</h1>
          <div className='w-full relative'>

        {showShopLeftButton &&  <button
          type="button"
          aria-label="Scroll categories left"
          className="absolute left-0 sm:-left-4 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#ff4d2d]/15 bg-white text-[#ff4d2d] shadow-md transition-all duration-200 hover:bg-[#ff4d2d] hover:text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]/30" onClick={()=>scrollHandler(shopScrollRef,"left")}
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>}
       
        <div className='w-full flex gap-5 overflow-x-auto px-1 pb-3 pt-1' ref={shopScrollRef}>
          {shopsInMyCity?.map((shop,index)=>{
            return <ShopCard shop={shop} key={shop._id || index}/>
          })}
        </div>
        {showShopRightButton && <button
          type="button"
          aria-label="Scroll categories right"
          className="absolute right-0 sm:-right-4 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#ff4d2d]/15 bg-white text-[#ff4d2d] shadow-md transition-all duration-200 hover:bg-[#ff4d2d] hover:text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]/30" onClick={()=>scrollHandler(shopScrollRef,"right")}
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>}
        
      </div>
      </div>

      <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]'>
          <h1 className='text-gray-800 text-2xl sm:text-3xl'>Suggested Food Items</h1>
          <div className='w-full h-auto flex flex-wrap gap-[20px] justify-center sm:justify-start'>
            {updatedItemsList?.map((item,index)=>(
              <FoodCard key={index} data={item}/>
            ))}

            
          </div>
      </div>
    </div>
  )
}

export default UserDashboard

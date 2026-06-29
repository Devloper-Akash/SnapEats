import React from 'react'
import {categories} from '../category.js';
import CategoryCard from './CategoryCard';

const UserDashboard = () => {
  return (
    <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]'>
      <h1 className='text-gray-800 text-2xl sm:text-3xl'>Inspiration for your first order</h1>
      <div className='w-full'>
        <button>
          
        </button>
      <div className='w-full flex gap-4 overflow-x-auto pb-2'>
        {categories.map((cate,index)=>{
          return <CategoryCard data={cate} key={index}/>
        })}
      </div>
      </div>
    </div>
  )
}

export default UserDashboard
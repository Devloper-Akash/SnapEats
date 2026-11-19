import React from 'react'
const CategoryCard = ({name,image,onClick}) => {
  return (
    <div className='flex flex-col items-center gap-2 cursor-pointer' onClick={()=>onClick(name)}>
      <div className='w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-full overflow-hidden border-2 border-[#ff4d2d]/20 hover:border-[#ff4d2d] transition-all duration-300 hover:scale-105'>
        <img src={image} alt={name} className='w-full h-full object-cover'/>
      </div>
      <span className='text-sm sm:text-base text-gray-700 font-medium'>{name}</span>
    </div>
  )
}
export default CategoryCard


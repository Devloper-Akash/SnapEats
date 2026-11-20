import React from 'react'
const CategoryCard = ({name,image,onClick,active = false}) => {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onClick(name)}
      className={`group flex w-[98px] shrink-0 flex-col items-center gap-2 rounded-2xl px-2 py-2 text-center transition duration-300 sm:w-[112px] sm:gap-2.5 ${active ? 'bg-white shadow-md ring-1 ring-[#ff4d2d]/25' : 'hover:-translate-y-1 hover:bg-white/80 hover:shadow-sm'}`}
    >
      <span className={`relative size-[78px] rounded-full p-[3px] transition-all duration-300 sm:size-[94px] ${active ? 'bg-gradient-to-br from-[#ff4d2d] via-[#ff9a55] to-[#ffd2a6] shadow-[0_8px_18px_-10px_rgba(255,77,45,0.7)]' : 'bg-gradient-to-br from-[#ffd3bd] to-[#f4e4d9] group-hover:from-[#ff4d2d] group-hover:to-[#ffb26d]'}`}>
        <img src={image} alt="" className="size-full rounded-full border-2 border-white object-cover" />
      </span>
      <span className={`max-w-full truncate text-xs font-semibold transition-colors sm:text-sm ${active ? 'text-[#d83e22]' : 'text-[#514840] group-hover:text-[#d83e22]'}`}>{name}</span>
    </button>
  )
}
export default CategoryCard


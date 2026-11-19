import React from "react";
import { MapPin, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ShopCard = ({ shop }) => {
  const navigate = useNavigate();
  const itemCount = shop.items?.length || 0;

  return (
    <article
      className="group w-[250px] shrink-0 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl sm:w-[280px] cursor-pointer"
      onClick={() => navigate(`/shop/${shop._id}`)}
    >
      <div className="relative h-36 overflow-hidden sm:h-40">
        <img
          src={shop.image}
          alt={shop.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#d94024] shadow-sm">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="p-4">
        <h3 className="truncate text-lg font-bold text-gray-800">{shop.name}</h3>
        <div className="mt-2 flex items-start gap-2 text-sm text-gray-500">
          <MapPin size={16} className="mt-0.5 shrink-0 text-[#ff4d2d]" />
          <p className="line-clamp-2">{shop.address}, {shop.city}</p>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#ff4d2d]">
          <Utensils size={16} />
          View restaurant
        </div>
      </div>
    </article>
  );
};

export default ShopCard;

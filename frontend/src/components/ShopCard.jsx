import React from "react";
import { ArrowUpRight, MapPin, Utensils } from "lucide-react";
import { Link } from "react-router-dom";

const ShopCard = ({ shop }) => {
  const itemCount = shop.items?.length || 0;

  return (
    <Link
      to={`/shop/${shop._id}`}
      aria-label={`Explore ${shop.name}`}
      className="group block w-[270px] shrink-0 overflow-hidden rounded-[26px] border border-[#efe1d8] bg-white shadow-[0_8px_24px_-20px_rgba(75,39,23,0.45)] transition duration-300 hover:-translate-y-1 hover:border-[#f1c7b5] hover:shadow-[0_22px_38px_-24px_rgba(75,39,23,0.38)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d2d]/40 sm:w-[300px]"
    >
      <div className="relative aspect-[1.65] overflow-hidden bg-gradient-to-br from-[#fff0e4] to-[#f5dacc]">
        {shop.image && (
          <img
            src={shop.image}
            alt={shop.name}
            loading="lazy"
            className="size-full object-cover transition duration-700 group-hover:scale-[1.06]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#21150f]/55 via-transparent to-transparent" />
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/95 px-3 py-1.5 text-xs font-bold text-[#51463e] shadow-sm">
          <Utensils size={13} className="text-[#e64b2e]" />
          {itemCount} {itemCount === 1 ? "dish" : "dishes"}
        </span>
        <span className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/95 text-[#d94024] shadow-md transition group-hover:rotate-45 group-hover:bg-[#ff4d2d] group-hover:text-white">
          <ArrowUpRight size={18} />
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="truncate text-lg font-extrabold tracking-tight text-[#302923] sm:text-xl">{shop.name}</h3>
        <div className="mt-2 flex min-h-10 items-start gap-2 text-sm leading-5 text-[#81766e]">
          <MapPin size={16} className="mt-0.5 shrink-0 text-[#ff4d2d]" />
          <p className="line-clamp-2">{[shop.address, shop.city].filter(Boolean).join(", ") || "Address available in restaurant details"}</p>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-[#f2e8e1] pt-3 text-sm font-bold text-[#e64b2e]">
          <span>Explore menu</span>
          <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  );
};

export default ShopCard;

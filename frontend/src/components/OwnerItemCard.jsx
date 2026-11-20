import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "@/App";
import { useDispatch } from "react-redux";
import { setMyShopData } from "@/redux/ownerSlice.js";

function OwnerItemCard({ data }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isVeg = data.foodType === "Veg";

  const handleDelete = async()=>{
    try{
      const result = await axios.get(`${serverUrl}/api/item/delete-item/${data._id}`,{withCredentials:true});
      dispatch(setMyShopData(result.data));
    }
    catch(error){
      console.log(error);
    }
  }

  return (
    <article className="group flex w-full items-center gap-3 rounded-[20px] border border-[#f0e5de] bg-[#fffdfb] p-3 transition duration-200 hover:border-[#f1c8b7] hover:shadow-[0_12px_28px_-24px_rgba(75,39,23,0.48)] sm:gap-4 sm:p-3.5">
      <div className="relative shrink-0">
        <img
          src={data.image}
          alt={data.name}
          className="size-[68px] rounded-[16px] object-cover sm:size-[76px]"
        />
        <div
          className={`absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-md border-2 border-white ${isVeg ? "bg-[#428450]" : "bg-[#bd5042]"}`}
          aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"}
        >
          <div className="size-1.5 rounded-full bg-white" />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-extrabold text-[#302923] sm:text-base" title={data.name}>{data.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {data.category && <span className="max-w-[130px] truncate rounded-full bg-[#f6eee9] px-2.5 py-1 text-[10px] font-semibold text-[#796b61]">{data.category}</span>}
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${isVeg ? "bg-[#edf5ed] text-[#3b7547]" : "bg-[#fbefed] text-[#a6463d]"}`}>{isVeg ? "Veg" : "Non-veg"}</span>
        </div>
        <p className="mt-1.5 text-sm font-extrabold tracking-tight text-[#e64b2e]">₹{Number(data.price || 0).toFixed(2)}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label={`Edit ${data.name}`}
          title="Edit dish"
          className="flex size-9 items-center justify-center rounded-xl text-[#84776e] transition hover:bg-[#fff0e7] hover:text-[#e64b2e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d2d]/30"
          onClick={() => navigate(`/edit-item/${data._id}`)}
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          aria-label={`Delete ${data.name}`}
          title="Delete dish"
          className="flex size-9 items-center justify-center rounded-xl text-[#a2938a] transition hover:bg-[#fbefed] hover:text-[#c34438] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d2d]/30"
          onClick={handleDelete}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
}

export default OwnerItemCard;


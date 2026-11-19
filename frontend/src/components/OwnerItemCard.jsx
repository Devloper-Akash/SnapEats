import React from "react";
import { FaPen } from "react-icons/fa6";
import { GoTrash } from "react-icons/go";
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
    <div className="w-full bg-white rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all duration-300 group">
      {/* Food Image */}
      <div className="relative shrink-0">
        <img
          src={data.image}
          alt={data.name}
          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl"
        />
        {/* Veg/Non-Veg badge */}
        <div
          className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-md border-2 border-white flex items-center justify-center ${
            isVeg ? "bg-green-500" : "bg-red-500"
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
          {data.name}
        </h3>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {data.category}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              isVeg
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {data.foodType}
          </span>
        </div>
        <p className="text-sm sm:text-base font-bold text-[#ff4d2d] mt-1">
          ₹{data.price.toFixed(2)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-1.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        <button
          className="p-2 rounded-lg hover:bg-orange-50 text-gray-500 hover:text-[#ff4d2d] cursor-pointer transition-colors duration-200"
          onClick={() => navigate(`/edit-item/${data._id}`)}
        >
          <FaPen size={14} />
        </button>
        <button className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 cursor-pointer transition-colors duration-200" onClick={handleDelete}>
          <GoTrash size={14} />
        </button>
      </div>
    </div>
  );
}

export default OwnerItemCard;


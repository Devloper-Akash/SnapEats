import React from "react";
import { FaMinus, FaPlus } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { updateQuantity } from "../redux/userSlice";
import { removeCartItem } from "../redux/userSlice";

function CartItemCard({ data }) {
    const dispatch = useDispatch();
    const handleIncrease = (id,currentQty) => {
        dispatch(updateQuantity({id,quantity:currentQty + 1}));
    }
    const handleDecrease = (id,currentQty) => {
        if(currentQty > 1){
            dispatch(updateQuantity({id,quantity:currentQty - 1}));
        }
    }
  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow border border-[#ff4d2d]/20 mb-4">
      <div className="flex items-center gap-4">
        <img
          src={data.image}
          alt={data.name}
          className="w-16 h-16 object-cover rounded-lg"
        />
        <div>
          <h3 className="text-lg font-bold text-gray-800">{data.name}</h3>
          <p className="text-gray-600">
            ₹{data.price.toFixed(2)} x {data.quantity}
          </p>
          <p className="text-lg font-bold text-[#ff4d2d]">
            Total: ₹{(data.price * data.quantity).toFixed(2)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition" onClick={() => handleDecrease(data.id,data.quantity)}
        >
          <FaMinus size={12} />
        </button>
        <span>{data.quantity}</span>
        <button
          className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition" onClick={() => handleIncrease(data.id,data.quantity)}  
        >
          <FaPlus size={12} />
        </button>
        <button className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition" onClick={() => dispatch(removeCartItem(data.id))}>
          <FaTrash size={12} />
        </button>
      </div>
    </div>
  );
}

export default CartItemCard;

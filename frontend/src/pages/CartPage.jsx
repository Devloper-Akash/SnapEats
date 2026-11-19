import React from "react";
import { MoveLeftIcon } from "@animateicons/react/lucide";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import CartItemCard from "@/components/CartItemCard";

function CartPage() {
    const navigate = useNavigate();
    const {cartItems,totalAmount} = useSelector(state => state.user);
  return (
    <div className="min-h-screen bg-[#fff9f6] flex justify-center p-6">
      <div className="w-full max-w-[800px]">
        <div className='flex items-center gap-3 mb-6'>
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full hover:bg-orange-100 transition-colors cursor-pointer"
            onClick={() => navigate("/")}
          >
            <MoveLeftIcon size={24} duration={1} color="#ff4d2d" />
          </div>
          <h1 className="text-2xl font-bold text-[#ff4d2d] text-start">Your Cart</h1>
        </div>
        {cartItems?.length == 0 ? (
            <p className='text-gray-500 text-lg text-center'>Your cart is empty.</p>
        ) : (<>
            <div>
                {cartItems?.map((item, index) =>(
                    <CartItemCard key={index} data={item}/>
                ))}
            </div>
            <div className="mt-6 p-4 bg-white rounded-xl shadow border border-[#ff4d2d]/20">
                <h2 className="text-lg font-bold text-gray-800 mb-2">Total Amount</h2>
                <p className="text-gray-600 text-lg">₹{totalAmount.toFixed(2)}</p>
            </div>
            <div>
                <button className="w-full mt-6 p-4 bg-[#ff4d2d] text-white rounded-xl hover:bg-[#e0432a] transition-colors cursor-pointer" onClick={()=>navigate("/checkout")}>
                    Proceed to Checkout
                </button>
            </div>
            </>
        )}
      </div>
    </div>
  );
}

export default CartPage;

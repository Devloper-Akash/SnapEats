import react from "react";
import { FaCircleCheck } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

const OrderPlaced = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[#fff9f6] flex flex-col justify-center items-center px-4 text-center relative overflow-hidden">
            <FaCircleCheck className="text-green-500 text-6xl mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h1>
            <p className="text-gray-600 mb-6">Thank you for your order. Your delicious food is on its way!</p>
            <button className="bg-[#ff5722] text-white px-6 py-3 rounded-lg hover:bg-[#e64a19] transition-colors duration-300" onClick={() => navigate('/my-orders')}>
                Back to My Orders
            </button>
        </div>
    )
}

export default OrderPlaced;
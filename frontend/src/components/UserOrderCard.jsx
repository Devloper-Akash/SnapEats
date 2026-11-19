import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'
import { serverUrl } from '../App'


function UserOrderCard({data}) {
  const navigate = useNavigate()
  const [selectedRating, setSelectedRating] = useState({})
  const orderStatus = data.shopOrders?.[0]?.status || 'Pending'

  const getStatusColor = (status) => {
    const s = status?.toLowerCase()
    if (s === 'delivered') return 'text-green-600 bg-green-50 border-green-200'
    if (s === 'cancelled') return 'text-red-600 bg-red-50 border-red-200'
    if (s === 'preparing') return 'text-orange-600 bg-orange-50 border-orange-200'
    if (s === 'out for delivery') return 'text-blue-600 bg-blue-50 border-blue-200'
    return 'text-[#ff4d2d] bg-[#ff4d2d]/10 border-[#ff4d2d]/20'
  }

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr?.slice(0, 10) || ''
    }
  }

  const handleRating = async(itemId , rating) =>{
    try{
      const result = await axios.post(`${serverUrl}/api/item/rating`,{itemId,rating},{withCredentials:true})
      setSelectedRating(prev=>({
        ...prev,
        [itemId]:rating
      }))
    }catch(error){
      console.log(error)
    }
  }

  return (
    <div className="w-full bg-white rounded-2xl shadow border border-[#ff4d2d]/20 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-gray-100">
        <div>
          <p className="text-gray-800 font-semibold text-sm">
            Order #{data._id?.slice(-6)}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">
            {formatDate(data.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data.paymentMethod == "cod"? <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
            {data.paymentMethod?.toUpperCase()}
          </span>: <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">Payment : 
            {data.payment? " Paid ".toUpperCase():" Not Paid ".toUpperCase()}
          </span>
          }
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${getStatusColor(orderStatus)}`}>
            {orderStatus}
          </span>
        </div>
      </div>

      {/* Shop Orders */}
      <div className="px-4 sm:px-5 py-4 space-y-4">
        {data.shopOrders?.map((shopOrder, index) => (
          <div key={index} className="rounded-xl border border-orange-100 bg-[#fff9f6] overflow-hidden">
            {/* Shop name row */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-orange-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#ff4d2d] text-white text-xs font-bold flex items-center justify-center">
                  {shopOrder.shop?.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <span className="text-sm font-semibold text-gray-800 truncate max-w-[160px] sm:max-w-none">
                  {shopOrder.shop?.name}
                </span>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${getStatusColor(shopOrder.status)}`}>
                {shopOrder.status}
              </span>
            </div>

            {shopOrder.status?.toLowerCase() === "out for delivery" && shopOrder.deliveryOtp && (
              <div className="mx-3 sm:mx-4 mt-2 p-2 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-orange-700">Delivery OTP (share with delivery partner):</span>
                <span className="font-bold text-[#ff4d2d] tracking-widest text-sm bg-white px-2 py-0.5 rounded border border-orange-200">
                  {shopOrder.deliveryOtp}
                </span>
              </div>
            )}

            {/* Items - horizontal scroll on mobile */}
            <div className="p-3 sm:p-4">
              <div className="flex gap-3 overflow-x-auto pb-1">
                {shopOrder.shopOrderItems?.map((item, idx) => (
                  <div key={idx} className="flex-shrink-0 w-36 sm:w-40 rounded-xl border border-[#ff4d2d]/20 bg-white overflow-hidden">
                    <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-gray-50">
                      <img
                        src={item.item?.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute top-1.5 right-1.5 bg-[#ff4d2d] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg">
                        x{item.quantity}
                      </span>
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">₹{item.price} × {item.quantity}</p>
                      <p className="text-sm font-bold text-[#ff4d2d] mt-0.5">₹{item.price * item.quantity}</p>
                    </div>

                    {shopOrder.status?.toLowerCase() === "delivered" && (
                      <div className="flex space-x-1 px-2 pb-2">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const itemId = item.item?._id || item.item;
                          const currentRating = selectedRating?.[itemId] || 0;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleRating(itemId, star)}
                              className={`text-xl cursor-pointer transition-colors ${
                                star <= currentRating
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            >
                              ★
                            </button>
                          );
                        })}
                      </div>
                    )}

                  </div>
                ))}
              </div>
            </div>

            {/* Subtotal */}
            <div className="flex items-center justify-end px-3 sm:px-4 py-2 border-t border-orange-100 bg-white/50">
              <span className="text-xs text-gray-500 mr-1">Subtotal:</span>
              <span className="text-sm font-bold text-gray-800">₹{shopOrder.subTotal}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm text-gray-500">Total:</span>
          <span className="text-xl font-bold text-gray-800">₹{data.totalAmount}</span>
        </div>
        <button className="w-full sm:w-auto bg-[#ff4d2d] hover:bg-[#e64526] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer" onClick={()=> navigate(`/track-order/${data._id}`)}>
          Track Order
        </button>
      </div>
    </div>
  )
}

export default UserOrderCard
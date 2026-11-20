import React from 'react'
import { useSelector } from 'react-redux'
import Nav from '../components/Nav'
import UserDashboard from '../components/UserDashboard'
import OwnerDashboard from '../components/OwnerDashboard'
import DeliveryBoy from '../components/DeliveryBoy'

const Home = () => {
  const { userData } = useSelector(state => state.user)
  const userRole = userData?.role || userData?.user || "user";
  const isOwner = userRole === "owner";
  const isDeliveryBoy = userRole === "deliveryBoy";
  const isUser = !isOwner && !isDeliveryBoy;

  return (
    <div className={`w-[100vw] min-h-[100vh] flex flex-col items-center bg-[#fff9f6] ${isUser ? "pt-[100px]" : "pt-[20px]"}`}>
      {isUser && <Nav />}
      {isUser && <UserDashboard />}
      {isOwner && <OwnerDashboard />}
      {isDeliveryBoy && <DeliveryBoy />}
    </div>
  )
}

export default Home

import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import ForgotPassword from './pages/ForgotPassword';
import useGetCurrentUser from './hooks/useGetCurrentUser';
import { useSelector } from 'react-redux';
import Home from './pages/Home';
import Welcome from './pages/Welcome';
import useGetCity from './hooks/useGetCity';
import useGetMyShop from './hooks/useGetMyShop';
import CreateEditShop from './pages/CreateEditShop';
import AddItem from './pages/AddItem';
import EditItem from './pages/EditItem';
import useGetShopByCity from './hooks/useGetShopByCity';
import useGetItemsByCity from './hooks/useGetItemsByCity';
import CartPage from './pages/CartPage';
import CheckOut from './pages/CheckOut';
import OrderPlaced from './pages/OrderPlaced';
import MyOrders from './pages/MyOrders';
import useGetMyOrders from './hooks/useGetMyOrders';
import useUpdateLocation from './hooks/useUpdateLocation';
import TrackOrderPage from './pages/TrackOrderPage';
import Shop from './pages/Shop';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { setSocket } from './redux/userSlice';
import { useDispatch } from 'react-redux';
export const serverUrl =
  import.meta.env.VITE_SERVER_URL || "https://snapeats-backend-g91m.onrender.com";

const App = () => {
  useGetCurrentUser();
  useUpdateLocation();
  useGetCity();
  useGetMyShop();
  useGetShopByCity();
  useGetItemsByCity();
  useGetMyOrders();
  const { userData } = useSelector(state => state.user);
  const dispatch = useDispatch();

  useEffect(() => {
    const socketInstance = io(serverUrl || window.location.origin, {
      withCredentials: true,
    })
    dispatch(setSocket(socketInstance));
    socketInstance.on('connect', (socket) => {
      if (userData) {
        socketInstance.emit('identity', { userId: userData._id });
      }
    });
    return () => {
      socketInstance.disconnect();
    }
  }, [userData?._id]);

  return (
    <Routes>
      <Route path='/signup' element={!userData ? <SignUp /> : <Navigate to={"/"} />}></Route>
      <Route path='/register' element={<Navigate to="/signup" />}></Route>
      <Route path='/signin' element={!userData ? <SignIn /> : <Navigate to={"/"} />}></Route>
      <Route path='/login' element={<Navigate to="/signin" />}></Route>
      <Route path='/forgot-password' element={!userData ? <ForgotPassword /> : <Navigate to={"/"} />}></Route>
      <Route path='/' element={userData ? <Home /> : <Welcome />}></Route>
      <Route path='/create-edit-shop' element={userData ? <CreateEditShop /> : <Navigate to={"/signin"} />}></Route>
      <Route path='/add-item' element={userData ? <AddItem /> : <Navigate to={"/signin"} />}></Route>
      <Route path='/edit-item/:itemId' element={userData ? <EditItem /> : <Navigate to={"/signin"} />}></Route>
      <Route path='/cart' element={userData ? <CartPage /> : <Navigate to={"/signin"} />}></Route>
      <Route path='/checkout' element={userData ? <CheckOut /> : <Navigate to={"/signin"} />}></Route>
      <Route path='/order-placed' element={userData ? <OrderPlaced /> : <Navigate to={"/signin"} />}></Route>
      <Route path='/my-orders' element={userData ? <MyOrders /> : <Navigate to={"/signin"} />}></Route>
      <Route path='/track-order/:orderId' element={userData ? <TrackOrderPage /> : <Navigate to={"/signin"} />}></Route>
      <Route path='/shop/:shopId' element={userData ? <Shop /> : <Navigate to={"/signin"} />}></Route>
      <Route path='*' element={<Navigate to="/" replace />}></Route>
    </Routes>
  )
}

export default App

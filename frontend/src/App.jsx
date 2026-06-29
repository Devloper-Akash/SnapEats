import React from 'react'
import {Navigate, Route,Routes} from 'react-router-dom'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import ForgotPassword from './pages/ForgotPassword';
import useGetCurrentUser from './hooks/useGetCurrentUser';
import { useSelector } from 'react-redux';
import Home from './pages/Home';
import useGetCity from './hooks/useGetCity';
import useGetMyShop from './hooks/useGetMyShop';
import CreateEditShop from './pages/CreateEditShop';
import AddItem from './pages/AddItem';
import EditItem from './pages/EditItem';
export const serverUrl = "http://localhost:8000";

const App = () => {
  useGetCurrentUser();
  useGetCity();
  useGetMyShop();
  const {userData} = useSelector(state=>state.user);
  const authFallbackRoute = userData ? "/" : "/signin";

  return (
    <Routes>
      <Route path='/signup' element={!userData?<SignUp/>:<Navigate to={"/"}/>}></Route>
      <Route path='/register' element={<Navigate to="/signup" />}></Route>
      <Route path='/signin' element={!userData?<SignIn/>:<Navigate to={"/"}/>}></Route>
      <Route path='/login' element={<Navigate to="/signin" />}></Route>
      <Route path='/forgot-password' element={!userData?<ForgotPassword/>:<Navigate to={"/"}/>}></Route>
      <Route path='/' element={userData?<Home/>:<Navigate to={"/signin"}/>}></Route>
       <Route path='/create-edit-shop' element={userData?<CreateEditShop/>:<Navigate to={"/signin"}/>}></Route>
       <Route path='/add-item' element={userData?<AddItem/>:<Navigate to={"/signin"}/>}></Route>
        <Route path='/edit-item/:itemId' element={userData?<EditItem/>:<Navigate to={"/signin"}/>}></Route>
      <Route path='*' element={<Navigate to={authFallbackRoute} replace />}></Route>
    </Routes>
  )
}

export default App

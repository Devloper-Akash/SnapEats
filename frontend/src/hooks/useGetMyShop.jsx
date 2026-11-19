import React, { useEffect } from 'react'
import { serverUrl } from '../App'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import { setMyShopData } from '../redux/ownerSlice'
import { useSelector } from 'react-redux'

const useGetMyShop = () => {
  const dispatch = useDispatch();
  const {userData} = useSelector(state=>state.user);
  useEffect(()=>{
    if(!userData) return;
    const fetchShop = async()=>{
        try {
             const result = await axios.get(`${serverUrl}/api/shop/get-my`,{withCredentials:true});
             dispatch(setMyShopData(result.data));
        } catch (error) {
            console.log(error);
        }   
    }
    fetchShop();
  },[userData])
}

export default useGetMyShop

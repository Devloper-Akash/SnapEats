import { useEffect } from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { setCurrentCity } from '../redux/userSlice'
import { setCurrentState } from '../redux/userSlice'
import { setCurrentAddress } from '../redux/userSlice'
import { setLocation } from '../redux/mapSlice'
import { setAddress } from '../redux/mapSlice'
import { useSelector } from 'react-redux';
import { serverUrl } from '../App';
import { useNavigate } from 'react-router-dom';
import { setUserData } from '../redux/userSlice';


const useUpdateLocation = () => {
  const dispatch = useDispatch();
 const {userData} = useSelector((state) => state.user);

  useEffect(() => {
    if(!userData) return;
    const updateLocation = async (lat,lon) => {
        try {
          const result = await axios.post(`${serverUrl}/api/user/update-location`,{lat,lon},{withCredentials:true})
          console.log(result.data)
        } catch (error) {
          console.log(error);
        }
    }

    const watchId = navigator.geolocation.watchPosition((pos) => {
        updateLocation(pos.coords.latitude,pos.coords.longitude);
    })

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userData]);
}

export default useUpdateLocation

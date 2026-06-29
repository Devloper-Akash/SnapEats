import { useEffect } from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { setCurrentCity } from '../redux/userSlice'
import { setCurrentState } from '../redux/userSlice'
import { setCurrentAddress } from '../redux/userSlice'

const useGetCity = () => {
  const dispatch = useDispatch();
  const apiKey = import.meta.env.VITE_GEOAPIKEY;

  useEffect(() => {
    if (!apiKey || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const result = await axios.get(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${apiKey}`,
          );

          dispatch(setCurrentCity(result?.data?.results?.[0]?.city ?? null));
          dispatch(setCurrentState(result?.data?.results?.[0]?.state ?? null));
          dispatch(setCurrentAddress(result?.data?.results?.[0]?.address_line1 || result?.data?.results?.[0]?.address_line2 || null));
          console.log(result?.data?.results?.[0]?.state);
        } catch (error) {
          console.log(error);
        }
      },
      (error) => {
        console.log(error);
      },
    );
  }, [apiKey, dispatch]);
}

export default useGetCity

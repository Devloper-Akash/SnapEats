import { useEffect } from 'react'
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { setCurrentCity } from '../redux/userSlice'
import { setCurrentState } from '../redux/userSlice'
import { setCurrentAddress } from '../redux/userSlice'
import { setLocation } from '../redux/mapSlice'
import { setAddress } from '../redux/mapSlice'

const useGetCity = () => {
  const dispatch = useDispatch();
  const manualSelection = useSelector((state) => state.map.manualSelection);
  const apiKey = import.meta.env.VITE_GEOAPIKEY;

  useEffect(() => {
    if (!navigator.geolocation || manualSelection) {
      return;
    }

    let ignore = false;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          let place = null;

          // 1. Try Geoapify
          if (apiKey) {
            try {
              const result = await axios.get(
                `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${apiKey}`,
                { withCredentials: false },
              );
              place = result?.data?.results?.[0];
            } catch (err) {
              console.warn("Geoapify failed in useGetCity, trying OSM:", err);
            }
          }

          // 2. Fallback to OpenStreetMap Nominatim
          if (!place) {
            try {
              const osmRes = await axios.get(
                `https://nominatim.openstreetmap.org/reverse`,
                {
                  params: {
                    lat: latitude,
                    lon: longitude,
                    format: "json",
                    addressdetails: 1,
                  },
                  withCredentials: false,
                },
              );
              if (osmRes.data) {
                const addr = osmRes.data.address || {};
                const city =
                  addr.city ||
                  addr.town ||
                  addr.village ||
                  addr.suburb ||
                  addr.county ||
                  addr.state ||
                  "";
                place = {
                  city,
                  state: addr.state,
                  address_line1: addr.road || osmRes.data.name,
                  formatted: osmRes.data.display_name,
                };
              }
            } catch (osmErr) {
              console.warn("OSM failed in useGetCity:", osmErr);
            }
          }

          if (ignore) return;

          dispatch(setLocation({ lat: latitude, lon: longitude }));
          if (place) {
            dispatch(setCurrentCity(place.city ?? null));
            dispatch(setCurrentState(place.state ?? null));
            dispatch(
              setCurrentAddress(
                place.address_line1 || place.address_line2 || place.formatted || null,
              ),
            );
            dispatch(setAddress(place.formatted ?? null));
          }
        } catch (error) {
          console.log("useGetCity error:", error);
        }
      },
      (error) => {
        console.log("Geolocation error in useGetCity:", error);
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 },
    );
    return () => {
      ignore = true;
    };
  }, [apiKey, dispatch, manualSelection]);
}

export default useGetCity

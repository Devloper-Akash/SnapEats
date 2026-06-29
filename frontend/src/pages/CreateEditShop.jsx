import React, { useRef } from "react";
import { MoveLeftIcon } from "@animateicons/react/lucide";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaUtensils } from "react-icons/fa";
import { useState } from "react";
import axios from "axios";
import { serverUrl } from "@/App";
import { useDispatch } from "react-redux";
import { setMyShopData } from "@/redux/ownerSlice";

const CreateEditShop = () => {
  const navigate = useNavigate();
  const { myShopData } = useSelector((state) => state.owner);
  const { currentCity, currentState, currentAddress } = useSelector(
    (state) => state.user,
  );
  const [name, setName] = useState(myShopData?.name || "");
  const [address, setAddress] = useState(myShopData?.address || currentAddress);
  const [city, setCity] = useState(myShopData?.city || currentCity);
  const [state, setState] = useState(myShopData?.state || currentState);
  const [frontendImage, setFrontendImage] = useState(myShopData?.image || null);
  const [backendImage, setBackendImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleImage = (e) => {
    const file = e.target.files[0];
    setBackendImage(file);
    setFrontendImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("city", city);
      formData.append("state", state);
      formData.append("address", address);
      if (backendImage) {
        formData.append("image", backendImage);
      }
      const result = await axios.post(`${serverUrl}/api/shop/create-edit`, formData, {
        withCredentials: true,
      });
      dispatch(setMyShopData(result.data));
      console.log(result.data);
    } catch (error) {
      console.log(error);
    }
      setLoading(false);
  };

  return (
    <div className="flex justify-center flex-col items-center px-4 py-6 sm:p-6 bg-gradient-to-br from-orange-50 to-white min-h-screen">
      <div className="w-full max-w-lg mb-3">
        <div
          className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full hover:bg-orange-100 transition-colors cursor-pointer"
          onClick={() => navigate("/")}
        >
          <MoveLeftIcon
            size={24}
            duration={1}
            color="#ff4d2d"
          />
        </div>
      </div>
      <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-5 sm:p-8 border border-orange-100">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-orange-100 p-4 rounded-full mb-4">
            <FaUtensils color="#ff4d2d" className="w-16 h-16" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {myShopData ? "Edit shop" : "Add Shop"}
          </div>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              placeholder="Enter Shop Name"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              onChange={(e) => setName(e.target.value)}
              value={name}
            ></input>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop Image
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              onChange={handleImage}
            ></input>
            {frontendImage && (
              <div className="w-full h-[200px] bg-gray-100 rounded-lg mt-4 border-dashed border-2 border-gray-300 flex items-center justify-center overflow-hidden">
                <img
                  src={frontendImage}
                  className="w-full h-48 object-cover rounded-lg border"
                ></img>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                placeholder="City"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                onChange={(e) => setCity(e.target.value)}
                value={city}
              ></input>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                placeholder="state"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                onChange={(e) => setState(e.target.value)}
                value={state}
              ></input>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop Address
            </label>
            <input
              type="text"
              placeholder="Enter Shop Address"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              onChange={(e) => setAddress(e.target.value)}
              value={address}
            ></input>
          </div>
          <button className="w-full bg-[#ff4d2d] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-orange-600 hover:shadow-lg transition-all duration-300 cursor-pointer" disabled={loading}>
            {loading ? <ClipLoader size={20} color="white" /> : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEditShop;

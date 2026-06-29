import React from "react";
import { MoveLeftIcon } from "@animateicons/react/lucide";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaUtensils } from "react-icons/fa";
import { useState } from "react";
import axios from "axios";
import { serverUrl } from "@/App";
import { useDispatch } from "react-redux";
import { setMyShopData } from "@/redux/ownerSlice";

const AddItem = () => {
  const navigate = useNavigate();
  const { myShopData } = useSelector((state) => state.owner);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState("");
  const [foodType, setFoodType] = useState("Veg");
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const categories = [
    "Snacks",
    "Main Course",
    "Deserts",
    "Pizza",
    "Burgers",
    "Sandwich",
    "South Indian",
    "North Indian",
    "Chinese",
    "Fast Food",
    "Bevarages",
    "Others",
  ];
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
      formData.append("category", category);
      formData.append("price", price);
      formData.append("foodType", foodType);
      if (backendImage) {
        formData.append("image", backendImage);
      }
      const result = await axios.post(
        `${serverUrl}/api/item/add-item`,
        formData,
        {
          withCredentials: true,
        },
      );
      dispatch(setMyShopData(result.data));
      navigate("/");
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center flex-col items-center px-4 py-6 sm:p-6 bg-gradient-to-br from-orange-50 to-white min-h-screen">
      {/* Back button — flows with content, not absolute */}
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
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-orange-100 p-4 rounded-full mb-4">
            <FaUtensils color="#ff4d2d" className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Add Food Item
          </h1>
          <p className="text-gray-500 text-sm mt-1 text-center">
            Add a new dish to your restaurant menu
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Food Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              placeholder="Enter Food Name"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
              onChange={(e) => setName(e.target.value)}
              value={name}
            />
          </div>

          {/* Food Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Food Image
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-[#ff4d2d] hover:file:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow cursor-pointer"
              onChange={handleImage}
            />
            {frontendImage && (
              <div className="w-full mt-3 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <img
                  src={frontendImage}
                  alt="Food preview"
                  className="w-full h-44 sm:h-52 object-cover"
                />
              </div>
            )}
          </div>

          {/* Price & Food Type — side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
                onChange={(e) => setPrice(e.target.value)}
                value={price}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Food Type
              </label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow bg-white"
                onChange={(e) => setFoodType(e.target.value)}
                value={foodType}
              >
                <option value="Veg">🟢 Veg</option>
                <option value="Non Veg">🔴 Non Veg</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow bg-white"
              onChange={(e) => setCategory(e.target.value)}
              value={category}
            >
              <option value="">Select a category</option>
              {categories.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            className="w-full bg-[#ff4d2d] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-orange-600 hover:shadow-lg active:scale-[0.98] transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Save"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddItem;


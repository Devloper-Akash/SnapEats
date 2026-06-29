import React from "react";
import { useState } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword]= useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err,setErr] = useState("");
  const [loading, setLoading] = useState(false);

const handleSendOtp = async()=>{
  setLoading(true);
  try {
    const result = await axios.post(
      `${serverUrl}/api/auth/send-otp`,
      { email },
      { withCredentials: true }
    );
    console.log(result);
    setLoading(false);
    setErr("");
    setStep(2);
  } catch (error) {
    setErr(error?.response?.data?.message);
    setLoading(false);
  }
}

const handleVerifyOtp = async()=>{
  setLoading(true);
  try {
    const result = await axios.post(
      `${serverUrl}/api/auth/verify-otp`,
      { email, otp },
      { withCredentials: true }
    );
    console.log(result);
    setLoading(false);
    setErr("");
    setStep(3);
  } catch (error) {
    setErr(error?.response?.data?.message);
    setLoading(false);
  }
}

const handleResetPassword = async()=>{
  setLoading(true);
  if(!newPassword){
    setErr("New password is required");
    setLoading(false);
    return;
  }
  if(newPassword != confirmPassword){
    setErr("Passwords do not match");
    setLoading(false);
    return;
  }
  
  try {
    const result = await axios.post(
      `${serverUrl}/api/auth/reset-password`,
      { email, newPassword },
      { withCredentials: true }
    );
    setErr("");
    console.log(result);
    setLoading(false);
    navigate("/signin");
  } catch (error) {
    setErr(error?.response?.data?.message);
    setLoading(false);
  }
}

  return (
    <div className="flex items-center justify-center min-h-screen p-4 w-full bg-[#fff9f6]">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
        <div className="flex items-center gap-4 mb-4">
          <IoIosArrowRoundBack className="text-[#ff4d2d] cursor-pointer" size={30} onClick={()=>navigate("/signin")}/>
          <h1 className="text-2xl font-bold text-center text-[#ff4d2d]">
            Forgot Password
          </h1>
        </div>
        {step == 1 && (
          <div className="mb-6">
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-gray-700 font-medium mb-1"
              >
                Email
              </label>
              <input
                type="text"
                className="w-full border-[1px] rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                placeholder="Enter your Email"
                onChange={(e) => setEmail(e.target.value)}
                value={email} required
              ></input>
            </div>
            <button
              className="w-full mt-4 font-semibold flex items-center justify-center gap-2 rounded-lg px-4 py-2 transition duration-200 bg-[#ff4d2d] hover:bg-[#e64323] text-white cursor-pointer" onClick={handleSendOtp} disabled={loading}
            >
              {loading ? <ClipLoader size={20} color="white"/> : "Send OTP"}
            </button>
            <p className="text-red-500 text-center my-[10px]">{err}</p>
          </div>
        )}

         {step == 2 && (
          <div className="mb-6">
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-gray-700 font-medium mb-1"
              >
                OTP
              </label>
              <input
                type="text"
                className="w-full border-[1px] rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                placeholder="Enter your OTP"
                onChange={(e) => setOtp(e.target.value)}
                value={otp}
              ></input>
            </div>
            <button
              className="w-full mt-4 font-semibold flex items-center justify-center gap-2 rounded-lg px-4 py-2 transition duration-200 bg-[#ff4d2d] hover:bg-[#e64323] text-white cursor-pointer" onClick={handleVerifyOtp} disabled={loading}
            >
              {loading ? <ClipLoader size={20} color="white"/> : "Verify OTP"}
            </button>
            <p className="text-red-500 text-center my-[10px]">{err}</p>
          </div>
        )}

        {step == 3 && (
          <div className="mb-6">
            <div className="mb-4">
              <label
                htmlFor="newPassword"
                className="block text-gray-700 font-medium mb-1"
              >
                New Password
              </label>
              <input
                type="text"
                className="w-full border-[1px] rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                placeholder="Enter your new password"
                onChange={(e) => setNewPassword(e.target.value)}
                value={newPassword} required
              ></input>
            </div>

             <div className="mb-4">
              <label
                htmlFor="ConfirmPassword"
                className="block text-gray-700 font-medium mb-1"
              >
                Confirm Password
              </label>
              <input
                type="text"
                className="w-full border-[1px] rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                placeholder="Confirm your new password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                value={confirmPassword} required
              ></input>
            </div>
            <button
              className="w-full mt-4 font-semibold flex items-center justify-center gap-2 rounded-lg px-4 py-2 transition duration-200 bg-[#ff4d2d] hover:bg-[#e64323] text-white cursor-pointer" onClick={handleResetPassword} disabled={loading}
            >
              {loading ? <ClipLoader size={20}/> : "Update Password"}
            </button>
            <p className="text-red-500 text-center my-[10px]">{err}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

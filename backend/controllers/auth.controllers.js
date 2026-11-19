import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../utils/token.js";
import { sendOtpMail } from "../utils/mail.js";

export const signUp=async(req,res)=>{
    try {
        const {fullName,email,password,mobile,role} = req.body;
        const normalizedEmail = email?.trim().toLowerCase();
        let user = await User.findOne({email: normalizedEmail});
        if(user){
            return res.status(400).json({message:"User Already exists."});
        }
        if(password.length<6){
            return res.status(400).json({message:"Password must be at least 6 characters."})
        }
        if(mobile.length<10){
            return res.status(400).json({message:"Mobile number must be at least 10 digits."})
        }

        const hasedPassword = await bcrypt.hash(password,10);

        user = await User.create({
            fullName,
            email: normalizedEmail,
            role,
            mobile,
            password:hasedPassword
        });

        const token = await genToken(user._id);
        res.cookie("token",token,{
            secure:true,
            sameSite:"none",
            maxAge:7*24*60*60*1000,
            httpOnly:true
        })

        return res.status(201).json(user);
    } catch (error) {
        return res.status(500).json(`Sign up error ${error}`);
    }
}


export const signIn=async(req,res)=>{
    try {
        const {email,password} = req.body;
        const normalizedEmail = email?.trim().toLowerCase();
        const user = await User.findOne({email: normalizedEmail});
        if(!user){
            return res.status(400).json({message:"User does not exists."});
        }

        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400).json({message:"Incorrect Password"});
        }

        const token = await genToken(user._id);
        res.cookie("token",token,{
            secure:true,
            sameSite:"none",
            maxAge:7*24*60*60*1000,
            httpOnly:true
        })

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json(`Sign In error ${error}`);
    }
}

export const signOut = async(req,res)=>{
    try {
        res.clearCookie("token");
        return res.status(200).json({message:"Logout Successfully"})
    } catch (error) {
        return res.status(500).json({message:`Sign out error ${error}`});
    }
}

 export const sendOtp = async(req,res)=>{
    try {
        const {email} = req.body;
        const normalizedEmail = email?.trim().toLowerCase();
        const user = await User.findOne({email: normalizedEmail});
        if(!user){
            return res.status(400).json({message:"User does not exists."});
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        user.resetOtp = otp;
        user.otpExpires = Date.now() + 5*60*1000; // OTP valid for 5 minutes
        user.isOtpVerified = false;
        await user.save();
        await sendOtpMail(user.email, otp);
        return res.status(200).json({message:"OTP sent successfully."});
    } catch (error) {
        return res.status(500).json({message:`Send OTP error ${error}`});
    }

}

 export const verifyOtp = async(req,res)=>{
        try {
            const {email,otp} = req.body;
            const normalizedEmail = email?.trim().toLowerCase();
            const user = await User.findOne({email: normalizedEmail});
            if(!user){
                return res.status(400).json({message:"User does not exists."});
            }
            if(user.resetOtp !== otp){
                return res.status(400).json({message:"Invalid OTP."});
            }
            if(Date.now() > user.otpExpires){
                return res.status(400).json({message:"OTP has expired."});
            }
            user.isOtpVerified = true;
            user.resetOtp = undefined;
            user.otpExpires = undefined;
            await user.save();
            return res.status(200).json({message:"OTP verified successfully."});
        } catch (error) {
            return res.status(500).json({message:`Verify OTP error ${error}`});
        }
    }

export const resetPassword = async(req,res)=>{
    try {
        const {email,newPassword} = req.body;
        const normalizedEmail = email?.trim().toLowerCase();
        if(!newPassword || !newPassword.trim()){
            return res.status(400).json({message:"New password is required."});
        }
        const user = await User.findOne({email: normalizedEmail});
        if(!user){
            return res.status(400).json({message:"User does not exists."});
        }
        if(!user.isOtpVerified){
            return res.status(400).json({message:"OTP not verified."});
        }
        const hasedPassword = await bcrypt.hash(newPassword,10);
        user.password = hasedPassword;
        user.isOtpVerified = false;
        await user.save();
        return res.status(200).json({message:"Password reset successfully."});
    } catch (error) {
        return res.status(500).json({message:`Reset Password error ${error}`});
    }
}

export const googleAuth = async(req,res)=>{
    try {
        const { fullName, email, mobile, role } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        let user = await User.findOne({email});
        if(!user){
            if (!fullName || !mobile || !role) {
                return res.status(400).json({ message: "fullName, mobile and role are required for new Google users." });
            }

            user = await User.create({
                fullName,
                email,
                mobile,
                role
            });
        }

        const token = await genToken(user._id);
        res.cookie("token",token,{
            secure:true,
            sameSite:"none",
            maxAge:7*24*60*60*1000,
            httpOnly:true
        })

        return res.status(200).json(user);

    } catch (error) {
        return res.status(500).json({message:`Google Auth error ${error}`});
    }
}

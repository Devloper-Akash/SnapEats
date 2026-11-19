import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL?.trim(),
    pass: process.env.PASS?.trim(),
  },
});

export const sendOtpMail = async(to,otp)=>{
  await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject:"Reset Your Password",
    html:`<p> Your OTP for resetting your password is <b>${otp}</b>. It is valid for 5 minutes.</p>`
  })
}

export const sendDeliveryOtpMail = async(user,otp)=>{
  await transporter.sendMail({
    from: process.env.EMAIL,
    to: user.email,
    subject:"Delivery OTP",
    html:`<p> Your OTP for delivery is <b>${otp}</b>. It is valid for 5 minutes.</p>`
  })
}



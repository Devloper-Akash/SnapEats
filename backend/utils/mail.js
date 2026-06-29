import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
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

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL?.trim(),
    pass: process.env.PASS?.trim(),
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

export const sendOtpMail = async (to, otp) => {
  try {
    if (!to || !process.env.EMAIL || !process.env.PASS) {
      console.warn("Skipping email: missing recipient or credentials");
      return;
    }
    await transporter.sendMail({
      from: process.env.EMAIL,
      to,
      subject: "Reset Your Password",
      html: `<p> Your OTP for resetting your password is <b>${otp}</b>. It is valid for 5 minutes.</p>`
    });
  } catch (error) {
    console.error("sendOtpMail error:", error?.message || error);
  }
}

export const sendDeliveryOtpMail = async (user, otp) => {
  const toEmail = (user?.email || (typeof user === "string" ? user : "")).trim();
  if (!toEmail) {
    throw new Error("Customer email address is missing");
  }
  if (!process.env.EMAIL || !process.env.PASS) {
    throw new Error("Server email configuration (EMAIL/PASS) is missing in environment variables");
  }
  await transporter.sendMail({
    from: process.env.EMAIL,
    to: toEmail,
    subject: "Delivery OTP",
    html: `<p>Your OTP for delivery is <b>${otp}</b>. It is valid for 5 minutes.</p>`,
  });
};



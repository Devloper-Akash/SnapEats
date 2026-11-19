import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const emailUser = (process.env.EMAIL || "haldarProkash53@gmail.com").trim();
const emailPass = (process.env.PASS || "pxmr btxh ocmp zgul").trim();

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

export const sendOtpMail = async (to, otp) => {
  try {
    if (!to) {
      console.warn("Skipping email: missing recipient");
      return;
    }
    await transporter.sendMail({
      from: emailUser,
      to,
      subject: "Reset Your Password",
      html: `<p> Your OTP for resetting your password is <b>${otp}</b>. It is valid for 5 minutes.</p>`
    });
  } catch (error) {
    console.error("sendOtpMail error:", error?.message || error);
  }
};

export const sendDeliveryOtpMail = async (user, otp) => {
  const toEmail = (user?.email || (typeof user === "string" ? user : "")).trim();
  if (!toEmail) {
    throw new Error("Customer email address is missing");
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    const from = (process.env.EMAIL_FROM || "onboarding@resend.dev").trim();
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [toEmail],
          subject: "Delivery OTP",
          html: `<p>Your OTP for delivery is <b>${otp}</b>. It is valid for 5 minutes.</p>`,
        }),
      });

      if (response.ok) {
        return;
      }
      const details = await response.text();
      console.warn(`Resend API returned ${response.status}: ${details}. Falling back to Gmail.`);
    } catch (err) {
      console.warn("Resend API failed, falling back to Gmail:", err.message);
    }
  }

  await transporter.sendMail({
    from: emailUser,
    to: toEmail,
    subject: "Delivery OTP",
    html: `<p>Your OTP for delivery is <b>${otp}</b>. It is valid for 5 minutes.</p>`,
  });
};



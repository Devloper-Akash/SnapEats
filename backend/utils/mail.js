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

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    const from = process.env.EMAIL_FROM?.trim();
    if (!from) {
      throw new Error("EMAIL_FROM must be set to a verified sender address when RESEND_API_KEY is configured");
    }

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

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Delivery email provider returned ${response.status}: ${details}`);
    }
    return;
  }

  if (process.env.RENDER) {
    throw new Error(
      "Delivery OTP email is not configured for Render. Add RESEND_API_KEY and EMAIL_FROM to the backend service environment variables."
    );
  }

  if (!process.env.EMAIL || !process.env.PASS) {
    throw new Error("Configure RESEND_API_KEY and EMAIL_FROM or provide SMTP credentials (EMAIL/PASS)");
  }
  await transporter.sendMail({
    from: process.env.EMAIL,
    to: toEmail,
    subject: "Delivery OTP",
    html: `<p>Your OTP for delivery is <b>${otp}</b>. It is valid for 5 minutes.</p>`,
  });
};



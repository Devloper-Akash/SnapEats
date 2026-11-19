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
  connectionTimeout: 2500,
  greetingTimeout: 2500,
  socketTimeout: 2500,
});

const sendMailViaHttpOrSmtp = async ({ to, subject, html }) => {
  const toEmail = (to?.email || (typeof to === "string" ? to : "")).trim();
  if (!toEmail) {
    throw new Error("Recipient email address is missing");
  }

  // 1. Try Resend HTTPS API (Port 443 - works on Render)
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  let resendFailure = null;
  if (resendApiKey) {
    let from = (process.env.EMAIL_FROM || "onboarding@resend.dev").trim();
    // Resend only accepts verified domains or the default 'onboarding@resend.dev'.
    // If EMAIL_FROM was set to a @gmail.com or other public provider, default to onboarding@resend.dev.
    if (!from || from.includes("@gmail.com") || from.includes("@yahoo.com") || from.includes("@outlook.com") || from.includes("@hotmail.com")) {
      from = "onboarding@resend.dev";
    }
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
          subject,
          html,
        }),
      });

      if (response.ok) {
        return;
      }
      const details = await response.text();
      console.warn(`Resend API returned ${response.status}: ${details}`);
      resendFailure = new Error(`Resend email failed (${response.status}): ${details}`);
      if (response.status === 403) {
        resendFailure.code = "RESEND_SENDER_UNVERIFIED";
      }
    } catch (err) {
      console.warn("Resend API failed:", err?.message || err);
      resendFailure = err;
    }
  }

  // 2. Try Brevo HTTPS API as secondary backup (Port 443)
  const brevoApiKey = process.env.BREVO_API_KEY?.trim() || process.env.SENDINBLUE_API_KEY?.trim();
  if (brevoApiKey) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: "SnapEats", email: emailUser },
          to: [{ email: toEmail }],
          subject,
          htmlContent: html,
        }),
      });

      if (response.ok) {
        return;
      }
      const details = await response.text();
      console.warn(`Brevo API returned ${response.status}: ${details}`);
    } catch (err) {
      console.warn("Brevo API failed:", err?.message || err);
    }
  }

  // Render Free blocks outbound SMTP. Never fall back to Gmail there after an
  // API send fails; that only replaces the useful provider error with a
  // guaranteed SMTP connection failure.
  if (process.env.RENDER) {
    if (resendFailure) throw resendFailure;
    throw new Error("No HTTPS email provider succeeded. Configure RESEND_API_KEY and EMAIL_FROM.");
  }

  // 3. Fallback to Gmail SMTP for local development or other environments.
  await transporter.sendMail({
    from: emailUser,
    to: toEmail,
    subject,
    html,
  });
};

export const sendOtpMail = async (to, otp) => {
  try {
    await sendMailViaHttpOrSmtp({
      to,
      subject: "SnapEats - Reset Your Password",
      html: `<p>Your OTP for resetting your password is <b>${otp}</b>. It is valid for 5 minutes.</p>`,
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

  await sendMailViaHttpOrSmtp({
    to: toEmail,
    subject: "SnapEats - Delivery OTP",
    html: `<p>Your OTP for delivery is <b>${otp}</b>. It is valid for 5 minutes.</p>`,
  });
};




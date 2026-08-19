/**
 * OneService – Email Service (Resend)
 */
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_STYLE = `
  font-family: 'Segoe UI', sans-serif;
  background: #f0f6fd;
  padding: 40px 20px;
`;

const CARD_STYLE = `
  background: white;
  border-radius: 16px;
  padding: 40px;
  max-width: 520px;
  margin: 0 auto;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
`;

const PRIMARY = "#3b82f6";

const sendEmail = async ({ to, subject, html }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "OneService <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Email send error:", error);
      throw new Error(error.message);
    }

    console.log("Email sent successfully:", data?.id);
    return true;
  } catch (err) {
    console.error("Email send error:", err.message);
    throw err;
  }
};

exports.sendOTP = async (email, name, otp) => {
  return sendEmail({
    to: email,
    subject: "Verify your OneService account",
    html: `
      <div style="${BASE_STYLE}">
        <div style="${CARD_STYLE}">
          <h2 style="color:${PRIMARY};margin:0 0 8px">Welcome to OneService 👋</h2>
          <p style="color:#64748b">Hi ${name}, use the OTP below to verify your account.</p>
          <div style="background:#eff6ff;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
            <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:${PRIMARY}">${otp}</span>
          </div>
          <p style="color:#94a3b8;font-size:13px">This OTP expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      </div>
    `,
  });
};

exports.sendPasswordResetOTP = async (email, name, otp) => {
  return sendEmail({
    to: email,
    subject: "Reset your OneService password",
    html: `
      <div style="${BASE_STYLE}">
        <div style="${CARD_STYLE}">
          <h2 style="color:${PRIMARY};margin:0 0 8px">Password Reset</h2>
          <p style="color:#64748b">Hi ${name}, use this OTP to reset your password.</p>
          <div style="background:#eff6ff;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
            <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:${PRIMARY}">${otp}</span>
          </div>
          <p style="color:#94a3b8;font-size:13px">Valid for 10 minutes. Ignore if you didn't request this.</p>
        </div>
      </div>
    `,
  });
};

exports.sendPaymentConfirmation = async (email, name, { amount, bookingId }) => {
  return sendEmail({
    to: email,
    subject: `Payment Confirmed – ₹${amount} | OneService`,
    html: `
      <div style="${BASE_STYLE}">
        <div style="${CARD_STYLE}">
          <h2 style="color:#16a34a;margin:0 0 8px">✅ Payment Successful</h2>
          <p style="color:#64748b">Hi ${name}, your payment has been processed.</p>
          <div style="border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin:20px 0">
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9">
              <span style="color:#64748b">Booking ID</span>
              <strong>${bookingId}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0">
              <span style="color:#64748b">Amount Paid</span>
              <strong style="color:#16a34a">₹${amount}</strong>
            </div>
          </div>
          <p style="color:#94a3b8;font-size:13px">Thank you for using OneService!</p>
        </div>
      </div>
    `,
  });
};

exports.sendBookingConfirmation = async (
  email,
  name,
  { bookingId, serviceName, scheduledAt }
) => {
  return sendEmail({
    to: email,
    subject: `Booking Confirmed – ${serviceName} | OneService`,
    html: `
      <div style="${BASE_STYLE}">
        <div style="${CARD_STYLE}">
          <h2 style="color:${PRIMARY};margin:0 0 8px">Booking Confirmed 🎉</h2>
          <p style="color:#64748b">Hi ${name}, your booking is confirmed.</p>
          <div style="border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin:20px 0">
            <p><strong>Service:</strong> ${serviceName}</p>
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p><strong>Scheduled:</strong> ${new Date(scheduledAt).toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>
    `,
  });
};
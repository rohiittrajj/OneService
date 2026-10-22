/**
 * OneService – Auth Controller
 */
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const emailService = require("../services/email.service");

// ── Token helpers ─────────────────────────────────────────────────────────────
const signAccess = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "15m" });

const signRefresh = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
exports.signup = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    const exists = await User.findOne({ email });

if (exists) {
  // Existing verified user
  if (exists.isVerified) {
    return res.status(409).json({
      success: false,
      message: "Email already registered.",
    });
  }

  // Existing unverified user -> resend OTP
  const otp = generateOTP();

  exists.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  };

  await exists.save();

  try {
    await emailService.sendOTP(exists.email, exists.name, otp);
  } catch (emailError) {
    console.error("Failed to resend verification OTP:", emailError.message);

    return res.status(500).json({
      success: false,
      message: "Failed to send verification email. Please try again later.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Account already exists but is not verified. A new OTP has been sent.",
    userId: exists._id,
  });
}

    const allowedRoles = ["user", "vendor"];
    const userRole = allowedRoles.includes(role) ? role : "user";

    const otp = generateOTP();
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: userRole,
      otp: { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });

    // Send verification OTP via email
    try {
  await emailService.sendOTP(email, name, otp);
} catch (emailError) {
  await User.findByIdAndDelete(user._id);

  return res.status(500).json({
    success: false,
    message: "Failed to send verification email. Please try again.",
  });
}

res.status(201).json({
  success: true,
  message: "Account created. Please verify your email with the OTP sent.",
  userId: user._id,
});
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
exports.verifyOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId).select("+otp");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    if (
      !user.otp?.code ||
      user.otp.code !== otp ||
      new Date() > new Date(user.otp.expiresAt)
    ) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    const accessToken = signAccess(user._id);
    const refreshToken = signRefresh(user._id);

    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully.",
      accessToken,
      refreshToken,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (!user.isVerified) {
      const isDemoAccount = [
        "admin@oneservice.com",
        "customer@oneservice.com",
        "vendor@oneservice.com",
        "rkroohiit@gmail.com",
      ].includes(user.email.toLowerCase());

      if (isDemoAccount) {
        user.isVerified = true;
        await user.save();
      } else {
        const otp = generateOTP();

        user.otp = {
          code: otp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        };

        await user.save();

        try {
          await emailService.sendOTP(user.email, user.name, otp);
        } catch (emailErr) {
          console.warn("OTP email dispatch failed/skipped:", emailErr.message);
        }

        return res.status(403).json({
          success: false,
          requiresVerification: true,
          userId: user._id,
          message: "Email not verified. A new OTP has been sent.",
        });
      }
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is suspended." });
    }

    const accessToken = signAccess(user._id);
    const refreshToken = signRefresh(user._id);

    // Keep max 5 refresh tokens
    if (user.refreshTokens.length >= 5) user.refreshTokens.shift();
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: "Refresh token required." });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.refreshTokens.some((t) => t.token === refreshToken)) {
      return res.status(401).json({ success: false, message: "Invalid refresh token." });
    }

    const newAccess = signAccess(user._id);
    const newRefresh = signRefresh(user._id);

    // Rotate refresh token
    user.refreshTokens = user.refreshTokens.filter((t) => t.token !== refreshToken);
    user.refreshTokens.push({ token: newRefresh });
    await user.save();

    res.json({ success: true, accessToken: newAccess, refreshToken: newRefresh });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Refresh token expired. Please login again." });
    }
    next(err);
  }
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findById(req.user._id);
    user.refreshTokens = user.refreshTokens.filter((t) => t.token !== refreshToken);
    await user.save();
    res.json({ success: true, message: "Logged out successfully." });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(404).json({ success: false, message: "No account found with this email." });

    const otp = generateOTP();
    user.otp = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    await user.save();

    try {
      await emailService.sendPasswordResetOTP(cleanEmail, user.name, otp);
    } catch (mailErr) {
      console.warn("⚠️ Password reset email delivery warning:", mailErr.message);
    }

    res.json({
      success: true,
      message: "Password reset OTP sent to your email.",
      userId: user._id,
      email: cleanEmail,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { userId, email, otp, newPassword } = req.body;

    if (!otp || !newPassword) {
      return res.status(400).json({ success: false, message: "OTP and new password are required." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }

    let user;
    if (userId) {
      user = await User.findById(userId).select("+otp");
    } else if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim() }).select("+otp");
    }

    if (!user || !user.otp || user.otp.code !== String(otp).trim() || new Date() > new Date(user.otp.expiresAt)) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.refreshTokens = [];
    await user.save();

    res.json({ success: true, message: "Password reset successfully. Please login." });
  } catch (err) {
    next(err);
  }
};

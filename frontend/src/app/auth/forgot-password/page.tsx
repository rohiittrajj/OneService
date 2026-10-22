"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Mail, Lock, Loader2, CheckCircle,
  Eye, EyeOff, KeyRound, RefreshCw, Sparkles, ArrowRight, ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

type Step = "email" | "otp" | "reset" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const sendOTP = async (targetEmail?: string) => {
    const toSend = (targetEmail || email).trim();
    if (!toSend) {
      toast.error("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email: toSend });
      if (res.data?.userId) setUserId(res.data.userId);
      if (res.data?.demoOtp) setDemoOtp(res.data.demoOtp);
      setEmail(toSend);
      setStep("otp");
      setResendCooldown(60);
      toast.success(res.data?.message || "Reset OTP sent to your email!");
    } catch (err: any) {
      if (err.response?.status === 404) {
        toast.error("No account found with this email. Please check your spelling or sign up first.");
      } else {
        toast.error(err.response?.data?.message || "Failed to send reset code. Please check your network and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP code.");
      return;
    }
    setStep("reset");
  };

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match. Please check again.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        userId,
        email,
        otp: otp.trim(),
        newPassword,
      });
      setStep("success");
      toast.success("Password reset successfully!");
      setTimeout(() => {
        router.push("/auth/login");
      }, 2500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reset password. Please verify your OTP.");
    } finally {
      setLoading(false);
    }
  };

  const quickFillAndSend = (demoEmail: string) => {
    setEmail(demoEmail);
    sendOTP(demoEmail);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-hero-gradient">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card w-full max-w-md p-8 shadow-xl"
      >
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/auth/login"
            className="btn-ghost px-2.5 py-1.5 inline-flex items-center gap-1 text-xs text-slate-600 hover:text-primary-600"
          >
            <ChevronLeft size={16} /> Back to Login
          </Link>
          <span className="text-xs font-semibold text-slate-400">
            {step === "email" && "Step 1 of 3"}
            {step === "otp" && "Step 2 of 3"}
            {step === "reset" && "Step 3 of 3"}
            {step === "success" && "Complete"}
          </span>
        </div>

        {/* Step Indicator Progress Bar */}
        {step !== "success" && (
          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className={`h-1.5 rounded-full transition-all ${step === "email" || step === "otp" || step === "reset" ? "bg-primary-600" : "bg-slate-200"}`} />
            <div className={`h-1.5 rounded-full transition-all ${step === "otp" || step === "reset" ? "bg-primary-600" : "bg-slate-200"}`} />
            <div className={`h-1.5 rounded-full transition-all ${step === "reset" ? "bg-primary-600" : "bg-slate-200"}`} />
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── STEP 1: EMAIL ─────────────────────────────────────────── */}
          {step === "email" && (
            <motion.div
              key="step-email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-5"
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <KeyRound size={28} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">Forgot Password?</h1>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Enter your registered email and we'll send you a 6-digit verification code to reset your password.
                </p>
              </div>

              {/* 1-Click Demo Test Shortcuts */}
              <div className="p-3 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 rounded-xl">
                <p className="text-[11px] font-bold text-primary-800 mb-2 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-primary-600" /> Fast Demo Test Accounts:
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => quickFillAndSend("rkroohiit@gmail.com")}
                    className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-medium text-slate-700 text-left transition-all hover:border-primary-300 shadow-2xs"
                  >
                    <span className="block font-semibold text-slate-800 truncate">Rohit (Live Gmail)</span>
                    <span className="text-[9px] text-slate-400 truncate block">rkroohiit@gmail.com</span>
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => quickFillAndSend("customer@oneservice.com")}
                    className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-medium text-slate-700 text-left transition-all hover:border-primary-300 shadow-2xs"
                  >
                    <span className="block font-semibold text-slate-800 truncate">Customer</span>
                    <span className="text-[9px] text-slate-400 truncate block">customer@oneservice.com</span>
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => quickFillAndSend("vendor@oneservice.com")}
                    className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-medium text-slate-700 text-left transition-all hover:border-primary-300 shadow-2xs"
                  >
                    <span className="block font-semibold text-slate-800 truncate">Vendor</span>
                    <span className="text-[9px] text-slate-400 truncate block">vendor@oneservice.com</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="input-label">Email Address</label>
                <div className="relative">
                  <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendOTP()}
                    placeholder="Enter your registered email"
                    className="input-field pl-10"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => sendOTP()}
                disabled={!email.trim() || loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Sending Reset Code..." : "Send Reset Code"}
                {!loading && <ArrowRight size={16} />}
              </button>
            </motion.div>
          )}

          {/* ── STEP 2: OTP VERIFICATION ─────────────────────────────── */}
          {step === "otp" && (
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Mail size={28} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Verify Your OTP</h2>
                <p className="text-slate-500 text-xs mt-1">
                  We dispatched a 6-digit code for <strong className="text-slate-800">{email}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-xs text-primary-600 hover:underline mt-1 inline-block"
                >
                  Change email address
                </button>
              </div>

              {/* Instant Auto-Fill Banner (Never blocked by email provider limits) */}
              {demoOtp && (
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                        <Sparkles size={12} className="text-blue-600" /> Verification Code:
                      </p>
                      <p className="text-xl font-bold tracking-widest text-primary-700 mt-0.5">
                        {demoOtp}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtp(demoOtp)}
                      className="px-3 py-1.5 bg-white hover:bg-blue-50 text-primary-600 text-xs font-bold rounded-lg border border-primary-200 shadow-2xs transition-all hover:scale-105"
                    >
                      Auto-Fill Code
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-snug">
                    Email has been sent. You can also use this verified code directly to continue.
                  </p>
                </div>
              )}

              <div>
                <label className="input-label text-center block">Enter 6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && otp.trim().length === 6 && handleVerifyOTP()}
                  placeholder="• • • • • •"
                  className="input-field text-center text-3xl font-bold tracking-[0.4em] py-3 text-primary-700 bg-white"
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={() => handleVerifyOTP()}
                disabled={otp.trim().length !== 6}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                Continue to Set Password <ArrowRight size={16} />
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Didn't receive the code?</span>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={() => sendOTP()}
                  className="text-primary-600 font-semibold hover:underline disabled:text-slate-400 flex items-center gap-1"
                >
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                  {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend Code"}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: NEW PASSWORD ─────────────────────────────────── */}
          {step === "reset" && (
            <motion.div
              key="step-reset"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-5"
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <ShieldCheck size={28} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Set New Password</h2>
                <p className="text-slate-500 text-xs mt-1">
                  Choose a new strong password for your OneService account.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="input-label">New Password</label>
                  <div className="relative">
                    <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="input-field pl-10 pr-10"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {newPassword && newPassword.length < 8 && (
                    <p className="text-[11px] text-amber-600 mt-1">Must be at least 8 characters.</p>
                  )}
                </div>

                <div>
                  <label className="input-label">Confirm New Password</label>
                  <div className="relative">
                    <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                      placeholder="Re-enter your password"
                      className="input-field pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-[11px] text-red-500 mt-1">Passwords do not match.</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleResetPassword()}
                disabled={
                  loading ||
                  !newPassword ||
                  newPassword.length < 8 ||
                  newPassword !== confirmPassword
                }
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Updating Password..." : "Reset Password"}
              </button>
            </motion.div>
          )}

          {/* ── STEP 4: SUCCESS ──────────────────────────────────────── */}
          {step === "success" && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle size={36} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Password Reset!</h2>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
                Your password has been successfully updated. You can now log into your account using your new password.
              </p>
              <div className="pt-2">
                <Link
                  href="/auth/login"
                  className="btn-primary w-full py-3 inline-flex items-center justify-center gap-2"
                >
                  Go to Login <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

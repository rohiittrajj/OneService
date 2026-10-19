"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Loader2, Sparkles, Shield, User, Wrench } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);

  // Unverified account handling
  const [unverifiedUserId, setUnverifiedUserId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const {
    register, handleSubmit, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post("/auth/login", data);
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);

      // Redirect based on role
      if (user.role === "admin") router.push("/admin");
      else if (user.role === "vendor") router.push("/vendor/dashboard");
      else router.push("/dashboard");
    } catch (err: any) {
      if (err.response?.data?.requiresVerification) {
        setUnverifiedUserId(err.response.data.userId);
        toast(err.response.data.message || "Please enter the OTP sent to your email.", {
          icon: "📧",
        });
      } else {
        toast.error(err.response?.data?.message || "Login failed. Try again.");
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) return toast.error("Enter valid 6-digit OTP");
    setVerifyingOtp(true);
    try {
      const res = await api.post("/auth/verify-otp", {
        userId: unverifiedUserId,
        otp,
      });
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      toast.success("Email verified! Welcome to OneService.");
      if (user.role === "admin") router.push("/admin");
      else if (user.role === "vendor") router.push("/vendor/dashboard");
      else router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const fillDemo = (email: string, pass: string) => {
    setValue("email", email);
    setValue("password", pass);
    toast.success(`Filled credentials for ${email}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-hero-gradient">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold">OS</span>
            </div>
            <span className="text-2xl font-bold text-slate-800">OneService</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Welcome back</h1>
          <p className="text-slate-500 text-xs mt-1">Sign in to your account</p>
        </div>

        {/* 1-Click Demo Login Bar for College Showcase */}
        <div className="mb-6 p-3 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary-800 mb-2">
            <Sparkles size={13} className="text-primary-600" /> College Showcase 1-Click Login:
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => fillDemo("customer@oneservice.com", "Password@123")}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <User size={12} className="text-blue-500" /> Customer
            </button>
            <button
              type="button"
              onClick={() => fillDemo("rkroohiit@gmail.com", "Password@123")}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <Wrench size={12} className="text-amber-500" /> Rohit (Vendor)
            </button>
            <button
              type="button"
              onClick={() => fillDemo("vendor@oneservice.com", "Password@123")}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <Wrench size={12} className="text-orange-500" /> Demo Vendor
            </button>
            <button
              type="button"
              onClick={() => fillDemo("admin@oneservice.com", "Admin@123")}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <Shield size={12} className="text-purple-500" /> Admin
            </button>
          </div>
        </div>

        {/* Unverified OTP Screen */}
        {unverifiedUserId ? (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-semibold text-amber-800">
                Your email is not verified yet. An OTP has been dispatched to your email (and logged in the server console).
              </p>
            </div>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit OTP"
              className="input-field text-center text-xl font-bold tracking-widest"
            />
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={verifyingOtp || otp.length !== 6}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {verifyingOtp && <Loader2 size={16} className="animate-spin" />}
              Verify & Sign In
            </button>
            <button
              type="button"
              onClick={() => setUnverifiedUserId(null)}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Back to Regular Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="input-label">Email Address</label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@example.com"
                  className="input-field pl-10"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  {...register("password")}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-xs text-primary-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {isSubmitting && <Loader2 size={17} className="animate-spin" />}
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-500 mt-6">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="text-primary-600 font-semibold hover:underline">
            Sign Up Free
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

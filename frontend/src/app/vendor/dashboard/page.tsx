"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  IndianRupee, Calendar, CheckCircle, Clock, Star,
  Bell, Plus, Loader2, TrendingUp, Users, Package, ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";
import { useSocket } from "@/hooks/useSocket";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:     { label: "Pending",     cls: "status-pending" },
  accepted:    { label: "Accepted",    cls: "status-accepted" },
  in_progress: { label: "In Progress", cls: "status-in_progress" },
  completed:   { label: "Completed",   cls: "status-completed" },
  cancelled:   { label: "Cancelled",   cls: "status-cancelled" },
};

export default function VendorDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) router.push("/auth/login");
    if (user?.role === "user") router.push("/dashboard");
  }, [isAuthenticated, user]);

  // Listen for new bookings in real-time
  useEffect(() => {
    if (!socket) return;
    socket.on("new_booking", (data: any) => {
      toast.success("🔔 New booking request received!");
      queryClient.invalidateQueries("vendor-bookings");
    });
    return () => { socket.off("new_booking"); };
  }, [socket]);

  const { data: vendorData, isLoading: vendorLoading } = useQuery(
    "vendor-me",
    () => api.get("/vendors/me").then((r) => r.data).catch((err) => {
      if (err.response?.status === 404) return { data: null };
      throw err;
    }),
    { enabled: isAuthenticated }
  );
  const { data: bookingsData, isLoading } = useQuery(
    "vendor-bookings",
    () => api.get(`/vendors/${vendorData?.data?._id}/bookings?limit=10`).then((r) => r.data),
    { enabled: !!vendorData?.data?._id }
  );

  const vendor = vendorData?.data;
  const bookings = bookingsData?.data || [];

  const statusMutation = useMutation(
    ({ bookingId, status }: { bookingId: string; status: string }) =>
      api.patch(`/bookings/${bookingId}/status`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("vendor-bookings");
        toast.success("Booking status updated.");
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to update.");
      },
    }
  );

  // Unregistered vendor profile screen
  if (!vendorLoading && vendor === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hero-gradient p-4">
        <div className="glass-card p-10 text-center max-w-md">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Complete Vendor Profile</h2>
          <p className="text-slate-500 mb-6">
            You are signed in as a vendor! Please complete your business registration to start receiving customer bookings.
          </p>
          <Link href="/vendor/register" className="btn-primary w-full block py-3 text-center">
            Complete Registration Now
          </Link>
        </div>
      </div>
    );
  }

  // Pending approval screen
  if (vendor && vendor.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hero-gradient">
        <div className="glass-card p-10 text-center max-w-md">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Application Under Review</h2>
          <p className="text-slate-500 mb-6">Your vendor application is being reviewed by our team. You'll receive an email once approved (usually within 24 hours).</p>
          <button onClick={() => logout()} className="btn-secondary">Logout</button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Earnings",   value: `₹${vendor?.earnings?.total?.toLocaleString() || 0}`, icon: IndianRupee, color: "text-green-600 bg-green-50" },
    { label: "Total Bookings",   value: vendor?.totalBookings || 0,    icon: Calendar,  color: "text-blue-600 bg-blue-50" },
    { label: "Completed",        value: vendor?.completedBookings || 0, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
    { label: "Rating",           value: `${vendor?.rating || "0"} ★`,  icon: Star,      color: "text-yellow-600 bg-yellow-50" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Header */}
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">OS</span>
          </div>
          <span className="font-bold text-slate-800">Vendor Dashboard</span>
          {vendor?.isVerified && <span className="badge-blue">✓ Verified</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden md:block">ID: {vendor?.vendorId}</span>
          <Link href="/vendor/services/new" className="btn-primary text-sm py-2 flex items-center gap-1.5">
            <Plus size={15} /> Add Service
          </Link>
          <button onClick={() => logout()} className="btn-ghost text-sm">Logout</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome back, {vendor?.businessName || user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage your bookings and grow your business</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <s.icon size={20} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Bookings list */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 text-lg">Incoming Bookings</h2>
              <Link href="/vendor/bookings" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                View all <ArrowRight size={13} />
              </Link>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-primary-400" size={32} /></div>
            ) : bookings.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <Calendar size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No bookings yet. Add services to attract customers.</p>
                <Link href="/vendor/services/new" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
                  <Plus size={16} /> Add Your First Service
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b: any) => (
                  <div key={b._id} className="glass-card p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Users size={18} className="text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-800 text-sm">{b.service?.title}</p>
                          <span className={STATUS_CONFIG[b.status]?.cls || "badge-gray"}>{STATUS_CONFIG[b.status]?.label}</span>
                          {b.isUrgent && <span className="badge bg-red-100 text-red-600">⚡ Urgent</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Customer: {b.user?.name}</p>
                        <p className="text-xs text-slate-400">{b.scheduledAt ? format(new Date(b.scheduledAt), "MMM d, yyyy · hh:mm a") : "—"}</p>
                        <p className="text-sm font-semibold text-slate-700 mt-1">₹{b.amount?.total}</p>
                      </div>

                      {/* Action buttons */}
                      {b.status === "pending" && (
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => statusMutation.mutate({ bookingId: b._id, status: "accepted" })}
                            disabled={statusMutation.isLoading}
                            className="btn-primary text-xs py-1.5 px-3"
                          >Accept</button>
                          <button
                            onClick={() => statusMutation.mutate({ bookingId: b._id, status: "rejected" })}
                            disabled={statusMutation.isLoading}
                            className="btn-danger text-xs py-1.5 px-3"
                          >Reject</button>
                        </div>
                      )}
                      {b.status === "accepted" && (
                        <button
                          onClick={() => statusMutation.mutate({ bookingId: b._id, status: "in_progress" })}
                          disabled={statusMutation.isLoading}
                          className="btn-primary text-xs py-1.5 px-3 flex-shrink-0"
                        >Start Job</button>
                      )}
                      {b.status === "in_progress" && (
                        <button
                          onClick={() => statusMutation.mutate({ bookingId: b._id, status: "completed" })}
                          disabled={statusMutation.isLoading}
                          className="bg-green-500 hover:bg-green-600 text-white font-semibold text-xs py-1.5 px-3 rounded-lg flex-shrink-0"
                        >Mark Done</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            <div className="glass-card p-5">
              <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { href: "/vendor/services",   icon: Package,   label: "My Services" },
                  { href: "/vendor/earnings",   icon: IndianRupee, label: "Earnings" },
                  { href: "/vendor/profile",    icon: Users,     label: "Edit Profile" },
                  { href: "/vendor/schedule",   icon: Clock,     label: "Set Availability" },
                ].map((a) => (
                  <Link key={a.href} href={a.href}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 transition-colors cursor-pointer">
                      <a.icon size={17} className="text-primary-500" />
                      <span className="text-sm text-slate-700 font-medium">{a.label}</span>
                      <ArrowRight size={13} className="text-slate-400 ml-auto" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-bold text-slate-800 mb-3">Earnings This Month</h3>
              <div className="text-3xl font-bold text-green-600 mb-1">
                ₹{vendor?.earnings?.pending?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-slate-500">Pending payout</p>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total earned</span>
                  <span className="font-semibold text-slate-700">₹{vendor?.earnings?.total?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-500">Withdrawn</span>
                  <span className="font-semibold text-slate-700">₹{vendor?.earnings?.withdrawn?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

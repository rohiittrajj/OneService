"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft, Calendar, Clock, MapPin, CheckCircle,
  XCircle, Loader2, Phone, MessageSquare, AlertCircle, ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-800" },
  accepted: { label: "Accepted", cls: "bg-blue-100 text-blue-800" },
  in_progress: { label: "In Progress", cls: "bg-purple-100 text-purple-800" },
  completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Cancelled", cls: "bg-rose-100 text-rose-800" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-800" },
};

export default function VendorBookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState("all");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) router.push("/auth/login");
    if (user && user.role !== "vendor" && user.role !== "admin") router.push("/dashboard");
  }, [isAuthenticated, user]);

  const { data: vendorData } = useQuery(
    "vendor-me-bookings",
    () => api.get("/vendors/me").then((r) => r.data),
    { enabled: isAuthenticated }
  );

  const vendorId = vendorData?.data?._id;

  const { data: bookingsData, isLoading } = useQuery(
    ["vendor-all-bookings", vendorId, activeTab],
    () =>
      api
        .get(`/vendors/${vendorId}/bookings`, {
          params: {
            limit: 50,
            ...(activeTab !== "all" && { status: activeTab }),
          },
        })
        .then((r) => r.data),
    { enabled: !!vendorId }
  );

  const statusMutation = useMutation(
    ({ bookingId, status, note }: { bookingId: string; status: string; note?: string }) =>
      api.patch(`/bookings/${bookingId}/status`, { status, note }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("vendor-all-bookings");
        queryClient.invalidateQueries("vendor-bookings");
        toast.success("Booking status updated!");
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to update status.");
      },
    }
  );

  const bookings = bookingsData?.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Header */}
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/vendor/dashboard" className="btn-ghost p-2">
            <ChevronLeft size={20} />
          </Link>
          <span className="font-bold text-slate-800">Booking Management</span>
        </div>
        <Link href="/vendor/dashboard" className="btn-ghost text-xs">
          Dashboard
        </Link>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Title & Tabs */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Customer Bookings</h1>
          <p className="text-slate-500 text-sm">Review, accept, and manage the execution of incoming service jobs.</p>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === t.key
                  ? "bg-primary-500 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-primary-500 mb-3" size={36} />
            <p className="text-slate-500 text-sm">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-md mx-auto">
            <p className="text-4xl mb-3">📋</p>
            <h3 className="font-bold text-slate-800 mb-1">No {activeTab !== "all" ? activeTab : ""} bookings</h3>
            <p className="text-slate-500 text-sm">You'll receive a real-time notification whenever a customer books a service.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking: any) => {
              const badge = STATUS_BADGES[booking.status] || { label: booking.status, cls: "bg-slate-100 text-slate-800" };
              return (
                <motion.div
                  key={booking._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-card-hover transition-all"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-bold text-slate-800 text-base">{booking.service?.title}</span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                      {booking.isUrgent && (
                        <span className="badge bg-amber-500 text-white text-[11px] font-bold py-0.5 px-2">
                          ⚡ Urgent
                        </span>
                      )}
                      <span className="text-xs text-slate-400 ml-auto font-mono">{booking.bookingId}</span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span>{format(new Date(booking.scheduledAt), "EEEE, MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <span>{format(new Date(booking.scheduledAt), "hh:mm a")}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">{booking.address?.full || "Customer Address"}</span>
                      </div>
                    </div>

                    {booking.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="font-semibold text-slate-700">Customer Note:</span> {booking.notes}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs pt-1">
                      <span className="font-bold text-slate-700">
                        Payout: <span className="text-primary-600 text-sm">₹{booking.amount?.base}</span>
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600">Customer: <strong className="text-slate-800">{booking.user?.name}</strong></span>
                      {booking.user?.phone && (
                        <a href={`tel:${booking.user.phone}`} className="text-primary-600 hover:underline flex items-center gap-1">
                          <Phone size={12} /> {booking.user.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions based on current status */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 min-w-[170px] justify-center">
                    {booking.status === "pending" && (
                      <>
                        <button
                          onClick={() => statusMutation.mutate({ bookingId: booking._id, status: "accepted" })}
                          disabled={statusMutation.isLoading}
                          className="btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle size={14} /> Accept Booking
                        </button>
                        <button
                          onClick={() => statusMutation.mutate({ bookingId: booking._id, status: "rejected" })}
                          disabled={statusMutation.isLoading}
                          className="btn-danger text-xs py-2 flex items-center justify-center gap-1.5"
                        >
                          <XCircle size={14} /> Decline
                        </button>
                      </>
                    )}

                    {booking.status === "accepted" && (
                      <button
                        onClick={() => statusMutation.mutate({ bookingId: booking._id, status: "in_progress" })}
                        disabled={statusMutation.isLoading}
                        className="btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
                      >
                        🚀 Start Service
                      </button>
                    )}

                    {booking.status === "in_progress" && (
                      <button
                        onClick={() => statusMutation.mutate({ bookingId: booking._id, status: "completed" })}
                        disabled={statusMutation.isLoading}
                        className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle size={14} /> Mark Completed
                      </button>
                    )}

                    <Link
                      href={`/dashboard/bookings/${booking._id}`}
                      className="btn-secondary text-xs py-2 text-center flex items-center justify-center gap-1"
                    >
                      <MessageSquare size={13} /> View Details & Chat
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

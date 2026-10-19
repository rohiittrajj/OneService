"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft, Loader2, MapPin, Clock, CheckCircle,
  XCircle, MessageSquare, Download, CreditCard,
  Calendar, Zap, AlertCircle, Send, Phone, Star
} from "lucide-react";
import toast from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useSocket } from "@/hooks/useSocket";
import { format } from "date-fns";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const STATUS_STEPS = ["pending","accepted","in_progress","completed"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Booking Pending", accepted: "Vendor Accepted",
  in_progress: "In Progress", completed: "Completed",
  cancelled: "Cancelled", rejected: "Rejected",
};

// ── Stripe Payment Form ────────────────────────────────────────────────────────
function PaymentForm({ bookingId, amount, onSuccess }: { bookingId: string; amount: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoPay = async () => {
    setDemoLoading(true);
    try {
      await api.post("/payments/demo-pay", { bookingId });
      toast.success("Payment verified successfully! 🎉");
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Demo payment failed.");
    } finally {
      setDemoLoading(false);
    }
  };

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const { data } = await api.post("/payments/create-intent", { bookingId });
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement)! },
      });
      if (result.error) {
        toast.error(result.error.message || "Payment failed.");
      } else if (result.paymentIntent?.status === "succeeded") {
        toast.success("Payment successful! 🎉");
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Payment error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* 1-Click Demo Payment Option for college showcase */}
      <button
        type="button"
        onClick={handleDemoPay}
        disabled={demoLoading || loading}
        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
      >
        {demoLoading ? <Loader2 size={15} className="animate-spin" /> : <span>⚡ Instant Demo Pay (₹{amount})</span>}
      </button>

      <div className="relative flex items-center justify-center my-2">
        <div className="border-t border-slate-200 w-full" />
        <span className="bg-white px-3 text-[10px] text-slate-400 uppercase font-bold tracking-wider absolute">Or Stripe Card</span>
      </div>

      <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
        <CardElement options={{ style: { base: { fontSize: "14px", color: "#1e293b", "::placeholder": { color: "#94a3b8" } } } }} />
      </div>
      <button onClick={handlePay} disabled={loading || !stripe || demoLoading} className="btn-primary w-full flex items-center justify-center gap-2 text-xs py-2.5">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
        {loading ? "Processing..." : `Pay ₹${amount} with Card`}
      </button>
      <p className="text-[11px] text-slate-400 text-center">🔒 Test card: 4242 4242 4242 4242</p>
    </div>
  );
}

// ── Chat Component ─────────────────────────────────────────────────────────────
function ChatSection({ booking }: { booking: any }) {
  const { user } = useAuthStore();
  const socket = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isCustomer = user?._id === (booking.user?._id || booking.user);
  const otherUser = isCustomer ? booking.vendor?.user : booking.user;

  useEffect(() => {
    api.get(`/chat/${booking._id}`).then((r) => { setMessages(r.data.data); setLoading(false); });
  }, [booking._id]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("join_booking", { bookingId: booking._id });
    socket.on("new_message", (msg: any) => setMessages((prev) => [...prev, msg]));
    return () => { socket.off("new_message"); };
  }, [socket, booking._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !socket) return;
    const targetReceiverId = isCustomer
      ? (booking.vendor?.user?._id || booking.vendor?.user)
      : (booking.user?._id || booking.user);

    if (!targetReceiverId) {
      toast.error("Unable to send: receiver not found.");
      return;
    }

    socket.emit("send_message", {
      bookingId: booking._id,
      receiverId: targetReceiverId,
      message: text.trim(),
    });
    setText("");
  };

  return (
    <div className="glass-card flex flex-col h-96">
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <MessageSquare size={18} className="text-primary-500" />
        <p className="font-semibold text-slate-800 text-sm">
          Chat with {isCustomer ? (booking.vendor?.businessName || "Vendor") : (booking.user?.name || "Customer")}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center"><Loader2 className="animate-spin text-slate-300" size={24} /></div>
        ) : messages.length === 0 ? (
          <p className="text-slate-400 text-sm text-center mt-8">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((m: any) => {
            const isMine = m.sender?._id === user?._id || m.sender === user?._id;
            return (
              <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={isMine ? "chat-bubble-sent" : "chat-bubble-received"}>
                  <p>{m.message}</p>
                  <p className={`text-xs mt-1 ${isMine ? "text-primary-100" : "text-slate-400"}`}>
                    {format(new Date(m.createdAt), "hh:mm a")}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="input-field flex-1 py-2 text-sm"
        />
        <button onClick={sendMessage} disabled={!text.trim()} className="btn-primary py-2 px-3">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Main Booking Detail Page ───────────────────────────────────────────────────
export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [showPayment, setShowPayment] = useState(false);
  const [vendorLocation, setVendorLocation] = useState<[number, number] | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadReceipt = async () => {
    if (!booking) return;
    setDownloading(true);
    try {
      const res = await api.get(`/bookings/${booking._id}/receipt`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${booking.bookingId || "booking"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Receipt downloaded successfully!");
    } catch {
      toast.error("Receipt generation failed. Ensure booking is completed.");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) router.push("/auth/login");
  }, [isAuthenticated]);

  const { data, isLoading, refetch } = useQuery(
    ["booking", id],
    () => api.get(`/bookings/${id}`).then((r) => r.data),
    { enabled: isAuthenticated }
  );

  // Listen for real-time updates
  useEffect(() => {
    if (!socket || !id) return;
    socket.emit("join_booking", { bookingId: id });
    socket.on("booking_status_update", () => { refetch(); toast.success("Booking status updated!"); });
    socket.on("vendor_location_update", ({ coordinates }: any) => setVendorLocation(coordinates));
    return () => { socket.off("booking_status_update"); socket.off("vendor_location_update"); };
  }, [socket, id]);

const cancelMutation = useMutation(
  () =>
    api.patch(`/bookings/${id}/status`, {
      status: "cancelled",
      cancellationReason: "Cancelled by user.",
    }),
  {
    onSuccess: () => {
      toast.success("Booking cancelled.");
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Cancel failed.");
    },
  }
);

  const booking = data?.data;

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary-400" size={40} /></div>;
  if (!booking) return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-500">Booking not found.</p></div>;

  const currentStep = STATUS_STEPS.indexOf(booking.status);
  const isUser = user?._id === booking.user?._id;
  const canPay = booking.status === "accepted" && isUser;
  const canCancel = ["pending", "accepted"].includes(booking.status) && isUser;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2"><ChevronLeft size={20} /></button>
        <span className="font-bold text-slate-800">Booking Details</span>
        <span className="badge-gray ml-auto text-xs">{booking.bookingId}</span>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* Status tracker */}
            {!["cancelled","rejected"].includes(booking.status) && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                <h2 className="font-bold text-slate-800 mb-5">Booking Progress</h2>
                <div className="relative">
                  <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-200" />
                  <div className="space-y-5">
                    {STATUS_STEPS.map((step, i) => {
                      const done = i <= currentStep;
                      const active = i === currentStep;
                      return (
                        <div key={step} className="flex items-center gap-4 relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 flex-shrink-0 transition-colors ${done ? "bg-primary-500 text-white" : "bg-slate-100 text-slate-400"} ${active ? "ring-4 ring-primary-200" : ""}`}>
                            {done ? <CheckCircle size={18} /> : <div className="w-3 h-3 rounded-full bg-current" />}
                          </div>
                          <div>
                            <p className={`font-medium text-sm ${done ? "text-slate-800" : "text-slate-400"}`}>{STATUS_LABELS[step]}</p>
                            {booking.timeline?.find((t: any) => t.status === step) && (
                              <p className="text-xs text-slate-400">
                                {format(new Date(booking.timeline.find((t: any) => t.status === step).timestamp), "MMM d · hh:mm a")}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Cancelled / Rejected */}
            {["cancelled","rejected"].includes(booking.status) && (
              <div className="glass-card p-6 border border-red-100">
                <div className="flex items-center gap-3 text-red-600">
                  <XCircle size={24} />
                  <h2 className="font-bold text-lg">Booking {booking.status}</h2>
                </div>
                {booking.cancellationReason && <p className="text-slate-500 text-sm mt-2">{booking.cancellationReason}</p>}
              </div>
            )}

            {/* Booking info */}
            <div className="glass-card p-6">
              <h2 className="font-bold text-slate-800 mb-4">Booking Information</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {[
                  { label: "Service", value: booking.service?.title },
                  { label: "Vendor",  value: booking.vendor?.businessName },
                  { label: "Date",    value: format(new Date(booking.scheduledAt), "EEEE, MMM d yyyy") },
                  { label: "Time",    value: format(new Date(booking.scheduledAt), "hh:mm a") },
                  { label: "Address", value: booking.address?.full },
                  { label: "Urgent",  value: booking.isUrgent ? "⚡ Yes" : "No" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-slate-400 text-xs mb-0.5">{item.label}</p>
                    <p className="font-medium text-slate-700">{item.value || "—"}</p>
                  </div>
                ))}
              </div>
              {booking.notes && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-slate-400 text-xs mb-1">Notes</p>
                  <p className="text-slate-600 text-sm">{booking.notes}</p>
                </div>
              )}
            </div>

            {/* Live map placeholder */}
            {booking.status === "in_progress" && (
              <div className="glass-card p-6">
                <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <MapPin size={18} className="text-primary-500" /> Live Vendor Location
                </h2>
                <div className="h-48 rounded-xl bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center">
                  {vendorLocation ? (
                    <div className="text-center">
                      <p className="text-4xl mb-2">📍</p>
                      <p className="text-slate-600 text-sm">Vendor is on the way</p>
                      <p className="text-xs text-slate-400 mt-1">{vendorLocation[1].toFixed(4)}, {vendorLocation[0].toFixed(4)}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Loader2 className="animate-spin text-primary-400 mx-auto mb-2" size={28} />
                      <p className="text-slate-500 text-sm">Waiting for vendor location...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chat */}
            <ChatSection booking={booking} />
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Price breakdown */}
            <div className="glass-card p-5">
              <h3 className="font-bold text-slate-800 mb-4">Payment Summary</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Base price</span><span>₹{booking.amount?.base}</span></div>
                {booking.amount?.urgentFee > 0 && (
                  <div className="flex justify-between"><span className="text-slate-500">Urgent fee</span><span className="text-orange-500">+₹{booking.amount.urgentFee}</span></div>
                )}
                <div className="flex justify-between"><span className="text-slate-500">Platform fee</span><span>₹{booking.amount?.platformFee}</span></div>
                <div className="border-t border-slate-200 pt-2.5 flex justify-between font-bold text-base">
                  <span>Total</span><span className="text-primary-600">₹{booking.amount?.total}</span>
                </div>
              </div>
            </div>

            {/* Payment */}
            {canPay && (
              <div className="glass-card p-5">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <CreditCard size={17} className="text-primary-500" /> Make Payment
                </h3>
                {!showPayment ? (
                  <button onClick={() => setShowPayment(true)} className="btn-primary w-full">
                    Pay ₹{booking.amount?.total}
                  </button>
                ) : (
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      bookingId={booking._id}
                      amount={booking.amount?.total}
                      onSuccess={() => { setShowPayment(false); refetch(); }}
                    />
                  </Elements>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="glass-card p-5 space-y-3">
              <h3 className="font-bold text-slate-800 mb-1">Actions</h3>

              {booking.status === "completed" && isUser && (
                <Link
                  href={`/dashboard/reviews?bookingId=${booking._id}`}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Star size={15} className="fill-white" />
                  Leave a Review
                </Link>
              )}

              {(booking.status === "completed" || booking.paymentStatus === "paid") && (
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  disabled={downloading}
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                >
                  {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Download PDF Receipt
                </button>
              )}

              {canCancel && (
                <button
                  onClick={() => { if (confirm("Are you sure you want to cancel this booking?")) cancelMutation.mutate(); }}
                  disabled={cancelMutation.isLoading}
                  className="btn-danger w-full flex items-center justify-center gap-2 text-sm"
                >
                  {cancelMutation.isLoading ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                  Cancel Booking
                </button>
              )}

              <Link href="/dashboard" className="btn-ghost w-full flex items-center justify-center text-sm">
                ← Back to Dashboard
              </Link>
            </div>

            {/* Contact Card */}
            <div className="glass-card p-5">
              <h3 className="font-bold text-slate-800 mb-3">{isUser ? "Vendor Contact" : "Customer Contact"}</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center font-bold text-primary-700">
                  {isUser ? booking.vendor?.businessName?.charAt(0) : booking.user?.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-sm">
                    {isUser ? booking.vendor?.businessName : booking.user?.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {isUser ? `ID: ${booking.vendor?.vendorId || "Verified"}` : (booking.user?.email || "Customer")}
                  </p>
                </div>
              </div>
              {isUser ? (
                (booking.vendor?.user?.phone || booking.vendor?.phone) && (
                  <a href={`tel:${booking.vendor?.user?.phone || booking.vendor?.phone}`} className="btn-secondary w-full mt-3 text-sm flex items-center justify-center gap-2">
                    <Phone size={15} /> Call Vendor
                  </a>
                )
              ) : (
                booking.user?.phone && (
                  <a href={`tel:${booking.user?.phone}`} className="btn-secondary w-full mt-3 text-sm flex items-center justify-center gap-2">
                    <Phone size={15} /> Call Customer
                  </a>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

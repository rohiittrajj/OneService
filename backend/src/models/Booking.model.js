/**
 * OneService – Booking Model
 */
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      default: () => "BK-" + uuidv4().slice(0, 10).toUpperCase(),
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },

    status: {
      type: String,
      enum: [
        "pending",      // User created booking
        "accepted",     // Vendor accepted
        "rejected",     // Vendor rejected
        "in_progress",  // Vendor is on the way / working
        "completed",    // Work done
        "cancelled",    // Cancelled by user or vendor
        "refunded",
      ],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },

    scheduledAt: { type: Date, required: true },
    isUrgent: { type: Boolean, default: false },

    address: {
      full: { type: String, required: true },
      coordinates: { lat: Number, lng: Number },
    },

    amount: {
      base: { type: Number, required: true },
      urgentFee: { type: Number, default: 0 },
      platformFee: { type: Number, default: 0 },
      total: { type: Number, required: true },
      currency: { type: String, default: "INR" },
    },

    notes: { type: String, default: "" },

    // Timeline tracking
    timeline: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],

    // AI problem detection
    problemImageUrl: { type: String, default: "" },
    aiAnalysis: { type: Object, default: null },

    cancellationReason: { type: String, default: "" },
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ vendor: 1, status: 1 });
bookingSchema.index({ scheduledAt: 1 });

module.exports = mongoose.model("Booking", bookingSchema);

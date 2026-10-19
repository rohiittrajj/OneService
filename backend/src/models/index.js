/**
 * OneService – Review Model
 */
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },

    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    images: [{ type: String }],

    // AI sentiment analysis result
    sentiment: {
      score: { type: Number, default: null },
      label: { type: String, default: "" }, // positive, neutral, negative
      isFake: { type: Boolean, default: false },
      flagReason: { type: String, default: "" },
    },

    vendorReply: {
      text: { type: String, default: "" },
      repliedAt: { type: Date },
    },

    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reviewSchema.index({ vendor: 1, isVisible: 1 });
reviewSchema.index({ service: 1 });

const Review = mongoose.model("Review", reviewSchema);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * OneService – Notification Model
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "booking_confirmed",
        "booking_accepted",
        "booking_rejected",
        "booking_in_progress",
        "booking_completed",
        "booking_cancelled",
        "booking_refunded",
        "payment_success",
        "payment_failed",
        "vendor_approved",
        "vendor_rejected",
        "new_review",
        "chat_message",
        "general",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Object, default: {} }, // extra payload
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * OneService – Chat Message Model
 */
const chatMessageSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, default: "" },
    mediaUrl: { type: String, default: "" },
    mediaType: { type: String, enum: ["image", "video", "file", ""], default: "" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

chatMessageSchema.index({ booking: 1, createdAt: 1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

module.exports = { Review, Notification, ChatMessage };

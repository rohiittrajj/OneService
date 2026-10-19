/**
 * OneService – Service Model
 */
const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, default: "" },
    images: [{ type: String }],
    price: {
      base: { type: Number, required: true },
      unit: { type: String, default: "fixed" }, // fixed, per_hour, per_visit
      currency: { type: String, default: "INR" },
    },
    duration: { type: Number, default: 60 }, // minutes
    isActive: { type: Boolean, default: true },
    tags: [{ type: String }],
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ vendor: 1 });
serviceSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Service", serviceSchema);

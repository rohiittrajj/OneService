/**
 * OneService – Review Routes
 */
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { Review } = require("../models/index");
const Vendor = require("../models/Vendor.model");
const Service = require("../models/Service.model");

// POST /api/reviews
router.post("/", protect, async (req, res, next) => {
  try {
    const { bookingId, vendorId, serviceId, rating, comment, images } = req.body;

    // Check booking belongs to user and is completed
    const Booking = require("../models/Booking.model");
    const booking = await Booking.findOne({ _id: bookingId, user: req.user._id, status: "completed" });
    if (!booking) return res.status(403).json({ success: false, message: "Can only review completed bookings." });

    const exists = await Review.findOne({ booking: bookingId });
    if (exists) return res.status(409).json({ success: false, message: "Already reviewed this booking." });

    // AI sentiment analysis directly in-process
    let sentiment = {};
    if (comment) {
      try {
        const { computeReviewSentiment } = require("../controllers/ai.controller");
        sentiment = await computeReviewSentiment({ reviewText: comment, rating });
      } catch (_) { /* AI analysis optional */ }
    }

    const review = await Review.create({
      booking: bookingId, user: req.user._id,
      vendor: vendorId, service: serviceId,
      rating: Number(rating), comment, images, sentiment,
    });

    // Recalculate vendor & service rating
    const vendorReviews = await Review.find({ vendor: vendorId, isVisible: true });
    const avgRating = vendorReviews.reduce((sum, r) => sum + r.rating, 0) / vendorReviews.length;
    await Vendor.findByIdAndUpdate(vendorId, {
      rating: Number(avgRating.toFixed(1)),
      totalReviews: vendorReviews.length,
    });

    const serviceReviews = await Review.find({ service: serviceId, isVisible: true });
    const svcAvg = serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length;
    await Service.findByIdAndUpdate(serviceId, {
      rating: Number(svcAvg.toFixed(1)),
      totalReviews: serviceReviews.length,
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
});

// GET /api/reviews/vendor/:vendorId
router.get("/vendor/:vendorId", async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const reviews = await Review.find({ vendor: req.params.vendorId, isVisible: true })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Review.countDocuments({ vendor: req.params.vendorId, isVisible: true });
    res.json({ success: true, data: reviews, pagination: { total, page: Number(page) } });
  } catch (err) { next(err); }
});

module.exports = router;

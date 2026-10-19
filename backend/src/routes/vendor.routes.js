/**
 * OneService – Vendor Routes
 */
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const Vendor = require("../models/Vendor.model");
const Service = require("../models/Service.model");

// POST /api/vendors/register — vendor signup
router.post("/register", protect, async (req, res, next) => {
  try {
    const exists = await Vendor.findOne({ user: req.user._id });
    if (exists) return res.status(409).json({ success: false, message: "Vendor profile already exists." });

    const { businessName, description, categories, govIdUrl, certificatesUrls, location } = req.body;
    const vendor = await Vendor.create({
      user: req.user._id,
      businessName, description, categories,
      govIdUrl, certificatesUrls, location,
    });

    // Update user role
    const User = require("../models/User.model");
    await User.findByIdAndUpdate(req.user._id, { role: "vendor" });

    res.status(201).json({ success: true, message: "Vendor application submitted. Awaiting admin approval.", data: vendor });
  } catch (err) { next(err); }
});

// GET /api/vendors/me
router.get("/me", protect, authorize("vendor", "admin"), async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id }).populate("user", "name email phone avatar");
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor profile not found." });
    res.json({ success: true, data: vendor });
  } catch (err) { next(err); }
});

// PATCH /api/vendors/me
router.patch("/me", protect, authorize("vendor", "admin"), async (req, res, next) => {
  try {
    const allowed = ["businessName", "description", "categories", "availability", "location"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const vendor = await Vendor.findOneAndUpdate({ user: req.user._id }, updates, { new: true });
    res.json({ success: true, data: vendor });
  } catch (err) { next(err); }
});

// PATCH /api/vendors/me/live-location
router.patch("/me/live-location", protect, authorize("vendor"), async (req, res, next) => {
  try {
    const { coordinates } = req.body; // [lng, lat]
    const vendor = await Vendor.findOneAndUpdate(
      { user: req.user._id },
      { liveLocation: { coordinates, updatedAt: new Date() } },
      { new: true }
    );

    // Emit to any active booking users
    const { getIO } = require("../socket/socketManager");
    getIO().emit(`vendor_location_${vendor._id}`, { coordinates, updatedAt: new Date() });

    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET /api/vendors/nearby?lat=&lng=&radius=&category=
router.get("/nearby", async (req, res, next) => {
  try {
    const { lat, lng, radius = 50000, category, page = 1, limit = 20 } = req.query;

    const filter = { status: "approved" };

    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      filter.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      };
    }

    if (category && category !== "All") {
      filter.categories = { $in: [category] };
    }

    const sortOption = (lat && lng) ? {} : { rating: -1, totalReviews: -1 };

    const vendors = await Vendor.find(filter)
      .populate("user", "name avatar")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("businessName rating totalReviews vendorId isVerified categories location availability description");

    res.json({ success: true, data: vendors });
  } catch (err) { next(err); }
});

// GET /api/vendors/:id
router.get("/:id", async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate("user", "name avatar");
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found." });
    const services = await Service.find({ vendor: vendor._id, isActive: true });
    res.json({ success: true, data: { vendor, services } });
  } catch (err) { next(err); }
});

// GET /api/vendors/:id/bookings — vendor sees their bookings
router.get("/:id/bookings", protect, authorize("vendor", "admin"), async (req, res, next) => {
  try {
    const Booking = require("../models/Booking.model");
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found." });

    const { status, page = 1, limit = 10 } = req.query;
    const filter = { vendor: vendor._id };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate("user", "name phone avatar")
      .populate("service", "title category")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Booking.countDocuments(filter);
    res.json({ success: true, data: bookings, pagination: { total, page: Number(page) } });
  } catch (err) { next(err); }
});

module.exports = router;

/**
 * OneService – Service Routes
 */
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const Service = require("../models/Service.model");
const Vendor = require("../models/Vendor.model");

// GET /api/services?category=&minPrice=&maxPrice=&rating=&page=
router.get("/", async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, rating, search, page = 1, limit = 12, sortBy = "rating" } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter["price.base"] = {};
      if (minPrice) filter["price.base"].$gte = Number(minPrice);
      if (maxPrice) filter["price.base"].$lte = Number(maxPrice);
    }
    if (rating) filter.rating = { $gte: Number(rating) };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const sortMap = { rating: { rating: -1 }, price_asc: { "price.base": 1 }, price_desc: { "price.base": -1 }, newest: { createdAt: -1 } };
    const sort = sortMap[sortBy] || { rating: -1 };

    const services = await Service.find(filter)
      .populate({ path: "vendor", select: "businessName rating isVerified vendorId", match: { status: "approved" } })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const filtered = services.filter((s) => s.vendor);
    const total = await Service.countDocuments(filter);

    res.json({ success: true, data: filtered, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// GET /api/services/:id
router.get("/:id", async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate("vendor", "businessName rating isVerified vendorId location availability categories");
    if (!service) return res.status(404).json({ success: false, message: "Service not found." });
    res.json({ success: true, data: service });
  } catch (err) { next(err); }
});

// POST /api/services — vendor creates a service
router.post("/", protect, authorize("vendor", "admin"), async (req, res, next) => {
  try {
    let vendorId = req.body.vendor;
    if (req.user.role === "admin") {
      if (!vendorId) {
        const anyApprovedVendor = await Vendor.findOne({ status: "approved" });
        if (!anyApprovedVendor) return res.status(400).json({ success: false, message: "No approved vendors exist to assign this service." });
        vendorId = anyApprovedVendor._id;
      }
    } else {
      const vendor = await Vendor.findOne({ user: req.user._id, status: "approved" });
      if (!vendor) return res.status(403).json({ success: false, message: "Only approved vendors can create services." });
      vendorId = vendor._id;
    }

    const service = await Service.create({ ...req.body, vendor: vendorId });
    res.status(201).json({ success: true, data: service });
  } catch (err) { next(err); }
});

// PATCH /api/services/:id
router.patch("/:id", protect, authorize("vendor", "admin"), async (req, res, next) => {
  try {
    let service;
    if (req.user.role === "admin") {
      service = await Service.findById(req.params.id);
    } else {
      const vendor = await Vendor.findOne({ user: req.user._id });
      service = await Service.findOne({ _id: req.params.id, vendor: vendor?._id });
    }
    if (!service) return res.status(404).json({ success: false, message: "Service not found or not authorized to edit." });

    const allowed = ["title", "description", "category", "price", "duration", "images", "tags", "isActive"];
    allowed.forEach((f) => { if (req.body[f] !== undefined) service[f] = req.body[f]; });
    await service.save();
    res.json({ success: true, data: service });
  } catch (err) { next(err); }
});

// DELETE /api/services/:id
router.delete("/:id", protect, authorize("vendor", "admin"), async (req, res, next) => {
  try {
    if (req.user.role === "admin") {
      const deleted = await Service.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, message: "Service not found." });
    } else {
      const vendor = await Vendor.findOne({ user: req.user._id });
      const deleted = await Service.findOneAndDelete({ _id: req.params.id, vendor: vendor?._id });
      if (!deleted) return res.status(404).json({ success: false, message: "Service not found or not authorized." });
    }
    res.json({ success: true, message: "Service deleted." });
  } catch (err) { next(err); }
});

module.exports = router;

/**
 * OneService – Payment Controller (Stripe)
 */
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Booking = require("../models/Booking.model");
const Payment = require("../models/Payment.model");
const Vendor = require("../models/Vendor.model");
const notificationService = require("../services/notification.service");
const emailService = require("../services/email.service");

// ── POST /api/payments/create-intent ─────────────────────────────────────────
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate("service", "title");
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    if (booking.status !== "accepted") {
      return res.status(400).json({ success: false, message: "Booking must be accepted before payment." });
    }

    // Check if already paid
    const existingPayment = await Payment.findOne({ booking: bookingId, status: "succeeded" });
    if (existingPayment) {
      return res.status(400).json({ success: false, message: "Booking already paid." });
    }

    // Amount in paise (INR smallest unit)
    const amountInPaise = Math.round(booking.amount.total * 100);

    const intent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: "inr",
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user._id.toString(),
        service: booking.service?.title || "",
      },
      description: `OneService payment for booking ${booking.bookingId}`,
    });

    // Save payment record
    await Payment.findOneAndUpdate(
      { booking: bookingId },
      {
        booking: bookingId,
        user: req.user._id,
        vendor: booking.vendor,
        stripePaymentIntentId: intent.id,
        amount: booking.amount.total,
        currency: "inr",
        platformFee: booking.amount.platformFee,
        vendorAmount: booking.amount.total - booking.amount.platformFee,
        status: "created",
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, clientSecret: intent.client_secret, paymentIntentId: intent.id });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/payments/demo-pay ───────────────────────────────────────────────
// Allows seamless demonstration in college presentations & testing without live Stripe credentials
exports.demoPay = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate("user", "name email");
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });

    if (booking.status !== "accepted") {
      return res.status(400).json({ success: false, message: "Booking must be accepted before payment." });
    }

    const payment = await Payment.findOneAndUpdate(
      { booking: bookingId },
      {
        booking: bookingId,
        user: booking.user._id,
        vendor: booking.vendor,
        stripePaymentIntentId: "demo_pi_" + Date.now(),
        stripeChargeId: "demo_ch_" + Date.now(),
        amount: booking.amount.total,
        currency: "inr",
        platformFee: booking.amount.platformFee,
        vendorAmount: booking.amount.total - booking.amount.platformFee,
        status: "succeeded",
      },
      { upsert: true, new: true }
    );

    booking.status = "in_progress";
    booking.timeline.push({ status: "in_progress", note: "Payment confirmed (Demo / Test mode)." });
    await booking.save();

    await Vendor.findByIdAndUpdate(booking.vendor, {
      $inc: { "earnings.total": payment.vendorAmount, "earnings.pending": payment.vendorAmount },
    });

    try {
      if (booking.user?.email) {
        await emailService.sendPaymentConfirmation(booking.user.email, booking.user.name, {
          amount: payment.amount,
          bookingId: booking.bookingId,
        });
      }
    } catch (_) {}

    // Real-time socket broadcast
    try {
      const { getIO } = require("../socket/socketManager");
      const io = getIO();
      io.to(`booking_${booking._id}`).emit("booking_status_update", {
        bookingId: booking._id,
        status: "in_progress",
      });
      io.to(`user_${booking.user._id}`).emit("booking_status_update", {
        bookingId: booking._id,
        status: "in_progress",
      });
      io.to(`vendor_${booking.vendor}`).emit("booking_status_update", {
        bookingId: booking._id,
        status: "in_progress",
      });
    } catch (_) {}

    await notificationService.send({
      recipientId: booking.user._id,
      type: "payment_success",
      title: "Payment Successful",
      message: `Your payment of ₹${payment.amount} was confirmed!`,
      data: { bookingId: booking._id },
    });

    res.json({ success: true, message: "Payment verified successfully!", payment });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/payments/webhook ────────────────────────────────────────────────
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;
      const payment = await Payment.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        { status: "succeeded", stripeChargeId: intent.latest_charge || "" },
        { new: true }
      );

      if (payment) {
        const booking = await Booking.findByIdAndUpdate(
          payment.booking,
          { status: "in_progress", $push: { timeline: { status: "in_progress", note: "Payment confirmed." } } },
          { new: true }
        ).populate("user", "name email");

        // Update vendor earnings
        await Vendor.findByIdAndUpdate(payment.vendor, {
          $inc: { "earnings.total": payment.vendorAmount, "earnings.pending": payment.vendorAmount },
        });

        // Send email receipt
        if (booking?.user?.email) {
          await emailService.sendPaymentConfirmation(booking.user.email, booking.user.name, {
            amount: payment.amount,
            bookingId: booking.bookingId,
          });
        }

        // Real-time socket broadcast
        try {
          const { getIO } = require("../socket/socketManager");
          const io = getIO();
          io.to(`booking_${booking._id}`).emit("booking_status_update", {
            bookingId: booking._id,
            status: "in_progress",
          });
          io.to(`user_${payment.user}`).emit("booking_status_update", {
            bookingId: booking._id,
            status: "in_progress",
          });
          io.to(`vendor_${payment.vendor}`).emit("booking_status_update", {
            bookingId: booking._id,
            status: "in_progress",
          });
        } catch (_) {}

        // Notify user
        await notificationService.send({
          recipientId: payment.user,
          type: "payment_success",
          title: "Payment Successful",
          message: `Your payment of ₹${payment.amount} was successful.`,
          data: { bookingId: payment.booking },
        });
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object;
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        { status: "failed" }
      );
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    res.status(500).json({ error: "Webhook handler failed." });
  }
};

// ── POST /api/payments/:bookingId/refund ──────────────────────────────────────
exports.requestRefund = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findOne({ booking: req.params.bookingId, status: "succeeded" });

    if (!payment) return res.status(404).json({ success: false, message: "No successful payment found." });
    if (payment.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      reason: "requested_by_customer",
    });

    payment.status = "refunded";
    payment.refund = { refundId: refund.id, amount: refund.amount / 100, reason, refundedAt: new Date() };
    await payment.save();

    await Booking.findByIdAndUpdate(req.params.bookingId, {
      status: "refunded",
      $push: { timeline: { status: "refunded", note: "Refund processed." } },
    });

    res.json({ success: true, message: "Refund processed successfully.", refundId: refund.id });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/payments/history ─────────────────────────────────────────────────
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const filter = req.user.role === "admin" ? {} : { user: req.user._id };

    const payments = await Payment.find(filter)
      .populate("booking", "bookingId scheduledAt")
      .populate("vendor", "businessName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      data: payments,
      pagination: { page: Number(page), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * OneService – Payment Routes
 */
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const {
  createPaymentIntent, stripeWebhook,
  requestRefund, getPaymentHistory
} = require("../controllers/payment.controller");

// Webhook uses raw body (set in app.js)
router.post("/webhook", stripeWebhook);

router.post("/create-intent", protect, createPaymentIntent);
router.post("/demo-pay", protect, require("../controllers/payment.controller").demoPay);
router.post("/:bookingId/refund", protect, requestRefund);
router.get("/history", protect, getPaymentHistory);

module.exports = router;

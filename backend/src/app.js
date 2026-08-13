/**
 * OneService – Express App Configuration
 */
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

// ── Route Imports ────────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const vendorRoutes = require("./routes/vendor.routes");
const serviceRoutes = require("./routes/service.routes");
const bookingRoutes = require("./routes/booking.routes");
const paymentRoutes = require("./routes/payment.routes");
const reviewRoutes = require("./routes/review.routes");
const notificationRoutes = require("./routes/notification.routes");
const chatRoutes = require("./routes/chat.routes");
const aiRoutes = require("./routes/ai.routes");
const adminRoutes = require("./routes/admin.routes");
const uploadRoutes = require("./routes/upload.routes");

const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// ── Security & Middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const allowedOrigins = [
  "http://localhost:3000",
  "https://one-service-one.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header (Postman, server-to-server, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// Stripe webhook needs raw body — must be before express.json()
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Global Rate Limiter ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api", globalLimiter);

// ── Auth-specific strict limiter ────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many auth attempts, try again later." },
});

// ── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;

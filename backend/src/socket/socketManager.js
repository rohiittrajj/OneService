/**
 * OneService – Socket.io Manager
 * Handles: real-time chat, booking updates, live vendor tracking, notifications
 */
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const { ChatMessage } = require("../models/index");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // ── Auth middleware for socket ──────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
      if (!token) return next(new Error("Authentication required."));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id name role avatar");
      if (!user) return next(new Error("User not found."));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid token."));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(`🔌 Socket connected: ${user.name} (${user.role}) — ${socket.id}`);

    // ── Join personal room ──────────────────────────────────────────────────
    socket.join(`user_${user._id}`);
    if (user.role === "vendor") {
      // Vendor room for booking notifications (joins both user._id and vendor._id)
      socket.join(`vendor_${user._id}`);
      const Vendor = require("../models/Vendor.model");
      Vendor.findOne({ user: user._id }).select("_id").then((v) => {
        if (v) {
          socket.join(`vendor_${v._id}`);
          console.log(`🔌 Vendor socket joined room: vendor_${v._id}`);
        }
      }).catch(() => {});
    }
    if (user.role === "admin") {
      socket.join("admin_room");
    }

    // ── Join booking chat room ──────────────────────────────────────────────
    socket.on("join_booking", ({ bookingId }) => {
      socket.join(`booking_${bookingId}`);
      console.log(`${user.name} joined booking room: ${bookingId}`);
    });

    socket.on("leave_booking", ({ bookingId }) => {
      socket.leave(`booking_${bookingId}`);
    });

    // ── Real-time chat message ──────────────────────────────────────────────
    socket.on("send_message", async (data) => {
      try {
        const { bookingId, receiverId, message, mediaUrl, mediaType } = data;

        // Persist to DB
        const msg = await ChatMessage.create({
          booking: bookingId,
          sender: user._id,
          receiver: receiverId,
          message, mediaUrl, mediaType: mediaType || "",
        });
        await msg.populate("sender", "name avatar role");

        // Emit to booking room (both parties)
        io.to(`booking_${bookingId}`).emit("new_message", msg);

        // Emit to receiver's personal room (if not in booking room)
        io.to(`user_${receiverId}`).emit("message_notification", {
          bookingId,
          sender: { name: user.name, avatar: user.avatar },
          preview: message?.slice(0, 60) || "📎 Media",
        });
      } catch (err) {
        socket.emit("error", { message: "Failed to send message." });
      }
    });

    // ── Typing indicator ────────────────────────────────────────────────────
    socket.on("typing", ({ bookingId }) => {
      socket.to(`booking_${bookingId}`).emit("user_typing", { userId: user._id, name: user.name });
    });

    socket.on("stop_typing", ({ bookingId }) => {
      socket.to(`booking_${bookingId}`).emit("user_stop_typing", { userId: user._id });
    });

    // ── Vendor live location update ─────────────────────────────────────────
    socket.on("update_location", async ({ vendorId, coordinates, bookingId }) => {
      try {
        const Vendor = require("../models/Vendor.model");
        await Vendor.findByIdAndUpdate(vendorId, {
          liveLocation: { coordinates, updatedAt: new Date() },
        });

        // Broadcast to booking room so user can track
        if (bookingId) {
          io.to(`booking_${bookingId}`).emit("vendor_location_update", { coordinates, updatedAt: new Date() });
        }
      } catch (_) {}
    });

    // ── Vendor online/offline status ─────────────────────────────────────────
    socket.on("vendor_status", async ({ isOnline }) => {
      try {
        if (user.role === "vendor") {
          const Vendor = require("../models/Vendor.model");
          await Vendor.findOneAndUpdate({ user: user._id }, { "availability.isOnline": isOnline });
          io.emit(`vendor_status_${user._id}`, { isOnline });
        }
      } catch (_) {}
    });

    // ── Read receipt ────────────────────────────────────────────────────────
    socket.on("messages_read", async ({ bookingId, senderId }) => {
      try {
        await ChatMessage.updateMany(
          { booking: bookingId, sender: senderId, isRead: false },
          { isRead: true }
        );
        io.to(`user_${senderId}`).emit("messages_seen", { bookingId });
      } catch (_) {}
    });

    // ── Disconnect ──────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${user.name}`);
    });
  });

  console.log("✅ Socket.io initialized.");
  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized.");
  return io;
};

module.exports = initSocket;
module.exports.getIO = getIO;

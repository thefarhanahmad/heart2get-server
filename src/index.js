import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";

import http from "http";
import { Server as SocketServer } from "socket.io";

import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import interestRoutes from "./routes/interestRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import Message from "./models/chatModel.js";
import { autoExpireSubscriptions } from "./utils/cronJobs.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

// MongoDB Connection with improved configuration
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

// Handle MongoDB connection errors after initial connection
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/interests", interestRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/story", storyRoutes);
app.use("/api/location", locationRoutes);

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Dating ki API runing hai" });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.name === "MulterError") {
    return res.status(400).json({
      status: false,
      message: err.message,
    });
  }

  res.status(500).json({
    status: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: "Route not found",
  });
});

// ********** Using Socket.IO for real-time communication ********** //
// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
export const io = new SocketServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Track online users
const onlineUsers = new Map(); // userId -> socketId
const activeCalls = new Map(); // userId -> callData

// Socket.IO logic - Update the messageRead handler
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    // Store the user's socket connection
    onlineUsers.set(userId, socket.id);

    socket.join(userId);
    console.log(`User ${userId} joined their room`);

    // Notify others that this user is now online
    socket.broadcast.emit("userOnline", userId);

    // Send the current user a list of who's online
    const currentlyOnline = Array.from(onlineUsers.keys());
    socket.emit("onlineUsers", currentlyOnline);
  });

  // Handle online status check
  socket.on("checkOnlineStatus", (userId) => {
    const isOnline = onlineUsers.has(userId);
    socket.emit("onlineStatusResponse", { userId, isOnline });
  });

  // Improved message read handler
  socket.on("messageRead", async (data) => {
    // Properly destructure with default values
    const { messageId, readerId, senderId } = data || {};

    // Validate all required fields
    if (!messageId || !readerId || !senderId) {
      console.error("Invalid read receipt:", {
        messageId,
        readerId,
        senderId,
      });
      return;
    }

    console.log("Valid read receipt received:", {
      messageId,
      readerId,
      senderId,
    });
    try {
      const updated = await Message.findByIdAndUpdate(
        {
          _id: messageId,
          sender_id: senderId,
          receiver_id: readerId,
          read: false,
        },
        { $set: { read: true } },
        { new: true }
      );

      if (updated) {
        // Notify sender that their message was read
        io.to(senderId).emit("messageReadUpdate", {
          messageId: updated._id.toString(),
        });
      }
    } catch (error) {
      console.error("Error updating read status:", error);
    }
  });

  // *******Video call sockets********
  // ********** Enhanced Video Call Sockets ********** //
  socket.on("call-user", ({ from, to, channelName, callType = "video" }) => {
    console.log(`[CALL] User ${from} calling ${to} in channel ${channelName}`);

    // Check if receiver is already in a call
    if (activeCalls.has(to)) {
      console.log(`[CALL BUSY] ${to} is already in a call`);
      return socket.emit("call-busy", { to });
    }

    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) {
      // Track the call
      activeCalls.set(to, { from, channelName, callType });
      activeCalls.set(from, { to, channelName, callType });

      console.log(`[CALL] Tracking call between ${from} and ${to}`);

      io.to(targetSocketId).emit("incoming-call", {
        from,
        channelName,
        callType,
      });
      console.log(`[CALL] Sent incoming-call to ${to}`);

      // Add timeout for no response
      setTimeout(() => {
        if (activeCalls.has(to)) {
          console.log(`[CALL TIMEOUT] No response from ${to}`);
          io.to(socket.id).emit("call-timeout", { to });
          activeCalls.delete(to);
          activeCalls.delete(from);
        }
      }, 45000); // 45 seconds timeout
    } else {
      console.log(`[CALL FAILED] ${to} is offline`);
      socket.emit("user-offline", { to });
    }
  });

  socket.on("accept-call", ({ from, to, channelName }) => {
    console.log(`[CALL ACCEPT] ${from} accepting call from ${to}`);

    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId && activeCalls.has(to)) {
      // Update call state before notifying
      activeCalls.set(from, { ...activeCalls.get(from), status: "accepted" });
      activeCalls.set(to, { ...activeCalls.get(to), status: "accepted" });

      io.to(targetSocketId).emit("call-accepted", {
        from,
        channelName,
        callData: activeCalls.get(to),
      });
      console.log(`[CALL ACCEPT] Notified ${to} that call was accepted`);
    } else {
      console.log(`[CALL ACCEPT ERROR] ${to} not found or not in active call`);
      socket.emit("call-error", {
        to: from,
        message: "Call session expired",
      });
    }
  });

  socket.on("reject-call", ({ from, to }) => {
    console.log(`[CALL REJECT] ${from} rejecting call from ${to}`);

    const targetSocketId = onlineUsers.get(from);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-rejected", { to });
      console.log(`[CALL REJECT] Notified ${from} that call was rejected`);

      // Clean up
      activeCalls.delete(to);
      activeCalls.delete(from);
      console.log(`[CALL CLEANUP] Removed call tracking for ${from} and ${to}`);
    }
  });

  socket.on("end-call", ({ from, to }) => {
    console.log(`[CALL END] ${from} ending call with ${to}`);

    const otherUserId = from === socket.userId ? to : from;
    const targetSocketId = onlineUsers.get(otherUserId);

    if (targetSocketId) {
      io.to(targetSocketId).emit("call-ended", {
        userId: socket.userId,
      });
      console.log(`[CALL END] Notified ${otherUserId} that call ended`);
    }

    // Clean up
    activeCalls.delete(from);
    activeCalls.delete(to);
    console.log(`[CALL CLEANUP] Removed call tracking for ${from} and ${to}`);
  });

  // VIDEO CALL SOCKET EVENTS

  socket.on("disconnect", () => {
    // Find which user disconnected
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        // Notify if they were in a call
        if (activeCalls.has(userId)) {
          const callData = activeCalls.get(userId);
          const targetSocketId = onlineUsers.get(callData.to || callData.from);

          if (targetSocketId) {
            io.to(targetSocketId).emit("call-ended", {
              userId,
              reason: "disconnected",
            });
            console.log(`[CALL ENDED] ${userId} disconnected during call`);
          }

          // Clean up
          activeCalls.delete(userId);
          activeCalls.delete(callData.to || callData.from);
          console.log(
            `[CALL CLEANUP] Removed call tracking for disconnected user ${userId}`
          );
        }
        io.emit("userOffline", userId);
        console.log(`User ${userId} disconnected (Offline)`);
        break;
      }
    }
  });
});

// Cron Jobs expiring subscriptions
autoExpireSubscriptions();

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;

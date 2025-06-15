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
const onlineUsers = new Map();
const pendingInvitations = new Map();
const pendingAnswers = new Map();
const activeGames = new Map(); // Tracks users currently playing

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
      const updated = await Message.findOneAndUpdate(
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

  // GAMING SOCKETS
  // Game invitation handler
  socket.on("sendGameInvite", ({ senderId, recipientId }) => {
    console.log(
      `🎮 'sendGameInvite' received from ${senderId} to ${recipientId}`
    );

    // Validate users
    if (!onlineUsers.has(recipientId)) {
      console.warn(
        `⚠️ Cannot send invite — recipient ${recipientId} is offline`
      );
      socket.emit("inviteError", {
        error: "User is currently offline",
        recipientId,
      });
      return;
    }

    // ✅ Check if sender or recipient is already in an active game
    if (activeGames.has(senderId)) {
      socket.emit("inviteError", {
        error: "You are already in a game",
      });
      return;
    }

    if (activeGames.has(recipientId)) {
      socket.emit("inviteError", {
        error: "User is already in a game",
        recipientId,
      });
      return;
    }

    // ✅ Check if either user has a pending invite (sent or received)
    const hasPendingInvite = Array.from(pendingInvitations.values()).some(
      (inv) =>
        inv.status === "pending" &&
        (inv.senderId === senderId ||
          inv.recipientId === senderId ||
          inv.senderId === recipientId ||
          inv.recipientId === recipientId)
    );

    if (hasPendingInvite) {
      socket.emit("inviteError", {
        error: "Either you or the recipient has a pending invite",
      });
      return;
    }

    // Create invitation
    const invitationId = `invite_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const invitation = {
      invitationId,
      senderId,
      recipientId,
      timestamp: Date.now(),
      status: "pending",
    };

    // Store invitation
    pendingInvitations.set(invitationId, invitation);
    console.log(`📨 Game invite created:`, invitation);

    // Send invitation to recipient
    const recipientSocketId = onlineUsers.get(recipientId);
    io.to(recipientSocketId).emit("receiveGameInvite", invitation);
    console.log(`📤 Sent game invite to recipient socket ${recipientSocketId}`);

    // Confirm to sender
    socket.emit("inviteSent", invitation);

    console.log(`📥 Confirmed to sender ${senderId} that invite was sent`);

    // Set timeout for expiration (e.g., 30 seconds)
    setTimeout(() => {
      if (pendingInvitations.get(invitationId)?.status === "pending") {
        pendingInvitations.delete(invitationId);
        io.to(socket.id).emit("inviteExpired", { invitationId });
        if (onlineUsers.has(recipientId)) {
          io.to(onlineUsers.get(recipientId)).emit("inviteExpired", {
            invitationId,
          });
        }
        console.log(`⏰ Invite ${invitationId} expired`);
      }
    }, 30000);
  });

  // Invitation response handler
  socket.on("respondToInvite", ({ invitationId, recipientId, accepted }) => {
    console.log(`📬 Received 'respondToInvite':`, {
      invitationId,
      recipientId,
      accepted,
    });
    const invitation = pendingInvitations.get(invitationId);

    // Validate invitation
    if (!invitation || invitation.recipientId !== recipientId) {
      console.error("❌ Invalid or unmatched invitation response");
      socket.emit("inviteError", { error: "Invalid invitation" });
      return;
    }

    // Update status
    invitation.status = accepted ? "accepted" : "rejected";
    pendingInvitations.set(invitationId, invitation);

    // Notify both parties
    const senderSocketId = onlineUsers.get(invitation.senderId);

    if (accepted) {
      // Create game session
      const gameSessionId = `quiz_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // ✅ Mark both users as in-game
      activeGames.set(invitation.senderId, gameSessionId);
      activeGames.set(invitation.recipientId, gameSessionId);

      console.log(
        `✅ Invitation accepted. Creating game session: ${gameSessionId}`
      );

      // Notify both players with game session details
      io.to(senderSocketId).emit("inviteAccepted", {
        invitationId,
        gameSessionId,
        opponentId: recipientId,
      });

      socket.emit("inviteAccepted", {
        invitationId,
        gameSessionId,
        opponentId: invitation.senderId,
      });

      console.log(`📤 Notified both players of game start`);

      // Clean up
      pendingInvitations.delete(invitationId);
    } else {
      console.log(`❌ Invitation rejected by ${recipientId}`);

      io.to(senderSocketId).emit("inviteRejected", { invitationId });
      pendingInvitations.delete(invitationId);
    }
  });

  socket.on(
    "submitAnswer",
    ({ answerText, userId, receiverId, gameSessionId, questionIndex }) => {
      const sessionKey = `${gameSessionId}_${questionIndex}`; // 👉 key is now session + question

      console.log(
        `📝 Answer from ${userId} for session ${gameSessionId}, question ${questionIndex}`
      );

      // Initialize if not exists
      if (!pendingAnswers.has(sessionKey)) {
        pendingAnswers.set(sessionKey, new Map());
      }

      const gameAnswers = pendingAnswers.get(sessionKey);
      gameAnswers.set(userId, answerText);

      // If both users have answered
      if (gameAnswers.size === 2) {
        const [player1, player2] = Array.from(gameAnswers.keys());
        const answer1 = gameAnswers.get(player1);
        const answer2 = gameAnswers.get(player2);

        if (!answer1 || !answer2) return;

        const socket1 = onlineUsers.get(player1);
        const socket2 = onlineUsers.get(player2);

        if (socket1) {
          io.to(socket1).emit("bothAnswersReceived", {
            gameSessionId,
            questionIndex,
            userId: player1,
            yourAnswer: answer1,
            opponentAnswer: answer2,
          });
        }

        if (socket2) {
          io.to(socket2).emit("bothAnswersReceived", {
            gameSessionId,
            questionIndex,
            userId: player2,
            yourAnswer: answer2,
            opponentAnswer: answer1,
          });
        }

        // Clean this specific question's data
        pendingAnswers.delete(sessionKey);
      }
    }
  );

  // GAMING SOCKETS

  socket.on("disconnect", () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
    // Find which user disconnected
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);

        io.emit("userOffline", userId);
        console.log(`User ${userId} disconnected (Offline)`);
        // ✅ Also clean up if user was in a game
        if (activeGames.has(userId)) {
          const gameSessionId = activeGames.get(userId);

          // Find opponent
          const opponentId = [...activeGames.entries()].find(
            ([uid, session]) => uid !== userId && session === gameSessionId
          )?.[0];

          activeGames.delete(userId);
          if (opponentId) {
            activeGames.delete(opponentId);

            // Notify opponent (optional)
            const opponentSocket = onlineUsers.get(opponentId);
            if (opponentSocket) {
              io.to(opponentSocket).emit("opponentDisconnected", {
                gameSessionId,
                opponentId: userId,
              });
            }

            console.log(
              `🎮 Game session ${gameSessionId} ended due to disconnect of ${userId}`
            );
          }
        }
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

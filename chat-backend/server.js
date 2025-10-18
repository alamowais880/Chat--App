import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import Message from "./models/Message.js";
import User from "./models/User.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// connect mongodb
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const onlineUsers = new Map();

// ✅ Authenticate socket connections
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.id;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    next();
  }
});

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.userId, socket.id);

  if (socket.userId) onlineUsers.set(String(socket.userId), socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.userId);
    if (socket.userId) onlineUsers.delete(String(socket.userId));
  });

  // ==============================
  // 🔹 NORMAL CHAT MESSAGES
  // ==============================
  socket.on("sendMessage", async (payload) => {
    try {
      const { senderId, receiverId, text } = payload;
      const msg = await Message.create({ sender: senderId, receiver: receiverId, text });

      const receiverSocketId = onlineUsers.get(String(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", msg);
        msg.status = "delivered";
        await msg.save();
        io.to(socket.id).emit("messageDelivered", { messageId: msg._id });
      }

      io.to(socket.id).emit("messageSent", msg);
    } catch (err) {
      console.error("Send message error:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("messageSeen", async ({ messageId }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;
      msg.status = "seen";
      await msg.save();

      const senderSocketId = onlineUsers.get(String(msg.sender));
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageSeen", { messageId });
      }
    } catch (err) {
      console.error("Message seen error:", err);
    }
  });

  // ==============================
  // 🔹 AUDIO/VIDEO CALL SIGNALING
  // ==============================

  // 1️⃣ When user initiates a call
  socket.on("call-user", ({ from, to, offer }) => {
    const targetSocketId = onlineUsers.get(String(to));
    if (targetSocketId) {
      io.to(targetSocketId).emit("incoming-call", { from, offer });
    }
  });

  // 2️⃣ When receiver accepts the call
  socket.on("answer-call", ({ to, answer }) => {
    const targetSocketId = onlineUsers.get(String(to));
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-accepted", { answer });
    }
  });

  // 3️⃣ When ICE candidates are exchanged
  socket.on("ice-candidate", ({ to, candidate }) => {
    const targetSocketId = onlineUsers.get(String(to));
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", { candidate });
    }
  });

  // 4️⃣ When call is ended
  socket.on("end-call", ({ to }) => {
    const targetSocketId = onlineUsers.get(String(to));
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-ended");
    }
  });
});

const PORT = process.env.PORT || 5000;

app.use((err, req, res, next) => {
  console.error("🔥 Unhandled error:", err.stack);
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

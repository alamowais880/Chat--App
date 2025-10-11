import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import jwt from "jsonwebtoken";
import Message from "./models/Message.js";
import User from "./models/User.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:3000", methods: ["GET","POST"] } });

// connect mongodb
mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB connected")).catch(err => console.log(err));

// REST routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// map userId -> socketId
const onlineUsers = new Map();

// middleware to authenticate socket (token sent in handshake auth)
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(); // allow unauthenticated? you can reject too
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.id;
    return next();
  } catch (err) {
    return next(); // allow or reject based on your policy
  }
});

io.on("connection", (socket) => {
  console.log("socket connected", socket.id, "user:", socket.userId);

  if (socket.userId) onlineUsers.set(String(socket.userId), socket.id);

  // keep onlineUsers tidy on disconnect
  socket.on("disconnect", () => {
    if (socket.userId) onlineUsers.delete(String(socket.userId));
  });

  // sendMessage: from client -> server
  // payload: { senderId, receiverId, text }
  socket.on("sendMessage", async (payload) => {
    try {
      const { senderId, receiverId, text } = payload;
      // save message to DB (status default "sent")
      const msg = await Message.create({ sender: senderId, receiver: receiverId, text });

      // If receiver online, send event and update status->delivered
      const receiverSocketId = onlineUsers.get(String(receiverId));
      if (receiverSocketId) {
        // deliver to receiver
        io.to(receiverSocketId).emit("receiveMessage", msg);
        // update status to delivered in DB
        msg.status = "delivered";
        await msg.save();
        // notify sender that message is delivered (so frontend can show double tick)
        io.to(socket.id).emit("messageDelivered", { messageId: msg._id });
      }

      // always confirm message saved to the sender (so sender sees the message)
      io.to(socket.id).emit("messageSent", msg);

    } catch (err) {
      console.error(err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // When receiver opens chat and reads messages, client emits messageSeen for particular message ids
  socket.on("messageSeen", async ({ messageId }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;
      msg.status = "seen";
      await msg.save();
      // notify original sender if online
      const senderSocketId = onlineUsers.get(String(msg.sender));
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageSeen", { messageId });
      }
    } catch (err) {
      console.error(err);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server listening on", PORT));

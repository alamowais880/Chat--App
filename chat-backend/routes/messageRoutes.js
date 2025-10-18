import express from "express";
import Message from "../models/Message.js";
const router = express.Router();

// Fetch conversation between two users (userAId, userBId)
router.get("/:userA/:userB", async (req, res) => {
  const { userA, userB } = req.params;
  console.log("📩 Fetching messages between:", userA, "and", userB); // 👈 Debug log

  try {
    if (!userA || !userB) {
      console.log("⚠️ Missing user IDs");
      return res.status(400).json({ message: "User IDs required" });
    }

    const msgs = await Message.find({
      $or: [
        { sender: userA, receiver: userB },
        { sender: userB, receiver: userA },
      ],
    }).sort({ createdAt: 1 });

    console.log("✅ Messages found:", msgs.length);
    res.json(msgs);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;

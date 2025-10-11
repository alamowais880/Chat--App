import express from "express";
import Message from "../models/Message.js";
const router = express.Router();

// fetch conversation between two users (userAId, userBId)
router.get("/:userA/:userB", async (req, res) => {
  const { userA, userB } = req.params;
  try {
    const msgs = await Message.find({
      $or: [
        { sender: userA, receiver: userB },
        { sender: userB, receiver: userA }
      ]
    }).sort({ createdAt: 1 });
    res.json(msgs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;

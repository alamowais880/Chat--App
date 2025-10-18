import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import User from "../models/User.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "_id name email"); // fetch only required fields
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

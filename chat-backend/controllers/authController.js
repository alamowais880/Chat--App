import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mychatappsecret2025";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already used" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });
    res.status(201).json({ user: { _id: user._id, name: user.name, email: user.email }, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// export const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) return res.status(400).json({ message: "Missing fields" });

//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: "User not found" });

//     const ok = await bcrypt.compare(password, user.password);
//     if (!ok) return res.status(401).json({ message: "Invalid credentials" });

//     const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });
//     res.json({ user: { _id: user._id, name: user.name, email: user.email }, token });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User not found" });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
      user: { _id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


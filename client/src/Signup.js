import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
      });

      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      alert("Signup successful!");
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert("Signup failed. Please try again.");
      }
      console.error("Signup error:", err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-green-200 to-green-400">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md transform transition hover:scale-[1.02]">
        {/* Header */}
        <h2 className="text-3xl font-bold text-center text-green-700 mb-2">
          Create Account
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Join our chat community and start messaging instantly!
        </p>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 font-medium">Full Name</label>
            <input
              type="text"
              placeholder="Owais Alam"
              className="w-full border border-gray-300 px-4 py-3 rounded-lg mt-1 focus:ring-2 focus:ring-green-500 focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-medium">Email</label>
            <input
              type="email"
              placeholder="example@email.com"
              className="w-full border border-gray-300 px-4 py-3 rounded-lg mt-1 focus:ring-2 focus:ring-green-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-medium">Password</label>
            <input
              type="password"
              placeholder="********"
              className="w-full border border-gray-300 px-4 py-3 rounded-lg mt-1 focus:ring-2 focus:ring-green-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-200 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-600 mt-6">
          Already have an account?{" "}
          <Link
            to="/"
            className="text-green-600 font-semibold hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

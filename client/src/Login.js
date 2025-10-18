import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      if (res.data && res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        alert("Login successful!");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err.response?.data || err);
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert("Invalid credentials or server error");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-green-200 to-green-400">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md transform transition hover:scale-[1.02]">
        {/* Header */}
        <h2 className="text-3xl font-bold text-center text-green-700 mb-2">
          Welcome Back
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Login to continue chatting with your friends!
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-600 mt-6">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="text-green-600 font-semibold hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

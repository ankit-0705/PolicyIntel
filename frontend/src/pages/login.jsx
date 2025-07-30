"use client";

import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { BackgroundBeams } from "../components/ui/background-beams";
import { Button } from "../components/ui/stateful-button";
import PolicyContext from "../context/PolicyContext";
const backendUrl = import.meta.env.VITE_API_BASE_URL;

const Login = () => {
  const navigate = useNavigate();
  const { info_getter, history_getter } = useContext(PolicyContext);

  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleLogin = async () => {
    setError("");

    if (!credentials.username || !credentials.password) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 750));

      const res = await axios.post(`${backendUrl}/api/login/`, {
        username: credentials.username,
        password: credentials.password,
      });

      if (res.data.token) {
        const token = res.data.token;
        localStorage.setItem("token", token);
        axios.defaults.headers.common["Authorization"] = `Token ${token}`;

        await info_getter();
        await history_getter();

        navigate("/home");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden flex items-center justify-center px-4 sm:px-0">
      <BackgroundBeams />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6 py-10 sm:px-8 rounded-2xl backdrop-blur-lg border border-white/20 bg-white/5 shadow-[0_0_40px_#06b6d420]"
      >
        <h2 className="text-3xl font-semibold text-white text-center mb-6 tracking-tight">
          Welcome Back
        </h2>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm text-center mb-4"
          >
            {error}
          </motion.p>
        )}

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Input
            name="username"
            placeholder="Username"
            onChange={handleChange}
            value={credentials.username}
            required
          />
          <Input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            value={credentials.password}
            required
          />

          <Button
            onClick={handleLogin}
            className="w-full mt-4"
            loading={loading}
            loadingText="Logging in..."
          >
            Login
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-white">
            Don’t have an account?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-cyan-300 hover:underline hover:cursor-pointer"
            >
              Sign up
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

const Input = ({
  name,
  type = "text",
  placeholder,
  onChange,
  value,
  required = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="relative">
      <input
        name={name}
        type={isPassword && showPassword ? "text" : type}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
        required={required}
        className="w-full px-4 py-2 pr-12 rounded-lg bg-white/10 text-white placeholder:text-neutral-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition duration-150"
      />

      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-300 hover:cursor-pointer"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
};

"use client";

import React, { useState } from "react";
import { BackgroundBeams } from "../components/ui/background-beams";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/stateful-button";
import { Info } from "lucide-react";
const backendUrl = import.meta.env.VITE_API_BASE_URL;

const SignUp = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    first_name: "",
    last_name: "",
    organization: "",
    role: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "password") {
      if (value.length < 6) setPasswordStrength("Weak");
      else if (value.length < 10) setPasswordStrength("Medium");
      else setPasswordStrength("Strong");
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess(false);

    const requiredFields = [
      "username",
      "email",
      "password",
      "confirmPassword",
      "first_name",
      "last_name",
    ];

    for (let field of requiredFields) {
      if (!formData[field]) {
        setError("All required fields must be filled.");
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 750));

      const res = await axios.post(`${backendUrl}/api/signup/`, {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        organization: formData.organization,
        role: formData.role,
      });

      if (res.status === 201) {
        setSuccess(true);

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const passwordColor =
    passwordStrength === "Weak"
      ? "text-red-400"
      : passwordStrength === "Medium"
      ? "text-yellow-400"
      : "text-green-400";

  return (
    <div className="relative min-h-screen w-full    bg-black flex items-center justify-center   overflow-hidden px-4 sm:px-0">
      <BackgroundBeams />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6 sm:px-8 py-10 rounded-2xl backdrop-blur-lg border border-white/20 bg-white/5 shadow-[0_0_40px_#9333ea20]"
      >
        <h2 className="text-3xl font-semibold text-white text-center mb-6 tracking-tight">
          Create Your Account
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
        {success && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-400 text-sm text-center mb-4"
          >
            Signup successful! Redirecting to login...
          </motion.p>
        )}

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Input
            name="username"
            placeholder="Username"
            onChange={handleChange}
            value={formData.username}
            required
          />
          <Input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            value={formData.email}
            required
          />
          <Input
            name="first_name"
            placeholder="First Name"
            onChange={handleChange}
            value={formData.first_name}
            required
          />
          <Input
            name="last_name"
            placeholder="Last Name"
            onChange={handleChange}
            value={formData.last_name}
            required
          />

          {/* Organization (optional with tooltip) */}
          <div className="relative">
            <Input
              name="organization"
              placeholder="Organization"
              onChange={handleChange}
              value={formData.organization}
            />
            <Tooltip message="This field is optional" />
          </div>

          {/* Role (optional with tooltip) */}
          <div className="relative">
            <Input
              name="role"
              placeholder="Role"
              onChange={handleChange}
              value={formData.role}
            />
            <Tooltip message="This field is optional" />
          </div>

          <div>
            <Input
              name="password"
              type="password"
              placeholder="Password"
              onChange={handleChange}
              value={formData.password}
              required
            />
            {formData.password && (
              <p className={`mt-2 text-sm font-medium ${passwordColor}`}>
                Password Strength:{" "}
                <span className="capitalize">{passwordStrength}</span>
              </p>
            )}
          </div>

          <Input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            onChange={handleChange}
            value={formData.confirmPassword}
            required
          />

          <Button
            onClick={handleSubmit}
            className="w-full mt-4"
            loading={loading}
            loadingText="Creating Account..."
          >
            Sign Up
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-white">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-cyan-300 hover:underline hover:cursor-pointer"
            >
              Log in
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUp;

const Input = ({
  name,
  type = "text",
  placeholder,
  onChange,
  value,
  required = false,
}) => (
  <input
    name={name}
    type={type}
    placeholder={placeholder}
    onChange={onChange}
    value={value}
    required={required}
    className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder:text-neutral-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
  />
);

const Tooltip = ({ message }) => (
  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 group">
    <Info className="h-4 w-4 text-neutral-400 group-hover:text-cyan-300 cursor-pointer" />
    <div className="absolute hidden group-hover:block w-max bg-white text-black text-xs rounded px-2 py-1 shadow-lg top-full mt-2 right-0 z-10">
      {message}
    </div>
  </div>
);

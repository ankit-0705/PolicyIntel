"use client";

import React, { useEffect, useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Spotlight } from "../components/ui/spotlight-new";
import { useNavigate } from "react-router-dom";
import { User, Mail, Building2, Briefcase } from "lucide-react";

import PolicyContext from "../context/PolicyContext";

const Field = ({ label, value, Icon }) => (
  <div className="flex flex-col gap-1">
    <label className="flex items-center text-xs text-cyan-400 gap-2 tracking-wide">
      <Icon className="w-4 h-4 text-cyan-300" />
      {label}
    </label>
    <input
      type="text"
      readOnly
      value={value || "N/A"}
      className="w-full px-3 py-2 rounded-md bg-transparent text-white text-sm border border-white/20 focus:outline-none cursor-default"
    />
  </div>
);

const ProfilePage = () => {
  const navigate = useNavigate();
  const { profile, info_getter } = useContext(PolicyContext);

  const [isMobile, setIsMobile] = useState(false);

  const [showSpotlight, setShowSpotlight] = useState(false);
  const [showHeading, setShowHeading] = useState(false);
  const [animateHeadingUp, setAnimateHeadingUp] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    info_getter();
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setShowSpotlight(true), 600),
      setTimeout(() => setShowHeading(true), 1000),
      setTimeout(() => setAnimateHeadingUp(true), 2000),
      setTimeout(() => setShowContent(true), 2250),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="relative h-screen w-screen bg-black/[0.96] bg-grid-white/[0.02] overflow-hidden flex items-center justify-center">
      {showSpotlight && <Spotlight />}

      <div className="relative z-10 w-full max-w-2xl px-6 md:px-0">
        <AnimatePresence>
          {showHeading && (
            <motion.h2
              initial={{ opacity: 0, y: 0 }}
              animate={{
                y: animateHeadingUp ? (isMobile ? -250 : -150) : 0,
                opacity: showHeading ? 1 : 0,
              }}
              transition={{
                duration: animateHeadingUp ? 1.2 : 1,
                ease: "easeInOut",
                type: animateHeadingUp ? "spring" : "tween",
              }}
              className="text-3xl md:text-4xl font-semibold text-center absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2
                       bg-clip-text text-transparent bg-gradient-to-b from-cyan-300 to-blue-500 pointer-events-none"
            >
              Profile
            </motion.h2>
          )}
        </AnimatePresence>

        {showContent && profile && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{
              y: showContent ? 0 : isMobile ? 0 : -80,
              opacity: showContent ? 1 : 0,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mt-40 space-y-10"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field
                label="First Name"
                value={profile.first_name}
                Icon={User}
              />
              <Field label="Last Name" value={profile.last_name} Icon={User} />
              <Field label="Email" value={profile.email} Icon={Mail} />
              <Field label="Username" value={profile.username} Icon={User} />
              <Field
                label="Organization"
                value={profile.organization}
                Icon={Building2}
              />
              <Field label="Role" value={profile.role} Icon={Briefcase} />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/home")}
                className="flex-1 border border-cyan-400 text-cyan-300 text-sm px-4 py-2 rounded-md hover:bg-cyan-400/10 transition duration-200 hover:cursor-pointer"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  navigate("/login");
                }}
                className="flex-1 border border-red-400 text-red-300 text-sm px-4 py-2 rounded-md hover:bg-red-400/10 transition duration-200 hover:cursor-pointer"
              >
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

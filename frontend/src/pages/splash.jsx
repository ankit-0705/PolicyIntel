import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, ShieldCheck, BrainCircuit } from "lucide-react";
import { Spotlight } from "../components/ui/spotlight-new";

const iconVariants = {
  hidden: { opacity: 0, scale: 0.5, y: -20 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      type: "spring",
      stiffness: 120,
    },
  }),
};

const Splash = () => {
  const navigate = useNavigate();
  const [exitAnimation, setExitAnimation] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExitAnimation(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (exitAnimation) {
      const navTimer = setTimeout(() => {
        navigate("/signup");
      }, 1000);
      return () => clearTimeout(navTimer);
    }
  }, [exitAnimation, navigate]);

  return (
    <div
      className="h-screen w-screen flex items-center justify-center bg-black/[0.96] bg-grid-white/[0.02] relative overflow-hidden text-white"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <Spotlight />

      <motion.div
        initial={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        animate={
          exitAnimation
            ? {
                scale: 1.08,
                filter: "blur(20px)",
                opacity: 0.4,
                transition: { duration: 1 },
              }
            : { scale: 1, opacity: 1, filter: "blur(0px)" }
        }
        className="flex flex-col items-center justify-center gap-6 px-4 sm:px-6 md:px-8 text-center max-w-[95vw] sm:max-w-[80vw] overflow-hidden"
      >
        {/* Animated Icons */}
        <div className="flex flex-wrap justify-center gap-6 sm:gap-8 z-10">
          {[FileText, ShieldCheck, BrainCircuit].map((Icon, index) => (
            <motion.div
              key={index}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={iconVariants}
              className="bg-[#1b1b2f] p-3 sm:p-4 rounded-full shadow-xl"
            >
              <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400" />
            </motion.div>
          ))}
        </div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 1.2,
            delay: 0.6,
            type: "spring",
            stiffness: 100,
          }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-center z-10 bg-clip-text text-transparent bg-gradient-to-b from-cyan-300 to-blue-500"
        >
          Welcome to <span className="text-cyan-400">PolicyIntel</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1.2 }}
          className="text-base sm:text-lg md:text-xl text-blue-300 text-center z-10 max-w-[90%]"
        >
          Smart Claims. Smarter Decisions.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Splash;

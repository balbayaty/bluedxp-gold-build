"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleDefinition } from "@/types/user";

export default function RedirectScreen() {
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const router = useRouter();
  const { user } = useAuth();
  const hasRedirectedRef = useRef(false);

  const messages = [
    "Initializing Intelligence Engine",
    "Connecting to Cloud Infrastructure",
    "Loading Your Workspace",
    "Preparing Dashboard Experience",
    "Almost Ready...",
  ];

  useEffect(() => {
    // Progress animation - complete to 100% over 2 seconds
    let progressValue = 0;
    const progressInterval = setInterval(() => {
      progressValue += 2;
      if (progressValue >= 100) {
        setProgress(100);
        clearInterval(progressInterval);
      } else {
        setProgress(progressValue);
      }
    }, 40); // Update every 40ms for smooth animation (2 seconds total)

    // Text rotation
    const textInterval = setInterval(() => {
      setCurrentText((prev) => (prev + 1) % messages.length);
    }, 2000);

    // Mouse tracking for interactive effects
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Auto-redirect after 2 seconds
    const redirectTimer = setTimeout(() => {
      if (hasRedirectedRef.current) return;
      hasRedirectedRef.current = true;

      try {
        if (user) {
          const roleDefinition = getRoleDefinition(user.role);
          const targetRoute = roleDefinition?.dashboardRoute || "/dashboard";
          console.log("RedirectScreen: Redirecting to", targetRoute);
          router.replace(targetRoute).catch(() => {
            window.location.href = targetRoute;
          });
        } else {
          console.log("RedirectScreen: Redirecting to /ultimate");
          router.replace("/ultimate").catch(() => {
            window.location.href = "/ultimate";
          });
        }
      } catch (error) {
        console.error("RedirectScreen redirect error:", error);
        window.location.href = "/ultimate";
      }
    }, 2000);

    // Safety redirect after 3 seconds
    const safetyTimer = setTimeout(() => {
      if (hasRedirectedRef.current) return;
      hasRedirectedRef.current = true;
      console.log("RedirectScreen: Safety redirect triggered");

      if (user) {
        try {
          const roleDefinition = getRoleDefinition(user.role);
          const targetRoute = roleDefinition?.dashboardRoute || "/dashboard";
          window.location.href = targetRoute;
        } catch {
          window.location.href = "/ultimate";
        }
      } else {
        window.location.href = "/ultimate";
      }
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
      clearTimeout(redirectTimer);
      clearTimeout(safetyTimer);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [messages.length, router, user]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a0a0f] via-[#0f1419] to-[#1a1f2e]"
    >
      {/* Multi-Layer Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large Gradient Orbs - Multiple Layers */}
        <motion.div
          className="absolute w-[800px] h-[800px] bg-blue-500/30 rounded-full blur-[150px]"
          style={{
            left: "20%",
            top: "20%",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            x: [0, 150, -100, 0],
            y: [0, -80, 120, 0],
            scale: [1, 1.3, 0.9, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-[1000px] h-[1000px] bg-cyan-500/30 rounded-full blur-[150px]"
          style={{
            left: "80%",
            top: "30%",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            x: [0, -120, 100, 0],
            y: [0, 90, -70, 0],
            scale: [1, 1.4, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] bg-purple-500/25 rounded-full blur-[120px]"
          style={{
            left: "50%",
            top: "70%",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            x: [0, 80, -60, 0],
            y: [0, -50, 40, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-[900px] h-[900px] bg-blue-500/25 rounded-full blur-[140px]"
          style={{
            left: "10%",
            top: "80%",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            x: [0, -90, 70, 0],
            y: [0, 60, -50, 0],
            scale: [1, 1.3, 0.95, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Interactive Mouse-Following Orb */}
        <motion.div
          className="absolute w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px]"
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`,
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Animated Grid Pattern */}
        <motion.div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
          animate={{
            opacity: [0.05, 0.12, 0.05],
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Particle System - Enhanced */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0.2, 1, 0.2],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Connection Lines/Beams */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.1 }}
        >
          <defs>
            <linearGradient
              id="lineGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          {[...Array(8)].map((_, i) => {
            const x1 = Math.random() * 100;
            const y1 = Math.random() * 100;
            const x2 = Math.random() * 100;
            const y2 = Math.random() * 100;
            return (
              <motion.line
                key={i}
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke="url(#lineGradient)"
                strokeWidth="2"
                animate={{
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 px-4">
        {/* Logo Container with Advanced 3D Effects */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
          style={{ perspective: "1000px" }}
        >
          {/* Outer Glow Rings */}
          {[1, 2, 3].map((ring) => (
            <motion.div
              key={ring}
              className="absolute inset-0 rounded-3xl border-2"
              style={{
                borderColor: `rgba(59, 130, 246, ${0.3 / ring})`,
                transform: `scale(${1 + ring * 0.1})`,
              }}
              animate={{
                rotate: [0, 360],
                opacity: [0.3 / ring, 0.5 / ring, 0.3 / ring],
              }}
              transition={{
                duration: 10 + ring * 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}

          {/* Pulsing Glow Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-3xl blur-3xl opacity-50"
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Logo Container with Glassmorphism */}
          <motion.div
            className="relative bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-10 shadow-2xl"
            style={{
              boxShadow:
                "0 0 60px rgba(59, 130, 246, 0.4), inset 0 0 60px rgba(6, 182, 212, 0.1)",
            }}
            animate={{
              boxShadow: [
                "0 0 60px rgba(59, 130, 246, 0.4), inset 0 0 60px rgba(6, 182, 212, 0.1)",
                "0 0 80px rgba(59, 130, 246, 0.6), inset 0 0 80px rgba(6, 182, 212, 0.2)",
                "0 0 60px rgba(59, 130, 246, 0.4), inset 0 0 60px rgba(6, 182, 212, 0.1)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-blue-500/20 rounded-3xl" />

            {/* Logo with Holographic Effect */}
            <motion.div
              className="relative z-10"
              animate={{
                filter: [
                  "drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))",
                  "drop-shadow(0 0 40px rgba(6, 182, 212, 0.7))",
                  "drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))",
                ],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <img
                src="/bluedxp-logo.svg"
                alt="BlueDXP"
                className="h-20 w-auto object-contain"
                style={{
                  filter: "drop-shadow(0 0 30px rgba(59, 130, 246, 0.6))",
                }}
              />
            </motion.div>

            {/* Rotating Accent Rings */}
            {[0, 1].map((ring) => (
              <motion.div
                key={ring}
                className="absolute inset-0 rounded-3xl"
                style={{
                  border: `2px solid rgba(6, 182, 212, ${0.2 - ring * 0.1})`,
                  transform: `scale(${1.1 + ring * 0.05})`,
                }}
                animate={{
                  rotate: ring === 0 ? [0, 360] : [360, 0],
                }}
                transition={{
                  duration: 15 + ring * 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </motion.div>
        </motion.div>

        {/* Progress Section */}
        <div className="flex flex-col items-center space-y-6 w-full max-w-lg">
          {/* Animated Progress Bar */}
          <div className="w-full">
            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
              {/* Background Shimmer */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{
                  x: ["-100%", "200%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* Progress Fill */}
              <motion.div
                className="relative h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-full overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Animated Shimmer on Progress */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{
                    x: ["-100%", "200%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />

                {/* Glowing Edge */}
                <motion.div
                  className="absolute right-0 top-0 h-full w-1 bg-white blur-sm"
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </div>
          </div>

          {/* Dynamic Text with Typewriter Effect */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentText}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="text-center min-h-[32px]"
            >
              <motion.p
                className="text-white/90 text-base font-medium tracking-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {messages[currentText]}
              </motion.p>
            </motion.div>
          </AnimatePresence>

          {/* Animated Dots with Enhanced Effects */}
          <div className="flex items-center space-x-3">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Outer Glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-md"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: index * 0.2,
                    ease: "easeInOut",
                  }}
                />
                {/* Dot */}
                <motion.div
                  className="relative w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: index * 0.2,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Platform Tagline with Glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="text-center"
        >
          <motion.p
            className="text-white/50 text-xs font-light tracking-[0.2em] uppercase"
            animate={{
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Enterprise Logistics Intelligence Platform
          </motion.p>
        </motion.div>
      </div>

      {/* Corner Accents with Animation */}
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 border-t border-l border-white/10"
        animate={{
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 border-b border-r border-white/10"
        animate={{
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
    </div>
  );
}

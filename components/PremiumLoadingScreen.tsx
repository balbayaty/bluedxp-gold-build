"use client";

import {
  motion,
  AnimatePresence,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface LoadingStage {
  label: string;
  duration: number;
  progress: number;
}

// Enterprise-grade loading stages
const getLoadingStages = (userName?: string): LoadingStage[] => {
  const name = userName ? userName.split(" ")[0] : "";

  return [
    {
      label: "Initializing Intelligence Engine",
      duration: 1200,
      progress: 15,
    },
    {
      label: "Connecting to Cloud Infrastructure",
      duration: 1000,
      progress: 35,
    },
    {
      label: name ? `Loading ${name}'s Workspace` : "Loading Your Workspace",
      duration: 900,
      progress: 55,
    },
    {
      label: "Preparing Dashboard Experience",
      duration: 800,
      progress: 75,
    },
    {
      label: "Activating IoT Connectivity",
      duration: 700,
      progress: 90,
    },
    {
      label: "Finalizing Setup",
      duration: 600,
      progress: 100,
    },
  ];
};

// Premium spring configuration
const springConfig = {
  type: "spring" as const,
  stiffness: 120,
  damping: 25,
  mass: 0.8,
};

export default function PremiumLoadingScreen() {
  const { user } = useAuth();
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(15); // Start at 15% immediately
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(15);

  // Smooth progress animation with spring physics
  const progressSpring = useSpring(15, springConfig); // Initialize at 15%

  // Start with default stages if auth is still loading
  const loadingStages = useMemo(
    () => getLoadingStages(user?.name),
    [user?.name],
  );

  useEffect(() => {
    // Immediately set initial progress to prevent 0% stuck state
    const initialProgress = loadingStages[0]?.progress || 15;
    progressSpring.set(initialProgress);
    setProgress(initialProgress);
    progressRef.current = initialProgress;

    let stageTimeout: NodeJS.Timeout;

    const advanceStage = (index: number) => {
      if (index < loadingStages.length) {
        setCurrentStage(index);
        const targetProgress = loadingStages[index].progress;

        // Smooth progress animation
        progressSpring.set(targetProgress);
        progressRef.current = targetProgress;
        setProgress(targetProgress);

        stageTimeout = setTimeout(() => {
          advanceStage(index + 1);
        }, loadingStages[index].duration);
      }
    };

    // Start stage progression immediately
    advanceStage(0);

    return () => {
      clearTimeout(stageTimeout);
    };
  }, [loadingStages, progressSpring]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0a0a0f 0%, #0f1117 25%, #0a0a0f 50%, #0f1117 75%, #0a0a0f 100%)",
        backgroundSize: "400% 400%",
      }}
    >
      {/* Sophisticated Background - Enterprise Grade */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            background:
              "linear-gradient(135deg, #0a0a0f 0%, #0f1117 25%, #0a0a0f 50%, #0f1117 75%, #0a0a0f 100%)",
            backgroundSize: "400% 400%",
          }}
        />

        {/* Premium gradient orbs - sophisticated and subtle */}
        <motion.div
          className="absolute rounded-full blur-[180px]"
          style={{
            width: "1400px",
            height: "1400px",
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.04) 40%, transparent 70%)",
            left: "15%",
            top: "15%",
          }}
          animate={{
            opacity: [0.4, 0.6, 0.4],
            scale: [1, 1.08, 1],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute rounded-full blur-[180px]"
          style={{
            width: "1200px",
            height: "1200px",
            background:
              "radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.03) 40%, transparent 70%)",
            right: "12%",
            bottom: "18%",
          }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.12, 1],
            x: [0, -25, 0],
            y: [0, 25, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Refined grid pattern */}
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
            `,
            backgroundSize: "100px 100px",
            opacity: 0.4,
          }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
            backgroundPosition: ["0% 0%", "100px 100px"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Subtle connection lines - sophisticated network visualization */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.15 }}
        >
          <defs>
            <linearGradient
              id="lineGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
              <stop offset="50%" stopColor="rgba(6, 182, 212, 0.4)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.3)" />
            </linearGradient>
          </defs>
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 400;
            const centerX = 50;
            const centerY = 50;
            const x1 = centerX + Math.cos(angle) * (radius / 20);
            const y1 = centerY + Math.sin(angle) * (radius / 20);
            const x2 = centerX + Math.cos(angle + Math.PI / 4) * (radius / 20);
            const y2 = centerY + Math.sin(angle + Math.PI / 4) * (radius / 20);
            return (
              <motion.line
                key={i}
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke="url(#lineGradient)"
                strokeWidth="1"
                animate={{
                  opacity: [0.1, 0.25, 0.1],
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* Main Content - Premium Centered Layout */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-20 px-6 max-w-2xl mx-auto">
        {/* Logo - World-Class Design */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 1,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.1,
          }}
          className="relative"
        >
          {/* Premium glow effect */}
          <motion.div
            className="absolute inset-0 rounded-3xl blur-3xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)",
              transform: "scale(1.2)",
            }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
              scale: [1.2, 1.3, 1.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Logo container - premium glassmorphism */}
          <motion.div
            className="relative rounded-3xl p-14 backdrop-blur-2xl border"
            style={{
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)",
              borderColor: "rgba(255, 255, 255, 0.1)",
              boxShadow:
                "0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)",
            }}
            animate={{
              boxShadow: [
                "0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)",
                "0 25px 80px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.1)",
                "0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)",
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Inner subtle glow */}
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)",
                opacity: 0.6,
              }}
            />

            <img
              src="/bluedxp-logo.svg"
              alt="BlueDXP"
              className="h-16 w-auto object-contain relative z-10"
              style={{
                filter: "drop-shadow(0 4px 12px rgba(59, 130, 246, 0.3))",
              }}
            />
          </motion.div>
        </motion.div>

        {/* Progress Section - Enterprise Design */}
        <div className="flex flex-col items-center space-y-10 w-full">
          {/* Premium Progress Bar */}
          <div className="w-full max-w-lg">
            <div
              className="relative h-[3px] rounded-full overflow-hidden"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              {/* Progress fill with premium gradient and glow */}
              <motion.div
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(90deg, #3b82f6 0%, #06b6d4 50%, #3b82f6 100%)",
                  backgroundSize: "200% 100%",
                  boxShadow:
                    "0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.2)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 25,
                }}
              >
                {/* Premium shimmer effect */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)",
                  }}
                  animate={{
                    x: ["-100%", "200%"],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />

                {/* Glowing edge */}
                <motion.div
                  className="absolute right-0 top-0 h-full w-3"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6))",
                    filter: "blur(4px)",
                  }}
                  animate={{
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </div>
          </div>

          {/* Loading Text - Premium Typography */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-center min-h-[40px] flex items-center justify-center"
            >
              <p
                className="text-white/95 text-[16px] font-medium"
                style={{
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Helvetica Neue", Arial, sans-serif',
                  letterSpacing: "-0.02em",
                  fontWeight: 500,
                }}
              >
                {loadingStages[currentStage]?.label || "Finalizing Setup"}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress Percentage - Refined */}
          <motion.div
            className="text-white/50 text-[12px] font-medium"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Helvetica Neue", Arial, sans-serif',
              letterSpacing: "0.08em",
              fontWeight: 500,
            }}
            animate={{
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {Math.round(progress)}%
          </motion.div>
        </div>

        {/* Platform Tagline - Sophisticated */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="text-center"
        >
          <p
            className="text-white/30 text-[11px] font-light tracking-[0.2em] uppercase"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Helvetica Neue", Arial, sans-serif',
              letterSpacing: "0.2em",
              fontWeight: 300,
            }}
          >
            Enterprise Logistics Intelligence
          </p>
        </motion.div>
      </div>

      {/* Subtle Corner Accents - Premium Details */}
      <motion.div
        className="absolute top-0 left-0 w-80 h-80 border-t border-l"
        style={{
          borderColor: "rgba(255, 255, 255, 0.04)",
        }}
        animate={{
          opacity: [0.03, 0.06, 0.03],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-80 h-80 border-b border-r"
        style={{
          borderColor: "rgba(255, 255, 255, 0.04)",
        }}
        animate={{
          opacity: [0.03, 0.06, 0.03],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />
    </div>
  );
}

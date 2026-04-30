"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";

interface AdvancedHeroProps {
  language: "en" | "ar";
}

/**
 * Advanced Hero Section with 3D effects, parallax, and mind-blowing animations
 */
export default function AdvancedHero({ language }: AdvancedHeroProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
    }>
  >([]);

  // Parallax transforms
  const y = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [0, 15]);

  // Smooth spring animations
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });
  const smoothOpacity = useSpring(opacity, { stiffness: 100, damping: 30 });

  // Initialize particles
  useEffect(() => {
    const newParticles = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
    }));
    setParticles(newParticles);
  }, []);

  // Animate particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: (p.x + p.vx + window.innerWidth) % window.innerWidth,
          y: (p.y + p.vy + window.innerHeight) % window.innerHeight,
        })),
      );
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Mouse tracking for 3D effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const content = {
    en: {
      tagline: "Discover. Design. Deliver. — One Brain. Infinite Output.",
      title: "Enterprise Intelligence Operating System",
      subtitle:
        "Transform operational complexity into strategic advantage through autonomous decision-making, real-time compliance intelligence, and continuous optimization.",
      ctaExplore: "Explore Platform",
      ctaBriefing: "Schedule Demo",
      liveStats: {
        activeUsers: "Active Users",
        processes: "Processes Running",
        aiQueries: "AI Queries Today",
        compliance: "Compliance Rate",
      },
    },
    ar: {
      tagline: "اكتشف. صمم. أنجز. — عقل واحد. إنتاج لا محدود.",
      title: "نظام تشغيل الذكاء المؤسسي",
      subtitle:
        "حول التعقيد التشغيلي إلى ميزة استراتيجية من خلال اتخاذ القرارات المستقلة وذكاء الامتثال في الوقت الفعلي والتحسين المستمر.",
      ctaExplore: "استكشف المنصة",
      ctaBriefing: "جدولة عرض توضيحي",
      liveStats: {
        activeUsers: "المستخدمون النشطون",
        processes: "العمليات الجارية",
        aiQueries: "استعلامات الذكاء الاصطناعي اليوم",
        compliance: "معدل الامتثال",
      },
    },
  };

  const t = content[language];

  const [liveStats, setLiveStats] = useState({
    activeUsers: 1247,
    processes: 342,
    aiQueries: 8934,
    compliance: 97.3,
  });

  // Simulate real-time stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats((prev) => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10 - 5),
        processes: prev.processes + Math.floor(Math.random() * 5 - 2),
        aiQueries: prev.aiQueries + Math.floor(Math.random() * 20),
        compliance: Math.max(
          95,
          Math.min(99.5, prev.compliance + (Math.random() - 0.5) * 0.2),
        ),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Animated Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e14] via-[#0f172a] to-[#0a0e14]">
        {/* Animated Grid */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(5, 164, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(5, 164, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
          animate={{
            backgroundPosition: ["0px 0px", "50px 50px"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Floating Particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-[#05a4ff]"
            style={{
              width: particle.size,
              height: particle.size,
              left: particle.x,
              top: particle.y,
              boxShadow: `0 0 ${particle.size * 2}px rgba(5, 164, 255, 0.8)`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* 3D Gradient Orbs with mouse interaction */}
        <motion.div
          className="absolute top-20 right-20 w-96 h-96 bg-[#05a4ff]/20 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * 2,
            y: mousePosition.y * 2,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-96 h-96 bg-[#00d4a8]/20 rounded-full blur-3xl"
          animate={{
            x: -mousePosition.x * 2,
            y: -mousePosition.y * 2,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#8b5cf6]/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Main Content with Parallax */}
      <motion.div
        style={{ y: smoothY, opacity: smoothOpacity, scale }}
        className="relative z-10 text-center px-6 max-w-7xl mx-auto"
      >
        {/* Tagline Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <motion.div
            className="inline-block px-6 py-3 bg-gradient-to-r from-[#00d4a8]/20 to-[#05a4ff]/20 border border-[#00d4a8]/30 rounded-full backdrop-blur-sm"
            animate={{
              boxShadow: [
                "0 0 20px rgba(0, 212, 168, 0.3)",
                "0 0 40px rgba(5, 164, 255, 0.5)",
                "0 0 20px rgba(0, 212, 168, 0.3)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          >
            <span className="text-[#00d4a8] text-sm font-bold uppercase tracking-wider">
              {t.tagline}
            </span>
          </motion.div>
        </motion.div>

        {/* Main Title with 3D Effect */}
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-6xl md:text-8xl lg:text-9xl font-extrabold mb-6"
          style={{
            transform: `perspective(1000px) rotateX(${mousePosition.y * 0.1}deg) rotateY(${mousePosition.x * 0.1}deg)`,
          }}
        >
          <span className="bg-gradient-to-r from-[#05a4ff] via-[#00d4a8] to-[#8b5cf6] bg-clip-text text-transparent animate-gradient">
            BlueDXP
          </span>
          <br />
          <motion.span
            className="text-white text-4xl md:text-6xl lg:text-7xl"
            animate={{
              textShadow: [
                "0 0 20px rgba(5, 164, 255, 0.5)",
                "0 0 40px rgba(0, 212, 168, 0.5)",
                "0 0 20px rgba(5, 164, 255, 0.5)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          >
            {t.title}
          </motion.span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-[#cbd5e1] mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          {t.subtitle}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <motion.button
            onClick={() => {
              const element = document.getElementById("intelligence");
              element?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group relative px-8 py-4 bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white rounded-xl text-lg font-semibold overflow-hidden"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10 flex items-center gap-2">
              <i className="ri-play-line"></i>
              {t.ctaExplore}
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-[#00d4a8] to-[#05a4ff]"
              initial={{ x: "-100%" }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
          <motion.button
            onClick={() => router.push("/showcase")}
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border-2 border-white/20 hover:border-[#05a4ff]/50 text-white rounded-xl text-lg font-semibold backdrop-blur-sm transition-all"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <i className="ri-dashboard-line mr-2"></i>
            {t.ctaBriefing}
          </motion.button>
        </motion.div>

        {/* Live Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {Object.entries(t.liveStats).map(([key, label], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:border-[#05a4ff]/50 transition-all"
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="text-xs text-[#a0aec0] mb-2">{label}</div>
              <motion.div
                className="text-2xl font-extrabold bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] bg-clip-text text-transparent"
                key={liveStats[key as keyof typeof liveStats]}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {key === "compliance"
                  ? `${liveStats[key as keyof typeof liveStats].toFixed(1)}%`
                  : liveStats[key as keyof typeof liveStats].toLocaleString()}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-[#9ca3af] cursor-pointer"
          onClick={() => {
            const element = document.getElementById("challenge");
            element?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <span className="text-sm">Scroll to explore</span>
          <motion.i
            className="ri-arrow-down-line text-2xl"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>

      <style jsx>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 5s ease infinite;
        }
      `}</style>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface BlueDXPLandingHeroProps {
  language: "en" | "ar";
}

/**
 * BlueDXP Landing Hero Section
 *
 * Animated hero section showcasing BlueDXP Platform with:
 * - Gradient animated background
 * - Particle effects
 * - Animated tagline and title
 * - Call-to-action buttons
 * - System status indicators
 */
export default function BlueDXPLandingHero({
  language,
}: BlueDXPLandingHeroProps) {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; delay: number }>
  >([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setParticles(newParticles);
  }, []);

  const content = {
    en: {
      tagline: "Discover. Design. Deliver. — One Brain. Infinite Output.",
      title:
        "Enterprise Intelligence Operating System for Tomorrow's Operations",
      subtitle:
        "Transform operational complexity into strategic advantage through autonomous decision-making, real-time compliance intelligence, and continuous optimization powered by integrated AI reasoning and human expertise.",
      ctaExplore: "Explore Platform",
      ctaBriefing: "Schedule Executive Briefing",
    },
    ar: {
      tagline: "اكتشف. صمم. أنجز. — عقل واحد. إنتاج لا محدود.",
      title: "نظام تشغيل الذكاء المؤسسي لعمليات الغد",
      subtitle:
        "حول التعقيد التشغيلي إلى ميزة استراتيجية من خلال اتخاذ القرارات المستقلة، وذكاء الامتثال في الوقت الفعلي، والتحسين المستمر المدعوم بالاستدلال الذكي المتكامل والخبرة البشرية.",
      ctaExplore: "استكشف المنصة",
      ctaBriefing: "جدولة إحاطة تنفيذية",
    },
  };

  const t = content[language];

  return (
    <div className="relative w-full max-w-[1400px] mx-auto px-6 py-20">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#05a4ff]/8 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#00d4a8]/8 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-[#05a4ff] rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[900px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <div className="inline-block px-4 py-2 bg-[#00d4a8]/15 text-[#00d4a8] rounded-full font-bold text-sm uppercase tracking-wider mb-6">
            {t.tagline}
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight"
        >
          {t.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl text-[#cbd5e1] mb-10 max-w-[850px] leading-relaxed"
        >
          {t.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap gap-6 mb-12"
        >
          <motion.button
            onClick={() => {
              const element = document.getElementById("intelligence");
              element?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-7 py-4 bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#05a4ff]/25 transition-all hover:-translate-y-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t.ctaExplore}
          </motion.button>
          <motion.button
            onClick={() => {
              const element = document.getElementById("cta");
              element?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-7 py-4 bg-transparent text-[#05a4ff] border-2 border-[#05a4ff] rounded-lg font-semibold hover:bg-[#05a4ff]/10 transition-all hover:-translate-y-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t.ctaBriefing}
          </motion.button>
        </motion.div>

        {/* System Status Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-wrap gap-4"
        >
          {[
            { name: "BlueDXP Core", status: "ONLINE", color: "green" },
            { name: "Hazalyze AI", status: "ONLINE", color: "green" },
            { name: "WMS Module", status: "ONLINE", color: "green" },
            { name: "AI Vision", status: "ONLINE", color: "green" },
          ].map((system) => (
            <div
              key={system.name}
              className="flex items-center gap-2 px-4 py-2 bg-[#05a4ff]/10 border border-[#05a4ff]/20 rounded-lg"
            >
              <div
                className={`w-2 h-2 rounded-full bg-${system.color}-400 animate-pulse`}
              ></div>
              <span className="text-sm text-white font-medium">
                {system.name}
              </span>
              <span className="text-xs text-[#a0aec0]">{system.status}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

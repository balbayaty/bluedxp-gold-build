"use client";

import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UltimateHeroProps {
  language: "en" | "ar";
}

export default function UltimateHero({ language }: UltimateHeroProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "80%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      mouseX.set((clientX / innerWidth - 0.5) * 20);
      mouseY.set((clientY / innerHeight - 0.5) * 20);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const translations = {
    en: {
      tagline: "Discover. Design. Deliver.",
      subtitle: "One Brain. Infinite Output.",
      title: "Enterprise Intelligence Operating System",
      description:
        "Transform operational complexity into strategic advantage through autonomous decision-making, real-time compliance intelligence, and continuous optimization powered by integrated AI reasoning and human expertise.",
      explore: "Explore Platform",
      briefing: "Schedule Executive Briefing",
      watchDemo: "Watch Demo",
    },
    ar: {
      tagline: "اكتشف. صمّم. أنجز.",
      subtitle: "عقل واحد، إنتاج بلا حدود.",
      title: "نظام تشغيل الذكاء المؤسسي",
      description:
        "حوِّل تعقيد العمليات إلى ميزة استراتيجية عبر اتخاذ قرارات ذاتي، وذكاء امتثال لحظي، وتحسين مستمر مدعوم بعقلانية ذكاء اصطناعي متكاملة وخبرة بشرية.",
      explore: "استكشف المنصة",
      briefing: "احجز عرضًا تنفيذياً",
      watchDemo: "شاهد العرض التوضيحي",
    },
  };

  const t = translations[language];

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center pt-32 pb-32 overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Geometric shapes floating */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute border-2 rounded-lg"
            style={{
              left: `${10 + i * 20}%`,
              top: `${10 + i * 15}%`,
              width: `${80 + i * 20}px`,
              height: `${80 + i * 20}px`,
              borderColor:
                i % 3 === 0
                  ? "#05a4ff40"
                  : i % 3 === 1
                    ? "#00d4a840"
                    : "#8b5cf640",
              x: mouseXSpring,
              y: mouseYSpring,
            }}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 15 + i * 5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <motion.div
        style={{ y, opacity, scale }}
        className="container mx-auto px-4 sm:px-6 lg:px-10 relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          {/* Animated tagline */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-[#05a4ff]/20 via-[#00d4a8]/20 to-[#8b5cf6]/20 backdrop-blur-2xl border border-[#05a4ff]/50 rounded-full shadow-2xl shadow-[#05a4ff]/30">
              <motion.span
                className="w-4 h-4 bg-[#00d4a8] rounded-full"
                animate={{
                  scale: [1, 1.4, 1],
                  boxShadow: [
                    "0 0 10px rgba(0, 212, 168, 0.5)",
                    "0 0 30px rgba(0, 212, 168, 0.8)",
                    "0 0 10px rgba(0, 212, 168, 0.5)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-[#00d4a8] font-extrabold text-xl uppercase tracking-widest">
                {t.tagline}
              </span>
              <span className="text-white/30 text-lg">—</span>
              <span className="text-white font-bold text-xl">{t.subtitle}</span>
            </div>
          </motion.div>

          {/* Main title with morphing gradient */}
          <motion.h1
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="text-center mb-10"
          >
            <motion.span
              className="block text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-none mb-4"
              style={{
                background:
                  "linear-gradient(90deg, #ffffff, #05a4ff, #00d4a8, #8b5cf6, #ffffff)",
                backgroundSize: "300% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {t.title}
            </motion.span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.6 }}
            className="text-center text-xl md:text-2xl lg:text-3xl text-white/80 max-w-5xl mx-auto mb-16 leading-relaxed"
          >
            {t.description}
          </motion.p>

          {/* CTA Buttons with advanced effects */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-6 mb-20"
          >
            <motion.button
              whileHover={{
                scale: 1.08,
                boxShadow: "0 30px 60px rgba(5, 164, 255, 0.5)",
              }}
              whileTap={{ scale: 0.92 }}
              onClick={() => router.push("/login")}
              className="group relative px-12 py-6 bg-gradient-to-r from-[#05a4ff] via-[#0088d1] to-[#00d4a8] text-white font-black rounded-2xl overflow-hidden text-xl shadow-2xl shadow-[#05a4ff]/50"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#00d4a8] via-[#05a4ff] to-[#8b5cf6]"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.4 }}
              />
              <span className="relative z-10 flex items-center gap-3">
                <i className="ri-rocket-line text-2xl"></i>
                {t.explore}
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-6 bg-white/10 backdrop-blur-2xl border-2 border-[#05a4ff]/60 text-[#05a4ff] font-black rounded-2xl hover:bg-[#05a4ff]/20 transition-all text-xl flex items-center gap-3 shadow-xl"
            >
              <i className="ri-calendar-line text-2xl"></i>
              {t.briefing}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-6 bg-white/5 backdrop-blur-2xl border border-white/30 text-white font-black rounded-2xl hover:bg-white/15 transition-all text-xl flex items-center gap-3 shadow-xl"
            >
              <i className="ri-play-circle-line text-3xl"></i>
              {t.watchDemo}
            </motion.button>
          </motion.div>

          {/* Animated stats preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
          >
            {[
              {
                value: "99.7%",
                label: language === "en" ? "Accuracy" : "دقة",
                icon: "ri-target-line",
                color: "#00d4a8",
              },
              {
                value: "95%+",
                label: language === "en" ? "Faster" : "أسرع",
                icon: "ri-flashlight-line",
                color: "#05a4ff",
              },
              {
                value: "80%+",
                label: language === "en" ? "Cost Saved" : "توفير",
                icon: "ri-money-dollar-circle-line",
                color: "#8b5cf6",
              },
              {
                value: "24/7",
                label: language === "en" ? "Autonomous" : "ذاتي",
                icon: "ri-cpu-line",
                color: "#f59e0b",
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
                whileHover={{ scale: 1.1, y: -10 }}
                className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-2xl border border-white/20 rounded-2xl p-6 text-center hover:border-[#05a4ff]/60 transition-all shadow-xl"
              >
                <div className="flex items-center justify-center mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}30` }}
                  >
                    <i
                      className={`${stat.icon} text-2xl`}
                      style={{ color: stat.color }}
                    ></i>
                  </div>
                </div>
                <div
                  className="text-4xl font-bold mb-1"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="flex flex-col items-center gap-4 text-white/60"
        >
          <span className="text-xs uppercase tracking-widest font-bold">
            Scroll to Explore
          </span>
          <motion.div
            animate={{
              y: [0, 8, 0],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <i className="ri-arrow-down-s-line text-3xl"></i>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

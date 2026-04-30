"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface HomeHeroProps {
  language: "en" | "ar";
}

export default function HomeHero({ language }: HomeHeroProps) {
  const router = useRouter();

  const translations = {
    en: {
      tagline: "Discover. Design. Deliver.",
      subtitle: "One Brain. Infinite Output.",
      title: "Enterprise Intelligence for Decision-Driven Operations",
      description:
        "Transform operational complexity into strategic advantage through autonomous decision-making, real-time compliance intelligence, and continuous optimization powered by integrated AI reasoning and human expertise.",
      explore: "Explore Platform",
      briefing: "Schedule Executive Briefing",
      watchDemo: "Watch Demo",
    },
    ar: {
      tagline: "اكتشف. صمّم. أنجز.",
      subtitle: "عقل واحد، إنتاج بلا حدود.",
      title: "ذكاء مؤسسي لعمليات تقودها القرارات",
      description:
        "حوِّل تعقيد العمليات إلى ميزة استراتيجية عبر اتخاذ قرارات ذاتي، وذكاء امتثال لحظي، وتحسين مستمر مدعوم بعقلانية ذكاء اصطناعي متكاملة وخبرة بشرية.",
      explore: "استكشف المنصة",
      briefing: "احجز عرضًا تنفيذياً",
      watchDemo: "شاهد العرض التوضيحي",
    },
  };

  const t = translations[language];

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(5, 164, 255, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(5, 164, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Floating Orbs */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-[#05a4ff]/20 rounded-full blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-[#00d4a8]/20 rounded-full blur-3xl"
        animate={{
          x: [0, -50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 mb-6 px-4 py-2 bg-gradient-to-r from-[#05a4ff]/20 to-[#00d4a8]/20 backdrop-blur-xl border border-[#05a4ff]/30 rounded-full"
          >
            <span className="w-2 h-2 bg-[#00d4a8] rounded-full animate-pulse" />
            <span className="text-[#00d4a8] font-bold text-sm md:text-base uppercase tracking-wider">
              {t.tagline}
            </span>
            <span className="text-white/60 text-sm">—</span>
            <span className="text-white/80 font-semibold text-sm md:text-base">
              {t.subtitle}
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-white via-[#05a4ff] to-[#00d4a8] bg-clip-text text-transparent">
              {t.title}
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            {t.description}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(5, 164, 255, 0.3)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/login")}
              className="group relative px-8 py-4 bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white font-semibold rounded-xl overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <i className="ri-rocket-line"></i>
                {t.explore}
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#0088d1] to-[#006ea7]"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/5 backdrop-blur-xl border-2 border-[#05a4ff]/50 text-[#05a4ff] font-semibold rounded-xl hover:bg-[#05a4ff]/10 transition-all flex items-center gap-2"
            >
              <i className="ri-calendar-line"></i>
              {t.briefing}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <i className="ri-play-circle-line text-2xl"></i>
              {t.watchDemo}
            </motion.button>
          </motion.div>

          {/* Stats Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            {[
              { value: "99.7%", label: language === "en" ? "Accuracy" : "دقة" },
              {
                value: "95%+",
                label: language === "en" ? "Faster Decisions" : "قرارات أسرع",
              },
              {
                value: "80%+",
                label: language === "en" ? "Cost Reduction" : "خفض التكلفة",
              },
              {
                value: "24/7",
                label: language === "en" ? "Autonomous" : "ذاتي",
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center hover:border-[#05a4ff]/50 transition-all"
              >
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-white/60">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-white/60"
        >
          <span className="text-xs uppercase tracking-wider">Scroll</span>
          <i className="ri-arrow-down-line text-xl"></i>
        </motion.div>
      </motion.div>
    </section>
  );
}

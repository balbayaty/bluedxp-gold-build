"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useRouter } from "next/navigation";

interface PremiumHeroProps {
  language: "en" | "ar";
}

export default function PremiumHero({ language }: PremiumHeroProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

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
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden"
    >
      <motion.div
        style={{ y, opacity }}
        className="container mx-auto px-4 sm:px-6 lg:px-10 relative z-10"
      >
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-3 mb-8 px-6 py-3 bg-gradient-to-r from-[#05a4ff]/20 to-[#00d4a8]/20 backdrop-blur-2xl border border-[#05a4ff]/40 rounded-full"
          >
            <motion.span
              className="w-3 h-3 bg-[#00d4a8] rounded-full"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-[#00d4a8] font-bold text-lg uppercase">
              {t.tagline}
            </span>
            <span className="text-white/40">—</span>
            <span className="text-white/90 font-semibold">{t.subtitle}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight"
          >
            <span className="bg-gradient-to-r from-white via-[#05a4ff] to-[#00d4a8] bg-clip-text text-transparent">
              {t.title}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-xl md:text-2xl text-white/70 max-w-4xl mx-auto mb-12 leading-relaxed"
          >
            {t.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-6"
          >
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 25px 50px rgba(5, 164, 255, 0.4)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/login")}
              className="px-10 py-5 bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white font-bold rounded-2xl text-lg shadow-2xl shadow-[#05a4ff]/40 flex items-center gap-3"
            >
              <i className="ri-rocket-line text-2xl"></i>
              {t.explore}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-5 bg-white/5 backdrop-blur-2xl border-2 border-[#05a4ff]/50 text-[#05a4ff] font-bold rounded-2xl text-lg flex items-center gap-3"
            >
              <i className="ri-calendar-line text-xl"></i>
              {t.briefing}
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

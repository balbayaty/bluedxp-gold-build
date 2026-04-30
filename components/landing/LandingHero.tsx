"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface LandingHeroProps {
  language: "en" | "ar";
}

export default function LandingHero({ language }: LandingHeroProps) {
  const router = useRouter();

  const translations = {
    en: {
      tagline: "Discover. Design. Deliver. — One Brain. Infinite Output.",
      title: "Enterprise Intelligence for Decision-Driven Operations",
      subtitle:
        "Transform operational complexity into strategic advantage through autonomous decision-making, real-time compliance intelligence, and continuous optimization powered by integrated AI reasoning and human expertise.",
      explore: "Explore Platform",
      briefing: "Schedule Executive Briefing",
    },
    ar: {
      tagline: "اكتشف. صمّم. أنجز. — عقل واحد، إنتاج بلا حدود.",
      title: "ذكاء مؤسسي لعمليات تقودها القرارات",
      subtitle:
        "حوِّل تعقيد العمليات إلى ميزة استراتيجية عبر اتخاذ قرارات ذاتي، وذكاء امتثال لحظي، وتحسين مستمر مدعوم بعقلانية ذكاء اصطناعي متكاملة وخبرة بشرية.",
      explore: "استكشف المنصة",
      briefing: "احجز عرضًا تنفيذياً",
    },
  };

  const t = translations[language];

  return (
    <section id="hero" className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Gradient */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"
        style={{
          background:
            "radial-gradient(circle, rgba(5, 164, 255, 0.08), transparent)",
        }}
      />

      <div className="container mx-auto px-6 lg:px-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-[#00d4a8] font-bold text-lg md:text-xl uppercase tracking-wider mb-6">
            {t.tagline}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 max-w-4xl leading-tight">
            {t.title}
          </h1>

          <p className="text-lg md:text-xl text-[#cbd5e1] max-w-3xl mb-10 leading-relaxed">
            {t.subtitle}
          </p>

          <div className="flex flex-wrap gap-4 mt-12">
            <motion.button
              onClick={() => router.push("/login")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white font-semibold rounded-lg hover:from-[#0088d1] hover:to-[#006ea7] transition-all duration-200 shadow-xl shadow-[#05a4ff]/25"
            >
              {t.explore}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-transparent border-2 border-[#05a4ff] text-[#05a4ff] font-semibold rounded-lg hover:bg-[#05a4ff]/10 transition-all duration-200"
            >
              {t.briefing}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

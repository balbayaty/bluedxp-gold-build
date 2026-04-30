"use client";

import { motion } from "framer-motion";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface CTASectionProps {
  language: "en" | "ar";
  router: AppRouterInstance;
}

/**
 * Call-to-Action Section
 *
 * Encourages users to get started with BlueDXP
 */
export default function CTASection({ language, router }: CTASectionProps) {
  const content = {
    en: {
      title: "Ready to Transform Your Operations?",
      subtitle:
        "Experience the power of unified intelligence. Schedule a demo or get started today.",
      ctaPrimary: "Schedule Demo",
      ctaSecondary: "Explore Showcase",
    },
    ar: {
      title: "هل أنت مستعد لتحويل عملياتك؟",
      subtitle: "اختبر قوة الذكاء الموحد. حدد موعد عرض توضيحي أو ابدأ اليوم.",
      ctaPrimary: "جدولة عرض توضيحي",
      ctaSecondary: "استكشف العرض",
    },
  };

  const t = content[language];

  return (
    <div className="max-w-[1400px] mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-gradient-to-r from-[#05a4ff]/10 to-[#00d4a8]/5 border border-[#05a4ff]/20 rounded-2xl p-12 text-center"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white max-w-[800px] mx-auto">
          {t.title}
        </h2>
        <p className="text-xl text-[#a0aec0] mb-10 max-w-[700px] mx-auto">
          {t.subtitle}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <motion.button
            onClick={() => {
              // In a real implementation, this would open a contact form or calendar
              alert(
                language === "en"
                  ? "Demo scheduling coming soon!"
                  : "جدولة العرض التوضيحي قريباً!",
              );
            }}
            className="px-8 py-4 bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#05a4ff]/25 transition-all hover:-translate-y-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t.ctaPrimary}
          </motion.button>
          <motion.button
            onClick={() => router.push("/showcase")}
            className="px-8 py-4 bg-transparent text-[#05a4ff] border-2 border-[#05a4ff] rounded-lg font-semibold hover:bg-[#05a4ff]/10 transition-all hover:-translate-y-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t.ctaSecondary}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

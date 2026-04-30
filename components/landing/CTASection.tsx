"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface CTASectionProps {
  language: "en" | "ar";
}

export default function CTASection({ language }: CTASectionProps) {
  const router = useRouter();

  const translations = {
    en: {
      title: "Ready to Transform Your Operations?",
      desc: "See how Bluedxp becomes the intelligence backbone for your organization. Live demonstration tailored to your operational complexity and strategic priorities.",
      button: "Schedule Executive Briefing Today",
    },
    ar: {
      title: "هل أنت جاهز لتحويل عملياتك؟",
      desc: "اكتشف كيف تصبح Bluedxp العمود الفقري الذكي لمؤسستك. عرض حي مخصص لتعقيد عملياتك وأولوياتك الاستراتيجية.",
      button: "احجز عرضًا تنفيذياً اليوم",
    },
  };

  const t = translations[language];

  return (
    <div className="py-20 border-t border-[#05a4ff]/10">
      <div className="container mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-[#05a4ff]/10 to-[#00d4a8]/5 border border-[#05a4ff]/20 rounded-2xl p-12 md:p-16 text-center max-w-4xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {t.title}
          </h2>
          <p className="text-lg text-[#cbd5e1] mb-10 max-w-2xl mx-auto leading-relaxed">
            {t.desc}
          </p>
          <motion.button
            onClick={() => router.push("/login")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white font-semibold rounded-lg hover:from-[#0088d1] hover:to-[#006ea7] transition-all duration-200 shadow-xl shadow-[#05a4ff]/25 text-lg"
          >
            {t.button}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

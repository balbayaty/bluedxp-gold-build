"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useRouter } from "next/navigation";

interface PremiumCTAProps {
  language: "en" | "ar";
}

export default function PremiumCTA({ language }: PremiumCTAProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const router = useRouter();

  return (
    <section ref={ref} className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="relative max-w-6xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#05a4ff]/30 to-[#00d4a8]/30 rounded-3xl blur-3xl" />
          <div className="relative bg-gradient-to-br from-white/15 to-white/10 backdrop-blur-2xl border border-[#05a4ff]/40 rounded-3xl p-12 md:p-16 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#05a4ff]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00d4a8]/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              >
                <span className="bg-gradient-to-r from-white via-[#05a4ff] to-[#00d4a8] bg-clip-text text-transparent">
                  {language === "en"
                    ? "Ready to Transform Your Operations?"
                    : "هل أنت جاهز لتحويل عملياتك؟"}
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-xl text-white/70 mb-10 max-w-3xl mx-auto leading-relaxed"
              >
                {language === "en"
                  ? "See how Bluedxp becomes the intelligence backbone for your organization. Live demonstration tailored to your operational complexity and strategic priorities."
                  : "اكتشف كيف تصبح Bluedxp العمود الفقري الذكي لمؤسستك. عرض حي مخصص لتعقيد عملياتك وأولوياتك الاستراتيجية."}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-wrap items-center justify-center gap-6"
              >
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 25px 50px rgba(5, 164, 255, 0.5)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/login")}
                  className="px-12 py-5 bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white font-bold rounded-2xl text-lg shadow-2xl shadow-[#05a4ff]/50 flex items-center gap-3"
                >
                  <i className="ri-rocket-line text-2xl"></i>
                  {language === "en"
                    ? "Schedule Executive Briefing Today"
                    : "احجز عرضًا تنفيذياً اليوم"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/login")}
                  className="px-12 py-5 bg-white/10 backdrop-blur-2xl border-2 border-white/30 text-white font-bold rounded-2xl text-lg hover:bg-white/20 transition-all"
                >
                  {language === "en"
                    ? "Start Free Trial"
                    : "ابدأ التجربة المجانية"}
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

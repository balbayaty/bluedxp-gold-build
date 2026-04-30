"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useRouter } from "next/navigation";

interface UltimateCTAProps {
  language: "en" | "ar";
}

export default function UltimateCTA({ language }: UltimateCTAProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const router = useRouter();

  return (
    <section ref={ref} className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="relative max-w-6xl mx-auto"
        >
          {/* Glow effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#05a4ff]/40 via-[#00d4a8]/40 to-[#8b5cf6]/40 rounded-3xl blur-3xl animate-pulse" />

          <div className="relative bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-2xl border-2 border-[#05a4ff]/50 rounded-3xl p-16 md:p-20 text-center overflow-hidden shadow-2xl">
            {/* Animated background orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#05a4ff]/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
            <div
              className="absolute bottom-0 left-0 w-96 h-96 bg-[#00d4a8]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse"
              style={{ animationDelay: "1s" }}
            />

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-block bg-[#00d4a8]/20 px-6 py-3 rounded-full mb-8"
              >
                <span className="text-[#00d4a8] font-bold text-lg uppercase tracking-wider">
                  {language === "en"
                    ? "Limited Time Offer"
                    : "عرض لفترة محدودة"}
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-5xl md:text-6xl lg:text-7xl font-black mb-8"
              >
                <span
                  className="bg-gradient-to-r from-white via-[#05a4ff] to-[#00d4a8] bg-clip-text text-transparent"
                  style={{
                    backgroundSize: "200% auto",
                  }}
                >
                  {language === "en"
                    ? "Transform Your Enterprise Today"
                    : "حوّل مؤسستك اليوم"}
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-2xl text-white/80 mb-12 max-w-4xl mx-auto leading-relaxed"
              >
                {language === "en"
                  ? "Join Fortune 500 companies using Bluedxp. Get a personalized demo tailored to your operational complexity and strategic priorities."
                  : "انضم إلى شركات Fortune 500 التي تستخدم Bluedxp. احصل على عرض توضيحي مخصص لتعقيد عملياتك وأولوياتك الاستراتيجية."}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-wrap items-center justify-center gap-6"
              >
                <motion.button
                  whileHover={{
                    scale: 1.08,
                    boxShadow: "0 30px 70px rgba(5, 164, 255, 0.6)",
                  }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => router.push("/login")}
                  className="group relative px-14 py-6 bg-gradient-to-r from-[#05a4ff] via-[#0088d1] to-[#00d4a8] text-white font-black rounded-2xl overflow-hidden text-2xl shadow-2xl shadow-[#05a4ff]/60"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-[#00d4a8] via-[#05a4ff] to-[#8b5cf6]"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                  <span className="relative z-10 flex items-center gap-4">
                    <i className="ri-rocket-line text-3xl"></i>
                    {language === "en"
                      ? "Schedule Executive Briefing"
                      : "احجز عرضًا تنفيذياً"}
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/login")}
                  className="px-14 py-6 bg-white/15 backdrop-blur-2xl border-2 border-white/40 text-white font-black rounded-2xl hover:bg-white/25 transition-all text-2xl shadow-xl"
                >
                  {language === "en"
                    ? "Start Free Trial"
                    : "ابدأ التجربة المجانية"}
                </motion.button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="text-sm text-white/60 mt-8"
              >
                {language === "en"
                  ? "No credit card required • 30-day free trial • Full enterprise features"
                  : "لا حاجة لبطاقة ائتمان • تجربة مجانية 30 يومًا • جميع ميزات المؤسسة"}
              </motion.p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

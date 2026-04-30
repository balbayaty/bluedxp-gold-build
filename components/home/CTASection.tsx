"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useRouter } from "next/navigation";

interface CTASectionProps {
  language: "en" | "ar";
}

export default function CTASection({ language }: CTASectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const router = useRouter();

  return (
    <section ref={ref} className="py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="relative max-w-5xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#05a4ff]/20 to-[#00d4a8]/20 rounded-3xl blur-3xl" />
          <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-[#05a4ff]/30 rounded-3xl p-12 md:p-16 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#05a4ff]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00d4a8]/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
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
                className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed"
              >
                {language === "en"
                  ? "See how Bluedxp becomes the intelligence backbone for your organization. Live demonstration tailored to your operational complexity and strategic priorities."
                  : "اكتشف كيف تصبح Bluedxp العمود الفقري الذكي لمؤسستك. عرض حي مخصص لتعقيد عملياتك وأولوياتك الاستراتيجية."}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-wrap items-center justify-center gap-4"
              >
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 20px 40px rgba(5, 164, 255, 0.4)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/login")}
                  className="group relative px-10 py-4 bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white font-semibold rounded-xl overflow-hidden text-lg"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <i className="ri-rocket-line"></i>
                    {language === "en"
                      ? "Schedule Executive Briefing Today"
                      : "احجز عرضًا تنفيذياً اليوم"}
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
                  onClick={() => router.push("/login")}
                  className="px-10 py-4 bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-lg"
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

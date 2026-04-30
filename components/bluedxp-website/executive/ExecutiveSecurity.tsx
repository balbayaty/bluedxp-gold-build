"use client";

import { motion } from "framer-motion";
import { RiShieldCheckLine, RiLockLine, RiEyeLine } from "react-icons/ri";

interface ExecutiveSecurityProps {
  language: "en" | "ar";
}

export default function ExecutiveSecurity({
  language,
}: ExecutiveSecurityProps) {
  const isArabic = language === "ar";
  return (
    <section
      id="security"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isArabic ? "الأمان المؤسسي" : "Enterprise Security"}
          </h2>
          <p className="text-xl text-white/70">
            {isArabic
              ? "حماية متعددة الطبقات لبياناتك المؤسسية"
              : "Multi-layer protection for your enterprise data"}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[RiShieldCheckLine, RiLockLine, RiEyeLine].map((Icon, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center"
            >
              <Icon className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">
                {isArabic ? "ميزة أمان" : "Security Feature"}
              </h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

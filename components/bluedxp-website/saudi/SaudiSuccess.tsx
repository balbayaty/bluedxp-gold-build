"use client";

import { motion } from "framer-motion";

interface SaudiSuccessProps {
  language: "en" | "ar";
}

export default function SaudiSuccess({ language }: SaudiSuccessProps) {
  const isArabic = language === "ar";
  return (
    <section id="success" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {isArabic ? "قصص النجاح" : "Success Stories"}
          </h2>
          <p className="text-xl text-white/70">
            {isArabic
              ? "مؤسسات سعودية تستخدم BlueDXP بنجاح"
              : "Saudi enterprises successfully using BlueDXP"}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

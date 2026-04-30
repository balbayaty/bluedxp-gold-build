"use client";

import { motion } from "framer-motion";

interface InnovationTechProps {
  language: "en" | "ar";
}

export default function InnovationTech({ language }: InnovationTechProps) {
  const isArabic = language === "ar";
  return (
    <section
      id="tech"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {isArabic ? "التكنولوجيا المتقدمة" : "Advanced Technology"}
          </h2>
          <p className="text-xl text-white/70">
            {isArabic
              ? "أحدث التقنيات في الذكاء الاصطناعي والتعلم الآلي"
              : "Latest technologies in AI and machine learning"}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

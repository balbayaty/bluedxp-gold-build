"use client";

import { motion } from "framer-motion";
import { RiBrainLine, RiRobotLine, RiLightbulbLine } from "react-icons/ri";

interface ExecutiveIntelligenceProps {
  language: "en" | "ar";
}

export default function ExecutiveIntelligence({
  language,
}: ExecutiveIntelligenceProps) {
  const isArabic = language === "ar";
  return (
    <section id="intelligence" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isArabic ? "الذكاء المؤسسي" : "Enterprise Intelligence"}
          </h2>
          <p className="text-xl text-white/70">
            {isArabic
              ? "نظام ذكاء اصطناعي متقدم يوفر رؤى تنبؤية واتخاذ قرارات مستقلة"
              : "Advanced AI system providing predictive insights and autonomous decision-making"}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[RiBrainLine, RiRobotLine, RiLightbulbLine].map((Icon, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center"
            >
              <Icon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">
                {isArabic ? "ميزة ذكية" : "Intelligent Feature"}
              </h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

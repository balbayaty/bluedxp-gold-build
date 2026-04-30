"use client";

import { motion } from "framer-motion";
import {
  RiSparklingLine,
  RiFlashlightLine,
  RiRocketLine,
} from "react-icons/ri";

interface InnovationFeaturesProps {
  language: "en" | "ar";
}

export default function InnovationFeatures({
  language,
}: InnovationFeaturesProps) {
  const isArabic = language === "ar";
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isArabic ? "الميزات المتطورة" : "Advanced Features"}
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: RiSparklingLine,
              title: isArabic ? "الابتكار" : "Innovation",
            },
            {
              icon: RiFlashlightLine,
              title: isArabic ? "الأداء" : "Performance",
            },
            { icon: RiRocketLine, title: isArabic ? "السرعة" : "Speed" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center"
            >
              <item.icon className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

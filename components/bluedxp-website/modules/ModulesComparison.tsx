"use client";

import { motion } from "framer-motion";
import { RiCheckboxCircleLine, RiCloseCircleLine } from "react-icons/ri";

interface ModulesComparisonProps {
  language: "en" | "ar";
}

export default function ModulesComparison({
  language,
}: ModulesComparisonProps) {
  const isArabic = language === "ar";

  const comparisonData = [
    {
      feature: isArabic ? "الوحدات المتكاملة" : "Integrated Modules",
      blueDXP: true,
      competitor: false,
    },
    {
      feature: isArabic ? "الذكاء الاصطناعي" : "Artificial Intelligence",
      blueDXP: true,
      competitor: false,
    },
    {
      feature: isArabic ? "الامتثال التلقائي" : "Automated Compliance",
      blueDXP: true,
      competitor: false,
    },
    {
      feature: isArabic ? "التكامل الشامل" : "Comprehensive Integration",
      blueDXP: true,
      competitor: true,
    },
    {
      feature: isArabic ? "التحليلات التنبؤية" : "Predictive Analytics",
      blueDXP: true,
      competitor: false,
    },
    {
      feature: isArabic ? "دعم متعدد اللغات" : "Multi-language Support",
      blueDXP: true,
      competitor: true,
    },
    {
      feature: isArabic ? "التوطين الكامل" : "Full Localization",
      blueDXP: true,
      competitor: false,
    },
    {
      feature: isArabic ? "24+ وحدة" : "24+ Modules",
      blueDXP: true,
      competitor: false,
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {isArabic ? "مقارنة الوحدات" : "Module Comparison"}
          </h2>
          <p className="text-xl text-white/70">
            {isArabic ? "BlueDXP مقابل المنافسين" : "BlueDXP vs Competitors"}
          </p>
        </motion.div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
          <div className="grid grid-cols-3 gap-4 p-6 bg-white/5 border-b border-white/10">
            <div className="font-semibold text-white">
              {isArabic ? "الميزة" : "Feature"}
            </div>
            <div className="font-semibold text-white text-center">BlueDXP</div>
            <div className="font-semibold text-white/60 text-center">
              {isArabic ? "المنافسون" : "Competitors"}
            </div>
          </div>

          {comparisonData.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="grid grid-cols-3 gap-4 p-6 border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors"
            >
              <div className="text-white/90">{item.feature}</div>
              <div className="flex items-center justify-center">
                {item.blueDXP ? (
                  <RiCheckboxCircleLine className="w-6 h-6 text-green-400" />
                ) : (
                  <RiCloseCircleLine className="w-6 h-6 text-red-400" />
                )}
              </div>
              <div className="flex items-center justify-center">
                {item.competitor ? (
                  <RiCheckboxCircleLine className="w-6 h-6 text-green-400/50" />
                ) : (
                  <RiCloseCircleLine className="w-6 h-6 text-red-400/50" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

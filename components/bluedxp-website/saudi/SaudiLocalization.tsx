"use client";

import { motion } from "framer-motion";
import { RiGlobalLine, RiTranslate2, RiFileTextLine } from "react-icons/ri";

interface SaudiLocalizationProps {
  language: "en" | "ar";
}

export default function SaudiLocalization({
  language,
}: SaudiLocalizationProps) {
  const isArabic = language === "ar";
  return (
    <section
      id="localization"
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
            {isArabic ? "التوطين الكامل" : "Full Localization"}
          </h2>
          <p className="text-xl text-white/70">
            {isArabic
              ? "واجهة عربية كاملة مع دعم RTL"
              : "Full Arabic interface with RTL support"}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: RiGlobalLine,
              title: isArabic ? "العربية الكاملة" : "Full Arabic",
              desc: isArabic
                ? "واجهة عربية كاملة"
                : "Complete Arabic interface",
            },
            {
              icon: RiTranslate2,
              title: isArabic ? "RTL كامل" : "Full RTL",
              desc: isArabic
                ? "دعم كامل للغة العربية من اليمين لليسار"
                : "Complete right-to-left support",
            },
            {
              icon: RiFileTextLine,
              title: isArabic ? "المحتوى المحلي" : "Local Content",
              desc: isArabic
                ? "محتوى محلي مخصص للمملكة"
                : "Localized content for the Kingdom",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center"
            >
              <item.icon className="w-16 h-16 text-[#00ff88] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">
                {item.title}
              </h3>
              <p className="text-white/70">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

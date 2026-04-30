"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface IntelligenceSectionProps {
  language: "en" | "ar";
}

export default function IntelligenceSection({
  language,
}: IntelligenceSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const capabilities = [
    {
      icon: "ri-message-3-line",
      title: language === "en" ? "Multi-Language Support" : "دعم لغات متعددة",
      items: ["Arabic", "English", "Hindi"],
    },
    {
      icon: "ri-eye-line",
      title: language === "en" ? "Transparent Reasoning" : "استدلال شفاف",
      items: [
        language === "en" ? "Auditable decisions" : "قرارات قابلة للتدقيق",
        language === "en" ? "Explainable AI" : "ذكاء اصطناعي قابل للتفسير",
      ],
    },
    {
      icon: "ri-user-settings-line",
      title: language === "en" ? "Human Override" : "تجاوز بشري",
      items: [
        language === "en" ? "Always in control" : "دائمًا تحت السيطرة",
        language === "en" ? "Exception handling" : "معالجة الاستثناءات",
      ],
    },
  ];

  return (
    <section
      ref={ref}
      className="py-20 bg-gradient-to-b from-transparent to-[#05a4ff]/5 relative"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-[#00d4a8] bg-clip-text text-transparent">
                {language === "en"
                  ? "Intelligent Decision Intelligence"
                  : "ذكاء قرارات ذكي"}
              </span>
            </h2>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              {language === "en"
                ? "Natural language interface enabling stakeholders at all levels to query, explore, and challenge decisions in real-time."
                : "واجهة لغة طبيعية تمكّن أصحاب المصلحة من الاستعلام والاستكشاف وتحدي القرارات لحظيًا."}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {capabilities.map((cap, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#00d4a8]/50 transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#00d4a8]/20 to-[#05a4ff]/20 rounded-xl flex items-center justify-center mb-4">
                  <i className={`${cap.icon} text-2xl text-[#00d4a8]`}></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  {cap.title}
                </h3>
                <ul className="space-y-2">
                  {cap.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="text-white/70 flex items-center gap-2"
                    >
                      <i className="ri-checkbox-circle-line text-[#00d4a8]"></i>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

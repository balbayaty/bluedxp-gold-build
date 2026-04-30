"use client";

import { motion } from "framer-motion";
import { RiBrainLine, RiRobotLine, RiLightbulbFlashLine } from "react-icons/ri";

interface InnovationAIProps {
  language: "en" | "ar";
}

export default function InnovationAI({ language }: InnovationAIProps) {
  const isArabic = language === "ar";
  return (
    <section id="ai" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isArabic
              ? "الذكاء الاصطناعي المتقدم"
              : "Advanced Artificial Intelligence"}
          </h2>
          <p className="text-xl text-white/70">
            {isArabic
              ? "نظام ذكاء اصطناعي متطور يوفر رؤى فورية واتخاذ قرارات ذكية"
              : "Sophisticated AI system providing instant insights and intelligent decision-making"}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: RiBrainLine,
              title: isArabic ? "التعلم الآلي" : "Machine Learning",
              desc: isArabic
                ? "نماذج متقدمة للتعلم والتنبؤ"
                : "Advanced models for learning and prediction",
            },
            {
              icon: RiRobotLine,
              title: isArabic ? "الذكاء الآلي" : "Automation",
              desc: isArabic
                ? "أتمتة ذكية للعمليات"
                : "Intelligent process automation",
            },
            {
              icon: RiLightbulbFlashLine,
              title: isArabic ? "الرؤى الذكية" : "Smart Insights",
              desc: isArabic
                ? "تحليلات تنبؤية فورية"
                : "Instant predictive analytics",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-all"
            >
              <item.icon className="w-16 h-16 text-cyan-400 mb-4" />
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

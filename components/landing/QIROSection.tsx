"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface QIROSectionProps {
  language: "en" | "ar";
}

export default function QIROSection({ language }: QIROSectionProps) {
  const [activeAlgo, setActiveAlgo] = useState<
    "quantum" | "ml" | "genetic" | "traditional"
  >("quantum");
  const mapRef = useRef<HTMLDivElement>(null);

  const translations = {
    en: {
      title: "Quantum-Inspired Route Optimization",
      subtitle:
        "Experience next-generation pathfinding with our proprietary quantum-inspired algorithms that solve complex multi-dimensional optimization problems.",
      controls: {
        quantum: "Quantum-Inspired",
        ml: "ML-Enhanced",
        genetic: "Genetic Algorithm",
        traditional: "Traditional",
      },
      descriptions: {
        quantum: {
          icon: "🔮",
          title: "Quantum-Inspired Algorithm",
          text: "Our proprietary quantum-inspired computing architecture solves complex multi-dimensional optimization problems in milliseconds, finding optimal routes across thousands of variables that would be impossible with traditional methods.",
        },
        ml: {
          icon: "🧠",
          title: "ML-Enhanced Routing",
          text: "Deep learning models analyze historical data, real-time conditions, and predictive signals to optimize routing adaptively in every iteration.",
        },
        genetic: {
          icon: "🧬",
          title: "Genetic Algorithm",
          text: "Evolutionary search that develops candidate routes across successive generations, balancing multiple constraints and multi-objective trade-offs.",
        },
        traditional: {
          icon: "📊",
          title: "Traditional Algorithm",
          text: "Heuristic approach (Dijkstra/A*) with optimized weights—a reliable baseline for comparison with our advanced methods.",
        },
      },
      metrics: {
        time: "Processing Time",
        routes: "Routes Calculated",
        level: "Optimization Level",
      },
      values: {
        quantum: { time: "0.32s", routes: "37,621", level: "99.7%" },
        ml: { time: "0.89s", routes: "28,350", level: "97.2%" },
        genetic: { time: "2.41s", routes: "15,783", level: "94.5%" },
        traditional: { time: "8.76s", routes: "5,942", level: "86.3%" },
      },
    },
    ar: {
      title: "تحسين المسارات المستلهم من الكم",
      subtitle:
        "اختبر الجيل القادم من إيجاد المسارات عبر خوارزمياتنا المستلهمة من الكم لحل مشكلات تحسين متعددة الأبعاد.",
      controls: {
        quantum: "مستلهم من الكم",
        ml: "مدعّم بالتعلّم الآلي",
        genetic: "خوارزمية جينية",
        traditional: "تقليدي",
      },
      descriptions: {
        quantum: {
          icon: "🔮",
          title: "الخوارزمية المستلهمة من الكم",
          text: "تعالج بنيتنا الحاسوبية المستلهمة من الكم مشكلات تحسين متعددة الأبعاد في أجزاء من الثانية، وتجد مسارات مثلى عبر آلاف المتغيرات لا يمكن للأساليب التقليدية التعامل معها.",
        },
        ml: {
          icon: "🧠",
          title: "توجيه مدعّم بالتعلّم الآلي",
          text: "تحلل نماذج التعلّم العميق البيانات التاريخية والظروف اللحظية والإشارات التنبؤية لتحسين التوجيه تكيفيًا في كل مرة.",
        },
        genetic: {
          icon: "🧬",
          title: "الخوارزمية الجينية",
          text: "بحث تطوري يطوّر مسارات مرشّحة عبر أجيال متعاقبة، موازنًا القيود والمفاضلات متعددة الأهداف.",
        },
        traditional: {
          icon: "📊",
          title: "خوارزمية تقليدية",
          text: "نهج إرشادي (Dijkstra/A*) بترجيحات مُحسّنة — معيار موثوق للمقارنة مع أساليبنا المتقدمة.",
        },
      },
      metrics: {
        time: "زمن المعالجة",
        routes: "المسارات المحتسبة",
        level: "مستوى التحسين",
      },
      values: {
        quantum: { time: "0.32ث", routes: "37,621", level: "99.7%" },
        ml: { time: "0.89ث", routes: "28,350", level: "97.2%" },
        genetic: { time: "2.41ث", routes: "15,783", level: "94.5%" },
        traditional: { time: "8.76ث", routes: "5,942", level: "86.3%" },
      },
    },
  };

  const t = translations[language];
  const currentDesc = t.descriptions[activeAlgo];
  const currentValues = t.values[activeAlgo];

  return (
    <section
      id="qiro"
      className="py-20 bg-gradient-to-b from-[#05a4ff]/5 to-[#00d4a8]/5 border-t border-[#05a4ff]/10"
    >
      <div className="container mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            {t.title}
          </h2>
          <p className="text-lg text-[#a0aec0] text-center max-w-3xl mx-auto mb-8">
            {t.subtitle}
          </p>

          {/* Controls */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {Object.entries(t.controls).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveAlgo(key as typeof activeAlgo)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeAlgo === key
                    ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white shadow-lg shadow-[#05a4ff]/25"
                    : "bg-[#05a4ff]/10 border border-[#05a4ff]/30 text-[#cbd5e1] hover:bg-[#05a4ff]/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Description */}
          <div className="flex gap-4 items-start justify-center max-w-3xl mx-auto mb-8 bg-[#05a4ff]/6 border border-[#05a4ff]/20 rounded-xl p-5">
            <div className="text-3xl">{currentDesc.icon}</div>
            <div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] bg-clip-text text-transparent mb-2">
                {currentDesc.title}
              </h3>
              <p className="text-sm text-[#cbd5e1] leading-relaxed">
                {currentDesc.text}
              </p>
            </div>
          </div>

          {/* Map Visualization */}
          <div
            ref={mapRef}
            className="relative h-80 md:h-[420px] max-w-5xl mx-auto bg-[#05a4ff]/6 border border-[#05a4ff]/20 rounded-2xl overflow-hidden mb-8"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-[#a0aec0] text-lg">
                {t.controls[activeAlgo]}{" "}
                {language === "en" ? "Visualization" : "تصور"}
              </div>
            </div>

            {/* Metrics Overlay */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 w-48 z-10">
              <div className="bg-[#0a0e14]/90 border border-[#05a4ff]/30 rounded-lg p-3">
                <div className="text-xs text-[#94a3b8] mb-1">
                  {t.metrics.time}
                </div>
                <div className="text-lg font-bold text-white">
                  {currentValues.time}
                </div>
              </div>
              <div className="bg-[#0a0e14]/90 border border-[#05a4ff]/30 rounded-lg p-3">
                <div className="text-xs text-[#94a3b8] mb-1">
                  {t.metrics.routes}
                </div>
                <div className="text-lg font-bold text-white">
                  {currentValues.routes}
                </div>
              </div>
              <div className="bg-[#0a0e14]/90 border border-[#05a4ff]/30 rounded-lg p-3">
                <div className="text-xs text-[#94a3b8] mb-1">
                  {t.metrics.level}
                </div>
                <div className="text-lg font-bold text-white">
                  {currentValues.level}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

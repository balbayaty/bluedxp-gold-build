"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface ProcessMiningSectionProps {
  language: "en" | "ar";
}

export default function ProcessMiningSection({
  language,
}: ProcessMiningSectionProps) {
  const [activeView, setActiveView] = useState<
    "standard" | "compliance" | "bottlenecks" | "digital-twin"
  >("standard");
  const diagramRef = useRef<HTMLDivElement>(null);

  const translations = {
    en: {
      title: "Advanced Process Mining & Compliance Intelligence",
      ctrlLabel: "Process Visualization Mode:",
      views: {
        standard: "Standard",
        compliance: "Compliance Focus",
        bottlenecks: "Bottleneck Analysis",
        twin: "Digital Twin",
      },
      metrics: [
        {
          title: "Average Compliance Resolution",
          value: "4.2 hrs",
          label: "Industry Avg: 38 hrs",
        },
        {
          title: "Documentation Accuracy",
          value: "99.7%",
          label: "With AI Verification",
        },
        {
          title: "Bottleneck Reduction",
          value: "82%",
          label: "Through Predictive AI",
        },
        {
          title: "Digital Twin Accuracy",
          value: "99.3%",
          label: "Real vs. Simulated",
        },
      ],
    },
    ar: {
      title: "التنقيب المتقدم في العمليات وذكاء الامتثال",
      ctrlLabel: "وضع عرض العملية:",
      views: {
        standard: "قياسي",
        compliance: "تركيز الامتثال",
        bottlenecks: "تحليل الاختناقات",
        twin: "التوأم الرقمي",
      },
      metrics: [
        {
          title: "متوسط زمن حل الامتثال",
          value: "4.2 ساعة",
          label: "متوسط الصناعة: 38 ساعة",
        },
        {
          title: "دقة المستندات",
          value: "99.7%",
          label: "مع تحقق الذكاء الاصطناعي",
        },
        {
          title: "خفض الاختناقات",
          value: "82%",
          label: "باستخدام الذكاء التنبؤي",
        },
        {
          title: "دقة التوأم الرقمي",
          value: "99.3%",
          label: "الحقيقي مقابل المحاكاة",
        },
      ],
    },
  };

  const t = translations[language];

  return (
    <section id="process-mining" className="py-20 border-t border-[#05a4ff]/10">
      <div className="container mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-10">
            {t.title}
          </h2>

          {/* Controls */}
          <div className="bg-gradient-to-r from-[#05a4ff]/10 to-[#00d4a8]/6 border border-[#05a4ff]/20 rounded-xl p-4 mb-6 text-center">
            <div className="text-sm font-semibold text-[#a0aec0] mb-3">
              {t.ctrlLabel}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {Object.entries(t.views).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveView(key as typeof activeView)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeView === key
                      ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white shadow-lg shadow-[#05a4ff]/25"
                      : "bg-[#05a4ff]/10 border border-[#05a4ff]/30 text-[#cbd5e1] hover:bg-[#05a4ff]/20"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Process Diagram */}
          <div
            ref={diagramRef}
            className="relative h-96 md:h-[480px] max-w-5xl mx-auto bg-[#05a4ff]/6 border border-[#05a4ff]/20 rounded-2xl overflow-hidden mb-8"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-[#a0aec0] text-lg">
                {t.views[activeView]}{" "}
                {language === "en" ? "Visualization" : "تصور"}
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {t.metrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gradient-to-br from-[#05a4ff]/10 to-[#00d4a8]/6 border border-[#05a4ff]/20 rounded-xl p-5 text-center"
              >
                <div className="text-xs text-[#a0aec0] mb-2">
                  {metric.title}
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] bg-clip-text text-transparent mb-1">
                  {metric.value}
                </div>
                <div className="text-xs text-[#7a8ba0]">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

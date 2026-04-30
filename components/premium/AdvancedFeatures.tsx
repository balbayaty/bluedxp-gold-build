"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface AdvancedFeaturesProps {
  language: "en" | "ar";
}

export default function AdvancedFeatures({ language }: AdvancedFeaturesProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: "ri-brain-line",
      title:
        language === "en"
          ? "AI-Powered Intelligence"
          : "ذكاء مدعوم بالذكاء الاصطناعي",
      description:
        language === "en"
          ? "Advanced machine learning models that learn from every decision and continuously improve operational efficiency."
          : "نماذج تعلم آلي متقدمة تتعلم من كل قرار وتحسن الكفاءة التشغيلية باستمرار.",
      gradient: "from-[#05a4ff] to-[#0088d1]",
    },
    {
      icon: "ri-shield-star-line",
      title: language === "en" ? "Predictive Compliance" : "امتثال تنبؤي",
      description:
        language === "en"
          ? "Identify compliance risks 90+ days before they become violations with ML-powered predictive analytics."
          : "تحديد مخاطر الامتثال قبل 90+ يومًا من تحوّلها إلى مخالفات باستخدام تحليلات تنبؤية مدعومة بالتعلم الآلي.",
      gradient: "from-[#00d4a8] to-[#00b894]",
    },
    {
      icon: "ri-global-line",
      title: language === "en" ? "Multi-Region Support" : "دعم متعدد المناطق",
      description:
        language === "en"
          ? "Full support for MENA region regulations, customs procedures, and multi-language operations."
          : "دعم كامل للوائح منطقة الشرق الأوسط وشمال أفريقيا وإجراءات الجمارك والعمليات متعددة اللغات.",
      gradient: "from-[#8b5cf6] to-[#7c3aed]",
    },
    {
      icon: "ri-database-2-line",
      title: language === "en" ? "Enterprise Integration" : "تكامل المؤسسة",
      description:
        language === "en"
          ? "Seamless integration with ERP, WMS, TMS, and all enterprise systems through modern APIs."
          : "تكامل سلس مع ERP وWMS وTMS وجميع أنظمة المؤسسة عبر واجهات برمجة حديثة.",
      gradient: "from-[#f59e0b] to-[#d97706]",
    },
  ];

  return (
    <section ref={ref} id="governance" className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-[#05a4ff] bg-clip-text text-transparent">
              {language === "en"
                ? "Enterprise-Grade Features"
                : "ميزات على مستوى المؤسسة"}
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -10 }}
              className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 hover:border-[#05a4ff]/50 transition-all overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
              />
              <div className="relative z-10">
                <div
                  className={`w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-xl`}
                >
                  <i className={`${feature.icon} text-4xl text-white`}></i>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-white/70 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

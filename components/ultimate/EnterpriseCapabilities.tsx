"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface EnterpriseCapabilitiesProps {
  language: "en" | "ar";
}

export default function EnterpriseCapabilities({
  language,
}: EnterpriseCapabilitiesProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const capabilities = [
    {
      title:
        language === "en"
          ? "AI-Powered Decision Intelligence"
          : "ذكاء القرارات المدعوم بالذكاء الاصطناعي",
      description:
        language === "en"
          ? "Advanced machine learning models that continuously learn and optimize decision-making across all operational processes."
          : "نماذج تعلم آلي متقدمة تتعلم وتحسن اتخاذ القرارات باستمرار عبر جميع العمليات التشغيلية.",
      icon: "ri-brain-line",
      gradient: "from-[#05a4ff] to-[#0088d1]",
      features: [
        language === "en"
          ? "Natural language processing"
          : "معالجة اللغة الطبيعية",
        language === "en" ? "Predictive analytics" : "تحليلات تنبؤية",
        language === "en" ? "Anomaly detection" : "كشف الشذوذ",
      ],
    },
    {
      title:
        language === "en"
          ? "Predictive Compliance Engine"
          : "محرك الامتثال التنبؤي",
      description:
        language === "en"
          ? "Identify compliance risks 90+ days before violations with ML-powered predictive analytics and automated remediation."
          : "تحديد مخاطر الامتثال قبل 90+ يومًا من المخالفات مع تحليلات تنبؤية مدعومة بالتعلم الآلي وإصلاح تلقائي.",
      icon: "ri-shield-star-line",
      gradient: "from-[#00d4a8] to-[#00b894]",
      features: [
        language === "en" ? "Risk prediction models" : "نماذج تنبؤ المخاطر",
        language === "en" ? "Automated compliance" : "امتثال تلقائي",
        language === "en" ? "Real-time monitoring" : "مراقبة لحظية",
      ],
    },
    {
      title:
        language === "en" ? "Multi-Region Intelligence" : "ذكاء متعدد المناطق",
      description:
        language === "en"
          ? "Full support for MENA region with multi-language, multi-currency, and regulatory compliance across GCC countries."
          : "دعم كامل لمنطقة الشرق الأوسط وشمال أفريقيا مع لغات متعددة وعملات متعددة وامتثال تنظيمي عبر دول مجلس التعاون الخليجي.",
      icon: "ri-global-line",
      gradient: "from-[#8b5cf6] to-[#7c3aed]",
      features: [
        language === "en" ? "Multi-language support" : "دعم لغات متعددة",
        language === "en" ? "Regional compliance" : "امتثال إقليمي",
        language === "en" ? "Customs integration" : "تكامل جمركي",
      ],
    },
    {
      title:
        language === "en" ? "Enterprise Integration Hub" : "مركز تكامل المؤسسة",
      description:
        language === "en"
          ? "Seamless integration with ERP, WMS, TMS, and all enterprise systems through modern APIs and intelligent connectors."
          : "تكامل سلس مع ERP وWMS وTMS وجميع أنظمة المؤسسة عبر واجهات برمجة حديثة وموصلات ذكية.",
      icon: "ri-plug-line",
      gradient: "from-[#f59e0b] to-[#d97706]",
      features: [
        language === "en" ? "REST & GraphQL APIs" : "واجهات REST وGraphQL",
        language === "en" ? "Real-time event streaming" : "بثّ أحداث لحظي",
        language === "en" ? "Custom integrations" : "تكاملات مخصصة",
      ],
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
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-[#8b5cf6] to-[#05a4ff] bg-clip-text text-transparent">
              {language === "en"
                ? "Enterprise-Grade Capabilities"
                : "قدرات على مستوى المؤسسة"}
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {capabilities.map((capability, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -10 }}
              className="group relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 hover:border-[#05a4ff]/50 transition-all overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r ${capability.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
              />
              <div className="relative z-10">
                <div
                  className={`w-20 h-20 bg-gradient-to-br ${capability.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-2xl`}
                >
                  <i className={`${capability.icon} text-4xl text-white`}></i>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {capability.title}
                </h3>
                <p className="text-white/70 leading-relaxed mb-6">
                  {capability.description}
                </p>
                <div className="space-y-2">
                  {capability.features.map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full bg-gradient-to-r ${capability.gradient}`}
                      />
                      <span className="text-sm text-white/80">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface GovernanceSectionProps {
  language: "en" | "ar";
}

export default function GovernanceSection({
  language,
}: GovernanceSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: "ri-government-line",
      title:
        language === "en"
          ? "Municipal & Regulatory Integration"
          : "تكامل بلدي وتنظيمي",
      description:
        language === "en"
          ? "Direct integration with civil defense requirements, municipal operational standards, and governmental compliance frameworks."
          : "تكامل مباشر مع متطلبات الدفاع المدني والمعايير التشغيلية البلدية وأطر الامتثال الحكومية.",
    },
    {
      icon: "ri-file-shield-line",
      title:
        language === "en" ? "IMS Orchestration" : "تنسيق نظام الإدارة المتكامل",
      description:
        language === "en"
          ? "Unified management of Quality, Safety, Environmental, and Health standards. Compliance becomes embedded in every operational decision."
          : "إدارة موحدة لمعايير الجودة والسلامة والبيئة والصحة. يصبح الامتثال جزءًا مدمجًا في كل قرار تشغيلي.",
    },
    {
      icon: "ri-lock-password-line",
      title: language === "en" ? "Cryptographic Security" : "أمن تشفيري",
      description:
        language === "en"
          ? "Enterprise-grade security with quantum-resistant encryption, immutable audit logs, and complete data residency control."
          : "أمن على مستوى المؤسسة بتشفير مقاوم للكم وسجلات تدقيق غير قابلة للتغيير وتحكم كامل في إقامة البيانات.",
    },
    {
      icon: "ri-radar-line",
      title:
        language === "en"
          ? "Predictive Compliance Risk"
          : "مخاطر امتثال تنبؤية",
      description:
        language === "en"
          ? "Machine learning identifies compliance risks and regulatory drift 90+ days before they become violations."
          : "يتعرف التعلم الآلي على مخاطر الامتثال والانجراف التنظيمي قبل 90+ يومًا من تحوّلها إلى مخالفات.",
    },
  ];

  return (
    <section
      ref={ref}
      id="governance"
      className="py-20 bg-gradient-to-b from-transparent to-[#00d4a8]/5 relative"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block bg-[#00d4a8]/15 text-[#00d4a8] px-4 py-2 rounded-full text-sm font-semibold mb-4 uppercase tracking-wider">
            {language === "en" ? "Enterprise Governance" : "حوكمة المؤسسة"}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-[#00d4a8] bg-clip-text text-transparent">
              {language === "en"
                ? "Integrated Management System Intelligence"
                : "ذكاء نظام الإدارة المتكامل"}
            </span>
          </h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            {language === "en"
              ? "Bluedxp embeds integrated management system (IMS) logic directly into operations, making compliance automatic outcomes of intelligent operations."
              : "تُضمّن Bluedxp منطق نظام الإدارة المتكامل مباشرة في العمليات، لتصبح الامتثال نواتج تلقائية لعمليات ذكية."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-[#00d4a8]/50 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#00d4a8]/10 to-[#05a4ff]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00d4a8]/20 to-[#05a4ff]/20 rounded-2xl flex items-center justify-center mb-6">
                  <i className={`${feature.icon} text-3xl text-[#00d4a8]`}></i>
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

"use client";

import { motion } from "framer-motion";
import {
  RiShieldCheckLine,
  RiFileList3Line,
  RiGlobalLine,
  RiCheckboxCircleLine,
} from "react-icons/ri";

interface ExecutiveComplianceProps {
  language: "en" | "ar";
}

export default function ExecutiveCompliance({
  language,
}: ExecutiveComplianceProps) {
  const isArabic = language === "ar";

  const complianceFeatures = [
    {
      icon: RiShieldCheckLine,
      title: isArabic ? "الامتثال التلقائي" : "Automated Compliance",
      description: isArabic
        ? "مراقبة مستمرة وضمان الامتثال لجميع اللوائح والمعايير"
        : "Continuous monitoring and enforcement of all regulations and standards",
    },
    {
      icon: RiFileList3Line,
      title: isArabic ? "إدارة الوثائق" : "Document Management",
      description: isArabic
        ? "نظام شامل لإدارة وتتبع جميع الوثائق والموافقات"
        : "Comprehensive system for managing and tracking all documents and approvals",
    },
    {
      icon: RiGlobalLine,
      title: isArabic ? "متعدد الاختصاصات" : "Multi-Jurisdiction",
      description: isArabic
        ? "دعم الامتثال عبر مختلف البلدان والسلطات التنظيمية"
        : "Support for compliance across different countries and regulatory authorities",
    },
    {
      icon: RiCheckboxCircleLine,
      title: isArabic ? "التقارير الآلية" : "Automated Reporting",
      description: isArabic
        ? "إنشاء تقارير الامتثال تلقائياً وإرسالها للسلطات"
        : "Automatic generation and submission of compliance reports to authorities",
    },
  ];

  const standards = [
    "ISO 9001",
    "ISO 14001",
    "ISO 45001",
    "ISO 27001",
    "OHSAS 18001",
    "Saudi Standards",
    "GCC Standards",
    "EU Regulations",
    "FDA Compliance",
    "Customs Regulations",
  ];

  return (
    <section
      id="compliance"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isArabic ? "الامتثال الشامل" : "Comprehensive Compliance"}
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            {isArabic
              ? "ضمان الامتثال الكامل لجميع اللوائح والمعايير الدولية والمحلية"
              : "Ensuring full compliance with all international and local regulations and standards"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {complianceFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8"
            >
              <feature.icon className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-white/70">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8"
        >
          <h3 className="text-2xl font-semibold text-white mb-6 text-center">
            {isArabic ? "المعايير المدعومة" : "Supported Standards"}
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {standards.map((standard, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-300 text-sm font-medium"
              >
                {standard}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

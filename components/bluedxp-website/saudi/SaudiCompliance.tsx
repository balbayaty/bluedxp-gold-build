"use client";

import { motion } from "framer-motion";
import {
  RiShieldCheckLine,
  RiFileList3Line,
  RiGovernmentLine,
} from "react-icons/ri";

interface SaudiComplianceProps {
  language: "en" | "ar";
}

export default function SaudiCompliance({ language }: SaudiComplianceProps) {
  const isArabic = language === "ar";
  const complianceItems = [
    {
      icon: RiShieldCheckLine,
      title: isArabic ? "الامتثال الحكومي" : "Government Compliance",
      description: isArabic
        ? "متوافق مع جميع متطلبات الحكومة السعودية"
        : "Compliant with all Saudi government requirements",
    },
    {
      icon: RiFileList3Line,
      title: isArabic ? "اللوائح المحلية" : "Local Regulations",
      description: isArabic
        ? "متوافق مع جميع اللوائح والمعايير المحلية"
        : "Compliant with all local regulations and standards",
    },
    {
      icon: RiGovernmentLine,
      title: isArabic ? "السلطات التنظيمية" : "Regulatory Authorities",
      description: isArabic
        ? "تكامل مع جميع السلطات التنظيمية السعودية"
        : "Integration with all Saudi regulatory authorities",
    },
  ];

  return (
    <section id="compliance" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isArabic ? "الامتثال السعودي" : "Saudi Compliance"}
          </h2>
          <p className="text-xl text-white/70">
            {isArabic
              ? "امتثال كامل مع جميع المتطلبات السعودية"
              : "Full compliance with all Saudi requirements"}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {complianceItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8"
            >
              <item.icon className="w-12 h-12 text-[#00ff88] mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">
                {item.title}
              </h3>
              <p className="text-white/70">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

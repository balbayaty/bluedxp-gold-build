"use client";

import { motion } from "framer-motion";
import { RiMoneyDollarCircleLine, RiArrowUpLine } from "react-icons/ri";

interface ExecutiveROIProps {
  language: "en" | "ar";
}

export default function ExecutiveROI({ language }: ExecutiveROIProps) {
  const isArabic = language === "ar";
  return (
    <section id="roi" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isArabic ? "عائد الاستثمار" : "Return on Investment"}
          </h2>
          <p className="text-xl text-white/70">
            {isArabic
              ? "استثمار ذكي يحقق نتائج ملموسة"
              : "Smart investment delivering tangible results"}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8"
          >
            <RiMoneyDollarCircleLine className="w-16 h-16 text-yellow-400 mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-4">
              {isArabic ? "توفير التكاليف" : "Cost Savings"}
            </h3>
            <p className="text-white/70 text-lg mb-4">
              {isArabic
                ? "توفير يصل إلى 45% في التكاليف التشغيلية"
                : "Up to 45% reduction in operational costs"}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8"
          >
            <RiArrowUpLine className="w-16 h-16 text-green-400 mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-4">
              {isArabic ? "زيادة الكفاءة" : "Efficiency Gain"}
            </h3>
            <p className="text-white/70 text-lg mb-4">
              {isArabic
                ? "تحسين الكفاءة بنسبة تصل إلى 95%"
                : "Up to 95% improvement in operational efficiency"}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  RiArrowUpLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiMoneyDollarCircleLine,
} from "react-icons/ri";

interface ExecutiveMetricsProps {
  language: "en" | "ar";
}

export default function ExecutiveMetrics({ language }: ExecutiveMetricsProps) {
  const isArabic = language === "ar";
  const [metrics, setMetrics] = useState({
    efficiency: 0,
    compliance: 0,
    savings: 0,
    uptime: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        efficiency: Math.min(95, prev.efficiency + Math.random() * 2),
        compliance: Math.min(100, prev.compliance + Math.random() * 1),
        savings: Math.min(45, prev.savings + Math.random() * 1.5),
        uptime: Math.min(99.9, prev.uptime + Math.random() * 0.1),
      }));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const performanceData = [
    { month: isArabic ? "يناير" : "Jan", value: 85 },
    { month: isArabic ? "فبراير" : "Feb", value: 88 },
    { month: isArabic ? "مارس" : "Mar", value: 92 },
    { month: isArabic ? "أبريل" : "Apr", value: 90 },
    { month: isArabic ? "مايو" : "May", value: 94 },
    { month: isArabic ? "يونيو" : "Jun", value: 96 },
  ];

  const complianceData = [
    { category: isArabic ? "الامتثال" : "Compliance", value: 100 },
    { category: isArabic ? "الأمان" : "Security", value: 98 },
    { category: isArabic ? "الجودة" : "Quality", value: 95 },
    { category: isArabic ? "الكفاءة" : "Efficiency", value: 96 },
    { category: isArabic ? "الموثوقية" : "Reliability", value: 99 },
  ];

  return (
    <section
      id="metrics"
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
            {isArabic ? "الأداء القياسي" : "Proven Performance"}
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            {isArabic
              ? "أرقام حقيقية من مؤسسات عالمية تستخدم BlueDXP"
              : "Real numbers from global enterprises using BlueDXP"}
          </p>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            {
              icon: RiArrowUpLine,
              label: isArabic ? "تحسين الكفاءة" : "Efficiency Gain",
              value: `${metrics.efficiency.toFixed(1)}%`,
              color: "from-green-500 to-emerald-600",
            },
            {
              icon: RiShieldCheckLine,
              label: isArabic ? "معدل الامتثال" : "Compliance Rate",
              value: `${metrics.compliance.toFixed(1)}%`,
              color: "from-blue-500 to-blue-600",
            },
            {
              icon: RiMoneyDollarCircleLine,
              label: isArabic ? "توفير التكاليف" : "Cost Savings",
              value: `${metrics.savings.toFixed(1)}%`,
              color: "from-yellow-500 to-orange-600",
            },
            {
              icon: RiTimeLine,
              label: isArabic ? "وقت التشغيل" : "Uptime",
              value: `${metrics.uptime.toFixed(2)}%`,
              color: "from-purple-500 to-purple-600",
            },
          ].map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
            >
              <div
                className={`w-12 h-12 bg-gradient-to-br ${metric.color} rounded-lg flex items-center justify-center mb-4`}
              >
                <metric.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {metric.value}
              </div>
              <div className="text-white/60 text-sm">{metric.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts - Simplified Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-6">
              {isArabic ? "اتجاه الأداء" : "Performance Trend"}
            </h3>
            <div className="h-64 flex items-end justify-between gap-2">
              {performanceData.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: `${item.value}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg mb-2"
                    style={{ minHeight: "20px" }}
                  />
                  <span className="text-white/60 text-xs">{item.month}</span>
                  <span className="text-white text-sm font-semibold">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-6">
              {isArabic ? "مصفوفة الامتثال" : "Compliance Matrix"}
            </h3>
            <div className="space-y-4">
              {complianceData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-white/80 text-sm">{item.category}</span>
                  <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                    />
                  </div>
                  <span className="text-white font-semibold text-sm w-12 text-right">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

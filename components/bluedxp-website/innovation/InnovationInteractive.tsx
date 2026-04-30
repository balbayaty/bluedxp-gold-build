"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { RiPulseLine, RiBarChartLine, RiArrowUpLine } from "react-icons/ri";

interface InnovationInteractiveProps {
  language: "en" | "ar";
}

export default function InnovationInteractive({
  language,
}: InnovationInteractiveProps) {
  const isArabic = language === "ar";
  const [activeTab, setActiveTab] = useState(0);
  const [realTimeData, setRealTimeData] = useState([
    { time: "00:00", value: 45 },
    { time: "04:00", value: 52 },
    { time: "08:00", value: 68 },
    { time: "12:00", value: 75 },
    { time: "16:00", value: 82 },
    { time: "20:00", value: 78 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData((prev) =>
        prev.map((item) => ({
          ...item,
          value: Math.min(100, item.value + (Math.random() * 4 - 2)),
        })),
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const metrics = [
    {
      icon: RiPulseLine,
      label: isArabic ? "العمليات/ثانية" : "Ops/sec",
      value: "2.4K",
      color: "from-cyan-400 to-blue-500",
    },
    {
      icon: RiBarChartLine,
      label: isArabic ? "الاستجابة" : "Response",
      value: "12ms",
      color: "from-green-400 to-emerald-500",
    },
    {
      icon: RiArrowUpLine,
      label: isArabic ? "الكفاءة" : "Efficiency",
      value: "98%",
      color: "from-purple-400 to-pink-500",
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {isArabic
              ? "تجربة تفاعلية ديناميكية"
              : "Dynamic Interactive Experience"}
          </h2>
          <p className="text-xl text-white/70 mb-8">
            {isArabic
              ? "تفاعل مع البيانات والتحليلات في الوقت الفعلي"
              : "Interact with real-time data and analytics"}
          </p>
        </motion.div>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
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

        {/* Interactive Charts - Simplified */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <div className="flex flex-wrap gap-4 mb-6">
            {[
              isArabic ? "البيانات المباشرة" : "Live Data",
              isArabic ? "الاتجاهات" : "Trends",
              isArabic ? "الأداء" : "Performance",
            ].map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeTab === index
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="h-80 flex items-end justify-between gap-2">
            {realTimeData.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${item.value}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className={`w-full rounded-t-lg mb-2 ${
                    activeTab === 0
                      ? "bg-gradient-to-t from-cyan-500 to-blue-600"
                      : activeTab === 1
                        ? "bg-gradient-to-t from-purple-500 to-pink-600"
                        : "bg-gradient-to-t from-green-500 to-emerald-600"
                  }`}
                  style={{ minHeight: "20px" }}
                />
                <span className="text-white/60 text-xs">{item.time}</span>
                <span className="text-white text-sm font-semibold">
                  {Math.round(item.value)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

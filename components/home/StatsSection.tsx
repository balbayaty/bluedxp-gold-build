"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

interface StatsSectionProps {
  language: "en" | "ar";
}

export default function StatsSection({ language }: StatsSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const stats = [
    {
      number: "67%",
      label:
        language === "en"
          ? "Decisions rely on manual data"
          : "القرارات تعتمد على البيانات اليدوية",
      icon: "ri-bar-chart-box-line",
    },
    {
      number: "43%",
      label:
        language === "en"
          ? "Compliance issues from process gaps"
          : "قضايا الامتثال من فجوات العمليات",
      icon: "ri-shield-check-line",
    },
    {
      number: "5-7",
      label:
        language === "en"
          ? "Days average response latency"
          : "أيام متوسط تأخير الاستجابة",
      icon: "ri-time-line",
    },
    {
      number: "31%",
      label:
        language === "en"
          ? "Supply chain value lost"
          : "قيمة سلسلة الإمداد المفقودة",
      icon: "ri-line-chart-line",
    },
  ];

  return (
    <section ref={ref} className="py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-block bg-[#00d4a8]/15 text-[#00d4a8] px-4 py-2 rounded-full text-sm font-semibold mb-4 uppercase tracking-wider">
            {language === "en" ? "The Reality Today" : "الواقع اليوم"}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-[#05a4ff] bg-clip-text text-transparent">
              {language === "en"
                ? "Modern Enterprises Face an Intelligence Crisis"
                : "المؤسسات الحديثة تواجه أزمة ذكاء"}
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#05a4ff]/50 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#05a4ff]/10 to-[#00d4a8]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#05a4ff]/20 to-[#00d4a8]/20 rounded-xl flex items-center justify-center">
                    <i className={`${stat.icon} text-2xl text-[#05a4ff]`}></i>
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-white/70 leading-relaxed">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

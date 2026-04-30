"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

interface InteractiveStatsProps {
  language: "en" | "ar";
}

export default function InteractiveStats({ language }: InteractiveStatsProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [animatedValues, setAnimatedValues] = useState([0, 0, 0, 0]);

  useEffect(() => {
    if (isInView) {
      const targets = [67, 43, 5, 31];
      const duration = 2000;
      const steps = 60;
      const increment = duration / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const easeOut = 1 - Math.pow(1 - progress, 3);

        setAnimatedValues(targets.map((target) => target * easeOut));

        if (currentStep >= steps) {
          clearInterval(interval);
          setAnimatedValues(targets);
        }
      }, increment);

      return () => clearInterval(interval);
    }
  }, [isInView]);

  const stats = [
    {
      value: animatedValues[0],
      suffix: "%",
      label:
        language === "en"
          ? "Decisions rely on manual data"
          : "القرارات تعتمد على البيانات اليدوية",
      icon: "ri-bar-chart-box-line",
      color: "from-[#05a4ff] to-[#0088d1]",
    },
    {
      value: animatedValues[1],
      suffix: "%",
      label:
        language === "en"
          ? "Compliance issues from process gaps"
          : "قضايا الامتثال من فجوات العمليات",
      icon: "ri-shield-check-line",
      color: "from-[#00d4a8] to-[#00b894]",
    },
    {
      value: animatedValues[2],
      suffix: "-7",
      unit: language === "en" ? "days" : "أيام",
      label:
        language === "en"
          ? "Average response latency"
          : "متوسط تأخير الاستجابة",
      icon: "ri-time-line",
      color: "from-[#8b5cf6] to-[#7c3aed]",
    },
    {
      value: animatedValues[3],
      suffix: "%",
      label:
        language === "en"
          ? "Supply chain value lost"
          : "قيمة سلسلة الإمداد المفقودة",
      icon: "ri-line-chart-line",
      color: "from-[#f59e0b] to-[#d97706]",
    },
  ];

  return (
    <section ref={ref} className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block bg-[#00d4a8]/15 text-[#00d4a8] px-4 py-2 rounded-full text-sm font-semibold mb-4 uppercase tracking-wider">
            {language === "en" ? "The Reality Today" : "الواقع اليوم"}
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
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
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 hover:border-[#05a4ff]/50 transition-all overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg`}
                  >
                    <i className={`${stat.icon} text-3xl text-white`}></i>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-5xl md:text-6xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                    >
                      {Math.round(stat.value)}
                    </span>
                    <span
                      className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                    >
                      {stat.suffix}
                    </span>
                    {stat.unit && (
                      <span className="text-lg text-white/60 ml-1">
                        {stat.unit}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-white/70 leading-relaxed">
                  {stat.label}
                </div>

                {/* Animated Progress Bar */}
                <div className="mt-6 h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${stat.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={
                      isInView ? { width: `${stat.value}%` } : { width: 0 }
                    }
                    transition={{
                      duration: 2,
                      delay: index * 0.2,
                      ease: "easeOut",
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

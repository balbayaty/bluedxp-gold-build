"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  RiPlayLine,
  RiPauseLine,
  RiRefreshLine,
  RiFullscreenLine,
} from "react-icons/ri";

interface InnovationDemoProps {
  language: "en" | "ar";
}

export default function InnovationDemo({ language }: InnovationDemoProps) {
  const isArabic = language === "ar";
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const demoSteps = [
    {
      title: isArabic ? "بدء التشغيل" : "Initialization",
      desc: isArabic ? "تهيئة النظام" : "System initialization",
    },
    {
      title: isArabic ? "تحميل البيانات" : "Data Loading",
      desc: isArabic ? "جلب البيانات من المصادر" : "Fetching data from sources",
    },
    {
      title: isArabic ? "معالجة الذكاء الاصطناعي" : "AI Processing",
      desc: isArabic
        ? "تحليل البيانات بالذكاء الاصطناعي"
        : "AI-powered data analysis",
    },
    {
      title: isArabic ? "عرض النتائج" : "Results Display",
      desc: isArabic
        ? "عرض الرؤى والتحليلات"
        : "Displaying insights and analytics",
    },
  ];

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setCurrentStep((prevStep) => (prevStep + 1) % demoSteps.length);
            return 0;
          }
          return prev + 2;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying, demoSteps.length]);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {isArabic ? "عرض تفاعلي مباشر" : "Live Interactive Demo"}
          </h2>
          <p className="text-xl text-white/70">
            {isArabic ? "شاهد المنصة في العمل" : "See the platform in action"}
          </p>
        </motion.div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          {/* Demo Steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {demoSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-lg border transition-all ${
                  currentStep === index
                    ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/50"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    currentStep === index ? "bg-cyan-500" : "bg-white/10"
                  }`}
                >
                  <span className="text-white font-bold">{index + 1}</span>
                </div>
                <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                <p className="text-white/60 text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-sm">
                {isArabic ? "التقدم" : "Progress"}
              </span>
              <span className="text-white/70 text-sm">{progress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <motion.button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPlaying ? (
                <RiPauseLine className="w-5 h-5" />
              ) : (
                <RiPlayLine className="w-5 h-5" />
              )}
              <span>
                {isPlaying
                  ? isArabic
                    ? "إيقاف"
                    : "Pause"
                  : isArabic
                    ? "تشغيل"
                    : "Play"}
              </span>
            </motion.button>
            <motion.button
              onClick={() => {
                setCurrentStep(0);
                setProgress(0);
                setIsPlaying(false);
              }}
              className="px-6 py-3 bg-white/10 text-white rounded-lg font-medium flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RiRefreshLine className="w-5 h-5" />
              <span>{isArabic ? "إعادة" : "Reset"}</span>
            </motion.button>
            <motion.button
              className="px-6 py-3 bg-white/10 text-white rounded-lg font-medium flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RiFullscreenLine className="w-5 h-5" />
              <span>{isArabic ? "ملء الشاشة" : "Fullscreen"}</span>
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}

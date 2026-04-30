"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

interface InteractiveDemoProps {
  language: "en" | "ar";
}

export default function InteractiveDemo({ language }: InteractiveDemoProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedDemo, setSelectedDemo] = useState<
    "route" | "compliance" | "analytics"
  >("route");

  return (
    <section
      ref={ref}
      className="py-24 bg-gradient-to-b from-transparent to-[#00d4a8]/5 relative"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-[#00d4a8] bg-clip-text text-transparent">
              {language === "en"
                ? "Interactive Platform Demo"
                : "عرض توضيحي تفاعلي للمنصة"}
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {[
            {
              key: "route",
              label: language === "en" ? "Route Optimization" : "تحسين المسار",
              icon: "ri-route-line",
            },
            {
              key: "compliance",
              label: language === "en" ? "Compliance Check" : "فحص الامتثال",
              icon: "ri-shield-check-line",
            },
            {
              key: "analytics",
              label: language === "en" ? "Analytics" : "التحليلات",
              icon: "ri-bar-chart-box-line",
            },
          ].map((demo) => (
            <motion.button
              key={demo.key}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDemo(demo.key as any)}
              className={`p-6 rounded-2xl font-semibold transition-all ${
                selectedDemo === demo.key
                  ? "bg-gradient-to-r from-[#00d4a8] to-[#05a4ff] text-white shadow-xl"
                  : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
              }`}
            >
              <i className={`${demo.icon} text-3xl mb-3 block`}></i>
              {demo.label}
            </motion.button>
          ))}
        </div>

        <motion.div
          key={selectedDemo}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-12 min-h-[500px] flex items-center justify-center"
        >
          <div className="text-center">
            <i className="ri-play-circle-line text-6xl text-[#00d4a8] mb-4"></i>
            <p className="text-xl text-white/70">
              {language === "en"
                ? "Interactive Demo Coming Soon"
                : "العرض التوضيحي التفاعلي قريباً"}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

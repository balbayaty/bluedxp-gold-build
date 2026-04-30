"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface InteractivePlatformDemoProps {
  language: "en" | "ar";
}

export default function InteractivePlatformDemo({
  language,
}: InteractivePlatformDemoProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeModule, setActiveModule] = useState("wms");

  const modules = [
    { key: "wms", label: "WMS", icon: "ri-warehouse-line", color: "#05a4ff" },
    { key: "tms", label: "TMS", icon: "ri-truck-line", color: "#00d4a8" },
    {
      key: "qms",
      label: "QMS",
      icon: "ri-shield-check-line",
      color: "#8b5cf6",
    },
    { key: "ai", label: "AI", icon: "ri-brain-line", color: "#f59e0b" },
  ];

  const demoData = [
    { name: "Mon", value: 85 },
    { name: "Tue", value: 92 },
    { name: "Wed", value: 88 },
    { name: "Thu", value: 95 },
    { name: "Fri", value: 90 },
  ];

  const currentModule = modules.find((m) => m.key === activeModule)!;

  return (
    <section
      ref={ref}
      className="py-24 bg-gradient-to-b from-transparent to-[#05a4ff]/5 relative"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-[#05a4ff] to-[#00d4a8] bg-clip-text text-transparent">
              {language === "en"
                ? "Interactive Platform Demo"
                : "عرض توضيحي تفاعلي للمنصة"}
            </span>
          </h2>
        </motion.div>

        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          {modules.map((module) => (
            <motion.button
              key={module.key}
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveModule(module.key)}
              className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 ${
                activeModule === module.key
                  ? "bg-gradient-to-r text-white shadow-2xl"
                  : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
              }`}
              style={{
                background:
                  activeModule === module.key
                    ? `linear-gradient(to right, ${module.color}, ${module.color}cc)`
                    : undefined,
                boxShadow:
                  activeModule === module.key
                    ? `0 20px 60px ${module.color}60`
                    : undefined,
              }}
            >
              <i className={`${module.icon} text-2xl`}></i>
              {module.label}
            </motion.button>
          ))}
        </div>

        <motion.div
          key={activeModule}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8">
            <h3 className="text-2xl font-bold mb-6">
              {currentModule.label}{" "}
              {language === "en" ? "Performance" : "الأداء"}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={demoData}>
                <defs>
                  <linearGradient
                    id={`gradient-${currentModule.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={currentModule.color}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={currentModule.color}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 10, 15, 0.95)",
                    border: `1px solid ${currentModule.color}`,
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={currentModule.color}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill={`url(#gradient-${currentModule.key})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8">
            <h3 className="text-2xl font-bold mb-6">
              {language === "en" ? "Key Features" : "الميزات الرئيسية"}
            </h3>
            <div className="space-y-4">
              {[
                language === "en" ? "Real-time monitoring" : "مراقبة لحظية",
                language === "en"
                  ? "AI-powered insights"
                  : "رؤى مدعومة بالذكاء الاصطناعي",
                language === "en" ? "Automated workflows" : "سير عمل تلقائي",
                language === "en" ? "Compliance tracking" : "تتبع الامتثال",
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${currentModule.color}30` }}
                  >
                    <i
                      className="ri-check-line text-xl"
                      style={{ color: currentModule.color }}
                    ></i>
                  </div>
                  <span className="text-white/80 font-medium">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  RiStoreLine,
  RiTruckLine,
  RiShieldCheckLine,
  RiBrainLine,
  RiGlobalLine,
  RiFileList3Line,
  RiMoneyDollarCircleLine,
  RiUserLine,
} from "react-icons/ri";

interface ModulesIntegrationProps {
  language: "en" | "ar";
}

export default function ModulesIntegration({
  language,
}: ModulesIntegrationProps) {
  const isArabic = language === "ar";
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  const modules = [
    {
      id: "wms",
      icon: RiStoreLine,
      name: isArabic ? "إدارة المستودعات" : "WMS",
      color: "from-blue-500 to-cyan-500",
      position: "top-1/4 left-1/4",
    },
    {
      id: "tms",
      icon: RiTruckLine,
      name: isArabic ? "إدارة النقل" : "TMS",
      color: "from-green-500 to-emerald-500",
      position: "top-1/4 right-1/4",
    },
    {
      id: "compliance",
      icon: RiShieldCheckLine,
      name: isArabic ? "الامتثال" : "Compliance",
      color: "from-yellow-500 to-orange-500",
      position: "bottom-1/4 left-1/4",
    },
    {
      id: "ai",
      icon: RiBrainLine,
      name: isArabic ? "الذكاء الاصطناعي" : "AI",
      color: "from-purple-500 to-pink-500",
      position: "bottom-1/4 right-1/4",
    },
    {
      id: "trade",
      icon: RiGlobalLine,
      name: isArabic ? "التجارة" : "Trade",
      color: "from-indigo-500 to-blue-500",
      position: "top-1/2 left-1/2",
    },
    {
      id: "iso",
      icon: RiFileList3Line,
      name: isArabic ? "ISO IMS" : "ISO IMS",
      color: "from-teal-500 to-cyan-500",
      position: "top-1/3 left-1/3",
    },
    {
      id: "finance",
      icon: RiMoneyDollarCircleLine,
      name: isArabic ? "المالية" : "Finance",
      color: "from-green-500 to-teal-500",
      position: "top-1/3 right-1/3",
    },
    {
      id: "hr",
      icon: RiUserLine,
      name: isArabic ? "الموارد البشرية" : "HR",
      color: "from-pink-500 to-rose-500",
      position: "bottom-1/3 left-1/3",
    },
  ];

  const connections = [
    { from: "wms", to: "tms" },
    { from: "wms", to: "compliance" },
    { from: "tms", to: "compliance" },
    { from: "ai", to: "wms" },
    { from: "ai", to: "tms" },
    { from: "trade", to: "compliance" },
    { from: "iso", to: "compliance" },
    { from: "finance", to: "wms" },
    { from: "hr", to: "wms" },
  ];

  return (
    <section
      id="integration"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isArabic ? "التكامل السلس" : "Seamless Integration"}
          </h2>
          <p className="text-xl text-white/70">
            {isArabic
              ? "جميع الوحدات تعمل معاً بشكل متناسق"
              : "All modules work together seamlessly"}
          </p>
        </motion.div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 relative h-[600px] overflow-hidden">
          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {connections.map((conn, index) => {
              const fromModule = modules.find((m) => m.id === conn.from);
              const toModule = modules.find((m) => m.id === conn.to);
              if (!fromModule || !toModule) return null;

              const isActive =
                hoveredModule === conn.from || hoveredModule === conn.to;

              return (
                <line
                  key={index}
                  x1="50%"
                  y1="50%"
                  x2="50%"
                  y2="50%"
                  stroke={isActive ? "#8b5cf6" : "#ffffff20"}
                  strokeWidth={isActive ? 2 : 1}
                  strokeDasharray={isActive ? "0" : "5,5"}
                />
              );
            })}
          </svg>

          {/* Module Nodes */}
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onMouseEnter={() => setHoveredModule(module.id)}
              onMouseLeave={() => setHoveredModule(null)}
              className={`absolute ${module.position} transform -translate-x-1/2 -translate-y-1/2 cursor-pointer`}
            >
              <motion.div
                className={`w-20 h-20 bg-gradient-to-br ${module.color} rounded-xl flex items-center justify-center shadow-lg ${
                  hoveredModule === module.id ? "scale-125" : ""
                } transition-transform`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <module.icon className="w-10 h-10 text-white" />
              </motion.div>
              <motion.div
                className={`mt-2 text-center text-white font-medium text-sm ${
                  hoveredModule === module.id ? "opacity-100" : "opacity-70"
                } transition-opacity`}
              >
                {module.name}
              </motion.div>
            </motion.div>
          ))}

          {/* Center Hub */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-xl">
              <span className="text-white font-bold text-xl">BD</span>
            </div>
            <div className="mt-2 text-center text-white font-semibold">
              BlueDXP
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 text-center text-white/70"
        >
          <p>
            {isArabic
              ? "مرر الماوس فوق الوحدات لرؤية الاتصالات"
              : "Hover over modules to see connections"}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

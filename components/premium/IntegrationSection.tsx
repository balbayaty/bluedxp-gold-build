"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface IntegrationSectionProps {
  language: "en" | "ar";
}

export default function IntegrationSection({
  language,
}: IntegrationSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const integrations = [
    {
      name: language === "en" ? "ERP Systems" : "أنظمة ERP",
      icon: "ri-database-line",
      color: "#05a4ff",
    },
    {
      name: language === "en" ? "WMS Platforms" : "منصات WMS",
      icon: "ri-warehouse-line",
      color: "#00d4a8",
    },
    {
      name: language === "en" ? "Transportation" : "النقل",
      icon: "ri-truck-line",
      color: "#8b5cf6",
    },
    {
      name: language === "en" ? "Financial Systems" : "الأنظمة المالية",
      icon: "ri-money-dollar-circle-line",
      color: "#f59e0b",
    },
    {
      name: language === "en" ? "Regulatory Bodies" : "الهيئات التنظيمية",
      icon: "ri-government-line",
      color: "#ef4444",
    },
    {
      name: language === "en" ? "API & Webhooks" : "API وWebhooks",
      icon: "ri-plug-line",
      color: "#10b981",
    },
  ];

  return (
    <section
      ref={ref}
      id="integration"
      className="py-24 bg-gradient-to-b from-transparent to-[#05a4ff]/5 relative"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block bg-[#00d4a8]/15 text-[#00d4a8] px-4 py-2 rounded-full text-sm font-semibold mb-4 uppercase tracking-wider">
            {language === "en"
              ? "Ecosystem Architecture"
              : "معمارية النظام البيئي"}
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-[#05a4ff] bg-clip-text text-transparent">
              {language === "en"
                ? "Connected Enterprise Intelligence Network"
                : "شبكة ذكاء مؤسسية متصلة"}
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {integrations.map((integration, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
              animate={isInView ? { opacity: 1, scale: 1, rotateY: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.15, y: -10, rotateY: 5 }}
              className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-2xl p-6 hover:border-[#05a4ff]/50 transition-all text-center"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className="w-16 h-16 bg-gradient-to-br rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"
                style={{
                  backgroundColor: `${integration.color}20`,
                  background: `linear-gradient(135deg, ${integration.color}30, ${integration.color}10)`,
                }}
              >
                <i
                  className={`${integration.icon} text-3xl`}
                  style={{ color: integration.color }}
                ></i>
              </div>
              <div className="text-sm font-semibold text-white/90">
                {integration.name}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

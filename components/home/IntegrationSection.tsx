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
    },
    {
      name: language === "en" ? "WMS Platforms" : "منصات WMS",
      icon: "ri-warehouse-line",
    },
    {
      name: language === "en" ? "Transportation" : "النقل",
      icon: "ri-truck-line",
    },
    {
      name: language === "en" ? "Financial Systems" : "الأنظمة المالية",
      icon: "ri-money-dollar-circle-line",
    },
    {
      name: language === "en" ? "Regulatory Bodies" : "الهيئات التنظيمية",
      icon: "ri-government-line",
    },
    {
      name: language === "en" ? "API & Webhooks" : "API وWebhooks",
      icon: "ri-plug-line",
    },
  ];

  return (
    <section ref={ref} id="integration" className="py-20 relative">
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
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-[#05a4ff] bg-clip-text text-transparent">
              {language === "en"
                ? "Connected Enterprise Intelligence Network"
                : "شبكة ذكاء مؤسسية متصلة"}
            </span>
          </h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            {language === "en"
              ? "Bluedxp integrates seamlessly with enterprise systems through open APIs and intelligent connectors. One unified brain. All your data. All your systems."
              : "تتكامل Bluedxp بسلاسة مع أنظمة المؤسسة عبر واجهات API مفتوحة وموصلات ذكية. عقل موحد واحد. كل بياناتك. كل أنظمتك."}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {integrations.map((integration, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.1, y: -5 }}
              className="group bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#05a4ff]/50 transition-all text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-[#05a4ff]/20 to-[#00d4a8]/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <i
                  className={`${integration.icon} text-3xl text-[#05a4ff]`}
                ></i>
              </div>
              <div className="text-sm font-medium text-white/80">
                {integration.name}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

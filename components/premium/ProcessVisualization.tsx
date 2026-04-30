"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface ProcessVisualizationProps {
  language: "en" | "ar";
}

export default function ProcessVisualization({
  language,
}: ProcessVisualizationProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeView, setActiveView] = useState<
    "standard" | "compliance" | "bottlenecks"
  >("standard");

  const processData = {
    standard: [
      {
        name: language === "en" ? "Order Received" : "تم استلام الطلب",
        value: 100,
        color: "#05a4ff",
      },
      {
        name: language === "en" ? "Resource Allocation" : "تخصيص الموارد",
        value: 85,
        color: "#00d4a8",
      },
      {
        name: language === "en" ? "Route Planning" : "تخطيط المسار",
        value: 92,
        color: "#8b5cf6",
      },
      {
        name: language === "en" ? "Pickup" : "الاستلام",
        value: 78,
        color: "#f59e0b",
      },
      {
        name: language === "en" ? "Delivery" : "التسليم",
        value: 95,
        color: "#10b981",
      },
    ],
    compliance: [
      {
        name:
          language === "en" ? "Document Verification" : "التحقق من المستندات",
        value: 99,
        color: "#00d4a8",
      },
      {
        name:
          language === "en"
            ? "AI Compliance Check"
            : "فحص الامتثال بالذكاء الاصطناعي",
        value: 97,
        color: "#05a4ff",
      },
      {
        name: language === "en" ? "Regional Regulations" : "لوائح إقليمية",
        value: 94,
        color: "#8b5cf6",
      },
      {
        name: language === "en" ? "Approval Process" : "عملية الموافقة",
        value: 88,
        color: "#f59e0b",
      },
    ],
    bottlenecks: [
      {
        name: language === "en" ? "Customs Backlogs" : "تراكمات جمركية",
        value: 45,
        color: "#ef4444",
      },
      {
        name: language === "en" ? "Border Congestion" : "ازدحام حدودي",
        value: 32,
        color: "#f59e0b",
      },
      {
        name: language === "en" ? "Resource Constraints" : "قيود الموارد",
        value: 28,
        color: "#8b5cf6",
      },
      {
        name: language === "en" ? "Capacity Limits" : "حدود السعة",
        value: 15,
        color: "#05a4ff",
      },
    ],
  };

  const currentData = processData[activeView];

  return (
    <section ref={ref} id="intelligence" className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block bg-[#00d4a8]/15 text-[#00d4a8] px-4 py-2 rounded-full text-sm font-semibold mb-4 uppercase tracking-wider">
            {language === "en"
              ? "Process Mining & Intelligence"
              : "التنقيب في العمليات والذكاء"}
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-[#00d4a8] bg-clip-text text-transparent">
              {language === "en"
                ? "Advanced Process Visualization"
                : "تصور العمليات المتقدم"}
            </span>
          </h2>
        </motion.div>

        {/* View Toggle */}
        <div className="flex justify-center gap-4 mb-12">
          {[
            {
              key: "standard",
              label: language === "en" ? "Standard" : "قياسي",
            },
            {
              key: "compliance",
              label: language === "en" ? "Compliance" : "الامتثال",
            },
            {
              key: "bottlenecks",
              label: language === "en" ? "Bottlenecks" : "الاختناقات",
            },
          ].map((view) => (
            <motion.button
              key={view.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveView(view.key as any)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeView === view.key
                  ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white shadow-xl shadow-[#05a4ff]/30"
                  : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
              }`}
            >
              {view.label}
            </motion.button>
          ))}
        </div>

        {/* Interactive Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8"
          >
            <h3 className="text-2xl font-bold mb-6 text-center">
              {language === "en" ? "Process Distribution" : "توزيع العمليات"}
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={currentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {currentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 10, 15, 0.95)",
                    border: "1px solid rgba(5, 164, 255, 0.3)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Process Flow */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8"
          >
            <h3 className="text-2xl font-bold mb-6 text-center">
              {language === "en" ? "Process Flow" : "تدفق العملية"}
            </h3>
            <div className="space-y-4">
              {currentData.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#05a4ff]/50 transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${step.color}20` }}
                  >
                    <span
                      className="text-xl font-bold"
                      style={{ color: step.color }}
                    >
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">
                      {step.name}
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: step.color }}
                        initial={{ width: 0 }}
                        animate={
                          isInView ? { width: `${step.value}%` } : { width: 0 }
                        }
                        transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                      />
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      {step.value}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

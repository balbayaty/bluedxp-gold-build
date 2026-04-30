"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AdvancedROICalculatorProps {
  language: "en" | "ar";
}

export default function AdvancedROICalculator({
  language,
}: AdvancedROICalculatorProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [annualRevenue, setAnnualRevenue] = useState(10000000);
  const [employees, setEmployees] = useState(100);
  const [currentCost, setCurrentCost] = useState(500000);

  const savings = {
    efficiency: annualRevenue * 0.15,
    compliance: employees * 50000,
    automation: employees * 30000,
    total: annualRevenue * 0.15 + employees * 80000,
  };

  const roi = ((savings.total - currentCost) / currentCost) * 100;
  const paybackMonths = currentCost / (savings.total / 12);

  const projectionData = [...Array(12)].map((_, i) => ({
    month: i + 1,
    savings: (savings.total / 12) * (i + 1),
    cost: currentCost,
    net: (savings.total / 12) * (i + 1) - currentCost,
  }));

  return (
    <section
      ref={ref}
      className="py-24 bg-gradient-to-b from-transparent to-[#8b5cf6]/5 relative"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-[#8b5cf6] to-[#f59e0b] bg-clip-text text-transparent">
              {language === "en" ? "Calculate Your ROI" : "احسب عائد الاستثمار"}
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            className="bg-gradient-to-br from-white/15 to-white/10 backdrop-blur-2xl border border-white/30 rounded-3xl p-8"
          >
            <h3 className="text-2xl font-bold mb-8">
              {language === "en" ? "Input Parameters" : "المعاملات"}
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-white/70 mb-3 font-semibold">
                  {language === "en"
                    ? "Annual Revenue (USD)"
                    : "الإيرادات السنوية (دولار)"}
                </label>
                <input
                  type="range"
                  min="1000000"
                  max="100000000"
                  step="1000000"
                  value={annualRevenue}
                  onChange={(e) => setAnnualRevenue(Number(e.target.value))}
                  className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(annualRevenue / 100000000) * 100}%, rgba(255,255,255,0.1) ${(annualRevenue / 100000000) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                />
                <div className="text-3xl font-bold text-[#8b5cf6] mt-3">
                  ${(annualRevenue / 1000000).toFixed(1)}M
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-3 font-semibold">
                  {language === "en" ? "Number of Employees" : "عدد الموظفين"}
                </label>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  value={employees}
                  onChange={(e) => setEmployees(Number(e.target.value))}
                  className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(employees / 1000) * 100}%, rgba(255,255,255,0.1) ${(employees / 1000) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                />
                <div className="text-3xl font-bold text-[#f59e0b] mt-3">
                  {employees}
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-3 font-semibold">
                  {language === "en"
                    ? "Current System Cost (USD)"
                    : "تكلفة النظام الحالي (دولار)"}
                </label>
                <input
                  type="range"
                  min="100000"
                  max="5000000"
                  step="100000"
                  value={currentCost}
                  onChange={(e) => setCurrentCost(Number(e.target.value))}
                  className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #05a4ff 0%, #05a4ff ${(currentCost / 5000000) * 100}%, rgba(255,255,255,0.1) ${(currentCost / 5000000) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                />
                <div className="text-3xl font-bold text-[#05a4ff] mt-3">
                  ${(currentCost / 1000000).toFixed(1)}M
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            className="bg-gradient-to-br from-white/15 to-white/10 backdrop-blur-2xl border border-white/30 rounded-3xl p-8"
          >
            <h3 className="text-2xl font-bold mb-8">
              {language === "en" ? "Projected Savings" : "التوفير المتوقع"}
            </h3>
            <div className="space-y-4">
              {[
                {
                  label:
                    language === "en" ? "Efficiency Gains" : "مكاسب الكفاءة",
                  value: savings.efficiency,
                  color: "#00d4a8",
                },
                {
                  label:
                    language === "en" ? "Compliance Savings" : "توفير الامتثال",
                  value: savings.compliance,
                  color: "#05a4ff",
                },
                {
                  label:
                    language === "en" ? "Automation Savings" : "توفير الأتمتة",
                  value: savings.automation,
                  color: "#8b5cf6",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/10"
                >
                  <span className="text-white/80 font-medium">
                    {item.label}
                  </span>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: item.color }}
                  >
                    ${(item.value / 1000000).toFixed(1)}M
                  </span>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-8 p-8 bg-gradient-to-r from-[#8b5cf6]/30 to-[#05a4ff]/30 rounded-3xl border-2 border-[#8b5cf6]/50 shadow-2xl shadow-[#8b5cf6]/40"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold">
                    {language === "en"
                      ? "Total Annual Savings"
                      : "إجمالي التوفير السنوي"}
                  </span>
                  <span className="text-4xl font-black text-white">
                    ${(savings.total / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <div className="text-xs text-white/60 mb-1">
                      {language === "en" ? "ROI" : "عائد الاستثمار"}
                    </div>
                    <div className="text-2xl font-bold text-[#00d4a8]">
                      {roi.toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-white/60 mb-1">
                      {language === "en" ? "Payback Period" : "فترة الاسترداد"}
                    </div>
                    <div className="text-2xl font-bold text-[#05a4ff]">
                      {paybackMonths.toFixed(1)}{" "}
                      {language === "en" ? "months" : "شهر"}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8"
        >
          <h3 className="text-2xl font-bold mb-6">
            {language === "en" ? "12-Month Projection" : "إسقاط 12 شهرًا"}
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4a8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#00d4a8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" />
              <YAxis stroke="rgba(255,255,255,0.6)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(10, 10, 15, 0.95)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  borderRadius: "16px",
                  color: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="savings"
                stroke="#00d4a8"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSavings)"
              />
              <Area
                type="monotone"
                dataKey="net"
                stroke="#8b5cf6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorNet)"
              />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </section>
  );
}

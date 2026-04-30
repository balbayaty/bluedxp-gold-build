"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

interface ROICalculatorProps {
  language: "en" | "ar";
}

export default function ROICalculator({ language }: ROICalculatorProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [annualRevenue, setAnnualRevenue] = useState(10000000);
  const [employees, setEmployees] = useState(100);

  const savings = {
    efficiency: annualRevenue * 0.15,
    compliance: employees * 50000,
    automation: employees * 30000,
    total: annualRevenue * 0.15 + employees * 80000,
  };

  const roi = ((savings.total - 500000) / 500000) * 100;

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
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-[#8b5cf6] bg-clip-text text-transparent">
              {language === "en" ? "Calculate Your ROI" : "احسب عائد الاستثمار"}
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8"
          >
            <h3 className="text-2xl font-bold mb-6">
              {language === "en" ? "Input Parameters" : "المعاملات"}
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  {language === "en" ? "Annual Revenue" : "الإيرادات السنوية"}
                </label>
                <input
                  type="number"
                  value={annualRevenue}
                  onChange={(e) => setAnnualRevenue(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#8b5cf6]/50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  {language === "en" ? "Number of Employees" : "عدد الموظفين"}
                </label>
                <input
                  type="number"
                  value={employees}
                  onChange={(e) => setEmployees(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#8b5cf6]/50"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8"
          >
            <h3 className="text-2xl font-bold mb-6">
              {language === "en" ? "Projected Savings" : "التوفير المتوقع"}
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                <span className="text-white/70">
                  {language === "en" ? "Efficiency Gains" : "مكاسب الكفاءة"}
                </span>
                <span className="text-2xl font-bold text-[#00d4a8]">
                  ${(savings.efficiency / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                <span className="text-white/70">
                  {language === "en" ? "Compliance Savings" : "توفير الامتثال"}
                </span>
                <span className="text-2xl font-bold text-[#05a4ff]">
                  ${(savings.compliance / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                <span className="text-white/70">
                  {language === "en" ? "Automation Savings" : "توفير الأتمتة"}
                </span>
                <span className="text-2xl font-bold text-[#8b5cf6]">
                  ${(savings.automation / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="mt-6 p-6 bg-gradient-to-r from-[#8b5cf6]/20 to-[#05a4ff]/20 rounded-2xl border border-[#8b5cf6]/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold">
                    {language === "en"
                      ? "Total Annual Savings"
                      : "إجمالي التوفير السنوي"}
                  </span>
                  <span className="text-3xl font-bold text-white">
                    ${(savings.total / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="text-sm text-white/60">
                  {language === "en" ? "ROI" : "عائد الاستثمار"}:{" "}
                  <span className="text-[#00d4a8] font-bold">
                    {roi.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

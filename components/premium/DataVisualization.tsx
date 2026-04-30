"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

interface DataVisualizationProps {
  language: "en" | "ar";
}

export default function DataVisualization({
  language,
}: DataVisualizationProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [chartType, setChartType] = useState<"bar" | "line" | "radar">("bar");

  const barData = [
    {
      category: language === "en" ? "Q1" : "الربع الأول",
      value: 85,
      target: 90,
    },
    {
      category: language === "en" ? "Q2" : "الربع الثاني",
      value: 92,
      target: 90,
    },
    {
      category: language === "en" ? "Q3" : "الربع الثالث",
      value: 88,
      target: 90,
    },
    {
      category: language === "en" ? "Q4" : "الربع الرابع",
      value: 95,
      target: 90,
    },
  ];

  const lineData = [
    {
      month: language === "en" ? "Jan" : "يناير",
      efficiency: 78,
      compliance: 82,
      speed: 75,
    },
    {
      month: language === "en" ? "Feb" : "فبراير",
      efficiency: 82,
      compliance: 85,
      speed: 80,
    },
    {
      month: language === "en" ? "Mar" : "مارس",
      efficiency: 85,
      compliance: 88,
      speed: 83,
    },
    {
      month: language === "en" ? "Apr" : "أبريل",
      efficiency: 88,
      compliance: 90,
      speed: 86,
    },
    {
      month: language === "en" ? "May" : "مايو",
      efficiency: 90,
      compliance: 92,
      speed: 89,
    },
    {
      month: language === "en" ? "Jun" : "يونيو",
      efficiency: 93,
      compliance: 95,
      speed: 92,
    },
  ];

  const radarData = [
    { subject: language === "en" ? "Accuracy" : "دقة", A: 99, fullMark: 100 },
    { subject: language === "en" ? "Speed" : "سرعة", A: 95, fullMark: 100 },
    { subject: language === "en" ? "Cost" : "تكلفة", A: 85, fullMark: 100 },
    {
      subject: language === "en" ? "Compliance" : "امتثال",
      A: 98,
      fullMark: 100,
    },
    {
      subject: language === "en" ? "Efficiency" : "كفاءة",
      A: 94,
      fullMark: 100,
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
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-[#8b5cf6] bg-clip-text text-transparent">
              {language === "en"
                ? "Interactive Data Analytics"
                : "تحليلات بيانات تفاعلية"}
            </span>
          </h2>
        </motion.div>

        {/* Chart Type Selector */}
        <div className="flex justify-center gap-4 mb-12">
          {[
            {
              key: "bar",
              label: language === "en" ? "Bar Chart" : "مخطط شريطي",
              icon: "ri-bar-chart-line",
            },
            {
              key: "line",
              label: language === "en" ? "Line Chart" : "مخطط خطي",
              icon: "ri-line-chart-line",
            },
            {
              key: "radar",
              label: language === "en" ? "Radar Chart" : "مخطط رادار",
              icon: "ri-radar-line",
            },
          ].map((type) => (
            <motion.button
              key={type.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setChartType(type.key as any)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                chartType === type.key
                  ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-xl"
                  : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
              }`}
            >
              <i className={type.icon}></i>
              {type.label}
            </motion.button>
          ))}
        </div>

        {/* Chart Display */}
        <motion.div
          key={chartType}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8"
        >
          <ResponsiveContainer width="100%" height={500}>
            {chartType === "bar" && (
              <BarChart data={barData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis dataKey="category" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 10, 15, 0.95)",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="target" fill="#00d4a8" radius={[8, 8, 0, 0]} />
              </BarChart>
            )}
            {chartType === "line" && (
              <LineChart data={lineData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 10, 15, 0.95)",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                />
                <Line
                  type="monotone"
                  dataKey="compliance"
                  stroke="#00d4a8"
                  strokeWidth={3}
                />
                <Line
                  type="monotone"
                  dataKey="speed"
                  stroke="#05a4ff"
                  strokeWidth={3}
                />
              </LineChart>
            )}
            {chartType === "radar" && (
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis
                  dataKey="subject"
                  stroke="rgba(255,255,255,0.5)"
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  stroke="rgba(255,255,255,0.5)"
                />
                <Radar
                  name="Performance"
                  dataKey="A"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 10, 15, 0.95)",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
              </RadarChart>
            )}
          </ResponsiveContainer>
        </motion.div>
      </div>
    </section>
  );
}

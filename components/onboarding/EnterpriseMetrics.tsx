"use client";

import { motion } from "framer-motion";
import {
  FiAward,
  FiTrendingUp,
  FiShield,
  FiGlobe,
  FiZap,
  FiUsers,
  FiBarChart,
  FiTarget,
  FiCheckCircle,
  FiArrowUpRight,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

const METRICS = [
  {
    icon: FiUsers,
    value: "50+",
    label: "Countries Served",
    color: "blue",
    description: "Global presence with local expertise",
    trend: [42, 45, 48, 50, 52, 50],
    comparison: { industry: "35+", percentile: "95th" },
    insights: [
      { text: "Expanded to 8 new markets in Q4", type: "positive" },
      { text: "Market penetration up 12% YoY", type: "positive" },
    ],
    subData: [
      { region: "MEA", value: 18, color: "#3b82f6" },
      { region: "APAC", value: 15, color: "#06b6d4" },
      { region: "Europe", value: 12, color: "#8b5cf6" },
      { region: "Americas", value: 5, color: "#ec4899" },
    ],
  },
  {
    icon: FiTrendingUp,
    value: "99.99%",
    label: "Uptime SLA",
    color: "green",
    description: "Enterprise-grade reliability",
    trend: [99.95, 99.96, 99.97, 99.98, 99.99, 99.99],
    comparison: { industry: "99.5%", percentile: "99th" },
    insights: [
      { text: "Zero downtime incidents in 6 months", type: "positive" },
      { text: "MTTR reduced by 40%", type: "positive" },
    ],
    subData: [
      { period: "Q1", value: 99.95 },
      { period: "Q2", value: 99.97 },
      { period: "Q3", value: 99.98 },
      { period: "Q4", value: 99.99 },
    ],
  },
  {
    icon: FiZap,
    value: "30+",
    label: "Integrated Modules",
    color: "cyan",
    description: "Comprehensive platform coverage",
    trend: [25, 27, 28, 29, 30, 30],
    comparison: { industry: "15-20", percentile: "Top 1%" },
    insights: [
      { text: "3 new modules launched this quarter", type: "positive" },
      { text: "100% module integration success rate", type: "positive" },
    ],
    subData: [
      { category: "Operations", count: 12 },
      { category: "Intelligence", count: 8 },
      { category: "Compliance", count: 6 },
      { category: "Integration", count: 4 },
    ],
  },
  {
    icon: FiShield,
    value: "ISO 27001",
    label: "Security Certified",
    color: "purple",
    description: "Bank-level security standards",
    trend: [95, 96, 97, 98, 99, 100],
    comparison: { industry: "85%", percentile: "Top 5%" },
    insights: [
      { text: "Zero security breaches in 24 months", type: "positive" },
      { text: "SOC 2 Type II certified", type: "positive" },
    ],
    subData: [
      { standard: "ISO 27001", status: "Certified", score: 100 },
      { standard: "SOC 2", status: "Type II", score: 98 },
      { standard: "GDPR", status: "Compliant", score: 100 },
    ],
  },
  {
    icon: FiAward,
    value: "4IR/5IR",
    label: "Future-Ready",
    color: "yellow",
    description: "Aligned with industrial revolutions",
    trend: [88, 90, 92, 94, 96, 100],
    comparison: { industry: "60%", percentile: "Top 2%" },
    insights: [
      { text: "Full 5IR alignment achieved", type: "positive" },
      { text: "Quantum-ready architecture deployed", type: "positive" },
    ],
    subData: [
      { pillar: "IoT Integration", score: 100 },
      { pillar: "AI/ML", score: 98 },
      { pillar: "Sustainability", score: 95 },
      { pillar: "Human-Centric", score: 100 },
    ],
  },
  {
    icon: FiGlobe,
    value: "2030",
    label: "Vision Aligned",
    color: "orange",
    description: "Saudi Vision 2030 compliance",
    trend: [92, 94, 96, 98, 99, 100],
    comparison: { industry: "70%", percentile: "Top 1%" },
    insights: [
      { text: "17 government agencies integrated", type: "positive" },
      { text: "100% regulatory compliance score", type: "positive" },
    ],
    subData: [
      { agency: "ZATCA", compliance: 100 },
      { agency: "SAMA", compliance: 98 },
      { agency: "MOI", compliance: 100 },
      { agency: "MOC", compliance: 97 },
    ],
  },
];

export default function EnterpriseMetrics() {
  const colorMap: Record<
    string,
    {
      icon: string;
      gradient: string;
      glow: string;
      border: string;
      stroke: string;
    }
  > = {
    blue: {
      icon: "text-blue-400",
      gradient: "from-blue-500/20 to-blue-600/10",
      glow: "from-blue-500/10",
      border: "border-blue-500/30",
      stroke: "#60a5fa",
    },
    green: {
      icon: "text-green-400",
      gradient: "from-green-500/20 to-green-600/10",
      glow: "from-green-500/10",
      border: "border-green-500/30",
      stroke: "#4ade80",
    },
    cyan: {
      icon: "text-cyan-400",
      gradient: "from-cyan-500/20 to-cyan-600/10",
      glow: "from-cyan-500/10",
      border: "border-cyan-500/30",
      stroke: "#22d3ee",
    },
    purple: {
      icon: "text-purple-400",
      gradient: "from-purple-500/20 to-purple-600/10",
      glow: "from-purple-500/10",
      border: "border-purple-500/30",
      stroke: "#a78bfa",
    },
    yellow: {
      icon: "text-yellow-400",
      gradient: "from-yellow-500/20 to-yellow-600/10",
      glow: "from-yellow-500/10",
      border: "border-yellow-500/30",
      stroke: "#fbbf24",
    },
    orange: {
      icon: "text-orange-400",
      gradient: "from-orange-500/20 to-orange-600/10",
      glow: "from-orange-500/10",
      border: "border-orange-500/30",
      stroke: "#fb923c",
    },
  };

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Enterprise-Grade Metrics
          </span>
        </h2>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
          Trusted by leading organizations worldwide
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {METRICS.map((metric, index) => {
          const trendData = metric.trend.map((val, i) => ({
            period: `Q${i + 1}`,
            value: val,
          }));

          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative bg-gradient-to-br from-slate-800/90 via-slate-800/70 to-slate-900/90 backdrop-blur-md border-2 border-slate-700/50 rounded-2xl p-6 transition-all cursor-pointer shadow-xl hover:shadow-2xl hover:border-blue-500/50 overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                    backgroundSize: "32px 32px",
                  }}
                />
              </div>

              {/* Gradient Overlay */}
              <div
                className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${colorMap[metric.color]?.glow || "from-blue-500/20"} to-transparent rounded-full blur-3xl`}
              />

              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br ${colorMap[metric.color]?.gradient || "from-blue-500/20 to-blue-600/10"} border ${colorMap[metric.color]?.border || "border-blue-500/30"} backdrop-blur-sm group-hover:scale-110 transition-transform`}
                    >
                      <metric.icon
                        className={`w-6 h-6 ${colorMap[metric.color]?.icon || "text-blue-400"}`}
                      />
                    </div>
                    <div>
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          delay: index * 0.1 + 0.2,
                          type: "spring",
                        }}
                        className="text-3xl font-bold text-white mb-1"
                      >
                        {metric.value}
                      </motion.div>
                      <div className="text-lg font-semibold text-slate-300 mb-1">
                        {metric.label}
                      </div>
                      <div className="text-sm text-slate-400">
                        {metric.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-lg border border-green-500/30">
                    <FiCheckCircle className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs font-medium text-green-400">
                      Verified
                    </span>
                  </div>
                </div>

                {/* Trend Chart */}
                <div className="mb-6 h-24 -mx-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <defs>
                        <linearGradient
                          id={`lineGradient-${index}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={
                              colorMap[metric.color]?.stroke || "#60a5fa"
                            }
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="100%"
                            stopColor={
                              colorMap[metric.color]?.stroke || "#60a5fa"
                            }
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={colorMap[metric.color]?.stroke || "#60a5fa"}
                        strokeWidth={3}
                        dot={false}
                        fill={`url(#lineGradient-${index})`}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Comparison & Percentile */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                    <div className="text-xs text-slate-400 mb-1">
                      Industry Avg
                    </div>
                    <div className="text-sm font-semibold text-slate-300">
                      {metric.comparison.industry}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                    <div className="text-xs text-slate-400 mb-1">
                      Percentile
                    </div>
                    <div className="text-sm font-semibold text-blue-400">
                      {metric.comparison.percentile}
                    </div>
                  </div>
                </div>

                {/* Insights */}
                <div className="space-y-2 mb-4">
                  {metric.insights.map((insight, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 bg-slate-700/30 rounded-lg"
                    >
                      <FiArrowUpRight
                        className={`w-3.5 h-3.5 mt-0.5 ${
                          insight.type === "positive"
                            ? "text-green-400"
                            : "text-yellow-400"
                        } flex-shrink-0`}
                      />
                      <span className="text-xs text-slate-300 leading-relaxed">
                        {insight.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Sub Data Visualization */}
                {metric.subData && (
                  <div className="pt-4 border-t border-slate-700/50">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Breakdown
                    </div>
                    <div className="space-y-2">
                      {metric.subData.slice(0, 3).map((item, i) => {
                        const value =
                          "value" in item
                            ? item.value
                            : "count" in item
                              ? item.count
                              : "score" in item
                                ? item.score
                                : "compliance" in item
                                  ? item.compliance
                                  : 0;
                        const label =
                          "region" in item
                            ? item.region
                            : "period" in item
                              ? item.period
                              : "category" in item
                                ? item.category
                                : "standard" in item
                                  ? item.standard
                                  : "pillar" in item
                                    ? item.pillar
                                    : "agency" in item
                                      ? item.agency
                                      : "";
                        const maxValue = Math.max(
                          ...metric.subData.map((d) =>
                            "value" in d
                              ? d.value
                              : "count" in d
                                ? d.count
                                : "score" in d
                                  ? d.score
                                  : "compliance" in d
                                    ? d.compliance
                                    : 0,
                          ),
                        );
                        const percentage = (value / maxValue) * 100;

                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">{label}</span>
                              <span className="font-semibold text-white">
                                {value}
                                {typeof value === "number" && value <= 100
                                  ? "%"
                                  : ""}
                              </span>
                            </div>
                            <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${percentage}%` }}
                                viewport={{ once: true }}
                                transition={{
                                  delay: index * 0.1 + i * 0.1,
                                  duration: 0.5,
                                }}
                                className="h-full bg-gradient-to-r rounded-full"
                                style={{
                                  background:
                                    metric.color === "blue"
                                      ? "linear-gradient(to right, #3b82f6, #60a5fa)"
                                      : metric.color === "green"
                                        ? "linear-gradient(to right, #22c55e, #4ade80)"
                                        : metric.color === "cyan"
                                          ? "linear-gradient(to right, #06b6d4, #22d3ee)"
                                          : metric.color === "purple"
                                            ? "linear-gradient(to right, #a78bfa, #c4b5fd)"
                                            : metric.color === "yellow"
                                              ? "linear-gradient(to right, #eab308, #fbbf24)"
                                              : "linear-gradient(to right, #fb923c, #fdba74)",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Hover Glow */}
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${colorMap[metric.color]?.glow || "from-blue-500/10"} to-transparent rounded-2xl pointer-events-none`}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

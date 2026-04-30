"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import {
  benchmarkCategories,
  getAllBenchmarks,
  getBenchmarkColor,
  getBenchmarkTrendIcon,
  type Benchmark,
} from "@/utils/benchmarks";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

export default function IntegrationHub() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const allBenchmarks = getAllBenchmarks();

  const overallScore =
    allBenchmarks.reduce((sum, b) => sum + (b.percentile || 0), 0) /
    allBenchmarks.length;

  const categoryPerformance = benchmarkCategories.map((cat) => {
    const benchmarks = cat.benchmarks;
    const avgPercentile =
      benchmarks.reduce((sum, b) => sum + (b.percentile || 0), 0) /
      benchmarks.length;
    return {
      category: cat.name,
      score: Math.round(avgPercentile),
    };
  });

  const stats = [
    {
      label: "Overall Score",
      value: Math.round(overallScore),
      icon: "ri-trophy-line",
      tooltip: "Average percentile across all benchmarks",
      trend: "up" as const,
      isPercentile: true,
    },
    {
      label: "Active Integrations",
      value: 12,
      icon: "ri-plug-line",
      tooltip: "Active system integrations",
    },
    {
      label: "Benchmark Categories",
      value: benchmarkCategories.length,
      icon: "ri-bar-chart-line",
      tooltip: "Tracked benchmark categories",
    },
    {
      label: "Top Quartile",
      value: allBenchmarks.filter((b) => (b.percentile || 0) >= 75).length,
      icon: "ri-star-line",
      tooltip: "Benchmarks in top 25%",
    },
  ];

  const integrationModules = [
    {
      name: "ERP Integration",
      description: "Connect to SAP, Oracle, and custom ERP systems",
      icon: "ri-database-2-line",
      href: "/integration/erp",
      benchmarks:
        benchmarkCategories.find((c) => c.id === "integration-performance")
          ?.benchmarks.length || 0,
      status: "active",
    },
    {
      name: "API Management",
      description: "Manage API keys, webhooks, and endpoints",
      icon: "ri-code-s-slash-line",
      href: "/integration/api",
      benchmarks:
        benchmarkCategories.find((c) => c.id === "integration-performance")
          ?.benchmarks.length || 0,
      status: "active",
    },
    {
      name: "EDI Integration",
      description: "Electronic Data Interchange transactions",
      icon: "ri-file-transfer-line",
      href: "/integration/edi",
      benchmarks:
        benchmarkCategories.find((c) => c.id === "integration-performance")
          ?.benchmarks.length || 0,
      status: "active",
    },
    {
      name: "Carrier Integration",
      description: "Shipping carrier APIs and tracking",
      icon: "ri-truck-line",
      href: "/integration/carriers",
      benchmarks:
        benchmarkCategories.find((c) => c.id === "logistics-performance")
          ?.benchmarks.length || 0,
      status: "active",
    },
    {
      name: "Label Printing",
      description: "Barcode and shipping label generation",
      icon: "ri-printer-line",
      href: "/integration/labels",
      benchmarks: 0,
      status: "active",
    },
    {
      name: "Benchmarks",
      description: "Compare performance against industry standards",
      icon: "ri-line-chart-line",
      href: "/integration/benchmarks",
      benchmarks: allBenchmarks.length,
      status: "active",
    },
  ];

  return (
    <PageTemplate
      title="Integration Hub"
      description="Connect, integrate, and benchmark your system against global industry standards. Real-time performance tracking with Gartner, IDC, McKinsey, and other leading research benchmarks."
      icon="ri-plug-line"
      stats={stats}
    >
      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">
            Performance Radar
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={categoryPerformance}>
              <PolarGrid />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: "#9ca3af", fontSize: 10 }}
              />
              <Radar
                name="Performance"
                dataKey="score"
                stroke="#22d3ee"
                fill="#22d3ee"
                fillOpacity={0.6}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">
            Benchmark Sources
          </h3>
          <div className="space-y-4">
            {benchmarkCategories.map((cat) => {
              const avgScore =
                cat.benchmarks.reduce(
                  (sum, b) => sum + (b.percentile || 0),
                  0,
                ) / cat.benchmarks.length;
              return (
                <div key={cat.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-white font-medium">{cat.name}</div>
                    <div className="text-gray-400 text-sm">
                      {cat.benchmarks.length} benchmarks
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${avgScore}%`,
                          backgroundColor: getBenchmarkColor(avgScore),
                        }}
                      />
                    </div>
                    <span
                      className="text-lg font-bold w-12 text-right"
                      style={{ color: getBenchmarkColor(avgScore) }}
                    >
                      {Math.round(avgScore)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Integration Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {integrationModules.map((module, index) => (
          <motion.div
            key={module.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => router.push(module.href)}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <i className={`${module.icon} text-white text-2xl`}></i>
              </div>
              {module.benchmarks > 0 && (
                <div className="px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                  <span className="text-cyan-400 text-xs font-semibold">
                    {module.benchmarks} benchmarks
                  </span>
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{module.name}</h3>
            <p className="text-gray-400 text-sm mb-4">{module.description}</p>
            <div className="flex items-center justify-between">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  module.status === "active"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                }`}
              >
                {module.status.toUpperCase()}
              </span>
              <i className="ri-arrow-right-line text-cyan-400 group-hover:translate-x-1 transition-transform"></i>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Benchmark Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <i className="ri-trophy-line text-cyan-400"></i>
          Top Performing Benchmarks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {allBenchmarks
            .filter((b) => (b.percentile || 0) >= 90)
            .slice(0, 4)
            .map((benchmark) => {
              const color = getBenchmarkColor(benchmark.percentile || 0);
              return (
                <div
                  key={benchmark.id}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="text-gray-400 text-xs mb-1">
                    {benchmark.metric}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl font-bold" style={{ color }}>
                      {benchmark.percentile}%
                    </div>
                    <i
                      className={`${getBenchmarkTrendIcon(benchmark.trend)} text-lg`}
                      style={{ color }}
                    ></i>
                  </div>
                  <div className="text-white text-sm font-medium">
                    {benchmark.value} {benchmark.unit}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    {benchmark.source}
                  </div>
                </div>
              );
            })}
        </div>
      </motion.div>
    </PageTemplate>
  );
}

"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import {
  benchmarkCategories,
  getAllBenchmarks,
  getBenchmarkColor,
  getBenchmarkTrendIcon,
  compareToBenchmark,
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
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";
import CurrencyDisplay from "@/components/CurrencyDisplay";

export default function IntegrationBenchmarks() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBenchmark, setSelectedBenchmark] = useState<Benchmark | null>(
    null,
  );
  const allBenchmarks = getAllBenchmarks();

  const filteredBenchmarks = useMemo(() => {
    if (selectedCategory === "all") return allBenchmarks;
    return (
      benchmarkCategories.find((cat) => cat.id === selectedCategory)
        ?.benchmarks || []
    );
  }, [selectedCategory]);

  // Overall performance score
  const overallScore = useMemo(() => {
    const avgPercentile =
      allBenchmarks.reduce((sum, b) => sum + (b.percentile || 0), 0) /
      allBenchmarks.length;
    return Math.round(avgPercentile);
  }, [allBenchmarks]);

  // Performance by category
  const categoryPerformance = useMemo(() => {
    return benchmarkCategories.map((cat) => {
      const benchmarks = cat.benchmarks;
      const avgPercentile =
        benchmarks.reduce((sum, b) => sum + (b.percentile || 0), 0) /
        benchmarks.length;
      return {
        category: cat.name,
        score: Math.round(avgPercentile),
        count: benchmarks.length,
      };
    });
  }, []);

  // Trend analysis
  const trendData = useMemo(() => {
    const trends = { up: 0, down: 0, stable: 0 };
    allBenchmarks.forEach((b) => {
      if (b.trend) trends[b.trend]++;
    });
    return Object.entries(trends).map(([trend, count]) => ({ trend, count }));
  }, [allBenchmarks]);

  // Percentile distribution
  const percentileDistribution = useMemo(() => {
    const ranges = [
      { range: "90-100", min: 90, max: 100, count: 0 },
      { range: "75-89", min: 75, max: 89, count: 0 },
      { range: "50-74", min: 50, max: 74, count: 0 },
      { range: "0-49", min: 0, max: 49, count: 0 },
    ];

    allBenchmarks.forEach((b) => {
      const percentile = b.percentile || 0;
      const range = ranges.find(
        (r) => percentile >= r.min && percentile <= r.max,
      );
      if (range) range.count++;
    });

    return ranges;
  }, [allBenchmarks]);

  const stats = [
    {
      label: "Overall Score",
      value: overallScore,
      icon: "ri-trophy-line",
      tooltip: "Average percentile across all benchmarks",
      trend: "up" as const,
      isPercentile: true,
    },
    {
      label: "Total Benchmarks",
      value: allBenchmarks.length,
      icon: "ri-bar-chart-line",
      tooltip: "Number of tracked benchmarks",
    },
    {
      label: "Top Quartile",
      value: allBenchmarks.filter((b) => (b.percentile || 0) >= 75).length,
      icon: "ri-star-line",
      tooltip: "Benchmarks in top 25%",
    },
    {
      label: "Categories",
      value: benchmarkCategories.length,
      icon: "ri-folder-line",
      tooltip: "Benchmark categories",
    },
  ];

  return (
    <PageTemplate
      title="Integration Benchmarks"
      description="Compare your system performance against global industry benchmarks from Gartner, IDC, McKinsey, and other leading research firms"
      icon="ri-line-chart-line"
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Categories</option>
            {benchmarkCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      }
    >
      {/* Overall Performance Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">
            Overall Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={categoryPerformance}>
              <PolarGrid />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
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

        {/* Percentile Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">
            Percentile Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={percentileDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ range, count }) => `${range}: ${count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {percentileDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBenchmarkColor(
                      parseInt(entry.range.split("-")[0]),
                    )}
                  />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Benchmark Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {filteredBenchmarks.map((benchmark, index) => {
          const color = getBenchmarkColor(benchmark.percentile || 0);
          const category = benchmarkCategories.find(
            (cat) => cat.id === benchmark.category,
          );

          return (
            <motion.div
              key={benchmark.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedBenchmark(benchmark)}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-white mb-1">
                    {benchmark.metric}
                  </h4>
                  <p className="text-gray-400 text-sm">{category?.name}</p>
                </div>
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {benchmark.percentile}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">
                    Industry Average
                  </span>
                  <span className="text-white font-semibold">
                    {benchmark.value} {benchmark.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Percentile</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${benchmark.percentile}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                    <span className="text-white font-semibold text-sm">
                      {benchmark.percentile}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Source</span>
                  <span className="text-cyan-400 text-sm">
                    {benchmark.source}
                  </span>
                </div>
                {benchmark.trend && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Trend</span>
                    <div
                      className={`flex items-center gap-1 ${
                        benchmark.trend === "up"
                          ? "text-green-400"
                          : benchmark.trend === "down"
                            ? "text-red-400"
                            : "text-gray-400"
                      }`}
                    >
                      <i className={getBenchmarkTrendIcon(benchmark.trend)}></i>
                      <span className="text-sm capitalize">
                        {benchmark.trend}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Trend Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6"
      >
        <h3 className="text-xl font-bold text-white mb-4">Trend Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="trend" tick={{ fill: "#9ca3af" }} />
            <YAxis tick={{ fill: "#9ca3af" }} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Bar dataKey="count" fill="#22d3ee" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Benchmark Detail Modal */}
      {selectedBenchmark && (
        <Modal
          isOpen={!!selectedBenchmark}
          onClose={() => setSelectedBenchmark(null)}
          title={`${selectedBenchmark.metric} - Benchmark Details`}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">
                  Industry Average
                </div>
                <div className="text-2xl font-bold text-white">
                  {selectedBenchmark.value} {selectedBenchmark.unit}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">
                  Your Percentile
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{
                    color: getBenchmarkColor(selectedBenchmark.percentile || 0),
                  }}
                >
                  {selectedBenchmark.percentile}%
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">
                Benchmark Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Source:</span>
                  <span className="text-white">{selectedBenchmark.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Year:</span>
                  <span className="text-white">{selectedBenchmark.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Industry:</span>
                  <span className="text-white">
                    {selectedBenchmark.industry}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">
                Performance Insights
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">Percentile Ranking</span>
                  <span className="text-white font-semibold">
                    Top {100 - (selectedBenchmark.percentile || 0)}% of industry
                  </span>
                </div>
                {selectedBenchmark.trend && (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-400">Trend</span>
                    <div
                      className={`flex items-center gap-2 ${
                        selectedBenchmark.trend === "up"
                          ? "text-green-400"
                          : selectedBenchmark.trend === "down"
                            ? "text-red-400"
                            : "text-gray-400"
                      }`}
                    >
                      <i
                        className={getBenchmarkTrendIcon(
                          selectedBenchmark.trend,
                        )}
                      ></i>
                      <span className="capitalize">
                        {selectedBenchmark.trend}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </PageTemplate>
  );
}

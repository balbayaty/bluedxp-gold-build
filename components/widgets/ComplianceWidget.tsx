/**
 * Compliance Score Dashboard Widget
 * Beautiful animated compliance overview
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface ComplianceData {
  overall: number;
  categories: {
    name: string;
    score: number;
    target: number;
    trend: "up" | "down" | "stable";
  }[];
  recentChanges: {
    date: string;
    change: number;
    reason: string;
  }[];
}

interface ComplianceWidgetProps {
  data?: ComplianceData;
  size?: "small" | "medium" | "large";
  showDetails?: boolean;
}

// Mock data for demo
const mockData: ComplianceData = {
  overall: 87,
  categories: [
    { name: "Safety", score: 92, target: 95, trend: "up" },
    { name: "Quality", score: 85, target: 90, trend: "stable" },
    { name: "Environmental", score: 78, target: 85, trend: "up" },
    { name: "Documentation", score: 91, target: 90, trend: "up" },
    { name: "Training", score: 88, target: 95, trend: "down" },
  ],
  recentChanges: [
    { date: "2024-01-15", change: 3, reason: "Completed safety audit" },
    { date: "2024-01-10", change: -2, reason: "Minor documentation gap" },
    { date: "2024-01-05", change: 5, reason: "Training completion" },
  ],
};

const COLORS = ["#06b6d4", "#22c55e", "#8b5cf6", "#f59e0b", "#ef4444"];

export default function ComplianceWidget({
  data = mockData,
  size = "medium",
  showDetails = true,
}: ComplianceWidgetProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Animate score on mount
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = data.overall / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= data.overall) {
        setAnimatedScore(data.overall);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [data.overall]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 75) return "text-cyan-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return "from-green-500 to-emerald-600";
    if (score >= 75) return "from-cyan-500 to-blue-600";
    if (score >= 60) return "from-yellow-500 to-amber-600";
    return "from-red-500 to-rose-600";
  };

  const pieData = data.categories.map((cat, idx) => ({
    name: cat.name,
    value: cat.score,
    color: COLORS[idx % COLORS.length],
  }));

  const sizeClasses = {
    small: "p-4",
    medium: "p-6",
    large: "p-8",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl ${sizeClasses[size]} overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 bg-gradient-to-br ${getScoreGradient(data.overall)} rounded-xl flex items-center justify-center`}
          >
            <i className="ri-shield-check-line text-white text-xl"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Compliance Score</h3>
            <p className="text-xs text-gray-400">Overall performance</p>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
          <i className="ri-more-2-fill text-gray-400"></i>
        </button>
      </div>

      {/* Main Score Display */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          {/* Circular Progress */}
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="#374151"
              strokeWidth="12"
              fill="none"
            />
            <motion.circle
              cx="80"
              cy="80"
              r="70"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0, 440" }}
              animate={{
                strokeDasharray: `${(animatedScore / 100) * 440}, 440`,
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Score Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className={`text-4xl font-bold ${getScoreColor(animatedScore)}`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              {animatedScore}%
            </motion.span>
            <span className="text-xs text-gray-400">Compliant</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {showDetails && (
        <>
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-400 mb-3">
              By Category
            </h4>
            <div className="space-y-3">
              {data.categories.map((category, idx) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === category.name ? null : category.name,
                    )
                  }
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-sm text-white">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${getScoreColor(category.score)}`}
                      >
                        {category.score}%
                      </span>
                      <i
                        className={`text-xs ${
                          category.trend === "up"
                            ? "ri-arrow-up-line text-green-400"
                            : category.trend === "down"
                              ? "ri-arrow-down-line text-red-400"
                              : "ri-arrow-right-line text-gray-400"
                        }`}
                      ></i>
                    </div>
                  </div>
                  <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${category.score}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                    />
                    <div
                      className="absolute top-1/2 w-0.5 h-3 bg-white/50 transform -translate-y-1/2"
                      style={{ left: `${category.target}%` }}
                      title={`Target: ${category.target}%`}
                    />
                  </div>

                  {/* Expanded details */}
                  {selectedCategory === category.name && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 p-3 bg-gray-900 rounded-lg text-xs"
                    >
                      <div className="flex justify-between text-gray-400">
                        <span>Target: {category.target}%</span>
                        <span>Gap: {category.target - category.score}%</span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent Changes */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">
              Recent Changes
            </h4>
            <div className="space-y-2">
              {data.recentChanges.map((change, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="flex items-center justify-between p-2 bg-gray-900 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        change.change > 0 ? "bg-green-900/50" : "bg-red-900/50"
                      }`}
                    >
                      <i
                        className={`text-xs ${
                          change.change > 0
                            ? "ri-arrow-up-line text-green-400"
                            : "ri-arrow-down-line text-red-400"
                        }`}
                      ></i>
                    </div>
                    <span className="text-xs text-gray-300">
                      {change.reason}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      change.change > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {change.change > 0 ? "+" : ""}
                    {change.change}%
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div className="mt-6 flex gap-2">
        <button className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors flex items-center justify-center gap-1">
          <i className="ri-file-list-line"></i>
          View Report
        </button>
        <button className="flex-1 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg text-xs text-white transition-colors flex items-center justify-center gap-1">
          <i className="ri-add-line"></i>
          Improve
        </button>
      </div>
    </motion.div>
  );
}

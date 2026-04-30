/**
 * Self-Learning System - Main Page
 * Deep dive into the learning system with all tools and capabilities
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function LearningSystemPage() {
  const router = useRouter();
  const [selectedView, setSelectedView] = useState<
    "overview" | "patterns" | "rules" | "accuracy" | "feedback"
  >("overview");

  const patternData = [
    {
      name: "Forklift Corner Damage",
      occurrences: 12,
      confidence: 88,
      accuracy: 94,
    },
    {
      name: "Water Damage Storage",
      occurrences: 8,
      confidence: 82,
      accuracy: 89,
    },
    {
      name: "Crush Damage Loading",
      occurrences: 15,
      confidence: 91,
      accuracy: 96,
    },
    {
      name: "Tear Damage Handling",
      occurrences: 6,
      confidence: 75,
      accuracy: 87,
    },
    {
      name: "Puncture Transport",
      occurrences: 4,
      confidence: 68,
      accuracy: 81,
    },
  ];

  const accuracyTrend = [
    { month: "Jan", accuracy: 86 },
    { month: "Feb", accuracy: 88 },
    { month: "Mar", accuracy: 90 },
    { month: "Apr", accuracy: 91 },
    { month: "May", accuracy: 93 },
    { month: "Jun", accuracy: 94 },
  ];

  const rulesData = [
    { name: "Loading Dock Rules", count: 8, active: 7 },
    { name: "Forklift Rules", count: 5, active: 5 },
    { name: "Storage Rules", count: 6, active: 4 },
    { name: "Transport Rules", count: 4, active: 3 },
  ];

  return (
    <PageTemplate
      title="🧠 Self-Learning System"
      description="Deep dive into the AI vision learning system - patterns, rules, accuracy, and continuous improvement"
      icon="ri-brain-line"
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            {
              label: "Patterns Learned",
              value: "47",
              change: "+12",
              color: "purple",
              href: "/ai-vision/learning/patterns",
            },
            {
              label: "Accuracy",
              value: "94%",
              change: "+8%",
              color: "green",
              href: "/ai-vision/learning/accuracy",
            },
            {
              label: "Rules Generated",
              value: "23",
              change: "Auto",
              color: "blue",
              href: "/ai-vision/learning/rules",
            },
            {
              label: "Feedback Received",
              value: "156",
              change: "+24",
              color: "orange",
              href: "/ai-vision/learning/feedback",
            },
          ].map((stat, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(stat.href)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/20 border border-${stat.color}-500/30 rounded-xl p-6 hover:border-${stat.color}-400/50 transition-all text-left group`}
            >
              <p className="text-white/60 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className={`text-${stat.color}-400 text-sm`}>{stat.change}</p>
              <div className="mt-3 flex items-center gap-2 text-white/40 group-hover:text-white/60 transition-colors">
                <span className="text-xs">View Details</span>
                <i className="ri-arrow-right-line"></i>
              </div>
            </motion.button>
          ))}
        </div>

        {/* View Tabs */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-2">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
              { id: "patterns", label: "Patterns", icon: "ri-shapes-line" },
              { id: "rules", label: "Rules", icon: "ri-file-list-line" },
              { id: "accuracy", label: "Accuracy", icon: "ri-line-chart-line" },
              { id: "feedback", label: "Feedback", icon: "ri-feedback-line" },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedView(tab.id as any)}
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  selectedView === tab.id
                    ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/20"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <i className={`ri-${tab.icon.split("-")[1]}-line`}></i>
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {selectedView === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Accuracy Trend */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Accuracy Improvement Over Time
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={accuracyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} domain={[80, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#a855f7"
                      strokeWidth={3}
                      dot={{ fill: "#a855f7", r: 5 }}
                      name="Accuracy %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top Patterns */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Top Learned Patterns
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => router.push("/ai-vision/learning/patterns")}
                    className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-white text-sm transition-all flex items-center gap-2"
                  >
                    View All
                    <i className="ri-arrow-right-line"></i>
                  </motion.button>
                </div>
                <div className="space-y-3">
                  {patternData.slice(0, 5).map((pattern, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-500/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-semibold">
                          {pattern.name}
                        </h4>
                        <span className="text-purple-400 font-medium">
                          {pattern.confidence}% confidence
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-white/60">Occurrences</p>
                          <p className="text-white font-medium">
                            {pattern.occurrences}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60">Accuracy</p>
                          <p className="text-green-400 font-medium">
                            {pattern.accuracy}%
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60">Status</p>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                            Active
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {selectedView === "patterns" && (
            <motion.div
              key="patterns"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6">
                  All Learned Patterns
                </h3>
                <div className="space-y-4">
                  {patternData.map((pattern, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-white mb-2">
                            {pattern.name}
                          </h4>
                          <p className="text-white/70 text-sm">
                            Automatically learned from {pattern.occurrences}{" "}
                            damage photo analyses
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-purple-400 font-bold text-2xl">
                            {pattern.confidence}%
                          </p>
                          <p className="text-white/60 text-xs">Confidence</p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/60 text-xs mb-1">
                            Occurrences
                          </p>
                          <p className="text-white font-semibold">
                            {pattern.occurrences}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/60 text-xs mb-1">Accuracy</p>
                          <p className="text-green-400 font-semibold">
                            {pattern.accuracy}%
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/60 text-xs mb-1">
                            Rules Generated
                          </p>
                          <p className="text-blue-400 font-semibold">
                            {pattern.occurrences >= 5 ? "Yes" : "Pending"}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/60 text-xs mb-1">Status</p>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                            Active
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-white text-sm transition-all"
                        >
                          View Details
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-all"
                        >
                          Edit Pattern
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-all"
                        >
                          View Examples
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {selectedView === "rules" && (
            <motion.div
              key="rules"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">
                    Auto-Generated Rules
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-white text-sm transition-all flex items-center gap-2"
                  >
                    <i className="ri-add-line"></i>
                    Create Rule
                  </motion.button>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      id: "rule-1",
                      name: "Forklift Corner Damage Rule",
                      condition:
                        'IF area == "loading_dock" AND equipment == "forklift" AND damageType == "crush"',
                      action:
                        'THEN likelyRootCause = "Forklift handling damage" AND prevention = "Review forklift training"',
                      confidence: 88,
                      occurrences: 12,
                      status: "active",
                    },
                    {
                      id: "rule-2",
                      name: "Water Damage Storage Rule",
                      condition:
                        'IF area == "storage" AND damageType == "water_damage"',
                      action:
                        'THEN likelyRootCause = "Storage location weather protection issue" AND prevention = "Review storage protection"',
                      confidence: 82,
                      occurrences: 8,
                      status: "active",
                    },
                  ].map((rule, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-blue-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-white mb-2">
                            {rule.name}
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
                              <p className="text-blue-300 font-mono text-xs mb-1">
                                Condition:
                              </p>
                              <p className="text-white">{rule.condition}</p>
                            </div>
                            <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
                              <p className="text-green-300 font-mono text-xs mb-1">
                                Action:
                              </p>
                              <p className="text-white">{rule.action}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-blue-400 font-bold text-2xl">
                            {rule.confidence}%
                          </p>
                          <p className="text-white/60 text-xs">Confidence</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <p className="text-white/60">Occurrences</p>
                            <p className="text-white font-medium">
                              {rule.occurrences}
                            </p>
                          </div>
                          <div>
                            <p className="text-white/60">Status</p>
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                              {rule.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-white text-sm transition-all"
                          >
                            Edit
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-all"
                          >
                            Test
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-all"
                          >
                            Disable
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {selectedView === "accuracy" && (
            <motion.div
              key="accuracy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Accuracy Analytics
                </h3>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white/5 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">
                      Overall Accuracy Trend
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={accuracyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                        <YAxis
                          stroke="#9ca3af"
                          fontSize={12}
                          domain={[80, 100]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "#fff" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="accuracy"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ fill: "#10b981", r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white/5 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">
                      Accuracy by Pattern Type
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={patternData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="name"
                          stroke="#9ca3af"
                          fontSize={10}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis
                          stroke="#9ca3af"
                          fontSize={12}
                          domain={[70, 100]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "#fff" }}
                        />
                        <Bar dataKey="accuracy" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">
                    Improvement Factors
                  </h4>
                  <div className="space-y-3">
                    {[
                      {
                        factor: "User Feedback",
                        impact: "+5%",
                        color: "green",
                      },
                      {
                        factor: "Pattern Learning",
                        impact: "+2%",
                        color: "blue",
                      },
                      {
                        factor: "Rule Generation",
                        impact: "+1%",
                        color: "purple",
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <span className="text-white">{item.factor}</span>
                        <span
                          className={`text-${item.color}-400 font-semibold`}
                        >
                          {item.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {selectedView === "feedback" && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Learning Feedback
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      id: "fb-1",
                      pattern: "Forklift Corner Damage",
                      type: "positive",
                      user: "John Doe",
                      comment: "Correctly identified forklift damage",
                      impact: "+2% accuracy",
                      date: "2 hours ago",
                    },
                    {
                      id: "fb-2",
                      pattern: "Water Damage Storage",
                      type: "correction",
                      user: "Jane Smith",
                      comment: "Corrected: Was storage issue, not transport",
                      impact: "Pattern updated",
                      date: "5 hours ago",
                    },
                  ].map((feedback, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white/5 rounded-xl p-6 border border-white/10"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-white font-semibold mb-1">
                            {feedback.pattern}
                          </h4>
                          <p className="text-white/70 text-sm">
                            {feedback.comment}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            feedback.type === "positive"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-orange-500/20 text-orange-400"
                          }`}
                        >
                          {feedback.type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <p className="text-white/60">User</p>
                            <p className="text-white">{feedback.user}</p>
                          </div>
                          <div>
                            <p className="text-white/60">Impact</p>
                            <p className="text-green-400">{feedback.impact}</p>
                          </div>
                          <div>
                            <p className="text-white/60">Date</p>
                            <p className="text-white/70">{feedback.date}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTemplate>
  );
}

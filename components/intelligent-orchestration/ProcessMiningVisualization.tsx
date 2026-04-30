"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ProcessMiningCase,
  ProcessVariant,
  ProcessDeviation,
} from "@/types/intelligentOrchestration";
import { format } from "date-fns";
// Using RemixIcon instead of lucide-react for consistency
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
} from "recharts";

interface ProcessMiningVisualizationProps {
  cases: ProcessMiningCase[];
  variants: ProcessVariant[];
  selectedCaseId?: string;
  onCaseSelect?: (caseId: string) => void;
}

const COLORS = {
  optimal: "#10b981",
  normal: "#3b82f6",
  deviation: "#f59e0b",
  critical: "#ef4444",
  background: "#1f2937",
  accent: "#06b6d4",
};

export default function ProcessMiningVisualization({
  cases,
  variants,
  selectedCaseId,
  onCaseSelect,
}: ProcessMiningVisualizationProps) {
  const [viewMode, setViewMode] = useState<
    "overview" | "variants" | "deviations" | "performance"
  >("overview");
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  // Performance metrics
  const metrics = useMemo(() => {
    const totalCases = cases.length;
    const completedCases = cases.filter((c) => c.status === "COMPLETED").length;
    const avgDuration =
      cases.reduce((sum, c) => sum + c.performance.duration, 0) / totalCases ||
      0;
    const avgEfficiency =
      cases.reduce((sum, c) => sum + c.performance.efficiency, 0) /
        totalCases || 0;
    const totalDeviations = cases.reduce(
      (sum, c) => sum + c.deviations.length,
      0,
    );
    const criticalDeviations = cases.reduce(
      (sum, c) =>
        sum + c.deviations.filter((d) => d.severity === "CRITICAL").length,
      0,
    );

    return {
      totalCases,
      completedCases,
      completionRate: totalCases > 0 ? (completedCases / totalCases) * 100 : 0,
      avgDuration,
      avgEfficiency,
      totalDeviations,
      criticalDeviations,
    };
  }, [cases]);

  // Variant performance data
  const variantData = useMemo(() => {
    return variants.map((v) => ({
      name: v.variantId.substring(0, 20),
      frequency: v.frequency,
      avgDuration: v.averageDuration / 3600, // Convert to hours
      compliance: v.complianceRate,
      optimization: v.optimizationScore,
      isOptimal: v.isOptimal,
    }));
  }, [variants]);

  // Performance over time
  const performanceData = useMemo(() => {
    const sortedCases = [...cases].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
    return sortedCases.slice(0, 20).map((c) => ({
      date: format(new Date(c.startTime), "MMM dd"),
      duration: c.performance.duration / 3600,
      efficiency: c.performance.efficiency,
      compliance:
        c.events.reduce(
          (sum, e) => sum + (e.compliance?.slaCompliance || 0),
          0,
        ) / c.events.length || 0,
    }));
  }, [cases]);

  // Deviation analysis
  const deviationData = useMemo(() => {
    const deviationTypes: Record<string, number> = {};
    cases.forEach((c) => {
      c.deviations.forEach((d) => {
        deviationTypes[d.deviationType] =
          (deviationTypes[d.deviationType] || 0) + 1;
      });
    });
    return Object.entries(deviationTypes).map(([type, count]) => ({
      name: type,
      value: count,
    }));
  }, [cases]);

  const selectedCase = useMemo(() => {
    return cases.find((c) => c.caseId === selectedCaseId);
  }, [cases, selectedCaseId]);

  return (
    <div className="space-y-6">
      {/* View Mode Selector */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
        {(["overview", "variants", "deviations", "performance"] as const).map(
          (mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                viewMode === mode
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                  : "text-[#9ca3af] hover:text-white hover:bg-white/5"
              }`}
            >
              {mode === "overview" && (
                <i className="ri-bar-chart-line text-base"></i>
              )}
              {mode === "variants" && (
                <i className="ri-node-tree text-base"></i>
              )}
              {mode === "deviations" && (
                <i className="ri-alert-line text-base"></i>
              )}
              {mode === "performance" && (
                <i className="ri-arrow-up-line text-base"></i>
              )}
              <span className="capitalize">{mode}</span>
            </button>
          ),
        )}
      </div>

      {/* Overview Mode */}
      {viewMode === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <i className="ri-activity-line text-blue-400 text-2xl"></i>
              </div>
              <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full">
                {metrics.completionRate.toFixed(1)}%
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {metrics.totalCases}
            </div>
            <div className="text-sm text-blue-300">Total Cases</div>
            <div className="mt-4 text-xs text-blue-200">
              {metrics.completedCases} completed
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <i className="ri-time-line text-green-400 text-2xl"></i>
              </div>
              <span className="text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded-full">
                Avg
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {(metrics.avgDuration / 3600).toFixed(1)}h
            </div>
            <div className="text-sm text-green-300">Average Duration</div>
            <div className="mt-4 text-xs text-green-200">
              {metrics.avgEfficiency.toFixed(1)}% efficiency
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <i className="ri-alert-line text-yellow-400 text-2xl"></i>
              </div>
              <span className="text-xs text-yellow-300 bg-yellow-500/20 px-2 py-1 rounded-full">
                {metrics.criticalDeviations} critical
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {metrics.totalDeviations}
            </div>
            <div className="text-sm text-yellow-300">Total Deviations</div>
            <div className="mt-4 text-xs text-yellow-200">
              {metrics.totalCases > 0
                ? (
                    (metrics.totalDeviations / metrics.totalCases) *
                    100
                  ).toFixed(1)
                : 0}
              % deviation rate
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <i className="ri-flashlight-line text-purple-400 text-2xl"></i>
              </div>
              <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full">
                {variants.filter((v) => v.isOptimal).length} optimal
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {variants.length}
            </div>
            <div className="text-sm text-purple-300">Process Variants</div>
            <div className="mt-4 text-xs text-purple-200">
              {variants.length > 0
                ? (
                    (variants.filter((v) => v.isOptimal).length /
                      variants.length) *
                    100
                  ).toFixed(1)
                : 0}
              % optimal
            </div>
          </motion.div>
        </div>
      )}

      {/* Variants Mode */}
      {viewMode === "variants" && (
        <div className="space-y-6">
          {/* Variant Performance Chart */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <i className="ri-node-tree text-cyan-400 text-xl"></i>
              Process Variant Performance
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={variantData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="frequency" fill="#3b82f6" name="Frequency" />
                <Bar dataKey="compliance" fill="#10b981" name="Compliance %" />
                <Bar
                  dataKey="optimization"
                  fill="#f59e0b"
                  name="Optimization Score"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Variant List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {variants.map((variant, index) => (
              <motion.div
                key={variant.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() =>
                  setSelectedVariant(
                    selectedVariant === variant.id ? null : variant.id,
                  )
                }
                className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 cursor-pointer transition-all ${
                  selectedVariant === variant.id
                    ? "border-cyan-500 shadow-lg shadow-cyan-500/20"
                    : "border-white/10 hover:border-cyan-500/50"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold text-white">
                        {variant.variantId}
                      </h4>
                      {variant.isOptimal && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                          <i className="ri-checkbox-circle-line text-sm"></i>
                          Optimal
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#9ca3af]">
                      {variant.frequency} cases •{" "}
                      {(variant.averageDuration / 3600).toFixed(1)}h avg
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-cyan-400">
                      {variant.optimizationScore}
                    </div>
                    <div className="text-xs text-[#9ca3af]">Score</div>
                  </div>
                </div>

                <AnimatePresence>
                  {selectedVariant === variant.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-[#9ca3af] mb-2">
                            Activity Flow
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {variant.activities.map((activity, i) => (
                              <div
                                key={i}
                                className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-medium flex items-center gap-2"
                              >
                                {i > 0 && (
                                  <span className="text-cyan-500">→</span>
                                )}
                                {activity}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-[#9ca3af] mb-1">
                              Compliance
                            </div>
                            <div className="text-lg font-semibold text-white">
                              {variant.complianceRate.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-[#9ca3af] mb-1">
                              Quality
                            </div>
                            <div className="text-lg font-semibold text-white">
                              {variant.averageQuality.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Deviations Mode */}
      {viewMode === "deviations" && (
        <div className="space-y-6">
          {/* Deviation Type Distribution */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <i className="ri-alert-line text-yellow-400 text-xl"></i>
              Deviation Analysis
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviationData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        [
                          COLORS.deviation,
                          COLORS.critical,
                          "#f97316",
                          "#ec4899",
                        ][index % 4]
                      }
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Cases with Deviations */}
          <div className="space-y-3">
            {cases
              .filter((c) => c.deviations.length > 0)
              .slice(0, 10)
              .map((case_, index) => (
                <motion.div
                  key={case_.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onCaseSelect?.(case_.caseId)}
                  className={`bg-white/5 backdrop-blur-xl border rounded-xl p-4 cursor-pointer transition-all ${
                    selectedCaseId === case_.caseId
                      ? "border-cyan-500 shadow-lg shadow-cyan-500/20"
                      : "border-white/10 hover:border-yellow-500/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-white">
                          {case_.caseId}
                        </h4>
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                          {case_.deviations.length} deviations
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#9ca3af]">
                        <span>
                          Duration:{" "}
                          {(case_.performance.duration / 3600).toFixed(1)}h
                        </span>
                        <span>
                          Critical:{" "}
                          {
                            case_.deviations.filter(
                              (d) => d.severity === "CRITICAL",
                            ).length
                          }
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-yellow-400">
                        {case_.deviations[0]?.deviationType}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {case_.deviations[0]?.severity}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}

      {/* Performance Mode */}
      {viewMode === "performance" && (
        <div className="space-y-6">
          {/* Performance Trends */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <i className="ri-arrow-up-line text-green-400 text-xl"></i>
              Performance Trends
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="duration"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Duration (hours)"
                  dot={{ fill: "#3b82f6", r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Efficiency %"
                  dot={{ fill: "#10b981", r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="compliance"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Compliance %"
                  dot={{ fill: "#f59e0b", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Selected Case Details */}
      {selectedCase && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">
              Case Details: {selectedCase.caseId}
            </h3>
            <button
              onClick={() => onCaseSelect?.("")}
              className="text-[#9ca3af] hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <div className="text-xs text-[#9ca3af] mb-1">Duration</div>
              <div className="text-lg font-semibold text-white">
                {(selectedCase.performance.duration / 3600).toFixed(1)}h
              </div>
            </div>
            <div>
              <div className="text-xs text-[#9ca3af] mb-1">Efficiency</div>
              <div className="text-lg font-semibold text-white">
                {selectedCase.performance.efficiency.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-[#9ca3af] mb-1">Deviations</div>
              <div className="text-lg font-semibold text-white">
                {selectedCase.deviations.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#9ca3af] mb-1">Status</div>
              <div className="text-lg font-semibold text-white">
                {selectedCase.status}
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-white mb-3">
              Event Timeline
            </div>
            <div className="space-y-2">
              {selectedCase.events.map((event, index) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 text-xs font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {event.activity}
                    </div>
                    <div className="text-xs text-[#9ca3af]">
                      {format(new Date(event.timestamp), "MMM dd, HH:mm")} •{" "}
                      {event.resource}
                    </div>
                  </div>
                  {event.compliance && (
                    <div className="text-right">
                      <div className="text-xs text-green-400">
                        {event.compliance.slaCompliance.toFixed(1)}%
                      </div>
                      <div className="text-xs text-[#9ca3af]">SLA</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

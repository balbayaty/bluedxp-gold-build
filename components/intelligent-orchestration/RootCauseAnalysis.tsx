"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RootCause,
  RootCauseFactor,
  RootCauseAction,
} from "@/types/intelligentOrchestration";
import { format } from "date-fns";
// Using RemixIcon instead of lucide-react for consistency
import {
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";

interface RootCauseAnalysisProps {
  rootCauses: RootCause[];
  onAnalyze?: (
    issueId: string,
    issueType: string,
    data: Record<string, any>,
  ) => void;
}

const FACTOR_COLORS = {
  HUMAN: "#ef4444",
  PROCESS: "#3b82f6",
  TECHNOLOGY: "#8b5cf6",
  ENVIRONMENT: "#10b981",
  MATERIAL: "#f59e0b",
  METHOD: "#ec4899",
  MACHINE: "#06b6d4",
  MEASUREMENT: "#84cc16",
};

export default function RootCauseAnalysis({
  rootCauses,
  onAnalyze,
}: RootCauseAnalysisProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "VALIDATED" | "PENDING"
  >("ALL");
  const [selectedRootCause, setSelectedRootCause] = useState<string | null>(
    null,
  );

  const filteredRootCauses = useMemo(() => {
    return rootCauses.filter((rc) => {
      const matchesSearch =
        rc.issueDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rc.issueType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filterStatus === "ALL" ||
        (filterStatus === "VALIDATED" && rc.validated) ||
        (filterStatus === "PENDING" && !rc.validated);
      return matchesSearch && matchesFilter;
    });
  }, [rootCauses, searchQuery, filterStatus]);

  const selectedRC = useMemo(() => {
    return rootCauses.find((rc) => rc.id === selectedRootCause);
  }, [rootCauses, selectedRootCause]);

  // Statistics
  const stats = useMemo(() => {
    const total = rootCauses.length;
    const validated = rootCauses.filter((rc) => rc.validated).length;
    const avgConfidence =
      rootCauses.reduce((sum, rc) => sum + rc.confidence, 0) / total || 0;
    const avgEffectiveness =
      rootCauses.reduce((sum, rc) => sum + rc.effectiveness, 0) / total || 0;
    const avgRecurrence =
      rootCauses.reduce((sum, rc) => sum + rc.recurrenceRate, 0) / total || 0;

    return {
      total,
      validated,
      validationRate: total > 0 ? (validated / total) * 100 : 0,
      avgConfidence,
      avgEffectiveness,
      avgRecurrence,
    };
  }, [rootCauses]);

  // Factor distribution
  const factorDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    rootCauses.forEach((rc) => {
      rc.rootCauses.forEach((factor) => {
        distribution[factor.category] =
          (distribution[factor.category] || 0) + 1;
      });
    });
    return Object.entries(distribution).map(([category, count]) => ({
      category,
      count,
      fill: FACTOR_COLORS[category as keyof typeof FACTOR_COLORS] || "#6b7280",
    }));
  }, [rootCauses]);

  // Risk score distribution
  const riskData = useMemo(() => {
    const riskScores: number[] = [];
    rootCauses.forEach((rc) => {
      rc.rootCauses.forEach((factor) => {
        riskScores.push(factor.riskScore);
      });
    });
    return riskScores;
  }, [rootCauses]);

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-xl"></i>
          <input
            type="text"
            placeholder="Search root causes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
          {(["ALL", "VALIDATED", "PENDING"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === status
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                  : "text-[#9ca3af] hover:text-white hover:bg-white/5"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <i className="ri-brain-line text-blue-400 text-2xl"></i>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.total}
          </div>
          <div className="text-sm text-blue-300">Total Analyses</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-green-400 text-2xl"></i>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.validated}
          </div>
          <div className="text-sm text-green-300">Validated</div>
          <div className="mt-2 text-xs text-green-200">
            {stats.validationRate.toFixed(1)}% rate
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <i className="ri-target-line text-purple-400 text-2xl"></i>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.avgConfidence.toFixed(0)}%
          </div>
          <div className="text-sm text-purple-300">Avg Confidence</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <i className="ri-flashlight-line text-yellow-400 text-2xl"></i>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.avgEffectiveness.toFixed(0)}%
          </div>
          <div className="text-sm text-yellow-300">Effectiveness</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30 rounded-2xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <i className="ri-arrow-down-line text-red-400 text-2xl"></i>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.avgRecurrence.toFixed(1)}%
          </div>
          <div className="text-sm text-red-300">Recurrence Rate</div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Factor Distribution */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <i className="ri-bar-chart-line text-cyan-400 text-xl"></i>
            Root Cause Factor Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={factorDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="category" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Score Radar */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <i className="ri-node-tree text-purple-400 text-xl"></i>
            Risk Score Analysis
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={factorDistribution}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis
                dataKey="category"
                stroke="#9ca3af"
                fontSize={12}
              />
              <PolarRadiusAxis angle={90} domain={[0, 10]} stroke="#9ca3af" />
              <Radar
                name="Risk Score"
                dataKey="count"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.6}
              />
              <RechartsTooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Root Cause List */}
      <div className="space-y-4">
        {filteredRootCauses.map((rc, index) => (
          <motion.div
            key={rc.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() =>
              setSelectedRootCause(selectedRootCause === rc.id ? null : rc.id)
            }
            className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 cursor-pointer transition-all ${
              selectedRootCause === rc.id
                ? "border-cyan-500 shadow-lg shadow-cyan-500/20"
                : "border-white/10 hover:border-cyan-500/50"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-semibold text-white">
                    {rc.issueType}
                  </h4>
                  {rc.validated && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                      <i className="ri-checkbox-circle-line text-sm"></i>
                      Validated
                    </span>
                  )}
                  {!rc.validated && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
                      <i className="ri-time-line text-sm"></i>
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#9ca3af] mb-3">
                  {rc.issueDescription}
                </p>
                <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
                  <span>Method: {rc.analysisMethod}</span>
                  <span>Confidence: {rc.confidence}%</span>
                  <span>Effectiveness: {rc.effectiveness}%</span>
                  <span>Recurrence: {rc.recurrenceRate}%</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-cyan-400">
                  {rc.confidence}
                </div>
                <div className="text-xs text-[#9ca3af]">Confidence</div>
              </div>
            </div>

            {/* Root Causes */}
            <div className="mb-3">
              <div className="text-xs text-[#9ca3af] mb-2">Root Causes</div>
              <div className="flex flex-wrap gap-2">
                {rc.rootCauses.map((factor) => (
                  <div
                    key={factor.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2"
                    style={{
                      backgroundColor: `${FACTOR_COLORS[factor.category] || "#6b7280"}20`,
                      color: FACTOR_COLORS[factor.category] || "#9ca3af",
                      border: `1px solid ${FACTOR_COLORS[factor.category] || "#6b7280"}40`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          FACTOR_COLORS[factor.category] || "#6b7280",
                      }}
                    ></span>
                    {factor.category}: {factor.factor}
                    <span className="text-[#9ca3af]">({factor.riskScore})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {rc.actions.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-[#9ca3af] mb-2">Actions</div>
                <div className="space-y-2">
                  {rc.actions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex-1">
                        <div className="text-sm text-white">
                          {action.action}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {action.responsibleParty} • Due:{" "}
                          {format(new Date(action.dueDate), "MMM dd, yyyy")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            action.status === "COMPLETED"
                              ? "bg-green-500/20 text-green-400"
                              : action.status === "IN_PROGRESS"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {action.status}
                        </span>
                        {action.effectiveness > 0 && (
                          <span className="text-xs text-cyan-400">
                            {action.effectiveness}% effective
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expanded Details */}
            <AnimatePresence>
              {selectedRootCause === rc.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Contributing Factors */}
                    {rc.contributingFactors.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-white mb-2">
                          Contributing Factors
                        </div>
                        <div className="space-y-2">
                          {rc.contributingFactors.map((factor) => (
                            <div
                              key={factor.id}
                              className="p-2 bg-white/5 rounded-lg border border-white/10"
                            >
                              <div className="text-sm text-white">
                                {factor.factor}
                              </div>
                              <div className="text-xs text-[#9ca3af] mt-1">
                                Impact: {factor.impact}% • Probability:{" "}
                                {factor.probability}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evidence */}
                    <div>
                      <div className="text-sm font-semibold text-white mb-2">
                        Analysis Details
                      </div>
                      <div className="space-y-2 text-sm text-[#9ca3af]">
                        <div>
                          <span className="text-white">Detected:</span>{" "}
                          {format(
                            new Date(rc.detectedAt),
                            "MMM dd, yyyy HH:mm",
                          )}
                        </div>
                        {rc.validatedAt && (
                          <div>
                            <span className="text-white">Validated:</span>{" "}
                            {format(
                              new Date(rc.validatedAt),
                              "MMM dd, yyyy HH:mm",
                            )}{" "}
                            by {rc.validatedBy}
                          </div>
                        )}
                        <div>
                          <span className="text-white">Method:</span>{" "}
                          {rc.analysisMethod}
                        </div>
                        <div>
                          <span className="text-white">Root Causes:</span>{" "}
                          {rc.rootCauses.length}
                        </div>
                        <div>
                          <span className="text-white">
                            Contributing Factors:
                          </span>{" "}
                          {rc.contributingFactors.length}
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
  );
}

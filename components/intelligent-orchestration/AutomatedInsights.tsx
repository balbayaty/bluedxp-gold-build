"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AutomatedInsight,
  AutomatedReport,
} from "@/types/intelligentOrchestration";
import { format } from "date-fns";
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

interface AutomatedInsightsProps {
  insights: AutomatedInsight[];
  reports: AutomatedReport[];
  onInsightAcknowledge?: (insightId: string) => void;
  onReportGenerate?: (reportId: string) => void;
}

export default function AutomatedInsights({
  insights,
  reports,
  onInsightAcknowledge,
  onReportGenerate,
}: AutomatedInsightsProps) {
  const [viewMode, setViewMode] = useState<
    "overview" | "insights" | "reports" | "analytics"
  >("overview");
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<
    "ALL" | "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  >("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterAcknowledged, setFilterAcknowledged] = useState<
    "ALL" | "ACKNOWLEDGED" | "PENDING"
  >("ALL");

  // Filter insights
  const filteredInsights = useMemo(() => {
    return insights.filter((i) => {
      const matchesSeverity =
        filterSeverity === "ALL" || i.severity === filterSeverity;
      const matchesType = filterType === "ALL" || i.insightType === filterType;
      const matchesAcknowledged =
        filterAcknowledged === "ALL" ||
        (filterAcknowledged === "ACKNOWLEDGED" && i.acknowledged) ||
        (filterAcknowledged === "PENDING" && !i.acknowledged);
      return matchesSeverity && matchesType && matchesAcknowledged;
    });
  }, [insights, filterSeverity, filterType, filterAcknowledged]);

  // Statistics
  const stats = useMemo(() => {
    const total = insights.length;
    const acknowledged = insights.filter((i) => i.acknowledged).length;
    const critical = insights.filter((i) => i.severity === "CRITICAL").length;
    const high = insights.filter((i) => i.severity === "HIGH").length;
    const avgConfidence =
      insights.reduce((sum, i) => sum + i.confidence, 0) / total || 0;

    return {
      total,
      acknowledged,
      acknowledgmentRate: total > 0 ? (acknowledged / total) * 100 : 0,
      critical,
      high,
      avgConfidence,
    };
  }, [insights]);

  // Insights by type
  const insightsByType = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    insights.forEach((i) => {
      typeCounts[i.insightType] = (typeCounts[i.insightType] || 0) + 1;
    });
    return Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count,
    }));
  }, [insights]);

  // Insights by severity
  const insightsBySeverity = useMemo(() => {
    const severityCounts: Record<string, number> = {};
    insights.forEach((i) => {
      severityCounts[i.severity] = (severityCounts[i.severity] || 0) + 1;
    });
    return Object.entries(severityCounts).map(([severity, count]) => ({
      severity,
      count,
    }));
  }, [insights]);

  // Impact analysis
  const impactData = useMemo(() => {
    return insights.map((i) => ({
      title: i.title.substring(0, 20),
      duration: i.impact.duration || 0,
      cost: i.impact.cost || 0,
      quality: i.impact.quality || 0,
      compliance: i.impact.compliance || 0,
      revenue: i.impact.revenue || 0,
      severity: i.severity,
    }));
  }, [insights]);

  const selectedInsightData = useMemo(() => {
    return insights.find((i) => i.id === selectedInsight);
  }, [insights, selectedInsight]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "#ef4444";
      case "HIGH":
        return "#f59e0b";
      case "MEDIUM":
        return "#eab308";
      case "LOW":
        return "#84cc16";
      case "INFO":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "PERFORMANCE":
        return "#3b82f6";
      case "OPTIMIZATION":
        return "#10b981";
      case "RISK":
        return "#ef4444";
      case "OPPORTUNITY":
        return "#f59e0b";
      case "ANOMALY":
        return "#8b5cf6";
      case "TREND":
        return "#06b6d4";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="space-y-6">
      {/* View Mode Selector */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
        {(["overview", "insights", "reports", "analytics"] as const).map(
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
              <i
                className={`ri-${mode === "overview" ? "dashboard-line" : mode === "insights" ? "lightbulb-line" : mode === "reports" ? "file-chart-line" : "bar-chart-line"} text-base`}
              ></i>
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
                <i className="ri-lightbulb-line text-blue-400 text-2xl"></i>
              </div>
              <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full">
                {stats.acknowledged} acknowledged
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.total}
            </div>
            <div className="text-sm text-blue-300">Total Insights</div>
            <div className="mt-4 text-xs text-blue-200">
              {stats.acknowledgmentRate.toFixed(1)}% acknowledgment rate
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30 rounded-2xl p-6 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <i className="ri-alert-line text-red-400 text-2xl"></i>
              </div>
              <span className="text-xs text-red-300 bg-red-500/20 px-2 py-1 rounded-full">
                {stats.high} high
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.critical}
            </div>
            <div className="text-sm text-red-300">Critical Insights</div>
            <div className="mt-4 text-xs text-red-200">
              {stats.high} high priority
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-green-400 text-2xl"></i>
              </div>
              <span className="text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded-full">
                {stats.acknowledgmentRate.toFixed(1)}%
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.acknowledgmentRate.toFixed(1)}%
            </div>
            <div className="text-sm text-green-300">Acknowledgment Rate</div>
            <div className="mt-4 text-xs text-green-200">
              {stats.acknowledged} of {stats.total} acknowledged
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
                <i className="ri-target-line text-purple-400 text-2xl"></i>
              </div>
              <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full">
                Avg
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.avgConfidence.toFixed(0)}%
            </div>
            <div className="text-sm text-purple-300">Avg Confidence</div>
            <div className="mt-4 text-xs text-purple-200">
              {insights.filter((i) => i.confidence > 80).length} high confidence
            </div>
          </motion.div>
        </div>
      )}

      {/* Insights Mode */}
      {viewMode === "insights" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="INFO">Info</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Types</option>
              {Array.from(new Set(insights.map((i) => i.insightType))).map(
                (type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ),
              )}
            </select>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
              {(["ALL", "PENDING", "ACKNOWLEDGED"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterAcknowledged(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterAcknowledged === status
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                      : "text-[#9ca3af] hover:text-white hover:bg-white/5"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Insights List */}
          <div className="space-y-4">
            {filteredInsights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() =>
                  setSelectedInsight(
                    selectedInsight === insight.id ? null : insight.id,
                  )
                }
                className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 cursor-pointer transition-all ${
                  selectedInsight === insight.id
                    ? "border-cyan-500 shadow-lg shadow-cyan-500/20"
                    : "border-white/10 hover:border-cyan-500/50"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-white">
                        {insight.title}
                      </h4>
                      <span
                        className="px-2 py-1 text-xs rounded-full"
                        style={{
                          backgroundColor: `${getSeverityColor(insight.severity)}20`,
                          color: getSeverityColor(insight.severity),
                        }}
                      >
                        {insight.severity}
                      </span>
                      <span
                        className="px-2 py-1 text-xs rounded-full"
                        style={{
                          backgroundColor: `${getTypeColor(insight.insightType)}20`,
                          color: getTypeColor(insight.insightType),
                        }}
                      >
                        {insight.insightType}
                      </span>
                      <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                        {insight.confidence}% confidence
                      </span>
                      {insight.acknowledged && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                          <i className="ri-checkbox-circle-line text-sm"></i>
                          Acknowledged
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#9ca3af] mb-3">
                      {insight.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
                      <span>
                        Generated:{" "}
                        {format(new Date(insight.generatedAt), "MMM dd, HH:mm")}
                      </span>
                      {insight.expiresAt && (
                        <span>
                          Expires:{" "}
                          {format(new Date(insight.expiresAt), "MMM dd, HH:mm")}
                        </span>
                      )}
                      {insight.acknowledgedAt && (
                        <span>
                          Acknowledged:{" "}
                          {format(
                            new Date(insight.acknowledgedAt),
                            "MMM dd, HH:mm",
                          )}{" "}
                          by {insight.acknowledgedBy}
                        </span>
                      )}
                    </div>
                  </div>
                  {!insight.acknowledged && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInsightAcknowledge?.(insight.id);
                      }}
                      className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <i className="ri-checkbox-circle-line text-base"></i>
                      Acknowledge
                    </button>
                  )}
                </div>

                {/* Impact Metrics */}
                {(insight.impact.duration ||
                  insight.impact.cost ||
                  insight.impact.quality ||
                  insight.impact.compliance ||
                  insight.impact.revenue) && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    {insight.impact.duration && (
                      <div>
                        <div className="text-xs text-[#9ca3af] mb-1">
                          Duration Impact
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {insight.impact.duration > 0 ? "+" : ""}
                          {(insight.impact.duration / 3600).toFixed(1)}h
                        </div>
                      </div>
                    )}
                    {insight.impact.cost && (
                      <div>
                        <div className="text-xs text-[#9ca3af] mb-1">
                          Cost Impact
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {insight.impact.cost > 0 ? "+" : ""}$
                          {insight.impact.cost.toFixed(2)}
                        </div>
                      </div>
                    )}
                    {insight.impact.quality && (
                      <div>
                        <div className="text-xs text-[#9ca3af] mb-1">
                          Quality Impact
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {insight.impact.quality > 0 ? "+" : ""}
                          {insight.impact.quality.toFixed(1)}%
                        </div>
                      </div>
                    )}
                    {insight.impact.compliance && (
                      <div>
                        <div className="text-xs text-[#9ca3af] mb-1">
                          Compliance Impact
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {insight.impact.compliance > 0 ? "+" : ""}
                          {insight.impact.compliance.toFixed(1)}%
                        </div>
                      </div>
                    )}
                    {insight.impact.revenue && (
                      <div>
                        <div className="text-xs text-[#9ca3af] mb-1">
                          Revenue Impact
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {insight.impact.revenue > 0 ? "+" : ""}$
                          {insight.impact.revenue.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                {insight.recommendations &&
                  insight.recommendations.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <i className="ri-lightbulb-line text-yellow-400 text-base"></i>
                        Recommendations
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {insight.recommendations.map((rec, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-lg border border-yellow-500/30"
                          >
                            {rec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Actions */}
                {insight.actions && insight.actions.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <i className="ri-play-line text-cyan-400 text-base"></i>
                      Recommended Actions
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {insight.actions.map((action, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-lg border border-cyan-500/30"
                        >
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedInsight === insight.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-semibold text-white mb-2">
                            Insight Details
                          </div>
                          <div className="space-y-2 text-sm text-[#9ca3af]">
                            <div>
                              <span className="text-white">Type:</span>{" "}
                              {insight.insightType}
                            </div>
                            <div>
                              <span className="text-white">Severity:</span>{" "}
                              {insight.severity}
                            </div>
                            <div>
                              <span className="text-white">Confidence:</span>{" "}
                              {insight.confidence}%
                            </div>
                            <div>
                              <span className="text-white">Generated:</span>{" "}
                              {format(
                                new Date(insight.generatedAt),
                                "MMM dd, yyyy HH:mm",
                              )}
                            </div>
                            {insight.expiresAt && (
                              <div>
                                <span className="text-white">Expires:</span>{" "}
                                {format(
                                  new Date(insight.expiresAt),
                                  "MMM dd, yyyy HH:mm",
                                )}
                              </div>
                            )}
                            {insight.acknowledgedAt && (
                              <div>
                                <span className="text-white">
                                  Acknowledged:
                                </span>{" "}
                                {format(
                                  new Date(insight.acknowledgedAt),
                                  "MMM dd, yyyy HH:mm",
                                )}{" "}
                                by {insight.acknowledgedBy}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white mb-2">
                            Data
                          </div>
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-xs text-[#9ca3af] font-mono">
                            {JSON.stringify(insight.data, null, 2)}
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

      {/* Reports Mode */}
      {viewMode === "reports" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <i className="ri-file-chart-line text-cyan-400 text-xl"></i>
              Automated Reports ({reports.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-white">
                        {report.name}
                      </h4>
                      {report.isActive && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                          <i className="ri-checkbox-circle-line text-sm"></i>
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#9ca3af] mb-3">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
                      <span>Type: {report.reportType}</span>
                      <span>Format: {report.format}</span>
                      <span>Recipients: {report.recipients.length}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-semibold text-white mb-2">
                    Schedule
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-xs text-[#9ca3af]">
                    Frequency: {report.schedule.frequency}
                    {report.schedule.time && ` at ${report.schedule.time}`}
                    {report.schedule.dayOfWeek !== undefined && (
                      <div>
                        Day:{" "}
                        {
                          [
                            "Sunday",
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                          ][report.schedule.dayOfWeek]
                        }
                      </div>
                    )}
                    {report.schedule.dayOfMonth && (
                      <div>Day of Month: {report.schedule.dayOfMonth}</div>
                    )}
                  </div>
                </div>

                {report.lastGenerated && (
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-white mb-2">
                      Last Generated
                    </div>
                    <div className="text-sm text-[#9ca3af]">
                      {format(
                        new Date(report.lastGenerated),
                        "MMM dd, yyyy HH:mm",
                      )}
                    </div>
                    {report.nextGeneration && (
                      <div className="text-sm text-[#9ca3af] mt-1">
                        Next:{" "}
                        {format(
                          new Date(report.nextGeneration),
                          "MMM dd, yyyy HH:mm",
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => onReportGenerate?.(report.id)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <i className="ri-play-line text-base"></i>
                  Generate Report
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Mode */}
      {viewMode === "analytics" && (
        <div className="space-y-6">
          {/* Insights by Type */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <i className="ri-pie-chart-line text-cyan-400 text-xl"></i>
              Insights by Type
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={insightsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percent }) =>
                    `${type}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {insightsByType.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getTypeColor(entry.type)}
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Insights by Severity */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <i className="ri-bar-chart-line text-purple-400 text-xl"></i>
              Insights by Severity
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={insightsBySeverity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="severity" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Impact Analysis */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <i className="ri-radar-line text-green-400 text-xl"></i>
              Impact Analysis
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={impactData.slice(0, 10)}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis
                  dataKey="title"
                  stroke="#9ca3af"
                  fontSize={10}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  stroke="#9ca3af"
                />
                <Radar
                  name="Duration"
                  dataKey="duration"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Cost"
                  dataKey="cost"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Quality"
                  dataKey="quality"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Compliance"
                  dataKey="compliance"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Revenue"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                />
                <RechartsTooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

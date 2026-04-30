"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ProcessPrediction,
  PredictiveInsight,
} from "@/types/intelligentOrchestration";
import { format } from "date-fns";
// Using RemixIcon instead of lucide-react for consistency
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

interface PredictiveAnalyticsProps {
  predictions: ProcessPrediction[];
  insights: PredictiveInsight[];
}

export default function PredictiveAnalytics({
  predictions,
  insights,
}: PredictiveAnalyticsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "1H" | "24H" | "7D" | "30D"
  >("24H");
  const [selectedPredictionType, setSelectedPredictionType] =
    useState<string>("ALL");

  // Filter predictions
  const filteredPredictions = useMemo(() => {
    let filtered = predictions;
    if (selectedPredictionType !== "ALL") {
      filtered = filtered.filter(
        (p) => p.predictionType === selectedPredictionType,
      );
    }
    return filtered.slice(0, 50); // Limit for performance
  }, [predictions, selectedPredictionType]);

  // Prediction accuracy
  const accuracyData = useMemo(() => {
    const validated = filteredPredictions.filter(
      (p) => p.actualValue !== undefined,
    );
    if (validated.length === 0) return { avgAccuracy: 0, count: 0 };

    const avgAccuracy =
      validated.reduce((sum, p) => sum + (p.accuracy || 0), 0) /
      validated.length;
    return { avgAccuracy, count: validated.length };
  }, [filteredPredictions]);

  // Prediction trends
  const predictionTrends = useMemo(() => {
    const sorted = [...filteredPredictions].sort(
      (a, b) =>
        new Date(a.predictedAt).getTime() - new Date(b.predictedAt).getTime(),
    );
    return sorted.slice(0, 20).map((p) => ({
      date: format(new Date(p.predictedAt), "MMM dd HH:mm"),
      predicted: p.predictedValue,
      actual: p.actualValue || null,
      confidence: p.confidence,
      type: p.predictionType,
    }));
  }, [filteredPredictions]);

  // Insights by severity
  const insightsBySeverity = useMemo(() => {
    const severityCounts: Record<string, number> = {};
    insights.forEach((insight) => {
      severityCounts[insight.severity] =
        (severityCounts[insight.severity] || 0) + 1;
    });
    return Object.entries(severityCounts).map(([severity, count]) => ({
      severity,
      count,
    }));
  }, [insights]);

  // Impact analysis
  const impactData = useMemo(() => {
    return insights.map((insight) => ({
      title: insight.title.substring(0, 30),
      duration: insight.impact.duration || 0,
      cost: insight.impact.cost || 0,
      quality: insight.impact.quality || 0,
      compliance: insight.impact.compliance || 0,
      revenue: insight.impact.revenue || 0,
      severity: insight.severity,
    }));
  }, [insights]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
          {(["1H", "24H", "7D", "30D"] as const).map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedTimeframe === timeframe
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                  : "text-[#9ca3af] hover:text-white hover:bg-white/5"
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
        <select
          value={selectedPredictionType}
          onChange={(e) => setSelectedPredictionType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        >
          <option value="ALL">All Prediction Types</option>
          <option value="DURATION">Duration</option>
          <option value="COST">Cost</option>
          <option value="QUALITY">Quality</option>
          <option value="COMPLIANCE">Compliance</option>
          <option value="RISK">Risk</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <i className="ri-brain-line text-blue-400 text-2xl"></i>
            </div>
            <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full">
              {filteredPredictions.length} predictions
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {filteredPredictions.length}
          </div>
          <div className="text-sm text-blue-300">Total Predictions</div>
          <div className="mt-4 text-xs text-blue-200">
            {accuracyData.count} validated •{" "}
            {accuracyData.avgAccuracy.toFixed(1)}% avg accuracy
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
              <i className="ri-target-line text-green-400 text-2xl"></i>
            </div>
            <span className="text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded-full">
              {accuracyData.avgAccuracy.toFixed(1)}%
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {accuracyData.avgAccuracy.toFixed(1)}%
          </div>
          <div className="text-sm text-green-300">Prediction Accuracy</div>
          <div className="mt-4 text-xs text-green-200">
            {accuracyData.count} validated predictions
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
              <i className="ri-lightbulb-line text-purple-400 text-2xl"></i>
            </div>
            <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full">
              {insights.filter((i) => i.severity === "CRITICAL").length}{" "}
              critical
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {insights.length}
          </div>
          <div className="text-sm text-purple-300">Predictive Insights</div>
          <div className="mt-4 text-xs text-purple-200">
            {
              insights.filter(
                (i) => i.severity === "HIGH" || i.severity === "CRITICAL",
              ).length
            }{" "}
            high priority
          </div>
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
            <span className="text-xs text-yellow-300 bg-yellow-500/20 px-2 py-1 rounded-full">
              Avg
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {filteredPredictions.length > 0
              ? (
                  filteredPredictions.reduce(
                    (sum, p) => sum + p.confidence,
                    0,
                  ) / filteredPredictions.length
                ).toFixed(0)
              : 0}
            %
          </div>
          <div className="text-sm text-yellow-300">Avg Confidence</div>
          <div className="mt-4 text-xs text-yellow-200">
            {filteredPredictions.filter((p) => p.confidence > 80).length} high
            confidence
          </div>
        </motion.div>
      </div>

      {/* Prediction Trends Chart */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <i className="ri-arrow-up-line text-cyan-400 text-xl"></i>
          Prediction Trends & Accuracy
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={predictionTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="predicted"
              fill="#3b82f6"
              fillOpacity={0.3}
              stroke="#3b82f6"
              strokeWidth={2}
              name="Predicted"
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Actual"
              dot={{ fill: "#10b981", r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="confidence"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Confidence %"
              dot={{ fill: "#f59e0b", r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights by Severity */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <i className="ri-alert-line text-yellow-400 text-xl"></i>
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
              <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Impact Analysis */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <i className="ri-activity-line text-purple-400 text-xl"></i>
            Impact Analysis
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={impactData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="title"
                stroke="#9ca3af"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                dataKey="duration"
                stackId="a"
                fill="#3b82f6"
                name="Duration Impact"
              />
              <Bar
                dataKey="cost"
                stackId="a"
                fill="#ef4444"
                name="Cost Impact"
              />
              <Bar
                dataKey="quality"
                stackId="a"
                fill="#10b981"
                name="Quality Impact"
              />
              <Bar
                dataKey="compliance"
                stackId="a"
                fill="#f59e0b"
                name="Compliance Impact"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <i className="ri-sparkling-line text-cyan-400 text-xl"></i>
          Predictive Insights
        </h3>
        {insights.slice(0, 10).map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 transition-all ${
              insight.severity === "CRITICAL"
                ? "border-red-500/50 shadow-lg shadow-red-500/20"
                : insight.severity === "HIGH"
                  ? "border-yellow-500/50 shadow-lg shadow-yellow-500/20"
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
                    className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                      insight.severity === "CRITICAL"
                        ? "bg-red-500/20 text-red-400"
                        : insight.severity === "HIGH"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : insight.severity === "MEDIUM"
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {insight.severity}
                  </span>
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                    {insight.confidence}% confidence
                  </span>
                </div>
                <p className="text-sm text-[#9ca3af] mb-4">
                  {insight.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-[#9ca3af] mb-4">
                  <span>Type: {insight.insightType}</span>
                  <span>
                    Generated:{" "}
                    {format(new Date(insight.predictedAt), "MMM dd, HH:mm")}
                  </span>
                  <span>
                    Affected: {insight.affectedEntities.length} entities
                  </span>
                </div>
              </div>
            </div>

            {/* Impact Metrics */}
            {(insight.impact.duration ||
              insight.impact.cost ||
              insight.impact.quality ||
              insight.impact.compliance) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
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
              </div>
            )}

            {/* Recommendations */}
            <div className="mb-4">
              <div className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <i className="ri-lightbulb-line text-yellow-400 text-base"></i>
                Recommendation
              </div>
              <p className="text-sm text-[#9ca3af] mb-3">
                {insight.recommendation}
              </p>
              {insight.actions.length > 0 && (
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
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

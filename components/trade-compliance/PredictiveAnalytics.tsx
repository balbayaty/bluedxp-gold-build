/**
 * Predictive Analytics Component
 * Advanced forecasting and risk prediction visualization
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import { predictiveAnalyticsService } from "@/lib/services/trade-compliance/predictiveAnalyticsService";
import type {
  Forecast,
  RiskPrediction,
  OptimizationRecommendation,
} from "@/lib/services/trade-compliance/predictiveAnalyticsService";

export default function PredictiveAnalytics() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [riskPredictions, setRiskPredictions] = useState<RiskPrediction[]>([]);
  const [optimizations, setOptimizations] = useState<
    OptimizationRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"7D" | "30D" | "90D" | "1Y">(
    "30D",
  );
  const [optimizationType, setOptimizationType] = useState<
    "cost" | "time" | "risk" | "efficiency"
  >("cost");

  useEffect(() => {
    loadPredictiveData();
  }, [timeframe, optimizationType]);

  const loadPredictiveData = async () => {
    setLoading(true);
    try {
      // Fetch historical data with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      try {
        const recordsRes = await fetch("/api/trade-compliance/records", {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const recordsData = await recordsRes.json();
        const records = recordsData.success ? recordsData.records || [] : [];

        // Generate historical data for forecasting
        const historicalData = generateHistoricalData(records);

        // Generate forecasts
        const forecastData = await predictiveAnalyticsService.forecastMetrics(
          historicalData,
          timeframe,
        );
        setForecasts(forecastData);

        // Generate risk predictions
        const risks = await predictiveAnalyticsService.predictRisks(records);
        setRiskPredictions(risks);

        // Generate optimizations
        const opts = await predictiveAnalyticsService.optimize(
          records,
          optimizationType,
        );
        setOptimizations(opts);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === "AbortError") {
          console.error(
            "Request timeout: Predictive analytics fetch took too long",
          );
          // Set empty data to prevent infinite loading
          setForecasts([]);
          setRiskPredictions([]);
          setOptimizations([]);
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error("Error loading predictive data:", error);
      // Set empty data on error
      setForecasts([]);
      setRiskPredictions([]);
      setOptimizations([]);
    } finally {
      setLoading(false);
    }
  };

  const generateHistoricalData = (records: any[]) => {
    const days =
      timeframe === "7D"
        ? 7
        : timeframe === "30D"
          ? 30
          : timeframe === "90D"
            ? 90
            : 365;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split("T")[0],
        recordCount:
          Math.floor(records.length / days) + Math.floor(Math.random() * 5),
        avgComplianceScore: 75 + Math.random() * 20,
        totalCosts: (records.length * 100000) / days + Math.random() * 50000,
      });
    }

    return data;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical":
        return "text-red-400 bg-red-500/20";
      case "high":
        return "text-orange-400 bg-orange-500/20";
      case "medium":
        return "text-yellow-400 bg-yellow-500/20";
      default:
        return "text-green-400 bg-green-500/20";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return "ri-arrow-up-line text-green-400";
      case "decreasing":
        return "ri-arrow-down-line text-red-400";
      default:
        return "ri-arrow-right-line text-[#9ca3af]";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#9ca3af] text-sm">
            Loading predictive analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Forecasts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 hover:border-cyan-500/50 transition-all"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <i className="ri-line-chart-line text-cyan-400"></i>
            Forecasts
          </h3>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          >
            <option value="7D">7 Days</option>
            <option value="30D">30 Days</option>
            <option value="90D">90 Days</option>
            <option value="1Y">1 Year</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {forecasts.map((forecast, idx) => (
            <div
              key={idx}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#9ca3af]">
                  {forecast.metric}
                </span>
                <i className={getTrendIcon(forecast.trend)}></i>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {forecast.currentValue.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={
                    forecast.changePercent > 0
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {forecast.changePercent > 0 ? "+" : ""}
                  {forecast.changePercent.toFixed(1)}%
                </span>
                <span className="text-[#9ca3af]">
                  • {forecast.confidence * 100}% confidence
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Forecast Chart */}
        {forecasts.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={forecasts[0].forecastedValues}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#9ca3af"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#ffffff",
                }}
              />
              <Legend wrapperStyle={{ color: "#9ca3af" }} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="value"
                fill="#06b6d4"
                fillOpacity={0.3}
                stroke="#06b6d4"
                name="Forecasted Value"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="confidence"
                stroke="#10b981"
                strokeWidth={2}
                name="Confidence"
              />
              <ReferenceLine
                yAxisId="left"
                y={forecasts[0].currentValue}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label="Current"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Risk Predictions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 hover:border-cyan-500/50 transition-all"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-alert-line text-cyan-400"></i>
          Risk Predictions
        </h3>
        <div className="space-y-3">
          {riskPredictions.slice(0, 5).map((risk, idx) => (
            <div
              key={idx}
              className="border border-white/10 rounded-lg p-4 hover:border-red-500/30 transition-colors bg-white/5"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(risk.riskLevel)}`}
                    >
                      {risk.riskLevel.toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {risk.riskType} Risk
                    </span>
                    <span className="text-xs text-[#9ca3af]">
                      • {risk.probability * 100}% probability
                    </span>
                  </div>
                  <p className="text-sm text-[#9ca3af] mb-2">
                    Record: {risk.recordId}
                  </p>
                  <div className="text-xs text-[#9ca3af] mb-2">
                    <strong className="text-white">Factors:</strong>{" "}
                    {risk.factors.join(", ")}
                  </div>
                  <div className="text-xs text-[#9ca3af]">
                    <strong className="text-white">Mitigation:</strong>{" "}
                    {risk.mitigationStrategies.join("; ")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">
                    {risk.timeframe}
                  </div>
                  <div className="text-xs text-[#9ca3af]">
                    {risk.confidence * 100}% confidence
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Optimization Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 sm:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <i className="ri-lightbulb-line text-green-400"></i>
            Optimization Recommendations
          </h3>
          <select
            value={optimizationType}
            onChange={(e) => setOptimizationType(e.target.value as any)}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          >
            <option value="cost">Cost</option>
            <option value="time">Time</option>
            <option value="risk">Risk</option>
            <option value="efficiency">Efficiency</option>
          </select>
        </div>

        <div className="space-y-4">
          {optimizations.map((opt, idx) => (
            <div
              key={idx}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-green-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">
                    {opt.type.toUpperCase()} Optimization
                  </h4>
                  <p className="text-sm text-[#9ca3af] mb-2">{opt.method}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">
                    {opt.improvement}%
                  </div>
                  <div className="text-xs text-[#9ca3af]">Improvement</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-[#9ca3af] mb-1">Current</div>
                  <div className="text-lg font-semibold text-white">
                    {opt.currentValue.toLocaleString()}
                    {opt.type === "cost" && " SAR"}
                    {opt.type === "time" && " days"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#9ca3af] mb-1">Optimized</div>
                  <div className="text-lg font-semibold text-green-400">
                    {opt.optimizedValue.toLocaleString()}
                    {opt.type === "cost" && " SAR"}
                    {opt.type === "time" && " days"}
                  </div>
                </div>
              </div>

              {opt.estimatedSavings && (
                <div className="bg-green-500/20 border border-green-500/30 rounded p-2 mb-3">
                  <div className="text-sm font-medium text-green-400">
                    Estimated Savings: {opt.estimatedSavings.toLocaleString()}{" "}
                    SAR
                  </div>
                </div>
              )}

              <div className="border-t border-white/10 pt-3">
                <div className="text-xs font-medium text-white mb-2">
                  Implementation Steps:
                </div>
                <ul className="space-y-1">
                  {opt.steps.map((step, stepIdx) => (
                    <li
                      key={stepIdx}
                      className="text-xs text-[#9ca3af] flex items-start gap-2"
                    >
                      <i className="ri-checkbox-circle-line text-green-400 mt-0.5"></i>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

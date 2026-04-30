/**
 * Predictive Insights Dashboard
 * Mind-blowing predictive analytics visualization
 * Shows trends, forecasts, risks, and opportunities
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
} from "recharts";

interface PredictiveInsightsDashboardProps {
  tenantId?: string;
  timeframe?: "7d" | "30d" | "90d";
}

interface PredictiveInsight {
  id: string;
  type: "trend" | "anomaly" | "risk" | "opportunity" | "maintenance";
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  predictedValue?: number;
  currentValue?: number;
  trend: "increasing" | "decreasing" | "stable" | "volatile";
  severity: "low" | "medium" | "high" | "critical";
  recommendations: string[];
}

interface TrendForecast {
  metric: string;
  currentValue: number;
  forecastedValues: Array<{
    date: string;
    value: number;
    confidence: number;
  }>;
  trend: "increasing" | "decreasing" | "stable";
  changeRate: number;
  confidence: number;
}

export default function PredictiveInsightsDashboard({
  tenantId,
  timeframe = "30d",
}: PredictiveInsightsDashboardProps) {
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [forecasts, setForecasts] = useState<TrendForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string>("compliance");

  useEffect(() => {
    loadPredictiveData();
  }, [tenantId, timeframe]);

  const loadPredictiveData = async () => {
    setLoading(true);
    try {
      // Load insights
      const insightsRes = await fetch(
        `/api/ai/vision/predictive/insights?timeframe=${timeframe}&tenantId=${tenantId || ""}`,
      );
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        setInsights(insightsData.insights || []);
      }

      // Load forecasts
      const forecastsRes = await fetch(
        `/api/ai/vision/predictive/forecasts?metric=${selectedMetric}&tenantId=${tenantId || ""}`,
      );
      if (forecastsRes.ok) {
        const forecastsData = await forecastsRes.json();
        setForecasts(forecastsData.forecasts || []);
      }
    } catch (error) {
      console.error("Error loading predictive data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "trend":
        return "ri-line-chart-line";
      case "anomaly":
        return "ri-alert-line";
      case "risk":
        return "ri-shield-cross-line";
      case "opportunity":
        return "ri-lightbulb-line";
      case "maintenance":
        return "ri-tools-line";
      default:
        return "ri-information-line";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <i className="ri-loader-4-line animate-spin text-4xl text-blue-600"></i>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Predictive Insights
          </h3>
          <p className="text-sm text-gray-600">
            AI-powered predictions and trend forecasting
          </p>
        </div>
        <select
          value={timeframe}
          onChange={(e) => {
            const newTimeframe = e.target.value as any;
            loadPredictiveData();
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Key Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.slice(0, 6).map((insight, idx) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-6 rounded-lg border-2 ${
                insight.severity === "critical"
                  ? "border-red-500 bg-red-50"
                  : insight.severity === "high"
                    ? "border-orange-500 bg-orange-50"
                    : insight.severity === "medium"
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-blue-500 bg-blue-50"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${getSeverityColor(insight.severity)} flex items-center justify-center text-white`}
                  >
                    <i className={`${getTypeIcon(insight.type)} text-lg`}></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {insight.title}
                    </h4>
                    <p className="text-xs text-gray-600 capitalize">
                      {insight.type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {insight.confidence}%
                  </div>
                  <div className="text-xs text-gray-500">Confidence</div>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-3">
                {insight.description}
              </p>

              {insight.currentValue !== undefined &&
                insight.predictedValue !== undefined && (
                  <div className="mb-3 p-2 bg-white rounded">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Current:</span>
                      <span className="font-semibold">
                        {insight.currentValue.toFixed(1)}
                      </span>
                      <span className="text-gray-600">→</span>
                      <span className="text-gray-600">Predicted:</span>
                      <span className="font-semibold">
                        {insight.predictedValue.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}

              {insight.recommendations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Recommendations:
                  </p>
                  <ul className="space-y-1">
                    {insight.recommendations.slice(0, 2).map((rec, i) => (
                      <li
                        key={i}
                        className="text-xs text-gray-600 flex items-start gap-2"
                      >
                        <i className="ri-checkbox-circle-line text-green-600 mt-0.5"></i>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Trend Forecasts */}
      {forecasts.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Trend Forecasts</h4>
          <div className="space-y-6">
            {forecasts.map((forecast, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h5 className="font-semibold text-gray-900 capitalize">
                      {forecast.metric.replace("_", " ")}
                    </h5>
                    <p className="text-sm text-gray-600">
                      Current: {forecast.currentValue.toFixed(1)} • Trend:{" "}
                      {forecast.trend} • Confidence: {forecast.confidence}%
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      forecast.trend === "increasing"
                        ? "bg-green-100 text-green-800"
                        : forecast.trend === "decreasing"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {forecast.changeRate.toFixed(1)}% change
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={forecast.forecastedValues}>
                    <defs>
                      <linearGradient
                        id={`color${idx}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill={`url(#color${idx})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}

      {insights.length === 0 && forecasts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <i className="ri-line-chart-line text-4xl text-gray-400 mb-3"></i>
          <p className="text-gray-600">No predictive insights available yet</p>
          <p className="text-sm text-gray-500 mt-1">
            More data needed for accurate predictions
          </p>
        </div>
      )}
    </div>
  );
}

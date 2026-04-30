/**
 * Comprehensive Trend Analysis Component
 * Visualizes trends across modules with beautiful charts
 */

"use client";

import { useState, useMemo } from "react";
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
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DataPoint {
  date: string;
  value: number;
  category?: string;
}

interface TrendData {
  compliance: DataPoint[];
  safety: DataPoint[];
  quality: DataPoint[];
  efficiency: DataPoint[];
}

interface TrendAnalysisProps {
  data?: TrendData;
  title?: string;
  timeRange?: "7d" | "30d" | "90d" | "1y";
}

// Generate mock data for demo
const generateMockData = (days: number): TrendData => {
  const now = new Date();
  const data: TrendData = {
    compliance: [],
    safety: [],
    quality: [],
    efficiency: [],
  };

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Generate trending data with some variance
    data.compliance.push({
      date: dateStr,
      value: Math.min(
        100,
        Math.max(
          60,
          75 + Math.sin(i / 5) * 15 + (i / days) * 10 + Math.random() * 5,
        ),
      ),
    });
    data.safety.push({
      date: dateStr,
      value: Math.max(0, 20 - (i / days) * 15 + Math.random() * 8 - 4),
    });
    data.quality.push({
      date: dateStr,
      value: Math.min(
        100,
        Math.max(
          50,
          70 + Math.cos(i / 7) * 10 + (i / days) * 8 + Math.random() * 5,
        ),
      ),
    });
    data.efficiency.push({
      date: dateStr,
      value: Math.min(
        100,
        Math.max(40, 65 + (i / days) * 20 + Math.random() * 10 - 5),
      ),
    });
  }

  return data;
};

const COLORS = {
  compliance: "#06b6d4", // cyan
  safety: "#f43f5e", // rose
  quality: "#8b5cf6", // violet
  efficiency: "#22c55e", // green
};

const TIME_RANGES = {
  "7d": { label: "7 Days", days: 7 },
  "30d": { label: "30 Days", days: 30 },
  "90d": { label: "90 Days", days: 90 },
  "1y": { label: "1 Year", days: 365 },
};

export default function TrendAnalysis({
  data,
  title = "Trend Analysis",
  timeRange = "30d",
}: TrendAnalysisProps) {
  const [selectedRange, setSelectedRange] = useState(timeRange);
  const [selectedMetrics, setSelectedMetrics] = useState<(keyof TrendData)[]>([
    "compliance",
    "quality",
  ]);
  const [chartType, setChartType] = useState<"line" | "area" | "bar">("area");

  const trendData = useMemo(() => {
    return data || generateMockData(TIME_RANGES[selectedRange].days);
  }, [data, selectedRange]);

  // Combine data for chart
  const chartData = useMemo(() => {
    const days = TIME_RANGES[selectedRange].days;
    return trendData.compliance.slice(-days).map((item, idx) => ({
      date: item.date,
      compliance: trendData.compliance[idx]?.value || 0,
      safety: trendData.safety[idx]?.value || 0,
      quality: trendData.quality[idx]?.value || 0,
      efficiency: trendData.efficiency[idx]?.value || 0,
    }));
  }, [trendData, selectedRange]);

  // Calculate stats
  const stats = useMemo(() => {
    const calcTrend = (values: number[]) => {
      if (values.length < 2) return 0;
      const first =
        values
          .slice(0, Math.floor(values.length / 2))
          .reduce((a, b) => a + b, 0) /
        (values.length / 2);
      const second =
        values.slice(Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) /
        (values.length / 2);
      return ((second - first) / first) * 100;
    };

    return {
      compliance: {
        current: Math.round(chartData[chartData.length - 1]?.compliance || 0),
        trend: calcTrend(chartData.map((d) => d.compliance)),
        avg: Math.round(
          chartData.reduce((a, b) => a + b.compliance, 0) / chartData.length,
        ),
      },
      safety: {
        current: Math.round(chartData[chartData.length - 1]?.safety || 0),
        trend: calcTrend(chartData.map((d) => d.safety)),
        avg: Math.round(
          chartData.reduce((a, b) => a + b.safety, 0) / chartData.length,
        ),
      },
      quality: {
        current: Math.round(chartData[chartData.length - 1]?.quality || 0),
        trend: calcTrend(chartData.map((d) => d.quality)),
        avg: Math.round(
          chartData.reduce((a, b) => a + b.quality, 0) / chartData.length,
        ),
      },
      efficiency: {
        current: Math.round(chartData[chartData.length - 1]?.efficiency || 0),
        trend: calcTrend(chartData.map((d) => d.efficiency)),
        avg: Math.round(
          chartData.reduce((a, b) => a + b.efficiency, 0) / chartData.length,
        ),
      },
    };
  }, [chartData]);

  const toggleMetric = (metric: keyof TrendData) => {
    if (selectedMetrics.includes(metric)) {
      if (selectedMetrics.length > 1) {
        setSelectedMetrics(selectedMetrics.filter((m) => m !== metric));
      }
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  const renderChart = () => {
    const ChartComponent =
      chartType === "line"
        ? LineChart
        : chartType === "area"
          ? AreaChart
          : BarChart;
    const DataComponent =
      chartType === "line" ? Line : chartType === "area" ? Area : Bar;

    return (
      <ResponsiveContainer width="100%" height={350}>
        <ChartComponent
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            {Object.entries(COLORS).map(([key, color]) => (
              <linearGradient
                key={key}
                id={`gradient${key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }
          />
          <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#fff" }}
          />
          <Legend />
          {selectedMetrics.includes("compliance") &&
            (chartType === "bar" ? (
              <Bar
                dataKey="compliance"
                name="Compliance"
                fill={COLORS.compliance}
                radius={[4, 4, 0, 0]}
              />
            ) : (
              <DataComponent
                type="monotone"
                dataKey="compliance"
                name="Compliance"
                stroke={COLORS.compliance}
                strokeWidth={2}
                fill={
                  chartType === "area" ? `url(#gradientcompliance)` : undefined
                }
                dot={false}
              />
            ))}
          {selectedMetrics.includes("safety") &&
            (chartType === "bar" ? (
              <Bar
                dataKey="safety"
                name="Safety Issues"
                fill={COLORS.safety}
                radius={[4, 4, 0, 0]}
              />
            ) : (
              <DataComponent
                type="monotone"
                dataKey="safety"
                name="Safety Issues"
                stroke={COLORS.safety}
                strokeWidth={2}
                fill={chartType === "area" ? `url(#gradientsafety)` : undefined}
                dot={false}
              />
            ))}
          {selectedMetrics.includes("quality") &&
            (chartType === "bar" ? (
              <Bar
                dataKey="quality"
                name="Quality Score"
                fill={COLORS.quality}
                radius={[4, 4, 0, 0]}
              />
            ) : (
              <DataComponent
                type="monotone"
                dataKey="quality"
                name="Quality Score"
                stroke={COLORS.quality}
                strokeWidth={2}
                fill={
                  chartType === "area" ? `url(#gradientquality)` : undefined
                }
                dot={false}
              />
            ))}
          {selectedMetrics.includes("efficiency") &&
            (chartType === "bar" ? (
              <Bar
                dataKey="efficiency"
                name="Efficiency"
                fill={COLORS.efficiency}
                radius={[4, 4, 0, 0]}
              />
            ) : (
              <DataComponent
                type="monotone"
                dataKey="efficiency"
                name="Efficiency"
                stroke={COLORS.efficiency}
                strokeWidth={2}
                fill={
                  chartType === "area" ? `url(#gradientefficiency)` : undefined
                }
                dot={false}
              />
            ))}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
            <i className="ri-line-chart-line text-white text-2xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-sm text-gray-400">
              Track performance across all metrics
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Time range selector */}
          <div className="flex bg-gray-900 rounded-lg p-1">
            {Object.entries(TIME_RANGES).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => setSelectedRange(key as typeof selectedRange)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedRange === key
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Chart type selector */}
          <div className="flex bg-gray-900 rounded-lg p-1">
            {(["area", "line", "bar"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`p-2 rounded-md transition-colors ${
                  chartType === type
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <i
                  className={`ri-${type === "area" ? "stack-fill" : type === "line" ? "line-chart-line" : "bar-chart-box-line"}`}
                ></i>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric toggles */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(COLORS) as (keyof typeof COLORS)[]).map((metric) => (
          <button
            key={metric}
            onClick={() => toggleMetric(metric)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              selectedMetrics.includes(metric)
                ? "text-white shadow-lg"
                : "bg-gray-800 text-gray-500 hover:text-gray-300"
            }`}
            style={
              selectedMetrics.includes(metric)
                ? {
                    backgroundColor: COLORS[metric] + "30",
                    borderColor: COLORS[metric],
                  }
                : {}
            }
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: selectedMetrics.includes(metric)
                  ? COLORS[metric]
                  : "#6b7280",
              }}
            />
            {metric.charAt(0).toUpperCase() + metric.slice(1)}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="mb-6">{renderChart()}</div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(
          Object.entries(stats) as [
            keyof typeof stats,
            typeof stats.compliance,
          ][]
        ).map(([key, value]) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 rounded-xl p-4 border border-gray-700"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[key] }}
              />
              <span className="text-sm text-gray-400 capitalize">{key}</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-white">
                  {key === "safety" ? value.current : `${value.current}%`}
                </div>
                <div className="text-xs text-gray-500">
                  Avg: {key === "safety" ? value.avg : `${value.avg}%`}
                </div>
              </div>
              <div
                className={`flex items-center gap-1 text-sm ${
                  key === "safety"
                    ? value.trend < 0
                      ? "text-green-400"
                      : "text-red-400"
                    : value.trend >= 0
                      ? "text-green-400"
                      : "text-red-400"
                }`}
              >
                <i
                  className={`ri-arrow-${
                    key === "safety"
                      ? value.trend < 0
                        ? "down"
                        : "up"
                      : value.trend >= 0
                        ? "up"
                        : "down"
                  }-line`}
                ></i>
                {Math.abs(Math.round(value.trend))}%
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

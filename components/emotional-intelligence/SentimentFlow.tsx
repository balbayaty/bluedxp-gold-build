/**
 * Sentiment Flow Visualization Component
 *
 * Revolutionary real-time sentiment flow visualization
 * Shows sentiment journey over time with predictive indicators
 *
 * @module components/emotional-intelligence
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";

interface SentimentDataPoint {
  timestamp: Date;
  sentiment: number; // -1 to 1 (negative to positive)
  emotionalState: string;
  intensity: number;
  entityId?: string;
  entityType?: string;
  touchpoint?: string;
}

interface SentimentFlowProps {
  data: SentimentDataPoint[];
  entityId?: string;
  entityType?: string;
  showPredictions?: boolean;
  realTime?: boolean;
  className?: string;
}

export function SentimentFlow({
  data,
  entityId,
  entityType,
  showPredictions = true,
  realTime = false,
  className = "",
}: SentimentFlowProps) {
  const [selectedPoint, setSelectedPoint] = useState<SentimentDataPoint | null>(
    null,
  );
  const [predictionData, setPredictionData] = useState<SentimentDataPoint[]>(
    [],
  );

  // Process data for chart
  const chartData = useMemo(() => {
    return data
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )
      .map((point, idx) => ({
        time: format(new Date(point.timestamp), "MMM dd HH:mm"),
        timestamp: point.timestamp,
        sentiment: point.sentiment,
        intensity: point.intensity,
        emotionalState: point.emotionalState,
        touchpoint: point.touchpoint,
        index: idx,
      }));
  }, [data]);

  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return "stable";

    const recent = chartData.slice(-5);
    const previous = chartData.slice(-10, -5);

    if (previous.length === 0) return "stable";

    const recentAvg =
      recent.reduce((sum, d) => sum + d.sentiment, 0) / recent.length;
    const prevAvg =
      previous.reduce((sum, d) => sum + d.sentiment, 0) / previous.length;

    const diff = recentAvg - prevAvg;
    if (diff > 0.1) return "improving";
    if (diff < -0.1) return "declining";
    return "stable";
  }, [chartData]);

  // Generate predictions
  useEffect(() => {
    if (!showPredictions || chartData.length < 3) {
      setPredictionData([]);
      return;
    }

    // Simple linear prediction (in production, use ML model)
    const recent = chartData.slice(-5);
    const avgChange =
      recent.slice(1).reduce((sum, d, idx) => {
        return sum + (d.sentiment - recent[idx].sentiment);
      }, 0) /
      (recent.length - 1);

    const lastPoint = chartData[chartData.length - 1];
    const predictions: SentimentDataPoint[] = [];

    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date(lastPoint.timestamp);
      futureDate.setDate(futureDate.getDate() + i);
      predictions.push({
        timestamp: futureDate,
        sentiment: Math.max(
          -1,
          Math.min(1, lastPoint.sentiment + avgChange * i),
        ),
        emotionalState:
          lastPoint.sentiment + avgChange * i > 0 ? "POSITIVE" : "NEGATIVE",
        intensity: 0.5,
      });
    }

    setPredictionData(predictions);
  }, [chartData, showPredictions]);

  // Real-time updates
  useEffect(() => {
    if (!realTime) return;

    const interval = setInterval(() => {
      // In production, fetch new data
      // For now, this is handled by parent component
    }, 5000);

    return () => clearInterval(interval);
  }, [realTime]);

  const trendColor =
    trend === "improving"
      ? "#22c55e"
      : trend === "declining"
        ? "#ef4444"
        : "#94a3b8";
  const trendIcon =
    trend === "improving" ? "↑" : trend === "declining" ? "↓" : "→";

  return (
    <div className={`sentiment-flow ${className}`}>
      {/* Header with Trend */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">
            Sentiment Flow
          </h3>
          {entityId && entityType && (
            <p className="text-sm text-gray-400">
              {entityType} {entityId.substring(0, 8)}
            </p>
          )}
        </div>
        <motion.div
          className="flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-xl border"
          style={{
            backgroundColor: `${trendColor}20`,
            borderColor: `${trendColor}40`,
          }}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          <span className="text-2xl">{trendIcon}</span>
          <span className="text-sm font-semibold" style={{ color: trendColor }}>
            {trend.toUpperCase()}
          </span>
        </motion.div>
      </div>

      {/* Chart */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={[...chartData, ...predictionData]}>
            <defs>
              <linearGradient
                id="sentimentGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#94a3b8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              opacity={0.3}
            />
            <XAxis
              dataKey="time"
              stroke="#9ca3af"
              fontSize={12}
              tick={{ fill: "#9ca3af" }}
            />
            <YAxis
              domain={[-1, 1]}
              stroke="#9ca3af"
              fontSize={12}
              tick={{ fill: "#9ca3af" }}
              label={{
                value: "Sentiment",
                angle: -90,
                position: "insideLeft",
                fill: "#9ca3af",
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null;

                const data = payload[0].payload;
                const isPrediction = data.index === undefined;

                return (
                  <div className="bg-black/90 backdrop-blur-xl rounded-lg p-3 border border-white/20 shadow-2xl">
                    <div className="text-xs text-gray-400 mb-1">
                      {isPrediction ? "Predicted" : "Actual"}
                    </div>
                    <div className="text-sm font-semibold text-white mb-1">
                      {format(new Date(data.timestamp), "MMM dd, yyyy HH:mm")}
                    </div>
                    <div className="text-xs text-gray-300 mb-1">
                      Sentiment: {(data.sentiment * 100).toFixed(0)}%
                    </div>
                    {data.emotionalState && (
                      <div className="text-xs text-gray-300 mb-1">
                        State: {data.emotionalState}
                      </div>
                    )}
                    {data.touchpoint && (
                      <div className="text-xs text-gray-400">
                        Touchpoint: {data.touchpoint}
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={0}
              stroke="#6b7280"
              strokeDasharray="2 2"
              opacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="sentiment"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#sentimentGradient)"
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6, fill: "#60a5fa" }}
            />
            {showPredictions && predictionData.length > 0 && (
              <Area
                type="monotone"
                dataKey="sentiment"
                data={predictionData.map((p, idx) => ({
                  ...p,
                  time: format(new Date(p.timestamp), "MMM dd HH:mm"),
                  index: chartData.length + idx,
                }))}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="none"
                dot={{ fill: "#f59e0b", r: 3 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>

        {/* Prediction Label */}
        {showPredictions && predictionData.length > 0 && (
          <div className="absolute top-4 right-4 bg-amber-500/20 backdrop-blur-xl rounded-lg px-3 py-1.5 border border-amber-500/30">
            <div className="text-xs font-semibold text-amber-400">
              🔮 7-Day Prediction
            </div>
          </div>
        )}
      </div>

      {/* Touchpoint Timeline */}
      {chartData.some((d) => d.touchpoint) && (
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">
            Key Touchpoints
          </h4>
          <div className="space-y-2">
            {chartData
              .filter((d) => d.touchpoint)
              .slice(-5)
              .map((point, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setSelectedPoint(point as any)}
                >
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <div className="flex-1">
                    <div className="text-sm text-white">{point.touchpoint}</div>
                    <div className="text-xs text-gray-400">
                      {format(new Date(point.timestamp), "MMM dd, HH:mm")}
                    </div>
                  </div>
                  <div
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      point.sentiment > 0
                        ? "bg-green-500/20 text-green-400"
                        : point.sentiment < 0
                          ? "bg-red-500/20 text-red-400"
                          : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {(point.sentiment * 100).toFixed(0)}%
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SentimentFlow;

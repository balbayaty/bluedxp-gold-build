"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Warehouse } from "@/types/warehouse-management";

interface WarehousePerformanceComparisonProps {
  warehouses: Warehouse[];
  selectedWarehouseId?: string;
}

export default function WarehousePerformanceComparison({
  warehouses,
  selectedWarehouseId,
}: WarehousePerformanceComparisonProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "efficiency",
    "throughput",
    "accuracy",
    "uptime",
  ]);
  const [comparisonMode, setComparisonMode] = useState<
    "bar" | "line" | "radar"
  >("bar");

  const performanceData = warehouses.map((wh) => ({
    name: wh.name,
    efficiency: wh.performance.efficiency,
    throughput: wh.performance.throughput,
    accuracy: wh.performance.accuracy,
    uptime: wh.performance.uptime,
    utilization: (wh.capacity.used / wh.capacity.total) * 100,
    iotSensors: wh.iot.sensors,
    staffEfficiency: (wh.staff.onDuty / wh.staff.total) * 100,
  }));

  const radarData = warehouses.map((wh) => ({
    warehouse: wh.name,
    efficiency: wh.performance.efficiency,
    throughput: wh.performance.throughput,
    accuracy: wh.performance.accuracy,
    uptime: wh.performance.uptime,
    utilization: (wh.capacity.used / wh.capacity.total) * 100,
  }));

  const getRanking = (warehouse: Warehouse) => {
    const metrics = [
      { name: "Efficiency", value: warehouse.performance.efficiency },
      { name: "Throughput", value: warehouse.performance.throughput },
      { name: "Accuracy", value: warehouse.performance.accuracy },
      { name: "Uptime", value: warehouse.performance.uptime },
    ];
    const avgScore =
      metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
    return {
      score: avgScore,
      rank:
        warehouses
          .map((w) => ({
            id: w.id,
            score:
              (w.performance.efficiency +
                w.performance.throughput +
                w.performance.accuracy +
                w.performance.uptime) /
              4,
          }))
          .sort((a, b) => b.score - a.score)
          .findIndex((w) => w.id === warehouse.id) + 1,
    };
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setComparisonMode("bar")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              comparisonMode === "bar"
                ? "bg-cyan-500 text-white"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <i className="ri-bar-chart-line mr-2"></i>
            Bar Chart
          </button>
          <button
            onClick={() => setComparisonMode("line")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              comparisonMode === "line"
                ? "bg-cyan-500 text-white"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <i className="ri-line-chart-line mr-2"></i>
            Line Chart
          </button>
          <button
            onClick={() => setComparisonMode("radar")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              comparisonMode === "radar"
                ? "bg-cyan-500 text-white"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <i className="ri-radar-line mr-2"></i>
            Radar Chart
          </button>
        </div>
      </div>

      {/* Bar Chart Comparison */}
      {comparisonMode === "bar" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <i className="ri-bar-chart-line mr-2 text-cyan-400"></i>
            Performance Comparison
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend />
              <Bar dataKey="efficiency" fill="#06b6d4" name="Efficiency %" />
              <Bar dataKey="throughput" fill="#10b981" name="Throughput %" />
              <Bar dataKey="accuracy" fill="#f59e0b" name="Accuracy %" />
              <Bar dataKey="uptime" fill="#8b5cf6" name="Uptime %" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Line Chart Comparison */}
      {comparisonMode === "line" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <i className="ri-line-chart-line mr-2 text-green-400"></i>
            Performance Trends
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="efficiency"
                stroke="#06b6d4"
                strokeWidth={2}
                name="Efficiency %"
              />
              <Line
                type="monotone"
                dataKey="throughput"
                stroke="#10b981"
                strokeWidth={2}
                name="Throughput %"
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Accuracy %"
              />
              <Line
                type="monotone"
                dataKey="uptime"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Uptime %"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Radar Chart Comparison */}
      {comparisonMode === "radar" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <i className="ri-radar-line mr-2 text-purple-400"></i>
            Multi-Dimensional Performance Analysis
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData[0]}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="warehouse" stroke="#9ca3af" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
              <Radar
                name="Performance"
                dataKey="efficiency"
                stroke="#06b6d4"
                fill="#06b6d4"
                fillOpacity={0.6}
              />
              <Radar
                name="Performance"
                dataKey="throughput"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
              />
              <Radar
                name="Performance"
                dataKey="accuracy"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.6}
              />
              <Radar
                name="Performance"
                dataKey="uptime"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.6}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Warehouse Rankings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <i className="ri-trophy-line mr-2 text-yellow-400"></i>
          Warehouse Rankings
        </h3>
        <div className="space-y-3">
          {warehouses
            .map((wh) => ({ warehouse: wh, ranking: getRanking(wh) }))
            .sort((a, b) => a.ranking.rank - b.ranking.rank)
            .map(({ warehouse, ranking }, index) => (
              <motion.div
                key={warehouse.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${
                  ranking.rank === 1
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : ranking.rank === 2
                      ? "bg-gray-500/10 border-gray-500/30"
                      : ranking.rank === 3
                        ? "bg-orange-500/10 border-orange-500/30"
                        : "bg-white/5 border-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        ranking.rank === 1
                          ? "bg-yellow-500 text-white"
                          : ranking.rank === 2
                            ? "bg-gray-400 text-white"
                            : ranking.rank === 3
                              ? "bg-orange-500 text-white"
                              : "bg-white/10 text-white"
                      }`}
                    >
                      {ranking.rank}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">
                        {warehouse.name}
                      </h4>
                      <p className="text-xs text-[#9ca3af]">
                        {warehouse.location.city}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {ranking.score.toFixed(1)}
                    </div>
                    <div className="text-xs text-[#9ca3af]">Overall Score</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[#9ca3af]">Efficiency</span>
                    <p className="text-white font-medium">
                      {warehouse.performance.efficiency.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">Throughput</span>
                    <p className="text-white font-medium">
                      {warehouse.performance.throughput.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">Accuracy</span>
                    <p className="text-white font-medium">
                      {warehouse.performance.accuracy.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">Uptime</span>
                    <p className="text-white font-medium">
                      {warehouse.performance.uptime.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </motion.div>
    </div>
  );
}

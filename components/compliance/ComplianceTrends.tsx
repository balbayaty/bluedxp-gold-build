"use client";

import { motion } from "framer-motion";
import { ComplianceTrendPoint } from "@/types/compliance";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ComplianceTrendsProps {
  trends?: ComplianceTrendPoint[];
  dashboard?: any;
}

export default function ComplianceTrends({
  trends,
  dashboard,
}: ComplianceTrendsProps) {
  // If no trends, show sample data
  const trendsData = trends || dashboard?.complianceTrend || [];
  const data =
    trendsData.length > 0
      ? trendsData
      : [
          {
            date: "2024-01",
            complianceScore: 85,
            compliantCount: 45,
            nonCompliantCount: 5,
          },
          {
            date: "2024-02",
            complianceScore: 87,
            compliantCount: 47,
            nonCompliantCount: 3,
          },
          {
            date: "2024-03",
            complianceScore: 90,
            compliantCount: 48,
            nonCompliantCount: 2,
          },
          {
            date: "2024-04",
            complianceScore: 88,
            compliantCount: 46,
            nonCompliantCount: 4,
          },
        ];

  const formattedData = data.map((point) => ({
    ...point,
    date: new Date(point.date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1f2937] border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}
              {entry.name.includes("%") || entry.name.includes("Score")
                ? "%"
                : ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
    >
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <i className="ri-line-chart-line text-cyan-400"></i>
        Compliance Trends
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: "#9ca3af" }}
            formatter={(value) => (
              <span className="text-[#9ca3af] text-sm">{value}</span>
            )}
          />
          <Line
            type="monotone"
            dataKey="complianceScore"
            stroke="#06b6d4"
            strokeWidth={3}
            name="Compliance Score (%)"
            dot={{ fill: "#06b6d4", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: "#06b6d4" }}
          />
          <Line
            type="monotone"
            dataKey="compliantCount"
            stroke="#22c55e"
            strokeWidth={2}
            name="Compliant"
            dot={{ fill: "#22c55e", strokeWidth: 2, r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="nonCompliantCount"
            stroke="#ef4444"
            strokeWidth={2}
            name="Non-Compliant"
            dot={{ fill: "#ef4444", strokeWidth: 2, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

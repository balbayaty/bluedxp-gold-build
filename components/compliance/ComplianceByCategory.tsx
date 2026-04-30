"use client";

import { motion } from "framer-motion";
import { ComplianceDashboard, ComplianceCategory } from "@/types/compliance";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ComplianceByCategoryProps {
  dashboard: ComplianceDashboard;
}

export default function ComplianceByCategory({
  dashboard,
}: ComplianceByCategoryProps) {
  const data = dashboard.complianceByCategory
    ? Object.values(dashboard.complianceByCategory).map((category) => ({
        name: category.category.replace(/_/g, " "),
        score: category.complianceScore,
        compliant: category.compliant,
        nonCompliant: category.nonCompliant,
        atRisk: category.atRisk,
      }))
    : [];

  const getColor = (score: number) => {
    if (score >= 90) return "#22c55e"; // green-500
    if (score >= 70) return "#eab308"; // yellow-500
    return "#ef4444"; // red-500
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1f2937] border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-1">{label}</p>
          <p className="text-sm" style={{ color: getColor(payload[0].value) }}>
            Compliance: {payload[0].value.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
    >
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <i className="ri-bar-chart-box-line text-cyan-400"></i>
        Compliance by Category
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            fontSize={11}
            tick={{ fill: "#9ca3af" }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <YAxis
            tick={{ fill: "#9ca3af" }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="score" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Category Details */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboard.complianceByCategory &&
          Object.values(dashboard.complianceByCategory).map((category) => (
            <motion.div
              key={category.category}
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all"
            >
              <h3 className="font-medium text-white mb-3 text-sm">
                {category.category.replace(/_/g, " ")}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[#9ca3af]">Score:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      category.complianceScore >= 90
                        ? "bg-green-500/20 text-green-400"
                        : category.complianceScore >= 70
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {category.complianceScore.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#9ca3af]">Compliant:</span>
                  <span className="text-green-400 font-medium">
                    {category.compliant}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#9ca3af]">Non-Compliant:</span>
                  <span className="text-red-400 font-medium">
                    {category.nonCompliant}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#9ca3af]">At Risk:</span>
                  <span className="text-yellow-400 font-medium">
                    {category.atRisk}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
      </div>
    </motion.div>
  );
}

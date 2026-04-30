"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import PageTemplate from "@/components/PageTemplate";

interface QualityMetric {
  workCenter: string;
  inspectionRate: number;
  passRate: number;
  defectRate: number;
  reworkRate: number;
  firstPassYield: number;
}

interface QualityInspection {
  id: string;
  orderNumber: string;
  material: string;
  workCenter: string;
  inspectionDate: Date;
  status: "PASSED" | "FAILED" | "PENDING";
  defects: number;
  inspector: string;
}

export default function QualityControlPage() {
  const [qualityMetrics] = useState<QualityMetric[]>(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      workCenter: `WC-${i + 1}`,
      inspectionRate: 85 + Math.random() * 15,
      passRate: 90 + Math.random() * 10,
      defectRate: 2 + Math.random() * 3,
      reworkRate: 1 + Math.random() * 2,
      firstPassYield: 85 + Math.random() * 15,
    }));
  });

  const [inspections] = useState<QualityInspection[]>(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: `INS-${i + 1}`,
      orderNumber: `WO-${String(i + 1).padStart(6, "0")}`,
      material: `MAT-${String(i + 1).padStart(6, "0")}`,
      workCenter: `WC-${(i % 5) + 1}`,
      inspectionDate: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
      ),
      status: ["PASSED", "FAILED", "PENDING"][
        Math.floor(Math.random() * 3)
      ] as QualityInspection["status"],
      defects: Math.floor(Math.random() * 5),
      inspector: `Inspector-${(i % 5) + 1}`,
    }));
  });

  const chartData = useMemo(() => {
    return qualityMetrics.map((qm) => ({
      name: qm.workCenter,
      passRate: qm.passRate,
      defectRate: qm.defectRate,
      reworkRate: qm.reworkRate,
      firstPassYield: qm.firstPassYield,
    }));
  }, [qualityMetrics]);

  const stats = [
    {
      label: "Avg Pass Rate",
      value: `${(qualityMetrics.reduce((sum, qm) => sum + qm.passRate, 0) / qualityMetrics.length).toFixed(1)}%`,
      icon: "ri-shield-check-line",
      tooltip: "Average pass rate",
      trend: "up" as const,
    },
    {
      label: "Avg Defect Rate",
      value: `${(qualityMetrics.reduce((sum, qm) => sum + qm.defectRate, 0) / qualityMetrics.length).toFixed(2)}%`,
      icon: "ri-alert-line",
      tooltip: "Average defect rate",
      trend: "down" as const,
    },
    {
      label: "First Pass Yield",
      value: `${(qualityMetrics.reduce((sum, qm) => sum + qm.firstPassYield, 0) / qualityMetrics.length).toFixed(1)}%`,
      icon: "ri-checkbox-circle-line",
      tooltip: "First pass yield",
      trend: "up" as const,
    },
    {
      label: "Pending Inspections",
      value: inspections.filter((ins) => ins.status === "PENDING").length,
      icon: "ri-time-line",
      tooltip: "Pending inspections",
      trend: "neutral" as const,
    },
  ];

  return (
    <PageTemplate
      title="Quality Control"
      description="Manufacturing quality management, inspection tracking, defect analysis, and quality metrics"
      shortDescription="Quality control and inspection management"
      icon="ri-shield-check-line"
      stats={stats}
      actions={
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-2">
            <i className="ri-add-line"></i>
            <span className="hidden sm:inline">New Inspection</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Quality Metrics Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
            <i className="ri-bar-chart-box-line text-cyan-400 text-lg"></i>
            <span>Quality Metrics by Work Center</span>
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="passRate" fill="#10b981" name="Pass Rate %" />
              <Bar dataKey="defectRate" fill="#ef4444" name="Defect Rate %" />
              <Bar dataKey="reworkRate" fill="#f59e0b" name="Rework Rate %" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Inspections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
            <i className="ri-file-search-line text-cyan-400 text-lg"></i>
            <span>Recent Inspections</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Inspection ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Work Center
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Defects
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Inspector
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {inspections.slice(0, 15).map((ins, index) => (
                  <motion.tr
                    key={ins.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-white leading-tight">
                        {ins.id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {ins.orderNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {ins.material}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {ins.workCenter}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          ins.status === "PASSED"
                            ? "bg-green-500/20 text-green-400"
                            : ins.status === "FAILED"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {ins.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className={`text-sm leading-tight ${ins.defects > 0 ? "text-red-400" : "text-white"}`}
                      >
                        {ins.defects}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {ins.inspector}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {ins.inspectionDate.toLocaleDateString()}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </PageTemplate>
  );
}

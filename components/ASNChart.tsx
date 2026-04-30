"use client";

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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ASNData } from "@/types/asn";

interface ASNChartProps {
  data: ASNData[];
}

export default function ASNChart({ data }: ASNChartProps) {
  // Status distribution
  const statusData = data.reduce(
    (acc, asn) => {
      const status = asn.status || "pending";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const statusChartData = Object.entries(statusData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Supplier distribution
  const supplierData = data.reduce(
    (acc, asn) => {
      const supplier = asn.vendorName || "Unknown";
      acc[supplier] = (acc[supplier] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const supplierChartData = Object.entries(supplierData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Weight by status
  const weightByStatus = data.reduce(
    (acc, asn) => {
      const status = asn.status || "pending";
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status] += asn.totalWeight || 0;
      return acc;
    },
    {} as Record<string, number>,
  );

  const weightChartData = Object.entries(weightByStatus).map(
    ([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      weight: Math.round(value),
    }),
  );

  const COLORS = ["#06b6d4", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Status Distribution Pie Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1E293B] border border-[#334155] rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-6">
          Status Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {statusChartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Top Suppliers Bar Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1E293B] border border-[#334155] rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-6">Top Suppliers</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={supplierChartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis
              dataKey="name"
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af" }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Weight by Status Line Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:col-span-2"
      >
        <h3 className="text-lg font-semibold text-white mb-6">
          Total Weight by Status
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weightChartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
            <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#06b6d4"
              strokeWidth={3}
              dot={{ fill: "#06b6d4", r: 6 }}
              name="Weight (kg)"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

/**
 * Compliance & Risk Page
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiTrendingUp,
  FiBarChart,
  FiPieChart,
  FiActivity,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function CompliancePage() {
  const [metrics, setMetrics] = useState({
    averageScore: 85,
    compliant: 120,
    nonCompliant: 15,
    riskLevel: "LOW" as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  });

  const [trends, setTrends] = useState([
    { month: "Jan", score: 82, compliant: 100, nonCompliant: 20 },
    { month: "Feb", score: 84, compliant: 110, nonCompliant: 18 },
    { month: "Mar", score: 85, compliant: 120, nonCompliant: 15 },
  ]);

  const riskData = [
    { name: "Low Risk", value: 85, color: "#10B981" },
    { name: "Medium Risk", value: 10, color: "#F59E0B" },
    { name: "High Risk", value: 4, color: "#EF4444" },
    { name: "Critical", value: 1, color: "#DC2626" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-3">
            <FiShield className="text-cyan-400" />
            <span>Compliance & Risk Management</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Monitor compliance scores and risk levels
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <FiShield className="text-white text-xl" />
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Average Score</p>
              <p className="text-2xl font-bold text-green-400">
                {metrics.averageScore}%
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <FiCheckCircle className="text-white text-xl" />
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Compliant</p>
              <p className="text-2xl font-bold text-blue-400">
                {metrics.compliant}
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl">
                <FiAlertTriangle className="text-white text-xl" />
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Non-Compliant</p>
              <p className="text-2xl font-bold text-red-400">
                {metrics.nonCompliant}
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl">
                <FiActivity className="text-white text-xl" />
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Risk Level</p>
              <p className="text-2xl font-bold text-yellow-400">
                {metrics.riskLevel}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-4">Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-4">Compliance Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#10B981"
                  name="Score"
                />
                <Line
                  type="monotone"
                  dataKey="compliant"
                  stroke="#3B82F6"
                  name="Compliant"
                />
                <Line
                  type="monotone"
                  dataKey="nonCompliant"
                  stroke="#EF4444"
                  name="Non-Compliant"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

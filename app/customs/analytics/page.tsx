/**
 * Analytics & Reports Page
 */

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiBarChart,
  FiDownload,
  FiFilter,
  FiCalendar,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D" | "1Y">(
    "30D",
  );

  const declarationData = [
    { date: "Mon", submitted: 12, approved: 10, rejected: 2 },
    { date: "Tue", submitted: 15, approved: 13, rejected: 2 },
    { date: "Wed", submitted: 18, approved: 16, rejected: 2 },
    { date: "Thu", submitted: 14, approved: 12, rejected: 2 },
    { date: "Fri", submitted: 20, approved: 18, rejected: 2 },
    { date: "Sat", submitted: 8, approved: 7, rejected: 1 },
    { date: "Sun", submitted: 5, approved: 4, rejected: 1 },
  ];

  const countryData = [
    { country: "Egypt", declarations: 45, cleared: 40, pending: 5 },
    { country: "Saudi Arabia", declarations: 38, cleared: 35, pending: 3 },
    { country: "UAE", declarations: 32, cleared: 30, pending: 2 },
    { country: "Kuwait", declarations: 25, cleared: 23, pending: 2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3">
              <FiBarChart className="text-cyan-400" />
              <span>Analytics & Reports</span>
            </h1>
            <p className="text-gray-400 mt-1">
              Customs analytics and reporting
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500"
            >
              <option value="7D">Last 7 Days</option>
              <option value="30D">Last 30 Days</option>
              <option value="90D">Last 90 Days</option>
              <option value="1Y">Last Year</option>
            </select>
            <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg transition-all flex items-center space-x-2">
              <FiDownload className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-4">Weekly Declarations</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={declarationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                  }}
                />
                <Legend />
                <Bar dataKey="submitted" fill="#06B6D4" name="Submitted" />
                <Bar dataKey="approved" fill="#10B981" name="Approved" />
                <Bar dataKey="rejected" fill="#EF4444" name="Rejected" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-4">By Country</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="country" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                  }}
                />
                <Legend />
                <Bar dataKey="declarations" fill="#3B82F6" name="Total" />
                <Bar dataKey="cleared" fill="#10B981" name="Cleared" />
                <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

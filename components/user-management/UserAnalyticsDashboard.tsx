/**
 * 🚀 USER ANALYTICS DASHBOARD
 *
 * Comprehensive analytics dashboard for user management
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiActivity,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiClock,
  FiAlertCircle,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface UserAnalyticsDashboardProps {
  userId?: string;
  tenantId?: string;
  timeRange?: { start: Date; end: Date };
  className?: string;
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function UserAnalyticsDashboard({
  userId,
  tenantId,
  timeRange,
  className = "",
}: UserAnalyticsDashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [userId, tenantId, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const url = userId
        ? `/api/users/${userId}/analytics`
        : `/api/analytics/users?tenantId=${tenantId}`;

      const response = await fetch(url);
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div
        className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}
      >
        No analytics data available
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Users
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalUsers || 0}
              </p>
            </div>
            <FiUsers className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Active Sessions
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.activeSessions || 0}
              </p>
            </div>
            <FiActivity className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Permission Checks
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.permissionChecks || 0}
              </p>
            </div>
            <FiShield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Security Events
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.securityEvents || 0}
              </p>
            </div>
            <FiAlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Over Time */}
        {stats.activityOverTime && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Activity Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.activityOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="logins"
                  stroke="#3b82f6"
                  name="Logins"
                />
                <Line
                  type="monotone"
                  dataKey="permissionChecks"
                  stroke="#10b981"
                  name="Permission Checks"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Permission Usage */}
        {stats.permissionUsage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Permission Usage
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.permissionUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="permission" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="usageCount" fill="#3b82f6" name="Usage Count" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Role Distribution */}
        {stats.roleDistribution && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Role Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.roleDistribution.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Security Events */}
        {stats.securityEventsOverTime && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Security Events
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.securityEventsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="failedLogins"
                  stroke="#ef4444"
                  name="Failed Logins"
                />
                <Line
                  type="monotone"
                  dataKey="permissionDenials"
                  stroke="#f59e0b"
                  name="Permission Denials"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </div>
  );
}

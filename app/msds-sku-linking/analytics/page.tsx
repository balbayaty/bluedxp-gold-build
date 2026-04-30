"use client";

/**
 * MSDS-SKU Linking Analytics Dashboard
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import {
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
  LineChart,
  Line,
} from "recharts";

export default function LinkingAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // TODO: Load from API
      // For now, use mock data
      setAnalytics({
        totalLinks: 150,
        approvedLinks: 120,
        pendingLinks: 20,
        rejectedLinks: 10,
        statusDistribution: [
          { status: "Approved", count: 120 },
          { status: "Pending", count: 20 },
          { status: "Rejected", count: 10 },
        ],
        strategyDistribution: [
          { strategy: "CAS_NUMBER", count: 45 },
          { strategy: "PRODUCT_NAME", count: 35 },
          { strategy: "MANUAL", count: 30 },
          { strategy: "UN_NUMBER", count: 20 },
          { strategy: "CHEMICAL_FORMULA", count: 15 },
          { strategy: "MANUFACTURER", count: 5 },
        ],
        confidenceDistribution: [
          { range: "90-100%", count: 50 },
          { range: "80-89%", count: 40 },
          { range: "70-79%", count: 30 },
          { range: "60-69%", count: 20 },
          { range: "0-59%", count: 10 },
        ],
        approvalRate: 85,
        averageConfidence: 82,
        dataReuseRate: 75,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = [
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  const stats = analytics
    ? [
        {
          label: "Total Links",
          value: analytics.totalLinks,
          icon: "ri-link",
          trend: "up" as const,
        },
        {
          label: "Approval Rate",
          value: `${analytics.approvalRate}%`,
          icon: "ri-checkbox-circle-line",
          trend: "up" as const,
        },
        {
          label: "Avg Confidence",
          value: `${analytics.averageConfidence}%`,
          icon: "ri-bar-chart-line",
          trend: "up" as const,
        },
        {
          label: "Data Reuse Rate",
          value: `${analytics.dataReuseRate}%`,
          icon: "ri-repeat-line",
          trend: "up" as const,
        },
      ]
    : [];

  if (loading) {
    return (
      <PageTemplate
        title="Linking Analytics"
        description="Analytics and insights for MSDS-SKU linking"
        icon="ri-bar-chart-line"
      >
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading analytics...</p>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Linking Analytics"
      description="Analytics and insights for MSDS-SKU linking"
      icon="ri-bar-chart-line"
      stats={stats}
    >
      <div className="space-y-6">
        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count }) => `${status}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analytics.statusDistribution.map(
                  (entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ),
                )}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Strategy Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Matching Strategy Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.strategyDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="strategy"
                stroke="#9ca3af"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="count" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Confidence Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Confidence Score Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.confidenceDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </PageTemplate>
  );
}

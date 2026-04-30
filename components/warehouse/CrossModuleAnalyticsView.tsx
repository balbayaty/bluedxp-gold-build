/**
 * Cross-Module Analytics View Component
 * Integrated analytics across all modules
 * 4IR & 5IR Aligned • Modern UI • Deep Integration
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { warehouseCrossModuleAnalyticsIntegration } from "@/lib/services/wms/crossModuleAnalyticsIntegration";
import type { WarehouseCrossModuleAnalytics } from "@/lib/services/wms/crossModuleAnalyticsIntegration";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface CrossModuleAnalyticsViewProps {
  warehouseId: string;
}

export default function CrossModuleAnalyticsView({
  warehouseId,
}: CrossModuleAnalyticsViewProps) {
  const [analytics, setAnalytics] =
    useState<WarehouseCrossModuleAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [warehouseId]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const period = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };
      const data = await warehouseCrossModuleAnalyticsIntegration.getAnalytics(
        warehouseId,
        period,
      );
      setAnalytics(data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="ri-loader-4-line text-4xl text-cyan-400 animate-spin"></i>
      </div>
    );
  }

  if (!analytics) return null;

  const moduleData = [
    { name: "WMS", efficiency: analytics.modules.wms.accuracy },
    { name: "TMS", efficiency: analytics.modules.tms.onTimeDelivery },
    { name: "Finance", efficiency: analytics.overall.profitability },
    { name: "HR", efficiency: analytics.modules.hr.productivity },
    { name: "QHSE", efficiency: analytics.modules.qhse.safetyScore },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <i className="ri-bar-chart-box-line mr-3 text-cyan-400"></i>
          Cross-Module Analytics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
            <p className="text-sm text-gray-400 mb-1">Efficiency</p>
            <p className="text-3xl font-bold text-white">
              {analytics.overall.efficiency}%
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
            <p className="text-sm text-gray-400 mb-1">Profitability</p>
            <p className="text-3xl font-bold text-white">
              {analytics.overall.profitability}%
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/30">
            <p className="text-sm text-gray-400 mb-1">Safety</p>
            <p className="text-3xl font-bold text-white">
              {analytics.overall.safety}%
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
            <p className="text-sm text-gray-400 mb-1">Compliance</p>
            <p className="text-3xl font-bold text-white">
              {analytics.overall.compliance}%
            </p>
          </div>
        </div>

        {/* Module Efficiency Chart */}
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={moduleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                }}
              />
              <Bar dataKey="efficiency" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Module Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* WMS */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h3 className="text-white font-medium mb-3">WMS</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Orders Processed</span>
              <span className="text-white">
                {analytics.modules.wms.ordersProcessed}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Inventory Turns</span>
              <span className="text-white">
                {analytics.modules.wms.inventoryTurns}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Accuracy</span>
              <span className="text-white">
                {analytics.modules.wms.accuracy}%
              </span>
            </div>
          </div>
        </div>

        {/* TMS */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h3 className="text-white font-medium mb-3">TMS</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Shipments</span>
              <span className="text-white">
                {analytics.modules.tms.shipmentsOutbound}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Transit</span>
              <span className="text-white">
                {analytics.modules.tms.averageTransitTime} days
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">On-Time Delivery</span>
              <span className="text-white">
                {analytics.modules.tms.onTimeDelivery}%
              </span>
            </div>
          </div>
        </div>

        {/* Finance */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h3 className="text-white font-medium mb-3">Finance</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Costs</span>
              <span className="text-white">
                ${(analytics.modules.finance.totalCosts / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Revenue</span>
              <span className="text-white">
                ${(analytics.modules.finance.totalRevenue / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Profit</span>
              <span className="text-green-400">
                ${(analytics.modules.finance.profit / 1000).toFixed(0)}K
              </span>
            </div>
          </div>
        </div>

        {/* HR */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h3 className="text-white font-medium mb-3">HR</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Utilization</span>
              <span className="text-white">
                {analytics.modules.hr.workforceUtilization}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Productivity</span>
              <span className="text-white">
                {analytics.modules.hr.productivity}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Attendance</span>
              <span className="text-white">
                {analytics.modules.hr.attendance}%
              </span>
            </div>
          </div>
        </div>

        {/* QHSE */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h3 className="text-white font-medium mb-3">QHSE</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Safety Score</span>
              <span className="text-white">
                {analytics.modules.qhse.safetyScore}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Compliance</span>
              <span className="text-white">
                {analytics.modules.qhse.complianceScore}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Incidents</span>
              <span className="text-white">
                {analytics.modules.qhse.incidents}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

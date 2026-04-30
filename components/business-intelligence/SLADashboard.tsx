"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useViewContext } from "@/contexts/ViewContextProvider";
import { CustomerSLA } from "@/types/asn";
import { generateMultiTenantCustomers } from "@/utils/mockDataGenerators";
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
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";
import { format } from "date-fns";

interface SLADashboardProps {
  customers?: any[];
  slas?: CustomerSLA[];
  className?: string;
}

export default function SLADashboard({
  customers,
  slas = [],
  className = "",
}: SLADashboardProps) {
  const { context } = useViewContext();
  const [viewMode, setViewMode] = useState<
    "overview" | "compliance" | "performance" | "trends"
  >("overview");

  // Generate customers if not provided
  const customerData = useMemo(() => {
    return customers || generateMultiTenantCustomers(20);
  }, [customers]);

  // Filter customers based on view context
  const filteredCustomers = useMemo(() => {
    if (context.customerFilter.type === "ALL") return customerData;
    if (context.customerFilter.type === "ASSIGNED") {
      return customerData.filter((c) =>
        context.customerFilter.customerIds?.includes(c.id),
      );
    }
    if (
      context.customerFilter.type === "SINGLE" ||
      context.customerFilter.type === "MULTIPLE"
    ) {
      return customerData.filter((c) =>
        context.customerFilter.customerIds?.includes(c.id),
      );
    }
    return customerData;
  }, [customerData, context.customerFilter]);

  // SLA Compliance Data
  const slaComplianceData = useMemo(() => {
    return filteredCustomers
      .map((customer) => ({
        name: customer.customerName.substring(0, 15),
        compliance: customer.metrics.slaComplianceRate,
        target: customer.serviceLevel.slaComplianceTarget,
        tier: customer.serviceTier,
        health: customer.healthScore,
        orders: customer.metrics.totalOrders,
      }))
      .sort((a, b) => b.compliance - a.compliance);
  }, [filteredCustomers]);

  // Compliance by Tier
  const complianceByTier = useMemo(() => {
    const tiers = ["PLATINUM", "GOLD", "SILVER", "BRONZE", "STANDARD"];
    return tiers
      .map((tier) => {
        const tierCustomers = filteredCustomers.filter(
          (c) => c.serviceTier === tier,
        );
        const avgCompliance =
          tierCustomers.length > 0
            ? tierCustomers.reduce(
                (sum, c) => sum + c.metrics.slaComplianceRate,
                0,
              ) / tierCustomers.length
            : 0;
        const target =
          tierCustomers.length > 0
            ? tierCustomers[0].serviceLevel.slaComplianceTarget
            : 0;

        return {
          tier,
          compliance: avgCompliance,
          target,
          count: tierCustomers.length,
          met: avgCompliance >= target,
        };
      })
      .filter((item) => item.count > 0);
  }, [filteredCustomers]);

  // Performance Trends (mock data - in production would come from historical data)
  const performanceTrends = useMemo(() => {
    const days = 30;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      return {
        date: format(date, "MMM dd"),
        compliance: 90 + Math.random() * 8,
        target: 95,
        orders: Math.floor(Math.random() * 100) + 50,
      };
    });
  }, []);

  // At-Risk SLAs
  const atRiskSLAs = useMemo(() => {
    return filteredCustomers
      .filter(
        (c) => c.metrics.slaComplianceRate < c.serviceLevel.slaComplianceTarget,
      )
      .sort((a, b) => a.metrics.slaComplianceRate - b.metrics.slaComplianceRate)
      .slice(0, 10);
  }, [filteredCustomers]);

  const COLORS = {
    PLATINUM: "#8b5cf6",
    GOLD: "#f59e0b",
    SILVER: "#6b7280",
    BRONZE: "#92400e",
    STANDARD: "#374151",
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* View Mode Selector */}
      <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
        {(["overview", "compliance", "performance", "trends"] as const).map(
          (mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2 min-h-[36px] ${
                viewMode === mode
                  ? "bg-cyan-500 text-white"
                  : "text-[#9ca3af] hover:text-white hover:bg-white/5"
              }`}
              aria-label={`View ${mode} mode`}
            >
              <i
                className={`ri-${mode === "overview" ? "dashboard-line" : mode === "compliance" ? "check-line" : mode === "performance" ? "line-chart-line" : "trending-up-line"} text-sm sm:text-base`}
              ></i>
              <span className="hidden sm:inline">
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </span>
            </button>
          ),
        )}
      </div>

      {/* Overview View */}
      {viewMode === "overview" && (
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-pie-chart-line text-cyan-400 text-lg"></i>
              <span>SLA Compliance by Service Tier</span>
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={complianceByTier}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="tier" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar
                  dataKey="compliance"
                  fill="#06b6d4"
                  name="Actual Compliance %"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target %"
                />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-bar-chart-box-line text-cyan-400 text-lg"></i>
              <span>Top Performers</span>
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={slaComplianceData.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#9ca3af"
                  fontSize={12}
                  width={120}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar
                  dataKey="compliance"
                  fill="#10b981"
                  name="SLA Compliance %"
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Compliance View */}
      {viewMode === "compliance" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-check-line text-cyan-400 text-lg"></i>
              <span>SLA Compliance Analysis</span>
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={slaComplianceData.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar
                  dataKey="compliance"
                  fill="#06b6d4"
                  name="Actual Compliance %"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target %"
                />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>

          {/* At-Risk SLAs Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-error-warning-line text-red-400 text-lg"></i>
              <span>At-Risk SLAs (Below Target)</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Service Tier
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Actual
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Gap
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Health Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {atRiskSLAs.map((customer, index) => {
                    const gap =
                      customer.serviceLevel.slaComplianceTarget -
                      customer.metrics.slaComplianceRate;
                    return (
                      <motion.tr
                        key={customer.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-white leading-tight">
                            {customer.customerName}
                          </div>
                          <div className="text-xs text-[#9ca3af] mt-0.5 leading-normal">
                            {customer.customerNumber}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              customer.serviceTier === "PLATINUM"
                                ? "bg-purple-500/20 text-purple-400"
                                : customer.serviceTier === "GOLD"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {customer.serviceTier}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-white leading-tight">
                            {customer.serviceLevel.slaComplianceTarget.toFixed(
                              1,
                            )}
                            %
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-white font-medium leading-tight">
                            {customer.metrics.slaComplianceRate.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-sm font-medium ${gap > 0 ? "text-red-400" : "text-green-400"}`}
                          >
                            {gap > 0
                              ? `-${gap.toFixed(1)}%`
                              : `+${Math.abs(gap).toFixed(1)}%`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full ${
                                  customer.healthScore >= 90
                                    ? "bg-green-500"
                                    : customer.healthScore >= 75
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${customer.healthScore}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-white w-12 text-right">
                              {customer.healthScore.toFixed(0)}
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {/* Performance View */}
      {viewMode === "performance" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-line-chart-line text-cyan-400 text-lg"></i>
              <span>Performance Metrics</span>
            </h3>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1.5 leading-normal">
                  Average Compliance
                </div>
                <div className="text-2xl font-bold text-white leading-none mb-1">
                  {(
                    slaComplianceData.reduce(
                      (sum, c) => sum + c.compliance,
                      0,
                    ) / slaComplianceData.length || 0
                  ).toFixed(1)}
                  %
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1.5 leading-normal">
                  Customers Meeting Target
                </div>
                <div className="text-2xl font-bold text-white leading-none mb-1">
                  {
                    slaComplianceData.filter((c) => c.compliance >= c.target)
                      .length
                  }{" "}
                  / {slaComplianceData.length}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1.5 leading-normal">
                  At-Risk Customers
                </div>
                <div className="text-2xl font-bold text-red-400 leading-none mb-1">
                  {atRiskSLAs.length}
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={slaComplianceData.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="compliance" fill="#06b6d4" name="Compliance %" />
                <Bar dataKey="health" fill="#10b981" name="Health Score" />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target"
                />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Trends View */}
      {viewMode === "trends" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-trending-up-line text-cyan-400 text-lg"></i>
              <span>SLA Compliance Trends (Last 30 Days)</span>
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={performanceTrends}>
                <defs>
                  <linearGradient
                    id="colorCompliance"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Area
                  type="monotone"
                  dataKey="compliance"
                  stroke="#06b6d4"
                  fillOpacity={1}
                  fill="url(#colorCompliance)"
                  name="Compliance %"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target %"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}
    </div>
  );
}

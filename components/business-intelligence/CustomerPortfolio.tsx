"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useViewContext } from "@/contexts/ViewContextProvider";
import { Customer } from "@/types/tenant";
import {
  BarChart,
  Bar,
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
  Line,
  LineChart,
} from "recharts";
import { format } from "date-fns";

interface CustomerPortfolioProps {
  customers: Customer[];
  className?: string;
}

export default function CustomerPortfolio({
  customers,
  className = "",
}: CustomerPortfolioProps) {
  const { context } = useViewContext();

  // Filter customers based on view context
  const filteredCustomers = useMemo(() => {
    if (context.customerFilter.type === "ALL") return customers;
    if (context.customerFilter.type === "ASSIGNED") {
      return customers.filter((c) =>
        context.customerFilter.customerIds?.includes(c.id),
      );
    }
    if (
      context.customerFilter.type === "SINGLE" ||
      context.customerFilter.type === "MULTIPLE"
    ) {
      return customers.filter((c) =>
        context.customerFilter.customerIds?.includes(c.id),
      );
    }
    return customers;
  }, [customers, context.customerFilter]);

  // Service Tier Distribution
  const tierDistribution = useMemo(() => {
    const tiers = ["PLATINUM", "GOLD", "SILVER", "BRONZE", "STANDARD"];
    return tiers
      .map((tier) => {
        const tierCustomers = filteredCustomers.filter(
          (c) => c.serviceTier === tier,
        );
        return {
          tier,
          count: tierCustomers.length,
          revenue: tierCustomers.reduce((sum, c) => sum + c.monthlyRevenue, 0),
          avgHealth:
            tierCustomers.length > 0
              ? tierCustomers.reduce((sum, c) => sum + c.healthScore, 0) /
                tierCustomers.length
              : 0,
          avgSLA:
            tierCustomers.length > 0
              ? tierCustomers.reduce(
                  (sum, c) => sum + c.metrics.slaComplianceRate,
                  0,
                ) / tierCustomers.length
              : 0,
        };
      })
      .filter((item) => item.count > 0);
  }, [filteredCustomers]);

  // Top Customers by Revenue
  const topCustomersByRevenue = useMemo(() => {
    return filteredCustomers
      .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
      .slice(0, 10)
      .map((customer) => ({
        name: customer.customerName.substring(0, 15),
        revenue: customer.monthlyRevenue,
        orders: customer.metrics.totalOrders,
        health: customer.healthScore,
        sla: customer.metrics.slaComplianceRate,
        tier: customer.serviceTier,
      }));
  }, [filteredCustomers]);

  // Customer Health Distribution
  const healthDistribution = useMemo(() => {
    const ranges = [
      { range: "90-100", min: 90, max: 100, label: "Excellent" },
      { range: "75-90", min: 75, max: 90, label: "Good" },
      { range: "60-75", min: 60, max: 75, label: "Fair" },
      { range: "0-60", min: 0, max: 60, label: "Poor" },
    ];

    return ranges.map((range) => ({
      range: range.label,
      count: filteredCustomers.filter(
        (c) => c.healthScore >= range.min && c.healthScore < range.max,
      ).length,
      revenue: filteredCustomers
        .filter((c) => c.healthScore >= range.min && c.healthScore < range.max)
        .reduce((sum, c) => sum + c.monthlyRevenue, 0),
    }));
  }, [filteredCustomers]);

  // Churn Risk Distribution
  const churnRiskDistribution = useMemo(() => {
    const risks = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
    return risks.map((risk) => ({
      risk,
      count: filteredCustomers.filter((c) => c.churnRisk === risk).length,
      revenue: filteredCustomers
        .filter((c) => c.churnRisk === risk)
        .reduce((sum, c) => sum + c.monthlyRevenue, 0),
    }));
  }, [filteredCustomers]);

  // Portfolio Metrics
  const portfolioMetrics = useMemo(() => {
    const totalCustomers = filteredCustomers.length;
    const totalRevenue = filteredCustomers.reduce(
      (sum, c) => sum + c.monthlyRevenue,
      0,
    );
    const avgHealth =
      filteredCustomers.length > 0
        ? filteredCustomers.reduce((sum, c) => sum + c.healthScore, 0) /
          filteredCustomers.length
        : 0;
    const avgSLA =
      filteredCustomers.length > 0
        ? filteredCustomers.reduce(
            (sum, c) => sum + c.metrics.slaComplianceRate,
            0,
          ) / filteredCustomers.length
        : 0;
    const atRiskCount = filteredCustomers.filter(
      (c) => c.churnRisk === "HIGH" || c.churnRisk === "CRITICAL",
    ).length;

    return {
      totalCustomers,
      totalRevenue,
      avgHealth,
      avgSLA,
      atRiskCount,
      atRiskPercentage: (atRiskCount / totalCustomers) * 100,
    };
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
      {/* Portfolio Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">Total Customers</div>
          <div className="text-2xl font-bold text-white">
            {portfolioMetrics.totalCustomers}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-white">
            AED {portfolioMetrics.totalRevenue.toLocaleString()}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">Avg Health Score</div>
          <div className="text-2xl font-bold text-white">
            {portfolioMetrics.avgHealth.toFixed(1)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">At Risk</div>
          <div className="text-2xl font-bold text-white">
            {portfolioMetrics.atRiskCount}
          </div>
          <div className="text-xs text-[#6b7280] mt-1">
            {portfolioMetrics.atRiskPercentage.toFixed(1)}% of portfolio
          </div>
        </motion.div>
      </div>

      {/* Service Tier Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-pie-chart-line text-cyan-400 text-lg"></i>
          <span>Service Tier Distribution</span>
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tierDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ tier, count }) => `${tier}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {tierDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.tier as keyof typeof COLORS]}
                  />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tierDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="tier" stroke="#9ca3af" fontSize={12} />
              <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#9ca3af"
                fontSize={12}
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
                yAxisId="left"
                dataKey="count"
                fill="#06b6d4"
                name="Customer Count"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={3}
                name="Revenue (AED)"
              />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Top Customers by Revenue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-bar-chart-box-line text-cyan-400 text-lg"></i>
          <span>Top Customers by Revenue</span>
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topCustomersByRevenue} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" stroke="#9ca3af" fontSize={12} />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#9ca3af"
              fontSize={12}
              width={150}
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
              dataKey="revenue"
              fill="#06b6d4"
              name="Monthly Revenue (AED)"
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Customer Health Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-heart-pulse-line text-cyan-400 text-lg"></i>
          <span>Customer Health Distribution</span>
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={healthDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="range" stroke="#9ca3af" fontSize={12} />
            <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#9ca3af"
              fontSize={12}
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
              yAxisId="left"
              dataKey="count"
              fill="#06b6d4"
              name="Customer Count"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={3}
              name="Revenue (AED)"
            />
            <Legend />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Churn Risk Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-alert-line text-red-400 text-lg"></i>
          <span>Churn Risk Distribution</span>
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={churnRiskDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="risk" stroke="#9ca3af" fontSize={12} />
            <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#9ca3af"
              fontSize={12}
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
              yAxisId="left"
              dataKey="count"
              fill="#ef4444"
              name="Customer Count"
            />
            <Bar
              yAxisId="right"
              dataKey="revenue"
              fill="#f59e0b"
              name="Revenue at Risk (AED)"
            />
            <Legend />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

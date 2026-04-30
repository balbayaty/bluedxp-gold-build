"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useViewContext } from "@/contexts/ViewContextProvider";
import { Customer } from "@/types/tenant";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

interface RevenueAnalyticsProps {
  customers: Customer[];
  className?: string;
}

export default function RevenueAnalytics({
  customers,
  className = "",
}: RevenueAnalyticsProps) {
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

  // Revenue by Service Tier
  const revenueByTier = useMemo(() => {
    const tiers = ["PLATINUM", "GOLD", "SILVER", "BRONZE", "STANDARD"];
    return tiers
      .map((tier) => {
        const tierCustomers = filteredCustomers.filter(
          (c) => c.serviceTier === tier,
        );
        const totalRevenue = tierCustomers.reduce(
          (sum, c) => sum + c.monthlyRevenue,
          0,
        );
        const avgRevenue =
          tierCustomers.length > 0 ? totalRevenue / tierCustomers.length : 0;
        const estimatedCosts = totalRevenue * 0.6; // 60% cost assumption
        const profit = totalRevenue - estimatedCosts;
        const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

        return {
          tier,
          count: tierCustomers.length,
          totalRevenue,
          avgRevenue,
          costs: estimatedCosts,
          profit,
          margin,
        };
      })
      .filter((item) => item.count > 0);
  }, [filteredCustomers]);

  // Top Revenue Customers
  const topRevenueCustomers = useMemo(() => {
    return filteredCustomers
      .map((customer) => {
        const estimatedCosts = customer.monthlyRevenue * 0.6;
        const profit = customer.monthlyRevenue - estimatedCosts;
        const margin = (profit / customer.monthlyRevenue) * 100;

        return {
          name: customer.customerName.substring(0, 15),
          revenue: customer.monthlyRevenue,
          costs: estimatedCosts,
          profit,
          margin,
          orders: customer.metrics.totalOrders,
          tier: customer.serviceTier,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);
  }, [filteredCustomers]);

  // Revenue Trends (mock - in production would come from historical data)
  const revenueTrends = useMemo(() => {
    const days = 30;
    const baseRevenue =
      filteredCustomers.reduce((sum, c) => sum + c.monthlyRevenue, 0) / 30;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      const variation = 0.8 + Math.random() * 0.4; // 80-120% variation
      return {
        date: format(date, "MMM dd"),
        revenue: baseRevenue * variation,
        orders: Math.floor(Math.random() * 50) + 20,
      };
    });
  }, [filteredCustomers]);

  // Profitability Analysis
  const profitabilityData = useMemo(() => {
    return filteredCustomers
      .map((customer) => {
        const estimatedCosts = customer.monthlyRevenue * 0.6;
        const profit = customer.monthlyRevenue - estimatedCosts;
        const margin = (profit / customer.monthlyRevenue) * 100;

        return {
          name: customer.customerName.substring(0, 15),
          revenue: customer.monthlyRevenue,
          costs: estimatedCosts,
          profit,
          margin,
          tier: customer.serviceTier,
        };
      })
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 20);
  }, [filteredCustomers]);

  // Overall Metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredCustomers.reduce(
      (sum, c) => sum + c.monthlyRevenue,
      0,
    );
    const totalCosts = totalRevenue * 0.6;
    const totalProfit = totalRevenue - totalCosts;
    const overallMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const avgRevenuePerCustomer =
      filteredCustomers.length > 0
        ? totalRevenue / filteredCustomers.length
        : 0;

    return {
      totalRevenue,
      totalCosts,
      totalProfit,
      overallMargin,
      avgRevenuePerCustomer,
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
      {/* Revenue Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-white">
            AED {metrics.totalRevenue.toLocaleString()}
          </div>
          <div className="text-xs text-[#6b7280] mt-1">Monthly</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">Total Profit</div>
          <div className="text-2xl font-bold text-white">
            AED {metrics.totalProfit.toLocaleString()}
          </div>
          <div className="text-xs text-[#6b7280] mt-1">Monthly</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">Profit Margin</div>
          <div className="text-2xl font-bold text-white">
            {metrics.overallMargin.toFixed(1)}%
          </div>
          <div className="text-xs text-[#6b7280] mt-1">Overall</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">
            Avg Revenue/Customer
          </div>
          <div className="text-2xl font-bold text-white">
            AED {metrics.avgRevenuePerCustomer.toLocaleString()}
          </div>
          <div className="text-xs text-[#6b7280] mt-1">Per month</div>
        </motion.div>
      </div>

      {/* Revenue by Tier */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-money-dollar-circle-line text-cyan-400 text-lg"></i>
          <span>Revenue by Service Tier</span>
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={revenueByTier}>
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
              dataKey="totalRevenue"
              fill="#06b6d4"
              name="Total Revenue (AED)"
            />
            <Bar
              yAxisId="left"
              dataKey="costs"
              fill="#ef4444"
              name="Estimated Costs (AED)"
            />
            <Bar
              yAxisId="left"
              dataKey="profit"
              fill="#10b981"
              name="Profit (AED)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="margin"
              stroke="#f59e0b"
              strokeWidth={3}
              name="Margin %"
            />
            <Legend />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Revenue Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-line-chart-line text-cyan-400 text-lg"></i>
          <span>Revenue Trends (Last 30 Days)</span>
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={revenueTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
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
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              fill="#06b6d4"
              fillOpacity={0.3}
              stroke="#06b6d4"
              name="Daily Revenue (AED)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="orders"
              stroke="#10b981"
              strokeWidth={2}
              name="Orders"
            />
            <Legend />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Top Revenue Customers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-bar-chart-box-line text-cyan-400 text-lg"></i>
          <span>Top Revenue Customers</span>
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topRevenueCustomers} layout="vertical">
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

      {/* Profitability Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-line-chart-line text-cyan-400 text-lg"></i>
          <span>Customer Profitability Analysis</span>
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={profitabilityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              stroke="#9ca3af"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
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
              dataKey="revenue"
              fill="#06b6d4"
              name="Revenue (AED)"
            />
            <Bar
              yAxisId="left"
              dataKey="costs"
              fill="#ef4444"
              name="Costs (AED)"
            />
            <Bar
              yAxisId="left"
              dataKey="profit"
              fill="#10b981"
              name="Profit (AED)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="margin"
              stroke="#f59e0b"
              strokeWidth={3}
              name="Margin %"
            />
            <Legend />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

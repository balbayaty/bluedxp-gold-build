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
} from "recharts";
import { format } from "date-fns";

interface ChurnRiskIndicatorProps {
  customers: Customer[];
  className?: string;
}

export default function ChurnRiskIndicator({
  customers,
  className = "",
}: ChurnRiskIndicatorProps) {
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

  // Churn Risk Distribution
  const churnRiskData = useMemo(() => {
    const risks = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
    return risks.map((risk) => {
      const riskCustomers = filteredCustomers.filter(
        (c) => c.churnRisk === risk,
      );
      return {
        risk,
        count: riskCustomers.length,
        revenue: riskCustomers.reduce((sum, c) => sum + c.monthlyRevenue, 0),
        avgHealth:
          riskCustomers.length > 0
            ? riskCustomers.reduce((sum, c) => sum + c.healthScore, 0) /
              riskCustomers.length
            : 0,
        avgSLA:
          riskCustomers.length > 0
            ? riskCustomers.reduce(
                (sum, c) => sum + c.metrics.slaComplianceRate,
                0,
              ) / riskCustomers.length
            : 0,
      };
    });
  }, [filteredCustomers]);

  // At-Risk Customers
  const atRiskCustomers = useMemo(() => {
    return filteredCustomers
      .filter((c) => c.churnRisk === "HIGH" || c.churnRisk === "CRITICAL")
      .sort((a, b) => {
        const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return riskOrder[a.churnRisk] - riskOrder[b.churnRisk];
      })
      .slice(0, 20)
      .map((customer) => ({
        name: customer.customerName.substring(0, 20),
        risk: customer.churnRisk,
        health: customer.healthScore,
        sla: customer.metrics.slaComplianceRate,
        revenue: customer.monthlyRevenue,
        orders: customer.metrics.totalOrders,
        daysSinceLastOrder: customer.metrics.daysSinceLastOrder,
        satisfaction: customer.satisfactionScore || 0,
      }));
  }, [filteredCustomers]);

  // Risk Factors Analysis
  const riskFactors = useMemo(() => {
    const highRiskCustomers = filteredCustomers.filter(
      (c) => c.churnRisk === "HIGH" || c.churnRisk === "CRITICAL",
    );

    return {
      lowHealthScore: highRiskCustomers.filter((c) => c.healthScore < 60)
        .length,
      lowSLA: highRiskCustomers.filter(
        (c) => c.metrics.slaComplianceRate < c.serviceLevel.slaComplianceTarget,
      ).length,
      lowSatisfaction: highRiskCustomers.filter(
        (c) => (c.satisfactionScore || 0) < 70,
      ).length,
      lowOrderVolume: highRiskCustomers.filter(
        (c) => c.metrics.totalOrders < 10,
      ).length,
      longTimeSinceOrder: highRiskCustomers.filter(
        (c) => (c.metrics.daysSinceLastOrder || 0) > 30,
      ).length,
    };
  }, [filteredCustomers]);

  // Risk Trends (mock - in production would come from historical data)
  const riskTrends = useMemo(() => {
    const days = 30;
    const baseRiskCount = filteredCustomers.filter(
      (c) => c.churnRisk === "HIGH" || c.churnRisk === "CRITICAL",
    ).length;

    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      const variation = 0.9 + Math.random() * 0.2; // 90-110% variation
      return {
        date: format(date, "MMM dd"),
        atRisk: Math.floor(baseRiskCount * variation),
        critical: Math.floor(baseRiskCount * variation * 0.3),
        high: Math.floor(baseRiskCount * variation * 0.7),
      };
    });
  }, [filteredCustomers]);

  // Overall Metrics
  const metrics = useMemo(() => {
    const totalCustomers = filteredCustomers.length;
    const atRiskCount = filteredCustomers.filter(
      (c) => c.churnRisk === "HIGH" || c.churnRisk === "CRITICAL",
    ).length;
    const atRiskRevenue = filteredCustomers
      .filter((c) => c.churnRisk === "HIGH" || c.churnRisk === "CRITICAL")
      .reduce((sum, c) => sum + c.monthlyRevenue, 0);
    const totalRevenue = filteredCustomers.reduce(
      (sum, c) => sum + c.monthlyRevenue,
      0,
    );

    return {
      totalCustomers,
      atRiskCount,
      atRiskPercentage: (atRiskCount / totalCustomers) * 100,
      atRiskRevenue,
      atRiskRevenuePercentage: (atRiskRevenue / totalRevenue) * 100,
    };
  }, [filteredCustomers]);

  const COLORS = {
    CRITICAL: "#ef4444",
    HIGH: "#f59e0b",
    MEDIUM: "#eab308",
    LOW: "#10b981",
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Risk Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">At-Risk Customers</div>
          <div className="text-2xl font-bold text-white">
            {metrics.atRiskCount}
          </div>
          <div className="text-xs text-[#6b7280] mt-1">
            {metrics.atRiskPercentage.toFixed(1)}% of portfolio
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">Revenue at Risk</div>
          <div className="text-2xl font-bold text-white">
            AED {metrics.atRiskRevenue.toLocaleString()}
          </div>
          <div className="text-xs text-[#6b7280] mt-1">
            {metrics.atRiskRevenuePercentage.toFixed(1)}% of total
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">Critical Risk</div>
          <div className="text-2xl font-bold text-red-400">
            {filteredCustomers.filter((c) => c.churnRisk === "CRITICAL").length}
          </div>
          <div className="text-xs text-[#6b7280] mt-1">Customers</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">High Risk</div>
          <div className="text-2xl font-bold text-orange-400">
            {filteredCustomers.filter((c) => c.churnRisk === "HIGH").length}
          </div>
          <div className="text-xs text-[#6b7280] mt-1">Customers</div>
        </motion.div>
      </div>

      {/* Churn Risk Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-pie-chart-line text-cyan-400 text-lg"></i>
          <span>Churn Risk Distribution</span>
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={churnRiskData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ risk, count }) => `${risk}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {churnRiskData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.risk as keyof typeof COLORS]}
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
            <BarChart data={churnRiskData}>
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
        </div>
      </motion.div>

      {/* Risk Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-line-chart-line text-cyan-400 text-lg"></i>
          <span>Risk Trends (Last 30 Days)</span>
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={riskTrends}>
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
            <Bar dataKey="atRisk" fill="#ef4444" name="Total At-Risk" />
            <Line
              type="monotone"
              dataKey="critical"
              stroke="#dc2626"
              strokeWidth={2}
              name="Critical"
            />
            <Line
              type="monotone"
              dataKey="high"
              stroke="#f59e0b"
              strokeWidth={2}
              name="High"
            />
            <Legend />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Risk Factors */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-alert-line text-red-400 text-lg"></i>
          <span>Risk Factors Analysis</span>
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-xs text-[#9ca3af] mb-1">Low Health Score</div>
            <div className="text-2xl font-bold text-white">
              {riskFactors.lowHealthScore}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-xs text-[#9ca3af] mb-1">Low SLA</div>
            <div className="text-2xl font-bold text-white">
              {riskFactors.lowSLA}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-xs text-[#9ca3af] mb-1">Low Satisfaction</div>
            <div className="text-2xl font-bold text-white">
              {riskFactors.lowSatisfaction}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-xs text-[#9ca3af] mb-1">Low Order Volume</div>
            <div className="text-2xl font-bold text-white">
              {riskFactors.lowOrderVolume}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-xs text-[#9ca3af] mb-1">
              Long Time Since Order
            </div>
            <div className="text-2xl font-bold text-white">
              {riskFactors.longTimeSinceOrder}
            </div>
          </div>
        </div>
      </motion.div>

      {/* At-Risk Customers Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-error-warning-line text-red-400 text-lg"></i>
          <span>High & Critical Risk Customers</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Risk Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Health Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  SLA Compliance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Revenue
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Days Since Order
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {atRiskCustomers.map((customer, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-white">
                      {customer.name}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        customer.risk === "CRITICAL"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      }`}
                    >
                      {customer.risk}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${
                            customer.health >= 90
                              ? "bg-green-500"
                              : customer.health >= 75
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${customer.health}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-white w-12 text-right">
                        {customer.health.toFixed(0)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-white">
                      {customer.sla.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-white font-medium">
                      AED {customer.revenue.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-white">
                      {customer.daysSinceLastOrder}
                    </div>
                    <div className="text-xs text-[#6b7280]">days</div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

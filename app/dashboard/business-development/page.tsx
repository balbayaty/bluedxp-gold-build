"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useViewContext } from "@/contexts/ViewContextProvider";
import { Customer } from "@/types/tenant";
import { format } from "date-fns";
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
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";
import PageTemplate from "@/components/PageTemplate";
import CustomerSelector from "@/components/multi-tenant/CustomerSelector";
import ViewScopeSelector from "@/components/role-based/ViewScopeSelector";
import SLADashboard from "@/components/business-intelligence/SLADashboard";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import CurrencyDisplay from "@/components/CurrencyDisplay";

export default function BusinessDevelopmentDashboard() {
  const { user, tenant } = useAuth();
  const { context } = useViewContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    atRiskCustomers: 0,
    totalRevenue: 0,
    mrr: 0,
    averageRevenue: 0,
    averageSLA: 0,
    pipelineValue: 0,
    activeOpportunities: 0,
    profitability: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [viewMode, setViewMode] = useState<
    "overview" | "revenue" | "sla" | "churn" | "profitability"
  >("overview");

  useEffect(() => {
    async function loadBusinessDevelopmentData() {
      const targetTenant = user?.tenantId || "tenant-1";
      setLoading(true);
      try {
        const response = await fetch(
          `/api/dashboards/business-development?tenantId=${targetTenant}`,
        );
        const result = await response.json();

        if (result.success && result.data) {
          setCustomers(result.data.customers || []);
          setMetrics(result.data.metrics || {
            totalCustomers: 0,
            activeCustomers: 0,
            atRiskCustomers: 0,
            totalRevenue: 0,
            mrr: 0,
            averageRevenue: 0,
            averageSLA: 0,
            pipelineValue: 0,
            activeOpportunities: 0,
            profitability: 0,
          });
        } else {
          console.error("API returned error:", result.error);
        }
      } catch (error) {
        console.error("Failed to load business development data:", error);
        // Set empty data on error
        setCustomers([]);
        setMetrics({
          totalCustomers: 0,
          activeCustomers: 0,
          atRiskCustomers: 0,
          totalRevenue: 0,
          mrr: 0,
          averageRevenue: 0,
          averageSLA: 0,
          pipelineValue: 0,
          activeOpportunities: 0,
          profitability: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    loadBusinessDevelopmentData();
  }, [user?.tenantId]);

  // Filter customers based on view context
  const filteredCustomers = useMemo(() => {
    if (context.customerFilter.type === "ALL") return customers;
    if (context.customerFilter.type === "ASSIGNED") {
      return customers.filter((c) => user?.assignedCustomers?.includes(c.id));
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
  }, [customers, context.customerFilter, user?.assignedCustomers]);

  // Key Metrics (using fetched metrics with local calculations)
  const dashboardMetrics = useMemo(() => {
    const totalCustomers = filteredCustomers.length || metrics.totalCustomers;
    const activeCustomers = filteredCustomers.filter(
      (c) => c.status === "ACTIVE",
    ).length || metrics.activeCustomers;
    const atRiskCustomers = filteredCustomers.filter(
      (c) => c.churnRisk === "HIGH" || c.churnRisk === "CRITICAL",
    ).length || metrics.atRiskCustomers;
    const totalRevenue = metrics.totalRevenue || filteredCustomers.reduce(
      (sum, c) => sum + (c.monthlyRevenue || 0),
      0,
    );
    const mrr = metrics.mrr || totalRevenue;
    const averageRevenue = metrics.averageRevenue || (totalCustomers > 0 ? totalRevenue / totalCustomers : 0);
    const averageSLA = metrics.averageSLA || (filteredCustomers.length > 0
      ? filteredCustomers.reduce(
          (sum, c) => sum + (c.metrics?.slaComplianceRate || 0),
          0,
        ) / filteredCustomers.length
      : 0);
    const averageSatisfaction =
      filteredCustomers.length > 0
        ? filteredCustomers.reduce(
            (sum, c) => sum + ((c as any).satisfactionScore || 0),
            0,
          ) / filteredCustomers.length
        : 0;
    const totalInventoryValue = filteredCustomers.reduce(
      (sum, c) => sum + (c.metrics?.inventoryValue || 0),
      0,
    );

    return {
      totalCustomers,
      activeCustomers,
      atRiskCustomers,
      totalRevenue,
      mrr,
      averageRevenue,
      averageSLA,
      averageSatisfaction,
      totalInventoryValue,
      pipelineValue: metrics.pipelineValue,
      activeOpportunities: metrics.activeOpportunities,
      profitability: metrics.profitability,
    };
  }, [filteredCustomers, metrics]);

  // Revenue Analytics
  const revenueData = useMemo(() => {
    return filteredCustomers
      .sort((a, b) => (b.monthlyRevenue || 0) - (a.monthlyRevenue || 0))
      .slice(0, 10)
      .map((customer) => ({
        name: (customer.customerName || "").substring(0, 15),
        revenue: customer.monthlyRevenue || 0,
        tier: customer.serviceTier || "STANDARD",
        orders: customer.metrics?.totalOrders || 0,
      }));
  }, [filteredCustomers]);

  // Service Tier Distribution
  const tierDistribution = useMemo(() => {
    const tiers = ["PLATINUM", "GOLD", "SILVER", "BRONZE", "STANDARD"];
    return tiers.map((tier) => ({
      tier,
      count: filteredCustomers.filter((c) => c.serviceTier === tier).length,
      revenue: filteredCustomers
        .filter((c) => c.serviceTier === tier)
        .reduce((sum, c) => sum + c.monthlyRevenue, 0),
    }));
  }, [filteredCustomers]);

  // SLA Compliance
  const slaData = useMemo(() => {
    return filteredCustomers.map((customer) => ({
      name: (customer.customerName || "").substring(0, 15),
      compliance: customer.metrics?.slaComplianceRate || 0,
      target: (customer as any).serviceLevel?.slaComplianceTarget || 95,
      tier: customer.serviceTier || "STANDARD",
    }));
  }, [filteredCustomers]);

  // Churn Risk Analysis
  const churnData = useMemo(() => {
    const risks = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    return risks.map((risk) => ({
      risk,
      count: filteredCustomers.filter((c) => c.churnRisk === risk).length,
      revenue: filteredCustomers
        .filter((c) => c.churnRisk === risk)
        .reduce((sum, c) => sum + c.monthlyRevenue, 0),
    }));
  }, [filteredCustomers]);

  // Customer Health Trends
  const healthTrends = useMemo(() => {
    return filteredCustomers
      .sort((a, b) => ((b as any).healthScore || 0) - ((a as any).healthScore || 0))
      .slice(0, 10)
      .map((customer) => ({
        name: (customer.customerName || "").substring(0, 15),
        health: (customer as any).healthScore || customer.metrics?.slaComplianceRate || 0,
        satisfaction: (customer as any).satisfactionScore || 0,
        sla: customer.metrics?.slaComplianceRate || 0,
      }));
  }, [filteredCustomers]);

  // Profitability Analysis
  const profitabilityData = useMemo(() => {
    return filteredCustomers
      .map((customer) => {
        // Estimate costs (simplified)
        const estimatedCosts = customer.monthlyRevenue * 0.6; // 60% cost assumption
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
      .slice(0, 15);
  }, [filteredCustomers]);

  // Contract Renewals
  const upcomingRenewals = useMemo(() => {
    return filteredCustomers
      .filter(
        (c) =>
          c.renewalDate &&
          new Date(c.renewalDate) <= new Date(Date.now() + 90 * 86400000),
      )
      .sort((a, b) => {
        const dateA = a.renewalDate
          ? new Date(a.renewalDate).getTime()
          : Infinity;
        const dateB = b.renewalDate
          ? new Date(b.renewalDate).getTime()
          : Infinity;
        return dateA - dateB;
      })
      .slice(0, 10);
  }, [filteredCustomers]);

  const stats = [
    {
      label: "Total Customers",
      value: dashboardMetrics.totalCustomers,
      icon: "ri-user-3-line",
      tooltip: "Total number of customers",
      trend: "up" as const,
    },
    {
      label: "Active Customers",
      value: dashboardMetrics.activeCustomers,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active customers",
      trend: "up" as const,
    },
    {
      label: "At Risk",
      value: dashboardMetrics.atRiskCustomers,
      icon: "ri-error-warning-line",
      tooltip: "Customers at risk of churn",
      trend: (metrics.atRiskCustomers > 0 ? "down" : "neutral") as
        | "down"
        | "neutral",
    },
    {
      label: "Monthly Recurring Revenue",
      value: dashboardMetrics.mrr,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total monthly recurring revenue",
      trend: "up" as const,
      isCurrency: true,
    },
    {
      label: "Average SLA Compliance",
      value: `${dashboardMetrics.averageSLA.toFixed(1)}%`,
      icon: "ri-time-line",
      tooltip: "Average SLA compliance rate",
      trend: (dashboardMetrics.averageSLA >= 95 ? "up" : "neutral") as "up" | "neutral",
    },
    {
      label: "Customer Satisfaction",
      value: `${dashboardMetrics.averageSatisfaction.toFixed(1)}%`,
      icon: "ri-star-line",
      tooltip: "Average customer satisfaction score",
      trend: (dashboardMetrics.averageSatisfaction >= 85 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
  ];

  const COLORS = {
    PLATINUM: "#8b5cf6",
    GOLD: "#f59e0b",
    SILVER: "#6b7280",
    BRONZE: "#92400e",
    STANDARD: "#374151",
  };

  if (loading) {
    return (
      <PageTemplate
        title="Business Development Dashboard"
        description="Loading business development data..."
        icon="ri-line-chart-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading business development data...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Business Development Dashboard"
      description="Customer portfolio analytics, revenue tracking, SLA compliance, and customer satisfaction metrics for 3PL/4PL providers"
      shortDescription="Customer portfolio analytics and revenue tracking"
      icon="ri-line-chart-line"
      systemInfo={{
        sap: "Business Development Dashboard",
        oracle: "Customer Analytics Dashboard",
        manhattan: "BD Dashboard",
      }}
      examples={[
        "Monitor customer portfolio health",
        "Track revenue and profitability",
        "Analyze SLA compliance",
        "Identify churn risks",
        "Plan contract renewals",
        "Optimize customer relationships",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-2 sm:gap-3 flex-nowrap">
          <CustomerSelector
            customers={customers}
            className="min-w-[160px] sm:min-w-[180px] flex-shrink-0"
          />
          <ViewScopeSelector className="flex-shrink-0" />
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 flex-shrink-0">
            {(
              ["overview", "revenue", "sla", "churn", "profitability"] as const
            ).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 sm:px-4 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 min-h-[36px] whitespace-nowrap flex-shrink-0 ${
                  viewMode === mode
                    ? "bg-cyan-500 text-white"
                    : "text-[#9ca3af] hover:text-white hover:bg-white/5"
                }`}
                aria-label={`View ${mode} mode`}
              >
                <i
                  className={`ri-${mode === "overview" ? "dashboard-line" : mode === "revenue" ? "money-dollar-circle-line" : mode === "sla" ? "time-line" : mode === "churn" ? "alert-line" : "line-chart-line"} text-sm sm:text-base flex-shrink-0`}
                ></i>
                <span className="hidden sm:inline">
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </div>
      }
    >
      {/* Overview View */}
      {viewMode === "overview" && (
        <div className="space-y-6">
          {/* Customer Portfolio Overview */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
                <i className="ri-pie-chart-line text-cyan-400 text-lg"></i>
                <span>Service Tier Distribution</span>
              </h3>
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
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
                <i className="ri-bar-chart-box-line text-cyan-400 text-lg"></i>
                <span>Top Customers by Revenue</span>
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
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
                  <Bar dataKey="revenue" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Customer Health & Churn Risk */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
                <i className="ri-heart-pulse-line text-cyan-400 text-lg"></i>
                <span>Customer Health Score</span>
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={healthTrends}>
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
                  <Bar dataKey="health" fill="#06b6d4" name="Health Score" />
                  <Line
                    type="monotone"
                    dataKey="satisfaction"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Satisfaction"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
                <i className="ri-alert-line text-red-400 text-lg"></i>
                <span>Churn Risk Analysis</span>
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={churnData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="risk" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="count" fill="#ef4444" name="Customers" />
                  <Bar
                    dataKey="revenue"
                    fill="#f59e0b"
                    name="Revenue at Risk"
                  />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Upcoming Renewals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-calendar-todo-line text-cyan-400 text-lg"></i>
              <span>Upcoming Contract Renewals (Next 90 Days)</span>
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
                      Monthly Revenue
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Renewal Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Auto Renew
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Health Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {upcomingRenewals.map((customer, index) => (
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
                                : customer.serviceTier === "SILVER"
                                  ? "bg-gray-500/20 text-gray-400"
                                  : "bg-orange-500/20 text-orange-400"
                          }`}
                        >
                          {customer.serviceTier}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-white font-medium leading-tight">
                          <CurrencyDisplay
                            amount={customer.monthlyRevenue}
                            size="sm"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-white leading-tight">
                          {customer.renewalDate
                            ? format(
                                new Date(customer.renewalDate),
                                "MMM dd, yyyy",
                              )
                            : "N/A"}
                        </div>
                        {customer.renewalDate && (
                          <div className="text-xs text-[#9ca3af] mt-0.5 leading-normal">
                            {Math.ceil(
                              (new Date(customer.renewalDate).getTime() -
                                new Date().getTime()) /
                                (1000 * 60 * 60 * 24),
                            )}{" "}
                            days
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            customer.autoRenew
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {customer.autoRenew ? "Yes" : "No"}
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
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowCustomerModal(true);
                          }}
                          className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          aria-label="View customer details"
                        >
                          <i className="ri-eye-line text-sm"></i>
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {/* Revenue View */}
      {viewMode === "revenue" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <i className="ri-money-dollar-circle-line text-cyan-400"></i>
              Revenue by Service Tier
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={tierDistribution}>
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
                  name="Revenue (SAR)"
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
              <i className="ri-line-chart-line text-cyan-400 text-lg"></i>
              <span>Top Revenue Customers</span>
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={revenueData} layout="vertical">
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
                  name="Monthly Revenue (SAR)"
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* SLA View */}
      {viewMode === "sla" && (
        <div className="space-y-6">
          <SLADashboard customers={filteredCustomers} />
        </div>
      )}

      {/* Churn Risk View */}
      {viewMode === "churn" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-alert-line text-red-400 text-lg"></i>
              <span>Churn Risk Analysis</span>
            </h3>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              {churnData.map((item) => (
                <div
                  key={item.risk}
                  className={`p-4 rounded-lg border ${
                    item.risk === "CRITICAL"
                      ? "bg-red-500/10 border-red-500/30"
                      : item.risk === "HIGH"
                        ? "bg-orange-500/10 border-orange-500/30"
                        : item.risk === "MEDIUM"
                          ? "bg-yellow-500/10 border-yellow-500/30"
                          : "bg-green-500/10 border-green-500/30"
                  }`}
                >
                  <div className="text-xs text-[#9ca3af] mb-1.5 leading-normal">
                    {item.risk} Risk
                  </div>
                  <div className="text-2xl font-bold text-white mb-1 leading-none">
                    {item.count}
                  </div>
                  <div className="text-xs text-[#9ca3af] leading-normal">
                    <CurrencyDisplay
                      amount={item.revenue}
                      size="sm"
                      variant="muted"
                    />
                  </div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={churnData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="risk" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="count" fill="#ef4444" name="Customers" />
                <Bar dataKey="revenue" fill="#f59e0b" name="Revenue at Risk" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* At-Risk Customers List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-error-warning-line text-red-400 text-lg"></i>
              <span>High & Critical Risk Customers</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Churn Risk
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Health Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      SLA Compliance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Monthly Revenue
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Last Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredCustomers
                    .filter(
                      (c) =>
                        c.churnRisk === "HIGH" || c.churnRisk === "CRITICAL",
                    )
                    .map((customer, index) => (
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
                              customer.churnRisk === "CRITICAL"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            }`}
                          >
                            {customer.churnRisk}
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
                        <td className="px-4 py-3">
                          <div className="text-sm text-white leading-tight">
                            {customer.metrics.slaComplianceRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-[#9ca3af] mt-0.5 leading-normal">
                            Target: {customer.serviceLevel.slaComplianceTarget}%
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-white font-medium leading-tight">
                            <CurrencyDisplay
                              amount={customer.monthlyRevenue}
                              size="sm"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-white leading-tight">
                            {customer.metrics.lastOrderDate
                              ? format(
                                  new Date(customer.metrics.lastOrderDate),
                                  "MMM dd",
                                )
                              : "N/A"}
                          </div>
                          <div className="text-xs text-[#9ca3af] mt-0.5 leading-normal">
                            {customer.metrics.daysSinceLastOrder} days ago
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowCustomerModal(true);
                            }}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {/* Profitability View */}
      {viewMode === "profitability" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
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
                  name="Revenue"
                />
                <Bar
                  yAxisId="left"
                  dataKey="costs"
                  fill="#ef4444"
                  name="Costs"
                />
                <Bar
                  yAxisId="left"
                  dataKey="profit"
                  fill="#10b981"
                  name="Profit"
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
      )}

      {/* Customer Detail Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setSelectedCustomer(null);
        }}
        title={`Customer Details - ${selectedCustomer?.customerName || ""}`}
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Customer Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedCustomer.customerNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Service Tier
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedCustomer.serviceTier === "PLATINUM"
                      ? "bg-purple-500/20 text-purple-400"
                      : selectedCustomer.serviceTier === "GOLD"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedCustomer.serviceTier}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Monthly Revenue
                </label>
                <div className="text-sm text-white font-medium">
                  <CurrencyDisplay
                    amount={selectedCustomer.monthlyRevenue}
                    size="sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Health Score
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedCustomer.healthScore.toFixed(1)}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Churn Risk
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedCustomer.churnRisk === "CRITICAL"
                      ? "bg-red-500/20 text-red-400"
                      : selectedCustomer.churnRisk === "HIGH"
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {selectedCustomer.churnRisk}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  SLA Compliance
                </label>
                <div className="text-sm text-white">
                  {selectedCustomer.metrics.slaComplianceRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}

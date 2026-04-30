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
  ComposedChart,
} from "recharts";
import PageTemplate from "@/components/PageTemplate";
import CustomerSelector from "@/components/multi-tenant/CustomerSelector";
import ViewScopeSelector from "@/components/role-based/ViewScopeSelector";
import SLADashboard from "@/components/business-intelligence/SLADashboard";
import Modal from "@/components/Modal";
import CurrencyDisplay from "@/components/CurrencyDisplay";

export default function AccountManagerDashboard() {
  const { user } = useAuth();
  const { context } = useViewContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    averageSLA: 0,
    customerRevenue: 0,
    criticalRisk: 0,
    totalOrders: 0,
    activeOpportunities: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [viewMode, setViewMode] = useState<
    "overview" | "orders" | "sla" | "issues"
  >("overview");

  // Fetch account manager dashboard data
  useEffect(() => {
    async function loadAccountManagerData() {
      const targetTenant = user?.tenantId || "tenant-1";
      setLoading(true);
      try {
        const customerIdParam =
          context.customerFilter.type === "SINGLE" &&
          context.customerFilter.customerIds?.[0]
            ? `&customerId=${context.customerFilter.customerIds[0]}`
            : "";

        const response = await fetch(
          `/api/dashboards/account-manager?tenantId=${targetTenant}${customerIdParam}`,
        );
        const result = await response.json();

        if (result.success && result.data) {
          setCustomers(result.data.customers || []);
          setOrders(result.data.orders || []);
          setMetrics(result.data.metrics || {
            totalCustomers: 0,
            activeCustomers: 0,
            averageSLA: 0,
            customerRevenue: 0,
            criticalRisk: 0,
            totalOrders: 0,
            activeOpportunities: 0,
          });
        } else {
          console.error("API returned error:", result.error);
        }
      } catch (error) {
        console.error("Failed to load account manager data:", error);
        // Set empty data on error
        setCustomers([]);
        setOrders([]);
        setMetrics({
          totalCustomers: 0,
          activeCustomers: 0,
          averageSLA: 0,
          customerRevenue: 0,
          criticalRisk: 0,
          totalOrders: 0,
          activeOpportunities: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    loadAccountManagerData();
  }, [user?.tenantId, context.customerFilter]);

  // Apply context filters (e.g. if they use the selector to drill down further)
  const filteredCustomers = useMemo(() => {
    if (context.customerFilter.type === "ALL") return customers;
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

  // Key Metrics (using fetched metrics with local calculations)
  const dashboardMetrics = useMemo(() => {
    const totalCustomers = filteredCustomers.length || metrics.totalCustomers;
    const activeCustomers = filteredCustomers.filter(
      (c) => c.status === "ACTIVE",
    ).length || metrics.activeCustomers;
    const criticalRisk = filteredCustomers.filter(
      (c) => c.churnRisk === "CRITICAL" || c.churnRisk === "HIGH",
    ).length || metrics.criticalRisk;

    // Calculate SLA compliance average from fetched data
    const averageSLA =
      filteredCustomers.length > 0
        ? filteredCustomers.reduce(
            (sum, c) => sum + (c.metrics?.slaComplianceRate || 0),
            0,
          ) / filteredCustomers.length
        : metrics.averageSLA;

    // Find customers below SLA target (assume 95% as default target)
    const slaBreaches = filteredCustomers.filter(
      (c) => (c.metrics?.slaComplianceRate || 0) < 95,
    ).length;

    // Sum of inventory value for assigned accounts
    const totalInventoryValue = filteredCustomers.reduce(
      (sum, c) => sum + (c.metrics?.inventoryValue || 0),
      0,
    );

    return {
      totalCustomers,
      activeCustomers,
      criticalRisk,
      averageSLA,
      slaBreaches,
      totalInventoryValue,
    };
  }, [filteredCustomers, metrics]);

  // Orders Data (from fetched orders)
  const orderStatusData = useMemo(() => {
    const statusCounts = orders.reduce((acc, order) => {
      const status = order.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      {
        name: "Processing",
        value: statusCounts["PICKING"] || statusCounts["PICKED"] || 0,
        color: "#06b6d4",
      },
      {
        name: "Shipped",
        value: statusCounts["DISPATCHED"] || statusCounts["IN_TRANSIT"] || 0,
        color: "#10b981",
      },
      {
        name: "Delivered",
        value: statusCounts["DELIVERED"] || statusCounts["COMPLETED"] || 0,
        color: "#8b5cf6",
      },
      {
        name: "Exceptions",
        value: orders.filter((o) => o.slaStatus === "BREACHED").length,
        color: "#ef4444",
      },
      {
        name: "Returns",
        value: statusCounts["RETURNED"] || 0,
        color: "#f59e0b",
      },
    ];
  }, [orders]);

  // Health Stats
  const healthStats = useMemo(() => {
    return filteredCustomers
      .map((c) => ({
        name: (c.customerName || "").substring(0, 15),
        health: (c as any).healthScore || (c.metrics?.slaComplianceRate || 0),
        sla: c.metrics?.slaComplianceRate || 0,
        risk: c.churnRisk || "LOW",
      }))
      .sort((a, b) => a.health - b.health)
      .slice(0, 10); // Bottom 10 health (ascending)
  }, [filteredCustomers]);

  const stats = [
    {
      label: "My Accounts",
      value: dashboardMetrics.totalCustomers,
      icon: "ri-briefcase-4-line",
      tooltip: "Total customers assigned to you",
      trend: "neutral" as const,
    },
    {
      label: "Critical Risk",
      value: dashboardMetrics.criticalRisk,
      icon: "ri-alarm-warning-line",
      tooltip: "Customers with High or Critical churn risk",
      trend: (metrics.criticalRisk > 0 ? "down" : "neutral") as
        | "down"
        | "neutral",
      color: metrics.criticalRisk > 0 ? "text-red-400" : undefined,
    },
    {
      label: "Avg SLA Compliance",
      value: `${dashboardMetrics.averageSLA.toFixed(1)}%`,
      icon: "ri-medal-line",
      tooltip: "Average SLA compliance across your accounts",
      trend: (dashboardMetrics.averageSLA >= 95 ? "up" : "down") as "up" | "down",
    },
    {
      label: "SLA Breaches",
      value: dashboardMetrics.slaBreaches,
      icon: "ri-file-warning-line",
      tooltip: "Customers currently below SLA target",
      trend: (dashboardMetrics.slaBreaches > 0 ? "down" : "up") as "down" | "up",
      color: dashboardMetrics.slaBreaches > 0 ? "text-orange-400" : "text-green-400",
    },
    {
      label: "Total Inventory",
      value: dashboardMetrics.totalInventoryValue,
      icon: "ri-stack-line",
      tooltip: "Total value of inventory for your accounts",
      isCurrency: true,
      trend: "up" as const,
    },
  ];

  if (loading) {
    return (
      <PageTemplate
        title="Account Manager Dashboard"
        description="Loading account data..."
        icon="ri-user-star-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading account manager data...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Account Manager Dashboard"
      description="Manage your assigned customer accounts, monitor their performance, and address service issues."
      shortDescription="Account portfolio management"
      icon="ri-user-star-line"
      systemInfo={{
        sap: "Key Account Dashboard",
        oracle: "Customer Engagement",
        manhattan: "Account Overview",
      }}
      stats={stats}
      actions={
        <div className="flex items-center gap-2 sm:gap-3 flex-nowrap">
          <CustomerSelector
            customers={customers}
            className="min-w-[160px] sm:min-w-[180px] flex-shrink-0"
          />
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 flex-shrink-0">
            {(["overview", "orders", "sla", "issues"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 sm:px-4 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 min-h-[36px] whitespace-nowrap flex-shrink-0 ${
                  viewMode === mode
                    ? "bg-cyan-500 text-white"
                    : "text-[#9ca3af] hover:text-white hover:bg-white/5"
                }`}
              >
                <i
                  className={`ri-${
                    mode === "overview"
                      ? "dashboard-line"
                      : mode === "orders"
                        ? "shopping-cart-line"
                        : mode === "sla"
                          ? "time-line"
                          : "alert-line"
                  } text-sm sm:text-base`}
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
      {/* Overview Mode */}
      {viewMode === "overview" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Account Status List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-list-check text-cyan-400"></i>
                Account Status Overview
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[#9ca3af] uppercase">
                        Customer
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[#9ca3af] uppercase">
                        Tier
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[#9ca3af] uppercase">
                        Health
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[#9ca3af] uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredCustomers.slice(0, 8).map((c, i) => (
                      <tr
                        key={c.id}
                        className="hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setShowCustomerModal(true);
                        }}
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-white">
                            {c.customerName}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              c.serviceTier === "PLATINUM"
                                ? "bg-purple-500/20 text-purple-400"
                                : c.serviceTier === "GOLD"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {c.serviceTier}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                c.healthScore > 80
                                  ? "bg-green-500"
                                  : c.healthScore > 50
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                            />
                            <span className="text-sm text-white">
                              {c.healthScore}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs ${c.status === "ACTIVE" ? "text-green-400" : "text-gray-400"}`}
                          >
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Account Health vs SLA Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-heart-pulse-line text-cyan-400"></i>
                Lowest Health Accounts
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={healthStats} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#9ca3af"
                    fontSize={12}
                    width={100}
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
                    dataKey="health"
                    fill="#ef4444"
                    barSize={15}
                    name="Health Score"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="sla"
                    fill="#06b6d4"
                    barSize={15}
                    name="SLA %"
                    radius={[0, 4, 4, 0]}
                  />
                  <Legend />
                </ComposedChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      )}

      {/* Orders Mode */}
      {viewMode === "orders" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Order Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Recent Exceptions
              </h3>
              <div className="space-y-3">
                {[1, 2, 3].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                  >
                    <div className="mt-1">
                      <i className="ri-error-warning-fill text-red-500"></i>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        Delayed Shipment - ORD-#{202400 + i}
                      </div>
                      <div className="text-xs text-gray-400">
                        Customer:{" "}
                        {
                          filteredCustomers[i % filteredCustomers.length]
                            ?.customerName
                        }
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Carrier notification: Weather delay in transit hub.
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* SLA Mode */}
      {viewMode === "sla" && <SLADashboard customers={filteredCustomers} />}

      {/* Issues Mode */}
      {viewMode === "issues" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <i className="ri-alarm-warning-line text-red-400"></i>
              Critical Attention Required
            </h3>
            <div className="grid gap-4">
              {filteredCustomers
                .filter(
                  (c) =>
                    c.churnRisk === "CRITICAL" ||
                    c.metrics.slaComplianceRate < 80,
                )
                .map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-red-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
                        {c.customerName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {c.customerName}
                        </div>
                        <div className="text-xs text-red-400 flex items-center gap-1">
                          {c.churnRisk === "CRITICAL" && (
                            <span>Critical Churn Risk</span>
                          )}
                          {c.churnRisk === "CRITICAL" &&
                            c.metrics.slaComplianceRate < 80 && <span>•</span>}
                          {c.metrics.slaComplianceRate < 80 && (
                            <span>
                              Low SLA ({c.metrics.slaComplianceRate.toFixed(1)}
                              %)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCustomer(c);
                        setShowCustomerModal(true);
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                ))}

              {filteredCustomers.filter(
                (c) =>
                  c.churnRisk === "CRITICAL" ||
                  c.metrics.slaComplianceRate < 80,
              ).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <i className="ri-checkbox-circle-line text-4xl mb-2 block text-green-500/50"></i>
                  No critical issues found. Good job!
                </div>
              )}
            </div>
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
        title={`Account Details - ${selectedCustomer?.customerName || ""}`}
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-gray-400">Service Level</div>
                <div className="text-lg font-semibold text-white">
                  {selectedCustomer.serviceTier}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-gray-400">Monthly Revenue</div>
                <div className="text-lg font-semibold text-white">
                  <CurrencyDisplay
                    amount={selectedCustomer.monthlyRevenue}
                    size="sm"
                  />
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-gray-400">Health Score</div>
                <div
                  className={`text-lg font-semibold ${selectedCustomer.healthScore > 80 ? "text-green-400" : "text-yellow-400"}`}
                >
                  {selectedCustomer.healthScore}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-gray-400">SLA Compliance</div>
                <div className="text-lg font-semibold text-white">
                  {selectedCustomer.metrics.slaComplianceRate.toFixed(1)}%
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-white mb-2">
                Contact Information
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <i className="ri-user-line text-gray-500"></i>
                  Primary: John Doe (Logistics Mgr)
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <i className="ri-mail-line text-gray-500"></i>
                  john.doe@
                  {selectedCustomer.customerName
                    .toLowerCase()
                    .replace(/\s/g, "")}
                  .com
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <i className="ri-phone-line text-gray-500"></i>
                  +1 (555) 123-4567
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <i className="ri-map-pin-line text-gray-500"></i>
                  Headquarters: New York, USA
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end gap-2">
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded transition-colors text-sm">
                View Full Profile
              </button>
              <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors text-sm">
                Create Ticket
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}

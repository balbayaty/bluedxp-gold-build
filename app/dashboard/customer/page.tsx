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
} from "recharts";
import PageTemplate from "@/components/PageTemplate";
import SLADashboard from "@/components/business-intelligence/SLADashboard";
import CurrencyDisplay from "@/components/CurrencyDisplay";
import MetricCard from "@/components/MetricCard";

export default function CustomerUserDashboard() {
  const { user } = useAuth();
  const { context } = useViewContext();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [inventoryData, setInventoryData] = useState<
    Array<{ category: string; items: number; value: number; color: string }>
  >([]);
  const [recentOrders, setRecentOrders] = useState<
    Array<{ id: string; date: string; status: string; items: number; total: number }>
  >([]);
  const [metrics, setMetrics] = useState({
    inventoryValue: 0,
    slaComplianceRate: 0,
    openOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<
    "overview" | "inventory" | "orders" | "billing"
  >("overview");

  useEffect(() => {
    async function loadCustomerData() {
      const targetTenant = user?.tenantId || "tenant-1";
      const customerId =
        user?.assignedCustomers?.[0] ||
        context.customerFilter.customerIds?.[0] ||
        "";

      if (!customerId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/dashboards/customer?tenantId=${targetTenant}&customerId=${customerId}`,
        );
        const result = await response.json();

        if (result.success && result.data) {
          // Map customer data
          const customerData = result.data.customer;
          setCustomer({
            id: customerData.id,
            customerName: customerData.name,
            customerCode: customerData.code,
            serviceTier: customerData.serviceTier || "STANDARD",
            metrics: {
              inventoryValue: result.data.metrics.inventoryValue,
              slaComplianceRate: result.data.metrics.slaComplianceRate,
            },
          } as Customer);

          setInventoryData(result.data.inventory?.data || []);
          setRecentOrders(result.data.orders?.recent || []);
          setMetrics(result.data.metrics || {
            inventoryValue: 0,
            slaComplianceRate: 0,
            openOrders: 0,
          });
        }
      } catch (error) {
        console.error("Failed to load customer data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadCustomerData();
  }, [user, context.customerFilter]);

  if (loading) {
    return (
      <PageTemplate
        title="Customer Dashboard"
        description="Loading your dashboard..."
        icon="ri-user-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading customer data...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (!customer) {
    return (
      <PageTemplate
        title="Customer Dashboard"
        description="Customer profile not found"
        icon="ri-user-line"
      >
        <div className="p-8 text-center text-gray-500">
          <p>No customer profile found. Please contact support.</p>
        </div>
      </PageTemplate>
    );
  }

  const stats = [
    {
      label: "Inventory Value",
      value: metrics.inventoryValue,
      icon: "ri-stack-line",
      tooltip: "Total value of your inventory currently in our warehouses",
      trend: "up" as const,
      isCurrency: true,
    },
    {
      label: "Open Orders",
      value: metrics.openOrders,
      icon: "ri-shopping-cart-2-line",
      tooltip: "Orders currently being processed",
      trend: "neutral" as const,
    },
    {
      label: "On-Time Delivery",
      value: `${metrics.slaComplianceRate.toFixed(1)}%`,
      icon: "ri-truck-line",
      tooltip: "Percentage of orders delivered on time",
      trend: (metrics.slaComplianceRate >= 95 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
    {
      label: "Service Level",
      value: customer?.serviceTier || "STANDARD",
      icon: "ri-vip-crown-line",
      tooltip: "Your current service tier plan",
      trend: "neutral" as const,
    },
  ];

  return (
    <PageTemplate
      title={`Welcome, ${customer.customerName}`}
      description="Overview of your inventory, orders, and service performance."
      shortDescription="Customer Portal"
      icon="ri-building-4-line"
      systemInfo={{
        sap: "Customer Portal",
        oracle: "iSupport",
        manhattan: "Customer Engagement",
      }}
      stats={stats}
      loading={loading}
      actions={
        <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 flex-shrink-0">
          {(["overview", "inventory", "orders", "billing"] as const).map(
            (mode) => (
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
                      : mode === "inventory"
                        ? "archive-line"
                        : mode === "orders"
                          ? "file-list-3-line"
                          : "bank-card-line"
                  } text-sm sm:text-base`}
                ></i>
                <span className="hidden sm:inline">
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </span>
              </button>
            ),
          )}
        </div>
      }
    >
      {/* Overview View */}
      {viewMode === "overview" && (
        <div className="space-y-6">
          {/* Quick Status Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Recent Order Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-2"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <i className="ri-time-line text-cyan-400"></i> Recent Activity
                </span>
                <button
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                  onClick={() => setViewMode("orders")}
                >
                  View All
                </button>
              </h3>
              <div className="space-y-4">
                {recentOrders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          order.status === "DELIVERED"
                            ? "bg-green-500/20 text-green-400"
                            : order.status === "SHIPPED"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        <i
                          className={`ri-${
                            order.status === "DELIVERED"
                              ? "check-double-line"
                              : order.status === "SHIPPED"
                                ? "truck-line"
                                : "loader-4-line"
                          }`}
                        ></i>
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          Order #{order.id}
                        </div>
                        <div className="text-xs text-gray-400">
                          {format(new Date(order.date), "MMM dd, yyyy")} •{" "}
                          {order.items} items
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        <CurrencyDisplay amount={order.total} size="sm" />
                      </div>
                      <div
                        className={`text-xs font-medium ${
                          order.status === "DELIVERED"
                            ? "text-green-400"
                            : order.status === "SHIPPED"
                              ? "text-blue-400"
                              : "text-yellow-400"
                        }`}
                      >
                        {order.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Account Manager Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-customer-service-2-line text-cyan-400"></i>{" "}
                Your Account Manager
              </h3>
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-gray-700/50 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl">
                  👨‍💼
                </div>
                <div className="text-lg font-medium text-white">
                  Alex Morgan
                </div>
                <div className="text-sm text-cyan-200 mb-6">
                  Senior Logistics Success Manager
                </div>

                <button className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors mb-3 flex items-center justify-center gap-2">
                  <i className="ri-chat-1-line"></i> Chat Now
                </button>
                <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                  <i className="ri-mail-send-line"></i> Send Email
                </button>
              </div>
            </motion.div>
          </div>

          {/* Inventory Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Inventory Distribution
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryData} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    horizontal={false}
                  />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                  <YAxis
                    dataKey="category"
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
                    dataKey="value"
                    fill="#06b6d4"
                    barSize={20}
                    radius={[0, 4, 4, 0]}
                    name="Value ($)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}

      {/* Inventory View */}
      {viewMode === "inventory" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {inventoryData.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="text-sm text-gray-400 mb-1">
                  {item.category}
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {item.items}
                </div>
                <div className="text-xs text-cyan-400">
                  <CurrencyDisplay amount={item.value} size="sm" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Detailed Stock Levels
            </h3>
            <div className="text-center py-12 text-gray-500 bg-white/5 rounded-xl border border-dashed border-gray-700">
              <i className="ri-table-line text-4xl mb-3 block"></i>
              Full inventory table would be displayed here.
              <br />
              <span className="text-sm">
                Connected to WMS Real-time Database
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Orders View */}
      {viewMode === "orders" && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase">
                    Order ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {recentOrders.map((order, i) => (
                  <tr
                    key={order.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 text-white font-mono text-sm">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {format(new Date(order.date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === "DELIVERED"
                            ? "bg-green-500/20 text-green-400"
                            : order.status === "SHIPPED"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {order.items}
                    </td>
                    <td className="px-6 py-4 text-white font-medium text-sm">
                      <CurrencyDisplay amount={order.total} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-cyan-400 hover:text-cyan-300 text-sm hover:underline">
                        Track
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Billing View */}
      {viewMode === "billing" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6">
                Current Balance
              </h3>
              <div className="text-4xl font-bold text-white mb-2">
                <CurrencyDisplay amount={12450.0} />
              </div>
              <div className="text-sm text-gray-300 mb-6">
                Due by{" "}
                {format(new Date(Date.now() + 5 * 86400000), "MMM dd, yyyy")}
              </div>
              <button className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-purple-900/20">
                Pay Invoice
              </button>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Invoice History
              </h3>
              <div className="space-y-3">
                {[1, 2, 3].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border-b border-white/10 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded text-gray-400">
                        <i className="ri-file-list-3-line"></i>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          INV-{202400 - i}
                        </div>
                        <div className="text-xs text-gray-500">
                          Paid on Oct {10 - i}, 2024
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-300">
                      <CurrencyDisplay amount={4500 + i * 100} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageTemplate>
  );
}

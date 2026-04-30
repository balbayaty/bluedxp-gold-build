"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useViewContext } from "@/contexts/ViewContextProvider";
import { Warehouse } from "@/types/tenant";
import { getWarehouseData } from "@/app/actions/wms/getWarehouseData"; // Real DB Action
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
import CurrencyDisplay from "@/components/CurrencyDisplay";
import WarehouseSelector from "@/components/multi-tenant/WarehouseSelector";
import CustomerSelector from "@/components/multi-tenant/CustomerSelector";
import ViewScopeSelector from "@/components/role-based/ViewScopeSelector";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";

type InventoryStockItem = {
  materialNumber: string;
  materialDescription: string;
  quantity: number;
  unit: string;
  valuation: number;
  storageLocation: string;
  warehouseId: string;
};

type SalesOrderItem = {
  id: string;
  orderNumber: string;
  customerNumber: string;
  customerName: string;
  orderDate: string;
  status: string;
  totalValue: number;
  totalItems: number;
  totalQuantity: number;
};

export default function WarehouseHeadDashboard() {
  const { user, tenant } = useAuth();
  const { context } = useViewContext();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stock, setStock] = useState<InventoryStockItem[]>([]);
  const [orders, setOrders] = useState<SalesOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(
    null,
  );
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [viewMode, setViewMode] = useState<
    "overview" | "stock" | "space" | "transactions" | "performance"
  >("overview");

  useEffect(() => {
    // Fetch Real Data from "SAP Killer" Backend
    async function loadRealData() {
      const targetTenant = user?.tenantId || "tenant-1";
      setLoading(true);
      try {
        // Fetch warehouses
        const realWarehouses = await getWarehouseData(targetTenant);
        if (realWarehouses.length > 0) {
          setWarehouses(realWarehouses);
        } else {
          setWarehouses([]);
        }

        // Fetch dashboard data (inventory + orders)
        const warehouseIdParam =
          context.warehouseFilter.type === "SINGLE" &&
          context.warehouseFilter.warehouseIds?.[0]
            ? `&warehouseId=${context.warehouseFilter.warehouseIds[0]}`
            : "";

        const response = await fetch(
          `/api/dashboards/warehouse-head?tenantId=${targetTenant}${warehouseIdParam}`,
        );
        const result = await response.json();

        if (result.success && result.data) {
          setStock(result.data.inventory?.items || []);
          setOrders(result.data.orders?.items || []);
        }
      } catch (error) {
        console.error("Failed to load real WMS data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadRealData();
  }, [user?.tenantId, context.warehouseFilter]);

  // Filter warehouses based on view context
  const filteredWarehouses = useMemo(() => {
    if (context.warehouseFilter.type === "ALL") return warehouses;
    if (context.warehouseFilter.type === "ASSIGNED") {
      return warehouses.filter((w) => user?.assignedWarehouses?.includes(w.id));
    }
    if (
      context.warehouseFilter.type === "SINGLE" ||
      context.warehouseFilter.type === "MULTIPLE"
    ) {
      return warehouses.filter((w) =>
        context.warehouseFilter.warehouseIds?.includes(w.id),
      );
    }
    return warehouses;
  }, [warehouses, context.warehouseFilter, user?.assignedWarehouses]);

  // Filter stock based on view context
  const filteredStock = useMemo(() => {
    let filtered = stock;

    // Filter by warehouse
    if (
      context.warehouseFilter.type !== "ALL" &&
      context.warehouseFilter.warehouseIds
    ) {
      filtered = filtered.filter((s) =>
        context.warehouseFilter.warehouseIds?.includes(s.warehouseId),
      );
    }

    // Filter by customer (if stock has customerId)
    if (
      context.customerFilter.type !== "ALL" &&
      context.customerFilter.customerIds
    ) {
      // In real implementation, stock would have customerId
      // For now, we'll just return all stock
    }

    return filtered;
  }, [stock, context]);

  // Filter orders based on view context
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Filter by customer
    if (
      context.customerFilter.type !== "ALL" &&
      context.customerFilter.customerIds
    ) {
      filtered = filtered.filter((o) =>
        context.customerFilter.customerIds?.includes(o.customerNumber),
      );
    }

    return filtered;
  }, [orders, context]);

  // Key Metrics
  const metrics = useMemo(() => {
    const totalWarehouses = filteredWarehouses.length;
    const totalStockValue = filteredStock.reduce(
      (sum, s) => sum + (s.valuation || 0),
      0,
    );
    const totalStockQuantity = filteredStock.reduce(
      (sum, s) => sum + s.quantity,
      0,
    );
    const totalOrders = filteredOrders.length;
    const activeOrders = filteredOrders.filter(
      (o) =>
        o.status === "CREATED" ||
        o.status === "CONFIRMED" ||
        o.status === "PICK_RELEASED" ||
        o.status === "PICKING" ||
        o.status === "PICKED" ||
        o.status === "READY_FOR_DISPATCH",
    ).length;
    const averageSpaceUtilization =
      filteredWarehouses.reduce(
        (sum, w) => sum + w.currentUtilization.utilizationPercentage,
        0,
      ) / filteredWarehouses.length || 0;
    const totalPalletPositions = filteredWarehouses.reduce(
      (sum, w) => sum + w.capacity.totalPalletPositions,
      0,
    );
    const usedPalletPositions = filteredWarehouses.reduce(
      (sum, w) => sum + w.currentUtilization.usedPalletPositions,
      0,
    );

    return {
      totalWarehouses,
      totalStockValue,
      totalStockQuantity,
      totalOrders,
      activeOrders,
      averageSpaceUtilization,
      totalPalletPositions,
      usedPalletPositions,
    };
  }, [filteredWarehouses, filteredStock, filteredOrders]);

  // Space Utilization by Warehouse
  const spaceUtilizationData = useMemo(() => {
    return filteredWarehouses.map((warehouse) => ({
      name: warehouse.warehouseName.substring(0, 15),
      utilization: warehouse.currentUtilization.utilizationPercentage,
      palletUtilization:
        warehouse.currentUtilization.palletUtilizationPercentage,
      totalArea: warehouse.capacity.totalArea,
      usedArea: warehouse.currentUtilization.usedArea,
      availableArea: warehouse.currentUtilization.availableArea,
    }));
  }, [filteredWarehouses]);

  // Stock by Customer (if available)
  const stockByCustomer = useMemo(() => {
    // Group stock by customer
    const customerMap = new Map<string, { quantity: number; value: number }>();

    filteredStock.forEach((item) => {
      // In real implementation, we'd get customerId from the stock item
      // For now, we'll use a placeholder or derive from material
      const customerId = (item as any).customerId || "default-customer";
      const existing = customerMap.get(customerId) || { quantity: 0, value: 0 };
      customerMap.set(customerId, {
        quantity: existing.quantity + item.quantity,
        value: existing.value + (item.valuation || 0),
      });
    });

    return Array.from(customerMap.entries())
      .map(([customerId, data]) => ({
        customerId,
        customerName: `Customer ${customerId.split("-").pop() || "Unknown"}`,
        quantity: data.quantity,
        value: data.value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredStock]);

  // Transaction Summary
  const transactionSummary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisWeek = new Date(today.getTime() - 7 * 86400000);
    const thisMonth = new Date(today.getTime() - 30 * 86400000);

    return {
      today: filteredOrders.filter(
        (o) => new Date(o.orderDate) >= today,
      ).length,
      thisWeek: filteredOrders.filter(
        (o) => new Date(o.orderDate) >= thisWeek,
      ).length,
      thisMonth: filteredOrders.filter(
        (o) => new Date(o.orderDate) >= thisMonth,
      ).length,
      total: filteredOrders.length,
    };
  }, [filteredOrders]);

  // Performance Metrics
  const performanceMetrics = useMemo(() => {
    return filteredWarehouses.map((warehouse) => ({
      name: warehouse.warehouseName.substring(0, 15),
      ordersToday: warehouse.metrics.ordersToday,
      onTimeDelivery: warehouse.metrics.onTimeDeliveryRate,
      inventoryAccuracy: warehouse.metrics.inventoryAccuracy,
      spaceEfficiency: warehouse.metrics.spaceEfficiency,
      throughput: warehouse.metrics.throughput,
    }));
  }, [filteredWarehouses]);

  const stats = [
    {
      label: "Warehouses",
      value: metrics.totalWarehouses,
      icon: "ri-warehouse-line",
      tooltip: "Total warehouses under management",
      trend: "up" as const,
    },
    {
      label: "Total Stock Value",
      value: metrics.totalStockValue,
      isCurrency: true,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total inventory value",
      trend: "up" as const,
    },
    {
      label: "Total Stock Quantity",
      value: metrics.totalStockQuantity.toFixed(0),
      icon: "ri-stack-line",
      tooltip: "Total stock units",
      trend: "up" as const,
    },
    {
      label: "Active Orders",
      value: metrics.activeOrders,
      icon: "ri-shopping-cart-line",
      tooltip: "Orders currently being processed",
      trend: "neutral" as const,
    },
    {
      label: "Space Utilization",
      value: `${metrics.averageSpaceUtilization.toFixed(1)}%`,
      icon: "ri-layout-grid-line",
      tooltip: "Average warehouse space utilization",
      trend: (metrics.averageSpaceUtilization > 85 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
    {
      label: "Pallet Positions",
      value: `${metrics.usedPalletPositions.toFixed(0)} / ${metrics.totalPalletPositions.toFixed(0)}`,
      icon: "ri-stack-fill",
      tooltip: "Used vs total pallet positions",
      trend: "neutral" as const,
    },
  ];

  if (loading) {
    return (
      <PageTemplate
        title="Warehouse Head Dashboard"
        description="Loading dashboard data..."
        icon="ri-warehouse-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading warehouse data...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Warehouse Head Dashboard"
      description="Multi-warehouse overview, stock visibility, space utilization, and performance metrics for warehouse management"
      icon="ri-warehouse-line"
      systemInfo={{
        sap: "Warehouse Head Dashboard",
        oracle: "Warehouse Management Dashboard",
        manhattan: "WH Head Dashboard",
      }}
      examples={[
        "View all warehouses or selected warehouses",
        "Monitor stock levels by customer or warehouse",
        "Track space utilization and capacity",
        "Monitor transactions and orders",
        "Analyze performance metrics",
        "Plan capacity and resources",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <WarehouseSelector
            warehouses={filteredWarehouses}
            className="min-w-[180px] sm:min-w-[200px]"
          />
          <CustomerSelector
            customers={[]}
            className="min-w-[180px] sm:min-w-[200px]"
          />
          <ViewScopeSelector />
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(
              [
                "overview",
                "stock",
                "space",
                "transactions",
                "performance",
              ] as const
            ).map((mode) => (
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
                  className={`ri-${mode === "overview" ? "dashboard-line" : mode === "stock" ? "stack-line" : mode === "space" ? "layout-grid-line" : mode === "transactions" ? "exchange-line" : "line-chart-line"} text-sm sm:text-base`}
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
          {/* Warehouse Overview Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWarehouses.map((warehouse, index) => (
              <motion.div
                key={warehouse.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedWarehouse(warehouse);
                  setShowWarehouseModal(true);
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {warehouse.warehouseName}
                    </h3>
                    <p className="text-sm text-[#9ca3af]">
                      {warehouse.warehouseCode}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      warehouse.status === "ACTIVE"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {warehouse.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[#9ca3af]">Space Utilization</span>
                      <span className="text-white font-medium">
                        {warehouse.currentUtilization.utilizationPercentage.toFixed(
                          1,
                        )}
                        %
                      </span>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${
                          warehouse.currentUtilization.utilizationPercentage >=
                          90
                            ? "bg-red-500"
                            : warehouse.currentUtilization
                                  .utilizationPercentage >= 75
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{
                          width: `${warehouse.currentUtilization.utilizationPercentage}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-[#9ca3af] text-xs mb-0.5 leading-normal">
                        Pallet Positions
                      </div>
                      <div className="text-white font-medium leading-tight">
                        {warehouse.currentUtilization.usedPalletPositions.toFixed(
                          0,
                        )}{" "}
                        / {warehouse.capacity.totalPalletPositions.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#9ca3af] text-xs mb-0.5 leading-normal">
                        Orders Today
                      </div>
                      <div className="text-white font-medium leading-tight">
                        {warehouse.metrics.ordersToday}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#9ca3af] text-xs mb-0.5 leading-normal">
                        On-Time Delivery
                      </div>
                      <div className="text-white font-medium leading-tight">
                        {warehouse.metrics.onTimeDeliveryRate.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[#9ca3af] text-xs mb-0.5 leading-normal">
                        Accuracy
                      </div>
                      <div className="text-white font-medium leading-tight">
                        {warehouse.metrics.inventoryAccuracy.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Space Utilization Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-layout-grid-line text-cyan-400 text-lg"></i>
              <span>Space Utilization by Warehouse</span>
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={spaceUtilizationData}>
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
                  dataKey="utilization"
                  fill="#06b6d4"
                  name="Utilization %"
                />
                <Bar
                  dataKey="palletUtilization"
                  fill="#10b981"
                  name="Pallet Utilization %"
                />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Stock View */}
      {viewMode === "stock" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-stack-line text-cyan-400 text-lg"></i>
              <span>Stock by Customer</span>
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stockByCustomer.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  dataKey="customerName"
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
                <Bar dataKey="value" fill="#06b6d4" name="Stock Value (SAR)" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Space Utilization View */}
      {viewMode === "space" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-layout-grid-line text-cyan-400 text-lg"></i>
              <span>Detailed Space Utilization</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {filteredWarehouses.map((warehouse) => (
                <div
                  key={warehouse.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4"
                >
                  <h4 className="text-sm font-semibold text-white mb-3 leading-tight">
                    {warehouse.warehouseName}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[#9ca3af]">Area Utilization</span>
                        <span className="text-white font-medium">
                          {warehouse.currentUtilization.utilizationPercentage.toFixed(
                            1,
                          )}
                          %
                        </span>
                      </div>
                      <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full ${
                            warehouse.currentUtilization
                              .utilizationPercentage >= 90
                              ? "bg-red-500"
                              : warehouse.currentUtilization
                                    .utilizationPercentage >= 75
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${warehouse.currentUtilization.utilizationPercentage}%`,
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-[#9ca3af] mt-1 leading-normal">
                        {warehouse.currentUtilization.usedArea.toFixed(0)} /{" "}
                        {warehouse.capacity.totalArea.toFixed(0)} sqm
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[#9ca3af]">
                          Pallet Utilization
                        </span>
                        <span className="text-white font-medium">
                          {warehouse.currentUtilization.palletUtilizationPercentage.toFixed(
                            1,
                          )}
                          %
                        </span>
                      </div>
                      <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full ${
                            warehouse.currentUtilization
                              .palletUtilizationPercentage >= 90
                              ? "bg-red-500"
                              : warehouse.currentUtilization
                                    .palletUtilizationPercentage >= 75
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${warehouse.currentUtilization.palletUtilizationPercentage}%`,
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-[#9ca3af] mt-1 leading-normal">
                        {warehouse.currentUtilization.usedPalletPositions.toFixed(
                          0,
                        )}{" "}
                        / {warehouse.capacity.totalPalletPositions.toFixed(0)}{" "}
                        positions
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Transactions View */}
      {viewMode === "transactions" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-exchange-line text-cyan-400 text-lg"></i>
              <span>Transaction Summary</span>
            </h3>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1.5 leading-normal">
                  Today
                </div>
                <div className="text-2xl font-bold text-white leading-none mb-1">
                  {transactionSummary.today}
                </div>
                <div className="text-xs text-cyan-400 leading-normal">
                  orders
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1.5 leading-normal">
                  This Week
                </div>
                <div className="text-2xl font-bold text-white leading-none mb-1">
                  {transactionSummary.thisWeek}
                </div>
                <div className="text-xs text-cyan-400 leading-normal">
                  orders
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1.5 leading-normal">
                  This Month
                </div>
                <div className="text-2xl font-bold text-white leading-none mb-1">
                  {transactionSummary.thisMonth}
                </div>
                <div className="text-xs text-cyan-400 leading-normal">
                  orders
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1.5 leading-normal">
                  Total
                </div>
                <div className="text-2xl font-bold text-white leading-none mb-1">
                  {transactionSummary.total}
                </div>
                <div className="text-xs text-cyan-400 leading-normal">
                  orders
                </div>
              </div>
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
              <span>Warehouse Performance Metrics</span>
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={performanceMetrics}>
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
                  dataKey="ordersToday"
                  fill="#06b6d4"
                  name="Orders Today"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="onTimeDelivery"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="On-Time Delivery %"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="inventoryAccuracy"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  name="Inventory Accuracy %"
                />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Warehouse Detail Modal */}
      <Modal
        isOpen={showWarehouseModal}
        onClose={() => {
          setShowWarehouseModal(false);
          setSelectedWarehouse(null);
        }}
        title={`Warehouse Details - ${selectedWarehouse?.warehouseName || ""}`}
        size="lg"
      >
        {selectedWarehouse && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1.5 block leading-normal">
                  Warehouse Code
                </label>
                <div className="text-sm text-white font-mono leading-tight">
                  {selectedWarehouse.warehouseCode}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1.5 block leading-normal">
                  Type
                </label>
                <div className="text-sm text-white leading-tight">
                  {selectedWarehouse.type}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1.5 block leading-normal">
                  Total Area
                </label>
                <div className="text-sm text-white leading-tight">
                  {selectedWarehouse.capacity.totalArea.toFixed(0)} sqm
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1.5 block leading-normal">
                  Used Area
                </label>
                <div className="text-sm text-white leading-tight">
                  {selectedWarehouse.currentUtilization.usedArea.toFixed(0)} sqm
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1.5 block leading-normal">
                  Space Utilization
                </label>
                <div className="text-sm text-white font-medium leading-tight">
                  {selectedWarehouse.currentUtilization.utilizationPercentage.toFixed(
                    1,
                  )}
                  %
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1.5 block leading-normal">
                  Pallet Positions
                </label>
                <div className="text-sm text-white leading-tight">
                  {selectedWarehouse.currentUtilization.usedPalletPositions.toFixed(
                    0,
                  )}{" "}
                  / {selectedWarehouse.capacity.totalPalletPositions.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}

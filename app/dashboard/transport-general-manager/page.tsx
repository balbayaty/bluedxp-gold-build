/**
 * Transport General Manager Dashboard
 *
 * Comprehensive executive-level dashboard for transportation operations oversight
 * - Carrier performance management
 * - Cost optimization and financial analytics
 * - Route optimization insights
 * - Customs and compliance monitoring
 * - Sustainability tracking
 * - Real-time operational visibility
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useViewContext } from "@/contexts/ViewContextProvider";
import { useRouter } from "next/navigation";
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
import Tooltip from "@/components/Tooltip";
import CurrencyDisplay from "@/components/CurrencyDisplay";
import { apiFetch } from "@/utils/apiFetch";
import type { Shipment, Carrier, TransportationAnalytics } from "@/types/tms";

interface TransportMetrics {
  totalShipments: number;
  activeShipments: number;
  onTimeDeliveryRate: number;
  totalFreightSpend: number;
  averageTransitTime: number;
  carrierPerformanceScore: number;
  customsClearanceRate: number;
  exceptionRate: number;
  costSavingsVsBudget: number;
}

interface CarrierPerformance {
  carrierId: string;
  carrierName: string;
  shipmentCount: number;
  onTimeRate: number;
  averageCost: number;
  averageTransitTime: number;
  exceptionRate: number;
  performanceScore: number;
}

export default function TransportGeneralManagerDashboard() {
  const { user, tenant } = useAuth();
  const { context } = useViewContext();
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<
    "7D" | "30D" | "90D" | "YTD" | "ALL"
  >("30D");
  const [viewMode, setViewMode] = useState<
    | "overview"
    | "carriers"
    | "financial"
    | "routes"
    | "customs"
    | "sustainability"
  >("overview");

  useEffect(() => {
    loadData();
  }, [timeRange, user?.tenantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [shipRes, carRes] = await Promise.all([
        apiFetch("/api/transportation/shipments?limit=1000").catch(() => ({
          ok: false,
          json: async () => [],
        })),
        apiFetch("/api/transportation/carriers?limit=500").catch(() => ({
          ok: false,
          json: async () => [],
        })),
      ]);

      let shipmentsData: Shipment[] = [];
      let carriersData: Carrier[] = [];

      try {
        if (shipRes.ok) {
          shipmentsData = (await shipRes.json()) as Shipment[];
        }
      } catch (e) {
        console.warn("Failed to parse shipments data:", e);
      }

      try {
        if (carRes.ok) {
          carriersData = (await carRes.json()) as Carrier[];
        }
      } catch (e) {
        console.warn("Failed to parse carriers data:", e);
      }

      // Filter by time range
      const now = new Date();
      const filteredShipments = Array.isArray(shipmentsData)
        ? shipmentsData.filter((s) => {
            if (timeRange === "ALL") return true;
            const created = new Date(
              (s as any).createdAt || (s as any).created_at || now,
            );
            const daysAgo =
              timeRange === "7D"
                ? 7
                : timeRange === "30D"
                  ? 30
                  : timeRange === "90D"
                    ? 90
                    : 365;
            return (
              created >= new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
            );
          })
        : [];

      setShipments(filteredShipments);
      setCarriers(Array.isArray(carriersData) ? carriersData : []);
    } catch (err) {
      console.error("Error loading transportation data:", err);
      setError(err instanceof Error ? err.message : String(err));
      // Set empty arrays to prevent crashes
      setShipments([]);
      setCarriers([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate comprehensive metrics
  const metrics = useMemo((): TransportMetrics => {
    const totalShipments = shipments.length;
    const activeShipments = shipments.filter((s) =>
      [
        "BOOKED",
        "PICKED_UP",
        "IN_TRANSIT",
        "AT_PORT",
        "CUSTOMS_CLEARANCE",
        "OUT_FOR_DELIVERY",
      ].includes(s.status),
    ).length;

    const deliveredShipments = shipments.filter(
      (s) => s.status === "DELIVERED",
    );
    const onTimeEligible = deliveredShipments.filter(
      (s) => (s as any).estimatedDelivery && (s as any).actualDelivery,
    );
    const onTimeCount = onTimeEligible.filter((s) => {
      const est = new Date(String((s as any).estimatedDelivery));
      const act = new Date(String((s as any).actualDelivery));
      return !isNaN(est.getTime()) && !isNaN(act.getTime()) && act <= est;
    }).length;
    const onTimeDeliveryRate =
      onTimeEligible.length > 0
        ? Math.round((onTimeCount / onTimeEligible.length) * 100)
        : 0;

    const totalFreightSpend = shipments.reduce((sum, s) => {
      const cost =
        (s as any).freightCharges?.total ??
        (s as any).totalCost ??
        (s as any).cost ??
        0;
      return sum + (typeof cost === "number" ? cost : 0);
    }, 0);

    const transitEligible = shipments.filter(
      (s) => (s as any).pickupDate && (s as any).actualDelivery,
    );
    const transitTimes = transitEligible
      .map((s) => {
        const pickup = new Date(String((s as any).pickupDate));
        const delivery = new Date(String((s as any).actualDelivery));
        if (isNaN(pickup.getTime()) || isNaN(delivery.getTime())) return null;
        return Math.max(
          0,
          (delivery.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24),
        );
      })
      .filter((v): v is number => v !== null);
    const averageTransitTime =
      transitTimes.length > 0
        ? Math.round(
            (transitTimes.reduce((a, b) => a + b, 0) / transitTimes.length) *
              10,
          ) / 10
        : 0;

    // Carrier performance score (weighted average)
    const carrierMap = new Map<string, { onTime: number; total: number }>();
    shipments.forEach((s) => {
      if (!(s as any).carrierId) return;
      const key = String((s as any).carrierId);
      const data = carrierMap.get(key) || { onTime: 0, total: 0 };
      if (
        s.status === "DELIVERED" &&
        (s as any).estimatedDelivery &&
        (s as any).actualDelivery
      ) {
        data.total++;
        const est = new Date(String((s as any).estimatedDelivery));
        const act = new Date(String((s as any).actualDelivery));
        if (act <= est) data.onTime++;
      }
      carrierMap.set(key, data);
    });
    const carrierScores = Array.from(carrierMap.values()).map((d) =>
      d.total > 0 ? (d.onTime / d.total) * 100 : 0,
    );
    const carrierPerformanceScore =
      carrierScores.length > 0
        ? Math.round(
            carrierScores.reduce((a, b) => a + b, 0) / carrierScores.length,
          )
        : 0;

    // Customs clearance rate
    const customsShipments = shipments.filter((s) => (s as any).customs);
    const clearedShipments = customsShipments.filter(
      (s) => (s as any).customs?.status === "CLEARED",
    );
    const customsClearanceRate =
      customsShipments.length > 0
        ? Math.round((clearedShipments.length / customsShipments.length) * 100)
        : 0;

    // Exception rate
    const exceptionShipments = shipments.filter(
      (s) => s.status === "EXCEPTION" || (s as any).hasException,
    );
    const exceptionRate =
      totalShipments > 0
        ? Math.round((exceptionShipments.length / totalShipments) * 100)
        : 0;

    // Cost savings vs budget (mock - would come from budget service)
    const costSavingsVsBudget = 0; // TODO: Integrate with budget service

    return {
      totalShipments,
      activeShipments,
      onTimeDeliveryRate,
      totalFreightSpend,
      averageTransitTime,
      carrierPerformanceScore,
      customsClearanceRate,
      exceptionRate,
      costSavingsVsBudget,
    };
  }, [shipments]);

  // Carrier performance data
  const carrierPerformance = useMemo((): CarrierPerformance[] => {
    const carrierMap = new Map<
      string,
      {
        name: string;
        shipments: Shipment[];
        onTime: number;
        total: number;
        totalCost: number;
        totalTransitTime: number;
        transitCount: number;
        exceptions: number;
      }
    >();

    shipments.forEach((s) => {
      const carrierId = String((s as any).carrierId || "unknown");
      const carrierName =
        (s as any).carrierName ||
        carriers.find((c) => String(c.id) === carrierId)?.name ||
        carrierId;

      const data = carrierMap.get(carrierId) || {
        name: carrierName,
        shipments: [],
        onTime: 0,
        total: 0,
        totalCost: 0,
        totalTransitTime: 0,
        transitCount: 0,
        exceptions: 0,
      };

      data.shipments.push(s);
      const cost =
        (s as any).freightCharges?.total ??
        (s as any).totalCost ??
        (s as any).cost ??
        0;
      data.totalCost += typeof cost === "number" ? cost : 0;

      if (
        s.status === "DELIVERED" &&
        (s as any).estimatedDelivery &&
        (s as any).actualDelivery
      ) {
        data.total++;
        const est = new Date(String((s as any).estimatedDelivery));
        const act = new Date(String((s as any).actualDelivery));
        if (act <= est) data.onTime++;
      }

      if ((s as any).pickupDate && (s as any).actualDelivery) {
        const pickup = new Date(String((s as any).pickupDate));
        const delivery = new Date(String((s as any).actualDelivery));
        if (!isNaN(pickup.getTime()) && !isNaN(delivery.getTime())) {
          data.totalTransitTime +=
            (delivery.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24);
          data.transitCount++;
        }
      }

      if (s.status === "EXCEPTION" || (s as any).hasException) {
        data.exceptions++;
      }

      carrierMap.set(carrierId, data);
    });

    return Array.from(carrierMap.entries())
      .map(([carrierId, data]) => {
        const onTimeRate =
          data.total > 0 ? (data.onTime / data.total) * 100 : 0;
        const avgCost =
          data.shipments.length > 0
            ? data.totalCost / data.shipments.length
            : 0;
        const avgTransitTime =
          data.transitCount > 0 ? data.totalTransitTime / data.transitCount : 0;
        const exceptionRate =
          data.shipments.length > 0
            ? (data.exceptions / data.shipments.length) * 100
            : 0;

        // Performance score: weighted combination
        const performanceScore = Math.round(
          onTimeRate * 0.4 +
            (100 - exceptionRate) * 0.3 +
            (data.shipments.length > 0
              ? Math.min(100, (1000 / avgCost) * 10)
              : 0) *
              0.3,
        );

        return {
          carrierId,
          carrierName: data.name,
          shipmentCount: data.shipments.length,
          onTimeRate: Math.round(onTimeRate),
          averageCost: Math.round(avgCost),
          averageTransitTime: Math.round(avgTransitTime * 10) / 10,
          exceptionRate: Math.round(exceptionRate),
          performanceScore,
        };
      })
      .sort((a, b) => b.performanceScore - a.performanceScore);
  }, [shipments, carriers]);

  // Mode distribution
  const modeDistribution = useMemo(() => {
    const modeCounts = new Map<string, number>();
    shipments.forEach((s) => {
      const mode = String((s as any).mode || "UNKNOWN").toUpperCase();
      modeCounts.set(mode, (modeCounts.get(mode) || 0) + 1);
    });
    const total = shipments.length;
    return Array.from(modeCounts.entries())
      .map(([mode, count]) => ({
        mode,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [shipments]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const statusCounts = new Map<string, number>();
    shipments.forEach((s) => {
      const status = String(s.status || "DRAFT").toUpperCase();
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    });
    const total = shipments.length;
    return Array.from(statusCounts.entries())
      .map(([status, count]) => ({
        status,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [shipments]);

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#ec4899",
  ];

  if (loading) {
    return (
      <PageTemplate
        title="Transport General Manager Dashboard"
        description="Comprehensive transportation operations oversight"
        icon="ri-truck-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-white/70">Loading transportation data...</div>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Transport General Manager Dashboard"
      description="Strategic transportation oversight, carrier management, and cost optimization"
      icon="ri-truck-line"
      actions={
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm"
          >
            <option value="7D">Last 7 Days</option>
            <option value="30D">Last 30 Days</option>
            <option value="90D">Last 90 Days</option>
            <option value="YTD">Year to Date</option>
            <option value="ALL">All Time</option>
          </select>
          <button
            onClick={() => router.push("/transportation")}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm flex items-center gap-2"
          >
            <i className="ri-external-link-line"></i>
            Transportation Module
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-200">
            {error}
          </div>
        )}

        {/* View Context Selectors */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomerSelector />
            <ViewScopeSelector />
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
          <div className="flex gap-2 overflow-x-auto">
            {(
              [
                "overview",
                "carriers",
                "financial",
                "routes",
                "customs",
                "sustainability",
              ] as const
            ).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  viewMode === mode
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Executive Summary - Key Metrics */}
        {viewMode === "overview" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Shipments</p>
                    <p className="text-3xl font-bold mt-1">
                      {metrics.totalShipments.toLocaleString()}
                    </p>
                    <p className="text-blue-100 text-xs mt-1">
                      {metrics.activeShipments} active
                    </p>
                  </div>
                  <div className="text-4xl opacity-50">📦</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">On-Time Delivery</p>
                    <p className="text-3xl font-bold mt-1">
                      {metrics.onTimeDeliveryRate}%
                    </p>
                    <p className="text-green-100 text-xs mt-1">
                      Carrier Score: {metrics.carrierPerformanceScore}%
                    </p>
                  </div>
                  <div className="text-4xl opacity-50">✅</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">
                      Total Freight Spend
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {(metrics.totalFreightSpend / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-purple-100 text-xs mt-1">SAR</p>
                  </div>
                  <div className="text-4xl opacity-50">💰</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Avg Transit Time</p>
                    <p className="text-3xl font-bold mt-1">
                      {metrics.averageTransitTime}
                    </p>
                    <p className="text-orange-100 text-xs mt-1">days</p>
                  </div>
                  <div className="text-4xl opacity-50">⏱️</div>
                </div>
              </motion.div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Customs Clearance Rate
                    </p>
                    <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                      {metrics.customsClearanceRate}%
                    </p>
                  </div>
                  <div className="text-3xl">🛂</div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Exception Rate
                    </p>
                    <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                      {metrics.exceptionRate}%
                    </p>
                  </div>
                  <div className="text-3xl">⚠️</div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Carrier Performance
                    </p>
                    <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                      {metrics.carrierPerformanceScore}%
                    </p>
                  </div>
                  <div className="text-3xl">⭐</div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mode Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">
                  Transport Mode Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={modeDistribution}
                      dataKey="count"
                      nameKey="mode"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ mode, percentage }) =>
                        `${mode}: ${percentage}%`
                      }
                    >
                      {modeDistribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Status Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Shipment Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Carrier Performance View */}
        {viewMode === "carriers" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">
                Carrier Performance
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-3 text-sm font-semibold">
                        Carrier
                      </th>
                      <th className="text-right p-3 text-sm font-semibold">
                        Shipments
                      </th>
                      <th className="text-right p-3 text-sm font-semibold">
                        On-Time Rate
                      </th>
                      <th className="text-right p-3 text-sm font-semibold">
                        Avg Cost
                      </th>
                      <th className="text-right p-3 text-sm font-semibold">
                        Avg Transit
                      </th>
                      <th className="text-right p-3 text-sm font-semibold">
                        Exception Rate
                      </th>
                      <th className="text-right p-3 text-sm font-semibold">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrierPerformance.map((carrier) => (
                      <tr
                        key={carrier.carrierId}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="p-3 text-sm">{carrier.carrierName}</td>
                        <td className="p-3 text-sm text-right">
                          {carrier.shipmentCount}
                        </td>
                        <td className="p-3 text-sm text-right">
                          <span
                            className={
                              carrier.onTimeRate >= 90
                                ? "text-green-600"
                                : carrier.onTimeRate >= 70
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }
                          >
                            {carrier.onTimeRate}%
                          </span>
                        </td>
                        <td className="p-3 text-sm text-right">
                          <CurrencyDisplay amount={carrier.averageCost} />
                        </td>
                        <td className="p-3 text-sm text-right">
                          {carrier.averageTransitTime} days
                        </td>
                        <td className="p-3 text-sm text-right">
                          <span
                            className={
                              carrier.exceptionRate <= 5
                                ? "text-green-600"
                                : carrier.exceptionRate <= 15
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }
                          >
                            {carrier.exceptionRate}%
                          </span>
                        </td>
                        <td className="p-3 text-sm text-right">
                          <span
                            className={`font-semibold ${carrier.performanceScore >= 80 ? "text-green-600" : carrier.performanceScore >= 60 ? "text-yellow-600" : "text-red-600"}`}
                          >
                            {carrier.performanceScore}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Carrier Performance Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">
                Carrier Performance Matrix
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={carrierPerformance.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="carrierName"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="onTimeRate"
                    fill="#10b981"
                    name="On-Time Rate %"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="performanceScore"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Performance Score"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Financial Analytics View */}
        {viewMode === "financial" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Financial Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Freight Spend
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  <CurrencyDisplay amount={metrics.totalFreightSpend} />
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Cost per Shipment
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  <CurrencyDisplay
                    amount={
                      metrics.totalShipments > 0
                        ? metrics.totalFreightSpend / metrics.totalShipments
                        : 0
                    }
                  />
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cost by Mode
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  See breakdown below
                </p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Financial analytics and cost breakdowns will be displayed here.
              Integration with financial services coming soon.
            </p>
          </div>
        )}

        {/* Routes View */}
        {viewMode === "routes" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Route Optimization</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Route optimization insights and analytics will be displayed here.
              Integration with route optimization service coming soon.
            </p>
          </div>
        )}

        {/* Customs View */}
        {viewMode === "customs" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Customs & Compliance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Clearance Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {metrics.customsClearanceRate}%
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Compliance Status
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Monitoring active
                </p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Customs clearance tracking and compliance monitoring. Integration
              with customs service coming soon.
            </p>
          </div>
        )}

        {/* Sustainability View */}
        {viewMode === "sustainability" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">
              Sustainability & Carbon Footprint
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              CO2 emissions tracking and sustainability metrics. Integration
              with sustainability service coming soon.
            </p>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

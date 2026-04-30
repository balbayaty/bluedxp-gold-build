/**
 * Transportation Analytics Dashboard
 *
 * Comprehensive analytics with drill-down capabilities
 * Real-time, predictive, comparative analytics
 * Modern, professional, sexy UI
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Activity,
  Target,
  DollarSign,
  Clock,
  Package,
  Truck,
  Zap,
  Download,
  Filter,
  Calendar,
  RefreshCw,
  Maximize2,
} from "lucide-react";
import PageTemplate from "@/components/PageTemplate";
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
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { apiFetch } from "@/utils/apiFetch";
import type { Shipment, Carrier } from "@/types/tms";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function TransportationAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<
    "7D" | "30D" | "90D" | "1Y" | "ALL"
  >("30D");
  const [selectedMetric, setSelectedMetric] = useState<string>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [shipmentData, setShipmentData] = useState<
    Array<{
      date: string;
      shipments: number;
      delivered: number;
      inTransit: number;
      delayed: number;
    }>
  >([]);
  const [costData, setCostData] = useState<
    Array<{ month: string; cost: number; savings: number; efficiency: number }>
  >([]);
  const [modeDistribution, setModeDistribution] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  const [carrierPerformance, setCarrierPerformance] = useState<
    Array<{ carrier: string; onTime: number; cost: number; rating: number }>
  >([]);
  const [routeEfficiency, setRouteEfficiency] = useState<
    Array<{
      route: string;
      distance: number;
      time: number;
      cost: number;
      efficiency: number;
    }>
  >([]);

  function rangeToDays(r: typeof timeRange): number | null {
    switch (r) {
      case "7D":
        return 7;
      case "30D":
        return 30;
      case "90D":
        return 90;
      case "1Y":
        return 365;
      case "ALL":
      default:
        return null;
    }
  }

  function isoDay(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const [shipRes, carRes] = await Promise.all([
        apiFetch("/api/transportation/shipments?limit=500"),
        apiFetch("/api/transportation/carriers?limit=500"),
      ]);
      const shipments = (await shipRes.json()) as Shipment[];
      const carriers = (await carRes.json()) as Carrier[];

      const all = Array.isArray(shipments) ? shipments : [];
      const carrierList = Array.isArray(carriers) ? carriers : [];
      const carrierNameById = new Map<string, string>();
      for (const c of carrierList)
        carrierNameById.set(String(c.id), String(c.name || c.code || c.id));

      const days = rangeToDays(timeRange);
      const cutoff = days ? Date.now() - days * 24 * 60 * 60 * 1000 : null;
      const filtered = cutoff
        ? all.filter((s) => {
            const dt = new Date(
              String(
                (s as any).createdAt || (s as any).pickupDate || Date.now(),
              ),
            );
            return !Number.isNaN(dt.getTime()) && dt.getTime() >= cutoff;
          })
        : all;

      const statusOf = (s: Shipment) =>
        String((s as any).status || "DRAFT").toUpperCase();
      const isDelayed = (s: Shipment) => {
        const est = (s as any).estimatedDelivery;
        const act = (s as any).actualDelivery;
        if (!est || !act) return statusOf(s) === "EXCEPTION";
        const e = new Date(String(est));
        const a = new Date(String(act));
        if (Number.isNaN(e.getTime()) || Number.isNaN(a.getTime()))
          return statusOf(s) === "EXCEPTION";
        return a.getTime() > e.getTime();
      };

      // Daily shipment trend
      const daily = new Map<
        string,
        {
          shipments: number;
          delivered: number;
          inTransit: number;
          delayed: number;
        }
      >();
      for (const s of filtered) {
        const dt = new Date(
          String((s as any).createdAt || (s as any).pickupDate || Date.now()),
        );
        const key = isoDay(Number.isNaN(dt.getTime()) ? new Date() : dt);
        const row = daily.get(key) || {
          shipments: 0,
          delivered: 0,
          inTransit: 0,
          delayed: 0,
        };
        row.shipments += 1;
        if (statusOf(s) === "DELIVERED") row.delivered += 1;
        if (statusOf(s) === "IN_TRANSIT") row.inTransit += 1;
        if (isDelayed(s)) row.delayed += 1;
        daily.set(key, row);
      }
      const trend = Array.from(daily.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-Math.min(90, Math.max(7, daily.size)))
        .map(([date, v]) => ({ date, ...v }));
      setShipmentData(trend);

      // Mode distribution
      const modeCounts = new Map<string, number>();
      for (const s of filtered) {
        const mode = String((s as any).mode || "UNKNOWN").toUpperCase();
        modeCounts.set(mode, (modeCounts.get(mode) || 0) + 1);
      }
      const total = filtered.length || 1;
      const colorsByMode: Record<string, string> = {
        LAND: "#3b82f6",
        RAIL: "#10b981",
        AIR: "#f59e0b",
        SEA: "#8b5cf6",
        MULTIMODAL: "#ec4899",
      };
      setModeDistribution(
        Array.from(modeCounts.entries())
          .map(([name, count]) => ({
            name,
            value: Math.round((count / total) * 100),
            color: colorsByMode[name] || "#6b7280",
          }))
          .sort((a, b) => b.value - a.value),
      );

      // Carrier performance (derived from shipment on-time + carrier rating)
      const byCarrier = new Map<string, Shipment[]>();
      for (const s of filtered) {
        const cid = String((s as any).carrierId || "");
        if (!cid) continue;
        byCarrier.set(cid, [...(byCarrier.get(cid) || []), s]);
      }
      setCarrierPerformance(
        Array.from(byCarrier.entries())
          .map(([carrierId, ss]) => {
            const eligible = ss.filter(
              (x) => (x as any).estimatedDelivery && (x as any).actualDelivery,
            );
            const onTime = eligible.filter((x) => {
              const est = new Date(String((x as any).estimatedDelivery));
              const act = new Date(String((x as any).actualDelivery));
              if (Number.isNaN(est.getTime()) || Number.isNaN(act.getTime()))
                return false;
              return act.getTime() <= est.getTime();
            }).length;
            const onTimeRate =
              eligible.length > 0
                ? Math.round((onTime / eligible.length) * 100)
                : 0;
            const costPerShipment =
              ss.length > 0
                ? ss.reduce(
                    (sum, x) =>
                      sum + Number((x as any).freightCharges?.total || 0),
                    0,
                  ) / ss.length
                : 0;
            const rating =
              carrierList.find((c) => String(c.id) === carrierId)?.rating || 0;
            return {
              carrier: carrierNameById.get(carrierId) || carrierId,
              onTime: onTimeRate,
              cost: Number(costPerShipment.toFixed(2)),
              rating: Number((rating || 0).toFixed(1)),
            };
          })
          .sort((a, b) => b.onTime - a.onTime)
          .slice(0, 10),
      );

      // Route efficiency (derived from shipment.route)
      const routes = filtered
        .filter((s) => (s as any).route)
        .slice(0, 20)
        .map((s, idx) => {
          const r = (s as any).route || {};
          const distance = Number(r.distance || 0);
          const time = Number(r.estimatedDuration || 0);
          const cost = Number(r.cost || (s as any).freightCharges?.total || 0);
          const efficiency =
            distance > 0 && time > 0
              ? Math.min(100, Math.round((distance / time) * 10))
              : 0;
          return {
            route: `Route ${idx + 1}`,
            distance,
            time,
            cost,
            efficiency,
          };
        });
      setRouteEfficiency(routes);

      // Cost data by month (derived from shipments total cost)
      const byMonth = new Map<string, number>();
      for (const s of filtered) {
        const dt = new Date(String((s as any).createdAt || Date.now()));
        if (Number.isNaN(dt.getTime())) continue;
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
        const cost = Number((s as any).freightCharges?.total || 0);
        byMonth.set(
          key,
          (byMonth.get(key) || 0) + (Number.isFinite(cost) ? cost : 0),
        );
      }
      const costRows = Array.from(byMonth.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-12)
        .map(([key, cost]) => {
          const month = key.split("-")[1] || key;
          const efficiency =
            filtered.length > 0
              ? Math.min(
                  100,
                  Math.round(
                    50 +
                      (filtered.filter((s) => statusOf(s) === "DELIVERED")
                        .length /
                        filtered.length) *
                        50,
                  ),
                )
              : 0;
          // Savings is internal-only estimate: 0 when we can't compute.
          return { month, cost: Math.round(cost), savings: 0, efficiency };
        });
      setCostData(costRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setShipmentData([]);
      setCostData([]);
      setModeDistribution([]);
      setCarrierPerformance([]);
      setRouteEfficiency([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await load();
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  return (
    <PageTemplate
      title="Transportation Analytics"
      description="Comprehensive analytics with real-time insights, predictions, and drill-down capabilities"
      icon="ri-bar-chart-line"
      stats={[
        {
          label: "Total Shipments",
          value: shipmentData.reduce((sum, d) => sum + d.shipments, 0),
          icon: "ri-box-line",
        },
        {
          label: "On-Time Rate",
          value:
            carrierPerformance.length > 0
              ? `${Math.round(carrierPerformance.reduce((a, b) => a + b.onTime, 0) / carrierPerformance.length)}%`
              : "0%",
          icon: "ri-time-line",
        },
        {
          label: "Cost Savings",
          value: "0",
          icon: "ri-money-dollar-circle-line",
        },
        {
          label: "Efficiency",
          value:
            costData.length > 0
              ? `${Math.round(costData.reduce((a, b) => a + b.efficiency, 0) / costData.length)}%`
              : "0%",
          icon: "ri-speed-line",
        },
      ]}
      actions={
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            <option value="7D">Last 7 Days</option>
            <option value="30D">Last 30 Days</option>
            <option value="90D">Last 90 Days</option>
            <option value="1Y">Last Year</option>
            <option value="ALL">All Time</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {loading && (
          <div className="text-white/70">Loading live analytics…</div>
        )}
        {error && (
          <div className="text-red-300">Failed to load analytics: {error}</div>
        )}
        {!loading && !error && shipmentData.length === 0 && (
          <div className="text-white/70">
            No shipment data yet. Create shipments to see analytics.
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Shipment Volume"
            value={String(
              shipmentData.reduce((sum, d) => sum + d.shipments, 0),
            )}
            change=""
            trend="up"
            icon={Package}
            color="blue"
          />
          <MetricCard
            title="On-Time Delivery"
            value={
              carrierPerformance.length > 0
                ? `${Math.round(carrierPerformance.reduce((a, b) => a + b.onTime, 0) / carrierPerformance.length)}%`
                : "0%"
            }
            change=""
            trend="up"
            icon={Clock}
            color="green"
          />
          <MetricCard
            title="Cost Efficiency"
            value={
              costData.length > 0
                ? `${Math.round(costData.reduce((a, b) => a + b.efficiency, 0) / costData.length)}%`
                : "0%"
            }
            change=""
            trend="up"
            icon={DollarSign}
            color="purple"
          />
          <MetricCard
            title="Route Optimization"
            value={
              routeEfficiency.length > 0
                ? `${Math.round(routeEfficiency.reduce((a, b) => a + b.efficiency, 0) / routeEfficiency.length)}%`
                : "0%"
            }
            change=""
            trend="up"
            icon={Target}
            color="orange"
          />
        </div>

        {/* Shipment Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Shipment Trends
            </h3>
            <div className="flex items-center gap-2">
              {["ALL", "DELIVERED", "IN_TRANSIT", "DELAYED"].map((metric) => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    selectedMetric === metric
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {metric}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={shipmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="shipments"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="delivered"
                stackId="2"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="inTransit"
                stackId="3"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Cost Analysis
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Total Cost"
                />
                <Line
                  type="monotone"
                  dataKey="savings"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Savings"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Transportation Mode Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={modeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {modeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Carrier Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Carrier Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={carrierPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="carrier" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="onTime" fill="#3b82f6" name="On-Time %" />
              <Bar dataKey="rating" fill="#10b981" name="Rating" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Route Efficiency */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Route Efficiency Analysis
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={routeEfficiency}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="route" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="efficiency" fill="#8b5cf6" name="Efficiency %" />
              <Bar dataKey="cost" fill="#f59e0b" name="Cost ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageTemplate>
  );
}

function MetricCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: any;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400",
    green:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400",
    purple:
      "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400",
    orange:
      "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-6 border ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8" />
        <span
          className={`text-sm font-medium flex items-center gap-1 ${
            trend === "up"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {trend === "up" ? "↑" : "↓"} {change}
        </span>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-80">{title}</div>
    </motion.div>
  );
}

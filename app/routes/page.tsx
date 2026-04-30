"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
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
  Area,
  AreaChart,
} from "recharts";
import CurrencyDisplay from "@/components/CurrencyDisplay";
import MapView from "@/components/maps/MapView";
import { apiFetch } from "@/utils/apiFetch";

interface Route {
  id: string;
  routeNumber: string;
  shipmentNumber: string;
  trackingNumber: string;
  soNumber: string;
  carrierCode: string;
  carrierName: string;
  vehicleNumber: string;
  driverName: string;
  status:
    | "PLANNED"
    | "OPTIMIZING"
    | "OPTIMIZED"
    | "ACTIVE"
    | "COMPLETED"
    | "CANCELLED";
  optimizationType: "DISTANCE" | "TIME" | "COST" | "MULTI_OBJECTIVE";
  origin: string;
  destination: string;
  waypoints: Array<{
    sequence: number;
    location: string;
    address: string;
    lat: number;
    lng: number;
    estimatedArrival: Date | string;
    estimatedDeparture: Date | string;
    actualArrival?: Date | string | null;
  }>;
  totalDistance: number;
  optimizedDistance: number;
  timeSaved: number;
  costSaved: number;
  estimatedDuration: number;
  actualDuration?: number | null;
  trafficConditions: string;
  fuelConsumption: number;
  carbonFootprint: number;
  multiStopOptimized: boolean;
  createdAt: Date | string;
  optimizedAt?: Date | string | null;
}

export default function RouteOptimization() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shipmentFilter = searchParams.get("shipment");
  const trackingFilter = searchParams.get("tracking");
  const viewParam = searchParams.get("view");

  const [routes, setRoutes] = useState<Route[]>([]);
  const [shipments] = useState<any[]>([]);
  const [carriers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedOptimizationType, setSelectedOptimizationType] =
    useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "map" | "analytics">(
    "table",
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const res = await apiFetch("/api/transportation/routes");
        const data = (await res.json()) as Route[];
        if (!mounted) return;
        setRoutes(data || []);
      } catch (e) {
        if (!mounted) return;
        setLoadError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Control Tower deep-link support (e.g., /routes?view=analytics)
  useEffect(() => {
    if (
      viewParam === "table" ||
      viewParam === "map" ||
      viewParam === "analytics"
    )
      setViewMode(viewParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewParam]);

  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      const matchesSearch =
        route.routeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.trackingNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        route.soNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.carrierName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || route.status === selectedStatus;
      const matchesOptimizationType =
        selectedOptimizationType === "ALL" ||
        route.optimizationType === selectedOptimizationType;
      const matchesShipment =
        !shipmentFilter || route.shipmentNumber === shipmentFilter;
      const matchesTracking =
        !trackingFilter || route.trackingNumber === trackingFilter;
      return (
        matchesSearch &&
        matchesStatus &&
        matchesOptimizationType &&
        matchesShipment &&
        matchesTracking
      );
    });
  }, [
    routes,
    searchQuery,
    selectedStatus,
    selectedOptimizationType,
    shipmentFilter,
    trackingFilter,
  ]);

  const optimizationStats = useMemo(() => {
    const totalSavings = routes.reduce((sum, r) => sum + r.costSaved, 0);
    const totalTimeSaved = routes.reduce((sum, r) => sum + r.timeSaved, 0);
    const avgDistanceReduction =
      routes.reduce(
        (sum, r) =>
          sum +
          ((r.totalDistance - r.optimizedDistance) / r.totalDistance) * 100,
        0,
      ) / routes.length;
    const optimized = routes.filter(
      (r) =>
        r.status === "OPTIMIZED" ||
        r.status === "ACTIVE" ||
        r.status === "COMPLETED",
    ).length;
    return { totalSavings, totalTimeSaved, avgDistanceReduction, optimized };
  }, [routes]);

  const statusDistribution = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    routes.forEach((route) => {
      statusCounts[route.status] = (statusCounts[route.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));
  }, [routes]);

  const optimizationTypeStats = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    routes.forEach((route) => {
      typeCounts[route.optimizationType] =
        (typeCounts[route.optimizationType] || 0) + 1;
    });
    return Object.entries(typeCounts).map(([type, count]) => ({ type, count }));
  }, [routes]);

  const savingsTrend = useMemo(() => {
    return routes
      .filter((r) => r.status === "COMPLETED")
      .slice(-10)
      .map((route, idx) => ({
        route: route.routeNumber.substring(0, 8),
        distance: route.optimizedDistance,
        savings: route.costSaved,
        timeSaved: route.timeSaved,
      }));
  }, [routes]);

  const stats = [
    {
      label: "Total Routes",
      value: routes.length,
      icon: "ri-route-line",
      tooltip: "Total routes",
      trend: "up" as const,
    },
    {
      label: "Optimized",
      value: optimizationStats.optimized,
      icon: "ri-checkbox-circle-line",
      tooltip: "Optimized routes",
      trend: "up" as const,
    },
    {
      label: "Total Savings",
      value: optimizationStats.totalSavings,
      isCurrency: true,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total cost savings",
      trend: "up" as const,
    },
    {
      label: "Time Saved",
      value: `${optimizationStats.totalTimeSaved.toFixed(1)}h`,
      icon: "ri-time-line",
      tooltip: "Total time saved",
      trend: "up" as const,
    },
  ];

  const handleView = (route: Route) => {
    setSelectedRoute(route);
    setShowViewModal(true);
  };

  const handleOptimize = (route: Route) => {
    setSelectedRoute(route);
    setShowOptimizeModal(true);
  };

  const handleNavigateToTracking = (route: Route) => {
    router.push(`/tracking?tracking=${route.trackingNumber}`);
  };

  const handleNavigateToSO = (route: Route) => {
    router.push(`/sales-orders?so=${route.soNumber}`);
  };

  const handleNavigateToCarrier = (route: Route) => {
    router.push(`/carriers?carrier=${route.carrierCode}`);
  };

  const handleNavigateToLoadPlanning = (route: Route) => {
    router.push(`/load-planning?route=${route.routeNumber}`);
  };

  return (
    <PageTemplate
      title="Route Optimization"
      description="Interactive route optimization with multi-vehicle planning, traffic integration, and cost/time savings analysis"
      icon="ri-route-line"
      systemInfo={{
        sap: "Route Planning, Transportation Planning",
        oracle: "Route Optimization, Multi-Vehicle Routing",
        manhattan: "Route Optimization, TMS Integration",
      }}
      examples={[
        "Multi-vehicle route optimization",
        "Distance/time/cost optimization",
        "Traffic-aware routing",
        "Multi-stop planning",
        "Fuel consumption tracking",
        "Carbon footprint calculation",
        "Real-time route adjustments",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["table", "map", "analytics"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-cyan-500 text-white"
                    : "text-[#9ca3af] hover:text-white"
                }`}
              >
                <i
                  className={`ri-${mode === "table" ? "table-line" : mode === "map" ? "map-line" : "bar-chart-line"} mr-1`}
                ></i>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20">
            <i className="ri-add-line"></i>
            Create Route
          </button>
        </div>
      }
    >
      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"][
                          index % 5
                        ]
                      }
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
            <h3 className="text-lg font-semibold text-white mb-4">
              Optimization Type Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={optimizationTypeStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="type"
                  stroke="#9ca3af"
                  fontSize={10}
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
                <Bar dataKey="count" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:col-span-2"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Optimization Savings Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={savingsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="route" stroke="#9ca3af" fontSize={12} />
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
                  dataKey="savings"
                  fill="#10b981"
                  name="Cost Savings (SAR)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="timeSaved"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="Time Saved (h)"
                />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Map View */}
      {viewMode === "map" && (
        <div className="mb-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Interactive Route Map
          </h3>
          <MapView
            center={
              filteredRoutes.length > 0 &&
              filteredRoutes[0].waypoints.length > 0
                ? {
                    lat: filteredRoutes[0].waypoints[0].lat,
                    lng: filteredRoutes[0].waypoints[0].lng,
                  }
                : { lat: 24.7136, lng: 46.6753 }
            }
            zoom={10}
            markers={filteredRoutes.flatMap((route) => [
              ...route.waypoints.map((wp, idx) => ({
                id: `${route.id}-wp-${idx}`,
                location: {
                  address: wp.address,
                  city: wp.location,
                  country: "",
                  coordinates: { lat: wp.lat, lng: wp.lng },
                },
                label:
                  idx === 0
                    ? "O"
                    : idx === route.waypoints.length - 1
                      ? "D"
                      : `${idx}`,
                color:
                  idx === 0
                    ? "#10b981"
                    : idx === route.waypoints.length - 1
                      ? "#ef4444"
                      : "#3b82f6",
              })),
            ])}
            height="600px"
            interactive={true}
            showControls={true}
          />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search by Route Number, Tracking, SO Number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Status</option>
          <option value="PLANNED">Planned</option>
          <option value="OPTIMIZING">Optimizing</option>
          <option value="OPTIMIZED">Optimized</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          value={selectedOptimizationType}
          onChange={(e) => setSelectedOptimizationType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[200px]"
        >
          <option value="ALL">All Types</option>
          <option value="DISTANCE">Distance</option>
          <option value="TIME">Time</option>
          <option value="COST">Cost</option>
          <option value="MULTI_OBJECTIVE">Multi-Objective</option>
        </select>
      </div>

      {/* Routes Table */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Route Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Sales Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Carrier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Origin → Destination
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Distance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Optimization
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Savings
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredRoutes.map((route, index) => {
                  const distanceReduction =
                    ((route.totalDistance - route.optimizedDistance) /
                      route.totalDistance) *
                    100;
                  return (
                    <motion.tr
                      key={route.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white font-mono">
                          {route.routeNumber}
                        </div>
                        <div className="text-xs text-[#9ca3af] font-mono">
                          {route.trackingNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleNavigateToSO(route)}
                          className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                        >
                          {route.soNumber}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleNavigateToCarrier(route)}
                          className="text-sm text-white hover:text-cyan-400 transition-colors cursor-pointer"
                        >
                          {route.carrierName}
                        </button>
                        <div className="text-xs text-[#9ca3af] font-mono">
                          {route.carrierCode}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{route.origin}</div>
                        <div className="text-xs text-[#9ca3af]">
                          → {route.destination}
                        </div>
                        {route.multiStopOptimized && (
                          <div className="text-xs text-purple-400 mt-1">
                            <i className="ri-map-pin-line mr-1"></i>
                            {route.waypoints.length} stops
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white font-medium">
                          {route.optimizedDistance.toFixed(1)} km
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          <span className="line-through">
                            {route.totalDistance.toFixed(1)}
                          </span>
                          <span className="text-green-400 ml-1">
                            -{distanceReduction.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {route.optimizationType.replace(/_/g, " ")}
                        </div>
                        {route.multiStopOptimized && (
                          <div className="text-xs text-purple-400">
                            Multi-stop
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-400 font-medium">
                          <CurrencyDisplay
                            amount={route.costSaved}
                            size="sm"
                            variant="highlight"
                          />
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {route.timeSaved.toFixed(1)}h saved
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            route.status === "COMPLETED"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : route.status === "ACTIVE"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : route.status === "OPTIMIZED"
                                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                  : route.status === "OPTIMIZING"
                                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {route.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Tooltip content="View Details" position="top">
                            <button
                              onClick={() => handleView(route)}
                              className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                            >
                              <i className="ri-eye-line"></i>
                            </button>
                          </Tooltip>
                          {route.status === "PLANNED" && (
                            <Tooltip content="Optimize Route" position="top">
                              <button
                                onClick={() => handleOptimize(route)}
                                className="p-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-600/30 transition-colors"
                              >
                                <i className="ri-magic-line"></i>
                              </button>
                            </Tooltip>
                          )}
                          <Tooltip content="View Tracking" position="top">
                            <button
                              onClick={() => handleNavigateToTracking(route)}
                              className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                            >
                              <i className="ri-map-pin-line"></i>
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedRoute(null);
        }}
        title={`Route Details - ${selectedRoute?.routeNumber || ""}`}
        size="lg"
      >
        {selectedRoute && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Route Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedRoute.routeNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Sales Order
                </label>
                <button
                  onClick={() => handleNavigateToSO(selectedRoute)}
                  className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {selectedRoute.soNumber}
                </button>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Carrier
                </label>
                <button
                  onClick={() => handleNavigateToCarrier(selectedRoute)}
                  className="text-sm text-white hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {selectedRoute.carrierName}
                </button>
                <div className="text-xs text-[#9ca3af] font-mono">
                  {selectedRoute.carrierCode}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Optimization Type
                </label>
                <div className="text-sm text-white">
                  {selectedRoute.optimizationType.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedRoute.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedRoute.status === "ACTIVE"
                        ? "bg-blue-500/20 text-blue-400"
                        : selectedRoute.status === "OPTIMIZED"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedRoute.status}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Vehicle
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedRoute.vehicleNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Total Distance
                </label>
                <div className="text-sm text-white">
                  {selectedRoute.totalDistance.toFixed(1)} km
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Optimized Distance
                </label>
                <div className="text-sm text-green-400 font-medium">
                  {selectedRoute.optimizedDistance.toFixed(1)} km
                </div>
                <div className="text-xs text-[#9ca3af]">
                  Saved:{" "}
                  {(
                    ((selectedRoute.totalDistance -
                      selectedRoute.optimizedDistance) /
                      selectedRoute.totalDistance) *
                    100
                  ).toFixed(1)}
                  %
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Cost Savings
                </label>
                <div className="text-sm text-green-400 font-medium">
                  <CurrencyDisplay
                    amount={selectedRoute.costSaved}
                    size="sm"
                    variant="highlight"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Time Saved
                </label>
                <div className="text-sm text-green-400 font-medium">
                  {selectedRoute.timeSaved.toFixed(1)} hours
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Fuel Consumption
                </label>
                <div className="text-sm text-white">
                  {selectedRoute.fuelConsumption.toFixed(2)} liters
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Carbon Footprint
                </label>
                <div className="text-sm text-white">
                  {selectedRoute.carbonFootprint.toFixed(2)} kg CO2
                </div>
              </div>
            </div>
            {selectedRoute.waypoints.length > 0 && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Route Waypoints ({selectedRoute.waypoints.length} stops)
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedRoute.waypoints.map((waypoint, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-medium">
                        {waypoint.sequence}
                      </div>
                      <div className="flex-1">
                        <div className="text-white">{waypoint.location}</div>
                        <div className="text-xs text-[#9ca3af]">
                          {waypoint.address}
                        </div>
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {format(new Date(waypoint.estimatedArrival), "HH:mm")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => handleNavigateToTracking(selectedRoute)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-map-pin-line"></i>
                View Tracking
              </button>
              <button
                onClick={() => handleNavigateToSO(selectedRoute)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-shopping-cart-2-line"></i>
                View Sales Order
              </button>
              <button
                onClick={() => handleNavigateToCarrier(selectedRoute)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-truck-line"></i>
                View Carrier
              </button>
              <button
                onClick={() => handleNavigateToLoadPlanning(selectedRoute)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-truck-line"></i>
                View Load Plan
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Optimize Route Modal */}
      <Modal
        isOpen={showOptimizeModal}
        onClose={() => {
          setShowOptimizeModal(false);
          setSelectedRoute(null);
        }}
        title={`Optimize Route - ${selectedRoute?.routeNumber || ""}`}
        size="md"
      >
        {selectedRoute && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-white mb-2">
                Current Distance:{" "}
                <span className="font-medium">
                  {selectedRoute.totalDistance.toFixed(1)} km
                </span>
              </div>
              <div className="text-sm text-white mb-2">
                Stops:{" "}
                <span className="font-medium">
                  {selectedRoute.waypoints.length}
                </span>
              </div>
              <div className="text-sm text-white">
                Origin:{" "}
                <span className="font-medium">{selectedRoute.origin}</span>
              </div>
              <div className="text-sm text-white">
                Destination:{" "}
                <span className="font-medium">{selectedRoute.destination}</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-2 block">
                Optimization Type
              </label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500">
                <option>Distance (Shortest Path)</option>
                <option>Time (Fastest Route)</option>
                <option>Cost (Most Economical)</option>
                <option>Multi-Objective (Balanced)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <label className="text-sm text-white">
                Consider traffic conditions
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <label className="text-sm text-white">
                Optimize multi-stop sequence
              </label>
            </div>
            <div className="flex items-center gap-3 justify-end pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setShowOptimizeModal(false);
                  setSelectedRoute(null);
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setRoutes((prev) =>
                    prev.map((r) =>
                      r.id === selectedRoute.id
                        ? {
                            ...r,
                            status: "OPTIMIZED",
                            optimizedDistance: r.totalDistance * 0.9,
                            optimizedAt: new Date(),
                          }
                        : r,
                    ),
                  );
                  setShowOptimizeModal(false);
                  setSelectedRoute(null);
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg transition-colors"
              >
                Optimize Route
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}

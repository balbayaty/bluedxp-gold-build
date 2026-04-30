"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import { getShipmentTrackingLinks } from "@/utils/moduleInterconnectivity";
import { format, differenceInMinutes, differenceInHours } from "date-fns";
import {
  LineChart,
  Line,
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
  Area,
  AreaChart,
} from "recharts";
import { realtimeSimulator } from "@/utils/realtimeDataSimulator";
import { apiFetch } from "@/utils/apiFetch";
import UniversalQRGenerator from "@/components/qr/UniversalQRGenerator";
import QRCodeBadge from "@/components/qr/QRCodeBadge";

interface Shipment {
  id: string;
  trackingNumber: string;
  shipmentNumber: string;
  soNumber: string;
  customerNumber: string;
  customerName: string;
  carrierCode: string;
  carrierName: string;
  status:
    | "CREATED"
    | "PICKED_UP"
    | "IN_TRANSIT"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "EXCEPTION"
    | "RETURNED";
  pickupDate: Date | string;
  estimatedDelivery: Date | string;
  actualDelivery?: Date | string | null;
  origin: string;
  destination: string;
  currentLocation: {
    lat: number;
    lng: number;
    address: string;
    timestamp: Date | string;
  };
  destinationLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  distance: number;
  estimatedTimeRemaining: number;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  exceptionType?: string | null;
  exceptionDescription?: string | null;
  podStatus?: "PENDING" | "COMPLETED";
  podDate?: Date | string | null;
  totalWeight: number;
  totalVolume: number;
  totalItems: number;
  createdAt: Date | string;
  lastUpdate: Date | string;
}

export default function ShipmentTracking() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const soFilter = searchParams.get("so");
  const statusParam = searchParams.get("status");
  const viewParam = searchParams.get("view");

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCarrier, setSelectedCarrier] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "map" | "analytics">(
    "table",
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null,
  );
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [carriers, setCarriers] = useState<
    Array<{ carrierCode: string; carrierName: string }>
  >([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const res = await apiFetch("/api/transportation/tracking");
        const data = (await res.json()) as Shipment[];
        if (!mounted) return;
        setShipments(data || []);
        const carrierMap = new Map<string, string>();
        (data || []).forEach((s) => {
          if (s.carrierCode)
            carrierMap.set(s.carrierCode, s.carrierName || s.carrierCode);
        });
        setCarriers(
          Array.from(carrierMap.entries()).map(
            ([carrierCode, carrierName]) => ({ carrierCode, carrierName }),
          ),
        );
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

  // Control Tower deep-link support (e.g., /tracking?status=EXCEPTION&view=table)
  useEffect(() => {
    if (statusParam) setSelectedStatus(statusParam);
    if (
      viewParam === "table" ||
      viewParam === "map" ||
      viewParam === "analytics"
    )
      setViewMode(viewParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusParam, viewParam]);

  // Filter by SO if provided in URL
  const filteredShipments = useMemo(() => {
    let filtered = shipments.filter((shipment) => {
      const matchesSearch =
        (shipment.trackingNumber || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (shipment.shipmentNumber || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (shipment.soNumber || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (shipment.customerName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || shipment.status === selectedStatus;
      const matchesCarrier =
        selectedCarrier === "ALL" || shipment.carrierCode === selectedCarrier;
      const matchesSO = !soFilter || shipment.soNumber === soFilter;
      return matchesSearch && matchesStatus && matchesCarrier && matchesSO;
    });
    return filtered;
  }, [shipments, searchQuery, selectedStatus, selectedCarrier, soFilter]);

  // Real-time GPS updates simulation
  useEffect(() => {
    if (!realTimeUpdates) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "shipments",
      (update: any) => {
        setShipments((prev) =>
          prev.map((shipment) => {
            if (
              shipment.id === update.id &&
              ["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(shipment.status)
            ) {
              return {
                ...shipment,
                currentLocation: {
                  ...shipment.currentLocation,
                  lat:
                    shipment.currentLocation.lat + (Math.random() - 0.5) * 0.01,
                  lng:
                    shipment.currentLocation.lng + (Math.random() - 0.5) * 0.01,
                  timestamp: new Date(),
                },
                estimatedTimeRemaining: Math.max(
                  0,
                  shipment.estimatedTimeRemaining - 5,
                ),
              };
            }
            return shipment;
          }),
        );
      },
    );

    const stop = realtimeSimulator.start(
      "shipments",
      () => {
        const activeShipments = shipments.filter((s) =>
          ["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.status),
        );
        if (activeShipments.length === 0) return null;
        const randomShipment =
          activeShipments[Math.floor(Math.random() * activeShipments.length)];
        return {
          id: randomShipment.id,
          update: "location",
        };
      },
      10000,
      true,
    );

    return () => {
      unsubscribe();
      stop();
    };
  }, [realTimeUpdates, shipments.length]);

  const statusDistribution = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    shipments.forEach((shipment) => {
      statusCounts[shipment.status] = (statusCounts[shipment.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));
  }, [shipments]);

  const carrierPerformance = useMemo(() => {
    const carrierStats: Record<
      string,
      { shipments: number; onTime: number; delayed: number }
    > = {};
    shipments.forEach((shipment) => {
      if (!carrierStats[shipment.carrierCode]) {
        carrierStats[shipment.carrierCode] = {
          shipments: 0,
          onTime: 0,
          delayed: 0,
        };
      }
      carrierStats[shipment.carrierCode].shipments++;
      if (shipment.actualDelivery && shipment.estimatedDelivery) {
        if (
          new Date(shipment.actualDelivery) <=
          new Date(shipment.estimatedDelivery)
        ) {
          carrierStats[shipment.carrierCode].onTime++;
        } else {
          carrierStats[shipment.carrierCode].delayed++;
        }
      }
    });
    return Object.entries(carrierStats)
      .map(([carrier, stats]) => ({
        carrier:
          carriers.find((c) => c.carrierCode === carrier)?.carrierName ||
          carrier,
        ...stats,
        onTimeRate:
          stats.shipments > 0 ? (stats.onTime / stats.shipments) * 100 : 0,
      }))
      .sort((a, b) => b.shipments - a.shipments)
      .slice(0, 10);
  }, [shipments, carriers]);

  const exceptionShipments = useMemo(() => {
    return shipments.filter((s) => s.status === "EXCEPTION").length;
  }, [shipments]);

  const inTransitShipments = useMemo(() => {
    return shipments.filter((s) =>
      ["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.status),
    ).length;
  }, [shipments]);

  const stats = [
    {
      label: "Total Shipments",
      value: shipments.length,
      icon: "ri-truck-line",
      tooltip: "Total shipments",
      trend: "up" as const,
    },
    {
      label: "In Transit",
      value: inTransitShipments,
      icon: "ri-road-map-line",
      tooltip: "Shipments currently in transit",
      trend: "neutral" as const,
    },
    {
      label: "Exceptions",
      value: exceptionShipments,
      icon: "ri-alert-line",
      tooltip: "Shipments with exceptions",
      trend: exceptionShipments > 0 ? ("down" as const) : ("neutral" as const),
    },
    {
      label: "Delivered",
      value: shipments.filter((s) => s.status === "DELIVERED").length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Delivered shipments",
      trend: "up" as const,
    },
  ];

  const handleView = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setShowViewModal(true);
  };

  const handleException = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setShowExceptionModal(true);
  };

  const handleNavigateToSO = (shipment: Shipment) => {
    router.push(`/sales-orders?so=${shipment.soNumber}`);
  };

  const handleNavigateToPOD = (shipment: Shipment) => {
    router.push(`/pod?tracking=${shipment.trackingNumber}`);
  };

  const handleNavigateToCarrier = (shipment: Shipment) => {
    router.push(`/carriers?carrier=${shipment.carrierCode}`);
  };

  const handleNavigateToRoute = (shipment: Shipment) => {
    router.push(`/routes?shipment=${shipment.shipmentNumber}`);
  };

  return (
    <PageTemplate
      title="Shipment Tracking"
      description="Real-time shipment tracking with GPS updates, ETA calculations, exception handling, and delivery status monitoring"
      icon="ri-map-pin-line"
      systemInfo={{
        sap: "Tracking, Shipment Status",
        oracle: "Shipment Tracking, Real-Time Tracking",
        manhattan: "Shipment Tracking, GPS Tracking",
      }}
      examples={[
        "Real-time GPS tracking",
        "ETA calculations",
        "Exception handling",
        "Delivery status updates",
        "Carrier performance",
        "Route visualization",
        "POD integration",
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
          <Tooltip
            content={
              realTimeUpdates
                ? "Disable Real-Time Updates"
                : "Enable Real-Time Updates"
            }
            position="bottom"
          >
            <button
              onClick={() => setRealTimeUpdates(!realTimeUpdates)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                realTimeUpdates
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-white/5 text-white border border-white/10"
              }`}
            >
              <i
                className={`ri-${realTimeUpdates ? "radio-button-line" : "radio-button-fill"}`}
              ></i>
              Live
            </button>
          </Tooltip>
        </div>
      }
    >
      {/* Alerts */}
      {exceptionShipments > 0 && (
        <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <i className="ri-alarm-warning-line text-red-400 text-xl"></i>
          <div className="flex-1">
            <div className="text-red-400 font-medium">
              {exceptionShipments} Shipment{exceptionShipments > 1 ? "s" : ""}{" "}
              with Exceptions
            </div>
            <div className="text-red-300/80 text-sm">
              Immediate action required
            </div>
          </div>
        </div>
      )}

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
                  label={({ status, count }) =>
                    `${status.replace(/_/g, " ")}: ${count}`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        [
                          "#10b981",
                          "#3b82f6",
                          "#f59e0b",
                          "#ef4444",
                          "#8b5cf6",
                          "#ec4899",
                        ][index % 6]
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
              Carrier Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={carrierPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="carrier"
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
                <Bar
                  dataKey="onTimeRate"
                  fill="#10b981"
                  name="On-Time Rate %"
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Map View */}
      {viewMode === "map" && (
        <div className="mb-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Live Shipment Map
          </h3>
          <div className="bg-white/5 rounded-lg p-8 h-96 flex items-center justify-center">
            <div className="text-center">
              <i className="ri-map-line text-6xl text-[#9ca3af] mb-4"></i>
              <div className="text-white font-medium mb-2">
                Interactive Map View
              </div>
              <div className="text-sm text-[#9ca3af]">
                {inTransitShipments} shipment
                {inTransitShipments !== 1 ? "s" : ""} currently in transit
              </div>
              <div className="text-xs text-[#6b7280] mt-2">
                Map integration would show real-time GPS positions here
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search by Tracking Number, SO Number, Customer..."
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
          <option value="CREATED">Created</option>
          <option value="PICKED_UP">Picked Up</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="EXCEPTION">Exception</option>
        </select>
        <select
          value={selectedCarrier}
          onChange={(e) => setSelectedCarrier(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[200px]"
        >
          <option value="ALL">All Carriers</option>
          {carriers.slice(0, 10).map((carrier) => (
            <option key={carrier.carrierCode} value={carrier.carrierCode}>
              {carrier.carrierName}
            </option>
          ))}
        </select>
      </div>

      {/* Shipments Table */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Tracking Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Sales Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Carrier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Current Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    ETA
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredShipments.map((shipment, index) => {
                  const etaMinutes = shipment.estimatedTimeRemaining;
                  const etaHours = Math.floor(etaMinutes / 60);
                  const etaMins = etaMinutes % 60;
                  const isDelayed =
                    shipment.actualDelivery && shipment.estimatedDelivery
                      ? new Date(shipment.actualDelivery) >
                        new Date(shipment.estimatedDelivery)
                      : false;

                  return (
                    <motion.tr
                      key={shipment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white font-mono">
                          {shipment.trackingNumber}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {shipment.shipmentNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleNavigateToSO(shipment)}
                          className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                        >
                          {shipment.soNumber}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {shipment.customerName}
                        </div>
                        <div className="text-xs text-[#9ca3af] font-mono">
                          {shipment.customerNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleNavigateToCarrier(shipment)}
                          className="text-sm text-white hover:text-cyan-400 transition-colors cursor-pointer"
                        >
                          {shipment.carrierName}
                        </button>
                        <div className="text-xs text-[#9ca3af] font-mono">
                          {shipment.carrierCode}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            shipment.status === "DELIVERED"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : shipment.status === "IN_TRANSIT" ||
                                  shipment.status === "OUT_FOR_DELIVERY"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : shipment.status === "EXCEPTION"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : shipment.status === "RETURNED"
                                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {shipment.status.replace(/_/g, " ")}
                        </span>
                        {shipment.exceptionType && (
                          <div className="text-xs text-red-400 mt-1">
                            {shipment.exceptionType}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {shipment.currentLocation.address}
                        </div>
                        {["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(
                          shipment.status,
                        ) && (
                          <div className="text-xs text-[#9ca3af]">
                            {format(
                              new Date(shipment.currentLocation.timestamp),
                              "HH:mm",
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {shipment.status === "DELIVERED" &&
                        shipment.actualDelivery ? (
                          <div>
                            <div
                              className={`text-sm font-medium ${isDelayed ? "text-red-400" : "text-green-400"}`}
                            >
                              Delivered
                            </div>
                            <div className="text-xs text-[#9ca3af]">
                              {format(
                                new Date(shipment.actualDelivery),
                                "MMM dd, HH:mm",
                              )}
                            </div>
                          </div>
                        ) : ["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(
                            shipment.status,
                          ) ? (
                          <div>
                            <div className="text-sm text-white font-medium">
                              {etaHours > 0
                                ? `${etaHours}h ${etaMins}m`
                                : `${etaMins}m`}
                            </div>
                            <div className="text-xs text-[#9ca3af]">
                              {format(
                                new Date(shipment.estimatedDelivery),
                                "MMM dd, HH:mm",
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-white">
                            {format(
                              new Date(shipment.estimatedDelivery),
                              "MMM dd, HH:mm",
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <QRCodeBadge
                            entityId={shipment.id}
                            entityType="shipment"
                            entityName={shipment.trackingNumber}
                            documentType="other"
                            documentUrl={`/tracking?shipment=${shipment.trackingNumber}`}
                            module="tms"
                            size="sm"
                          />
                          <Tooltip content="View Details" position="top">
                            <button
                              onClick={() => handleView(shipment)}
                              className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                            >
                              <i className="ri-eye-line"></i>
                            </button>
                          </Tooltip>
                          {shipment.status === "EXCEPTION" && (
                            <Tooltip content="Handle Exception" position="top">
                              <button
                                onClick={() => handleException(shipment)}
                                className="p-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded hover:bg-red-600/30 transition-colors"
                              >
                                <i className="ri-alert-line"></i>
                              </button>
                            </Tooltip>
                          )}
                          {shipment.status === "DELIVERED" && (
                            <Tooltip content="View POD" position="top">
                              <button
                                onClick={() => handleNavigateToPOD(shipment)}
                                className="p-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded hover:bg-green-600/30 transition-colors"
                              >
                                <i className="ri-file-check-line"></i>
                              </button>
                            </Tooltip>
                          )}
                          {["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(
                            shipment.status,
                          ) && (
                            <Tooltip content="View Route" position="top">
                              <button
                                onClick={() => handleNavigateToRoute(shipment)}
                                className="p-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-600/30 transition-colors"
                              >
                                <i className="ri-route-line"></i>
                              </button>
                            </Tooltip>
                          )}
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
          setSelectedShipment(null);
        }}
        title={`Shipment Tracking - ${selectedShipment?.trackingNumber || ""}`}
        size="lg"
      >
        {selectedShipment && (
          <div className="space-y-4">
            {/* QR Code Section */}
            <div className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
              <UniversalQRGenerator
                entityId={selectedShipment.id}
                entityType="shipment"
                entityName={selectedShipment.trackingNumber}
                documentType="other"
                documentUrl={`/tracking?shipment=${selectedShipment.trackingNumber}`}
                module="tms"
                showAdvanced={false}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Tracking Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedShipment.trackingNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Sales Order
                </label>
                <button
                  onClick={() => handleNavigateToSO(selectedShipment)}
                  className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {selectedShipment.soNumber}
                </button>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Customer
                </label>
                <div className="text-sm text-white">
                  {selectedShipment.customerName}
                </div>
                <div className="text-xs text-[#9ca3af] font-mono">
                  {selectedShipment.customerNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Carrier
                </label>
                <button
                  onClick={() => handleNavigateToCarrier(selectedShipment)}
                  className="text-sm text-white hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {selectedShipment.carrierName}
                </button>
                <div className="text-xs text-[#9ca3af] font-mono">
                  {selectedShipment.carrierCode}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedShipment.status === "DELIVERED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedShipment.status === "IN_TRANSIT"
                        ? "bg-blue-500/20 text-blue-400"
                        : selectedShipment.status === "EXCEPTION"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedShipment.status.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Driver
                </label>
                <div className="text-sm text-white">
                  {selectedShipment.driverName}
                </div>
                <div className="text-xs text-[#9ca3af]">
                  {selectedShipment.driverPhone}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Vehicle
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedShipment.vehicleNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Distance
                </label>
                <div className="text-sm text-white">
                  {selectedShipment.distance.toFixed(1)} km
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Origin
                </label>
                <div className="text-sm text-white">
                  {selectedShipment.origin}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Destination
                </label>
                <div className="text-sm text-white">
                  {selectedShipment.destination}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Pickup Date
                </label>
                <div className="text-sm text-white">
                  {format(
                    new Date(selectedShipment.pickupDate),
                    "MMM dd, yyyy HH:mm",
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Estimated Delivery
                </label>
                <div className="text-sm text-white">
                  {format(
                    new Date(selectedShipment.estimatedDelivery),
                    "MMM dd, yyyy HH:mm",
                  )}
                </div>
              </div>
              {selectedShipment.actualDelivery && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Actual Delivery
                  </label>
                  <div className="text-sm text-green-400 font-medium">
                    {format(
                      new Date(selectedShipment.actualDelivery),
                      "MMM dd, yyyy HH:mm",
                    )}
                  </div>
                </div>
              )}
            </div>
            {["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(
              selectedShipment.status,
            ) && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Current Location
                </h4>
                <div className="text-sm text-white mb-1">
                  {selectedShipment.currentLocation.address}
                </div>
                <div className="text-xs text-[#9ca3af]">
                  GPS: {selectedShipment.currentLocation.lat.toFixed(4)},{" "}
                  {selectedShipment.currentLocation.lng.toFixed(4)}
                </div>
                <div className="text-xs text-[#9ca3af] mt-1">
                  Last Update:{" "}
                  {format(
                    new Date(selectedShipment.currentLocation.timestamp),
                    "MMM dd, HH:mm:ss",
                  )}
                </div>
                <div className="text-sm text-white mt-2">
                  ETA:{" "}
                  {Math.floor(selectedShipment.estimatedTimeRemaining / 60)}h{" "}
                  {selectedShipment.estimatedTimeRemaining % 60}m remaining
                </div>
              </div>
            )}
            {selectedShipment.exceptionType && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-red-400 mb-2">
                  Exception Details
                </h4>
                <div className="text-sm text-white mb-1">
                  Type: {selectedShipment.exceptionType}
                </div>
                <div className="text-sm text-white">
                  {selectedShipment.exceptionDescription}
                </div>
              </div>
            )}
            <div className="pt-4 border-t border-white/10">
              <ModuleLinks
                links={getShipmentTrackingLinks(
                  selectedShipment.trackingNumber,
                  selectedShipment.soNumber,
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => handleNavigateToSO(selectedShipment)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-shopping-cart-2-line"></i>
                View Sales Order
              </button>
              {selectedShipment.status === "DELIVERED" && (
                <button
                  onClick={() => handleNavigateToPOD(selectedShipment)}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-file-check-line"></i>
                  View POD
                </button>
              )}
              <button
                onClick={() => handleNavigateToCarrier(selectedShipment)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-truck-line"></i>
                View Carrier
              </button>
              {["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(
                selectedShipment.status,
              ) && (
                <button
                  onClick={() => handleNavigateToRoute(selectedShipment)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-route-line"></i>
                  View Route
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Exception Handling Modal */}
      <Modal
        isOpen={showExceptionModal}
        onClose={() => {
          setShowExceptionModal(false);
          setSelectedShipment(null);
        }}
        title={`Handle Exception - ${selectedShipment?.trackingNumber || ""}`}
        size="md"
      >
        {selectedShipment && (
          <div className="space-y-4">
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <div className="text-sm text-red-400 font-medium mb-2">
                Exception Type: {selectedShipment.exceptionType}
              </div>
              <div className="text-sm text-white">
                {selectedShipment.exceptionDescription}
              </div>
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-2 block">
                Resolution Action
              </label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500">
                <option>Reschedule Delivery</option>
                <option>Contact Customer</option>
                <option>Return to Warehouse</option>
                <option>Investigate Issue</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-2 block">Notes</label>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                rows={3}
                placeholder="Enter resolution notes..."
              />
            </div>
            <div className="flex items-center gap-3 justify-end pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setShowExceptionModal(false);
                  setSelectedShipment(null);
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowExceptionModal(false);
                  setSelectedShipment(null);
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors"
              >
                Resolve Exception
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}

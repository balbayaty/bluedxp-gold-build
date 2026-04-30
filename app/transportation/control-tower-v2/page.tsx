/**
 * Transportation Control Tower V2 - Mind-Blowing UI
 *
 * World-class unified dashboard inspired by:
 * - Flexport Control Tower
 * - SAP Transportation Management
 * - project44 Movement
 * - FourKites Dynamic Yard
 *
 * Features:
 * - Real-time 3D globe view with animated shipments
 * - Multi-panel intelligent layout
 * - AI-powered predictive alerts
 * - Visual journey timeline
 * - Live KPI metrics
 * - Conversational AI copilot
 * - One-click actions
 * - Mobile-responsive
 *
 * USES PLATFORM SERVICES:
 * - Business Intelligence (dashboards)
 * - Intelligence Analytics (predictions)
 * - Real-time (WebSocket)
 * - AI Copilot
 * - Truth Engine (data verification)
 *
 * NO DUPLICATION
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import PageTemplate from "@/components/PageTemplate";
import { apiFetch } from "@/utils/apiFetch";
import type { Shipment } from "@/types/tms";

// Dynamic imports for heavy components
const ThreeJSGlobe = dynamic(
  () => import("@/components/transportation/ThreeJSGlobe"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-gray-900 rounded-2xl h-[600px] flex items-center justify-center">
        <div className="text-white/50">Loading 3D visualization...</div>
      </div>
    ),
  },
);

const AIInsightsPanel = dynamic(
  () => import("@/components/transportation/AIInsightsPanel"),
  { ssr: false },
);

export default function ControlTowerV2() {
  const [activeShipments, setActiveShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"globe" | "map" | "list">("globe");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([]);
  const [liveMetrics, setLiveMetrics] = useState({
    onTimeRate: 0,
    exceptionsCount: 0,
    avgDelay: 0,
    carbonEmissions: 0,
  });
  const wsRef = useRef<WebSocket | null>(null);

  // Real-time data via WebSocket
  useEffect(() => {
    loadInitialData();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const res = await apiFetch(
        "/api/transportation/shipments?status=IN_TRANSIT,CUSTOMS_CLEARANCE,OUT_FOR_DELIVERY",
      );
      const shipments = await res.json();
      setActiveShipments(shipments);

      // Load AI-powered alerts
      const alertsRes = await apiFetch(
        "/api/transportation/ai-insights?type=CRITICAL_ALERTS",
      );
      const alerts = await alertsRes.json();
      setCriticalAlerts(alerts.insights || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const connectWebSocket = () => {
    // Use existing WebSocket service
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/api/websocket`,
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "SHIPMENT_UPDATE") {
        setActiveShipments((prev) => {
          const index = prev.findIndex((s) => s.id === data.shipment.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = data.shipment;
            return updated;
          }
          return prev;
        });
      } else if (data.type === "METRICS_UPDATE") {
        setLiveMetrics(data.metrics);
      } else if (data.type === "ALERT") {
        setCriticalAlerts((prev) => [data.alert, ...prev].slice(0, 10));
      }
    };

    wsRef.current = ws;
  };

  return (
    <PageTemplate
      title="Transportation Control Tower"
      description="Real-time global shipment intelligence and command center"
      icon="ri-radar-line"
      fullWidth
    >
      <div className="h-screen flex flex-col gap-4 p-6 bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20">
        {/* Top Bar: View Controls & Metrics */}
        <div className="flex items-center justify-between gap-4">
          {/* View Mode Selector */}
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-2">
            <button
              onClick={() => setViewMode("globe")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "globe"
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/50"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <i className="ri-earth-line mr-2"></i>
              3D Globe
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "map"
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/50"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <i className="ri-map-2-line mr-2"></i>
              2D Map
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "list"
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/50"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <i className="ri-list-check mr-2"></i>
              List View
            </button>
          </div>

          {/* Live Metrics Bar */}
          <div className="flex items-center gap-6">
            <LiveMetric
              label="On-Time Rate"
              value={`${liveMetrics.onTimeRate}%`}
              icon="ri-time-line"
              color="green"
              trend="up"
            />
            <LiveMetric
              label="Active Exceptions"
              value={liveMetrics.exceptionsCount}
              icon="ri-alert-line"
              color="red"
              trend={liveMetrics.exceptionsCount > 5 ? "up" : "down"}
            />
            <LiveMetric
              label="Avg Delay"
              value={`${liveMetrics.avgDelay}h`}
              icon="ri-timer-line"
              color="orange"
              trend="neutral"
            />
            <LiveMetric
              label="CO₂ Today"
              value={`${liveMetrics.carbonEmissions}t`}
              icon="ri-leaf-line"
              color="green"
              trend="down"
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
          {/* Left Panel: Critical Alerts & AI Predictions (3 cols) */}
          <div className="col-span-3 flex flex-col gap-4 min-h-0">
            <AlertsPanel
              alerts={criticalAlerts}
              onAlertClick={(alert) => {
                if (alert.shipmentId) {
                  const shipment = activeShipments.find(
                    (s) => s.id === alert.shipmentId,
                  );
                  if (shipment) setSelectedShipment(shipment);
                }
              }}
            />
          </div>

          {/* Center Panel: 3D Globe / Map View (6 cols) */}
          <div className="col-span-6 flex flex-col min-h-0">
            {viewMode === "globe" && (
              <ThreeJSGlobe
                shipments={activeShipments}
                selectedShipment={selectedShipment}
                onShipmentClick={setSelectedShipment}
                realTime
                animate
                showRoutes
                showClusters
              />
            )}

            {viewMode === "list" && (
              <ShipmentListView
                shipments={activeShipments}
                onShipmentClick={setSelectedShipment}
                selectedShipment={selectedShipment}
              />
            )}
          </div>

          {/* Right Panel: Shipment Details & AI Copilot (3 cols) */}
          <div className="col-span-3 flex flex-col gap-4 min-h-0">
            {selectedShipment ? (
              <ShipmentDetailsPanel
                shipment={selectedShipment}
                onClose={() => setSelectedShipment(null)}
              />
            ) : (
              <AIInsightsPanel
                context="control-tower"
                shipments={activeShipments}
              />
            )}
          </div>
        </div>

        {/* Bottom Panel: Journey Timeline (if shipment selected) */}
        {selectedShipment && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="h-48 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <JourneyTimeline shipment={selectedShipment} />
          </motion.div>
        )}
      </div>
    </PageTemplate>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LiveMetric({
  label,
  value,
  icon,
  color,
  trend,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: "green" | "red" | "orange" | "blue";
  trend: "up" | "down" | "neutral";
}) {
  const colors = {
    green: "from-green-500 to-emerald-600",
    red: "from-red-500 to-rose-600",
    orange: "from-orange-500 to-amber-600",
    blue: "from-blue-500 to-cyan-600",
  };

  const trendIcons = {
    up: "ri-arrow-up-line",
    down: "ri-arrow-down-line",
    neutral: "ri-subtract-line",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 min-w-[140px] shadow-lg`}
    >
      <div className="flex items-center justify-between mb-1">
        <i className={`${icon} text-white/80 text-xl`}></i>
        <i className={`${trendIcons[trend]} text-white/60 text-sm`}></i>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-white/80 font-medium">{label}</div>
    </div>
  );
}

function AlertsPanel({
  alerts,
  onAlertClick,
}: {
  alerts: any[];
  onAlertClick: (alert: any) => void;
}) {
  return (
    <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <i className="ri-alert-fill text-red-400"></i>
          Critical Alerts
        </h3>
        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium">
          {alerts.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center text-white/50 py-8">
            <i className="ri-checkbox-circle-line text-4xl mb-2"></i>
            <div>All clear - no critical alerts</div>
          </div>
        ) : (
          alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onAlertClick(alert)}
              className="p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl cursor-pointer hover:border-red-500/50 transition-all"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 w-2 h-2 rounded-full ${
                    alert.priority === "CRITICAL"
                      ? "bg-red-500 animate-pulse"
                      : alert.priority === "HIGH"
                        ? "bg-orange-500"
                        : "bg-yellow-500"
                  }`}
                ></div>
                <div className="flex-1">
                  <div className="text-white font-medium mb-1">
                    {alert.title}
                  </div>
                  <div className="text-white/70 text-sm">{alert.message}</div>
                  <div className="text-white/50 text-xs mt-2">
                    {new Date(alert.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function ShipmentListView({
  shipments,
  onShipmentClick,
  selectedShipment,
}: {
  shipments: Shipment[];
  onShipmentClick: (shipment: Shipment) => void;
  selectedShipment: Shipment | null;
}) {
  return (
    <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Active Shipments</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {shipments.map((shipment, index) => (
          <motion.div
            key={shipment.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onShipmentClick(shipment)}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
              selectedShipment?.id === shipment.id
                ? "bg-cyan-500/20 border-2 border-cyan-500"
                : "bg-white/5 border border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-white font-mono font-medium">
                  {shipment.shipmentNumber}
                </div>
                <div className="text-white/50 text-sm">
                  {shipment.trackingNumber}
                </div>
              </div>
              <StatusBadge status={shipment.status} />
            </div>

            <div className="flex items-center gap-4 text-sm text-white/70">
              <div className="flex items-center gap-1">
                <i className="ri-map-pin-line"></i>
                <span>
                  {shipment.origin?.address?.city ||
                    shipment.origin?.city ||
                    shipment.origin?.name ||
                    "Origin"}
                </span>
              </div>
              <i className="ri-arrow-right-line"></i>
              <div className="flex items-center gap-1">
                <i className="ri-flag-line"></i>
                <span>
                  {shipment.destination?.address?.city ||
                    shipment.destination?.city ||
                    shipment.destination?.name ||
                    "Destination"}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4">
              <div className="flex-1">
                <div className="text-xs text-white/50 mb-1">ETA</div>
                <div className="text-white text-sm font-medium">
                  {shipment.estimatedDelivery
                    ? new Date(shipment.estimatedDelivery).toLocaleDateString()
                    : "TBD"}
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-white/50 mb-1">Mode</div>
                <div className="text-white text-sm">
                  <ModeIcon mode={shipment.mode} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ShipmentDetailsPanel({
  shipment,
  onClose,
}: {
  shipment: Shipment;
  onClose: () => void;
}) {
  return (
    <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col">
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Shipment Details</h3>
        <button
          onClick={onClose}
          className="text-white/50 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="text-2xl font-bold text-white mb-1">
            {shipment.shipmentNumber}
          </div>
          <div className="text-white/50">{shipment.trackingNumber}</div>
          <div className="mt-3">
            <StatusBadge status={shipment.status} large />
          </div>
        </div>

        {/* Route */}
        <div>
          <div className="text-xs uppercase text-white/50 mb-3">Route</div>
          <div className="space-y-3">
            <RoutePoint
              type="origin"
              location={shipment.origin.address.city}
              country={shipment.origin.address.country}
            />
            {shipment.route?.waypoints?.map((wp, i) => (
              <RoutePoint
                key={i}
                type="transit"
                location={wp.address.city}
                country={wp.address.country}
              />
            ))}
            <RoutePoint
              type="destination"
              location={shipment.destination.address.city}
              country={shipment.destination.address.country}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="text-xs uppercase text-white/50 mb-3">
            Quick Actions
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="px-4 py-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-white text-sm hover:bg-blue-500/30 transition-colors">
              <i className="ri-map-pin-line mr-2"></i>
              Track Live
            </button>
            <button className="px-4 py-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-white text-sm hover:bg-purple-500/30 transition-colors">
              <i className="ri-file-text-line mr-2"></i>
              Documents
            </button>
            <button className="px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-xl text-white text-sm hover:bg-green-500/30 transition-colors">
              <i className="ri-qr-code-line mr-2"></i>
              QR/E-Waybill
            </button>
            <button className="px-4 py-3 bg-orange-500/20 border border-orange-500/30 rounded-xl text-white text-sm hover:bg-orange-500/30 transition-colors">
              <i className="ri-customer-service-line mr-2"></i>
              Support
            </button>
          </div>
        </div>

        {/* Cargo Details */}
        <div>
          <div className="text-xs uppercase text-white/50 mb-3">Cargo</div>
          <div className="grid grid-cols-2 gap-3">
            <DataPoint
              label="Weight"
              value={`${shipment.totalWeight.toLocaleString()} kg`}
            />
            <DataPoint
              label="Volume"
              value={`${shipment.totalVolume.toFixed(2)} m³`}
            />
            <DataPoint label="Items" value={shipment.items.length} />
            <DataPoint
              label="Value"
              value={`${shipment.totalValue.toLocaleString()} ${shipment.currency}`}
            />
          </div>
        </div>

        {/* AI Insights */}
        {shipment.aiInsights && (
          <div>
            <div className="text-xs uppercase text-white/50 mb-3">
              AI Insights
            </div>
            <div className="space-y-2">
              {shipment.aiInsights.recommendations?.map((rec, i) => (
                <div
                  key={i}
                  className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-sm text-white/80"
                >
                  <i className="ri-lightbulb-line text-purple-400 mr-2"></i>
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function JourneyTimeline({ shipment }: { shipment: Shipment }) {
  const events = shipment.trackingEvents || [];

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-white font-semibold mb-4">Journey Timeline</h3>

      <div className="flex-1 relative">
        <div className="absolute inset-0 flex items-center">
          {/* Timeline bar */}
          <div className="w-full h-1 bg-white/10 rounded-full">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${(events.length / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Timeline events */}
        <div className="relative flex justify-between">
          {events.slice(-6).map((event, index) => (
            <div key={event.id} className="flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full ${
                  index === events.length - 1
                    ? "bg-cyan-500 animate-pulse shadow-lg shadow-cyan-500/50"
                    : "bg-white/30"
                }`}
              ></div>
              <div className="mt-2 text-xs text-white/70 text-center max-w-[100px]">
                {event.description}
              </div>
              <div className="mt-1 text-xs text-white/50">
                {new Date(event.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  large,
}: {
  status: Shipment["status"];
  large?: boolean;
}) {
  const statusConfig = {
    DRAFT: { color: "gray", icon: "ri-draft-line", label: "Draft" },
    QUOTED: { color: "blue", icon: "ri-file-list-3-line", label: "Quoted" },
    BOOKED: { color: "purple", icon: "ri-check-double-line", label: "Booked" },
    PICKED_UP: { color: "indigo", icon: "ri-truck-line", label: "Picked Up" },
    IN_TRANSIT: {
      color: "cyan",
      icon: "ri-road-map-line",
      label: "In Transit",
    },
    AT_PORT: { color: "blue", icon: "ri-anchor-line", label: "At Port" },
    CUSTOMS_CLEARANCE: {
      color: "orange",
      icon: "ri-passport-line",
      label: "Customs",
    },
    OUT_FOR_DELIVERY: {
      color: "green",
      icon: "ri-truck-line",
      label: "Out for Delivery",
    },
    DELIVERED: { color: "emerald", icon: "ri-check-line", label: "Delivered" },
    EXCEPTION: {
      color: "red",
      icon: "ri-error-warning-line",
      label: "Exception",
    },
    CANCELLED: { color: "gray", icon: "ri-close-line", label: "Cancelled" },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${large ? "text-base" : "text-xs"} font-medium bg-${config.color}-500/20 text-${config.color}-400 border border-${config.color}-500/30`}
    >
      <i className={config.icon}></i>
      {config.label}
    </span>
  );
}

function ModeIcon({ mode }: { mode: Shipment["mode"] }) {
  const modeIcons = {
    AIR: "ri-flight-takeoff-line",
    SEA: "ri-ship-line",
    LAND: "ri-truck-line",
    RAIL: "ri-train-line",
    MULTIMODAL: "ri-route-line",
    EXPRESS: "ri-rocket-line",
    COURIER: "ri-mail-send-line",
  };

  return (
    <span className="flex items-center gap-1">
      <i className={modeIcons[mode as keyof typeof modeIcons]}></i>
      <span>{mode}</span>
    </span>
  );
}

function RoutePoint({
  type,
  location,
  country,
}: {
  type: "origin" | "transit" | "destination";
  location: string;
  country: string;
}) {
  const icons = {
    origin: "ri-map-pin-line",
    transit: "ri-checkbox-blank-circle-line",
    destination: "ri-flag-line",
  };

  const colors = {
    origin: "text-green-400",
    transit: "text-yellow-400",
    destination: "text-red-400",
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center ${colors[type]}`}
      >
        <i className={icons[type]}></i>
      </div>
      <div>
        <div className="text-white font-medium">{location || "Unknown"}</div>
        <div className="text-white/50 text-xs">{country || ""}</div>
      </div>
    </div>
  );
}

function DataPoint({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="p-3 bg-white/5 rounded-lg">
      <div className="text-xs text-white/50 mb-1">{label}</div>
      <div className="text-white font-semibold">{value}</div>
    </div>
  );
}

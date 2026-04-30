/**
 * Last-Mile Optimization Page
 *
 * Route optimization for last-mile delivery
 * Modern, professional, sexy UI with full drill-down capabilities
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Route,
  Clock,
  Package,
  Zap,
  CheckCircle,
  AlertTriangle,
  Send,
  Navigation,
  Target,
  BarChart3,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Truck,
} from "lucide-react";
import PageTemplate from "@/components/PageTemplate";
import type {
  DeliveryRoute,
  LastMileOptimizationRequest,
  LastMileOptimizationResult,
  DeliveryStop,
} from "@/lib/services/transportation";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { apiFetch } from "@/utils/apiFetch";

export default function LastMileOptimizationPage() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<DeliveryRoute | null>(
    null,
  );
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [viewMode, setViewMode] = useState<"MAP" | "LIST" | "METRICS">("MAP");

  const optimizeRoute = async () => {
    setIsOptimizing(true);
    try {
      const request: LastMileOptimizationRequest = {
        stops: [
          {
            shipmentId: "ship-1",
            sequence: 0,
            location: {
              address: {
                street: "123 Main St",
                city: "Riyadh",
                country: "Saudi Arabia",
                countryCode: "SA",
              },
              coordinates: { lat: 24.7136, lng: 46.6753 },
            },
            timeWindow: {
              earliest: new Date("2024-01-20T09:00:00"),
              latest: new Date("2024-01-20T12:00:00"),
            },
            serviceTime: 15,
            requirements: {
              signatureRequired: true,
              proofOfDelivery: true,
            },
            status: "PENDING",
          },
        ],
        vehicle: {
          id: "vehicle-1",
          capacity: { weight: 5000, volume: 20 },
          currentLocation: {
            address: {
              street: "456 Depot St",
              city: "Riyadh",
              country: "Saudi Arabia",
              countryCode: "SA",
            },
            coordinates: { lat: 24.7136, lng: 46.6753 },
          },
        },
        objectives: ["MINIMIZE_DISTANCE", "MAXIMIZE_ON_TIME"],
        createdBy: "user",
      };

      const response = await apiFetch("/api/transportation/last-mile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "optimize",
          request,
        }),
      });

      const result: LastMileOptimizationResult = await response.json();
      setRoutes([result.route]);
      setSelectedRoute(result.route);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error optimizing route", err, {
        module: "transportation",
        service: "last-mile",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "last-mile",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <PageTemplate
      title="Last-Mile Optimization"
      description="Route optimization for last-mile delivery with time windows and customer communication"
      icon="ri-map-pin-3-line"
      stats={[
        { label: "Routes", value: routes.length, icon: "ri-route-line" },
        {
          label: "Stops",
          value: selectedRoute?.stops.length || 0,
          icon: "ri-map-pin-line",
        },
        {
          label: "Distance",
          value: `${selectedRoute?.totalDistance.toFixed(1) || 0} km`,
          icon: "ri-roadster-line",
        },
        {
          label: "Time",
          value: `${selectedRoute ? (selectedRoute.totalTime / 60).toFixed(1) : 0} hrs`,
          icon: "ri-time-line",
        },
      ]}
      actions={
        <div className="flex items-center gap-3">
          <button
            onClick={optimizeRoute}
            disabled={isOptimizing}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {isOptimizing ? (
              <>
                <Zap className="w-4 h-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Optimize Route
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
          {[
            { id: "MAP", label: "Map View", icon: MapPin },
            { id: "LIST", label: "Stop List", icon: Package },
            { id: "METRICS", label: "Metrics", icon: BarChart3 },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                viewMode === mode.id
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <mode.icon className="w-4 h-4 inline mr-2" />
              {mode.label}
            </button>
          ))}
        </div>

        {/* Map View */}
        {viewMode === "MAP" && <RouteMapVisualization route={selectedRoute} />}

        {/* List View */}
        {viewMode === "LIST" && selectedRoute && (
          <div className="space-y-4">
            {selectedRoute.stops.map((stop, idx) => (
              <motion.div
                key={stop.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                      {stop.sequence}
                    </div>
                    <div>
                      <h4 className="font-bold">Stop {stop.sequence}</h4>
                      <p className="text-sm text-gray-500">
                        {stop.location.address.street},{" "}
                        {stop.location.address.city}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      stop.status === "DELIVERED"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : stop.status === "IN_TRANSIT"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {stop.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-500">Time Window</label>
                    <p className="font-medium text-sm">
                      {stop.timeWindow.earliest.toLocaleTimeString()} -{" "}
                      {stop.timeWindow.latest.toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">
                      Service Time
                    </label>
                    <p className="font-medium text-sm">
                      {stop.serviceTime} min
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">
                      Estimated Arrival
                    </label>
                    <p className="font-medium text-sm">
                      {stop.estimatedArrival?.toLocaleTimeString() || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">
                      Requirements
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {stop.requirements.signatureRequired && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded text-xs">
                          Signature
                        </span>
                      )}
                      {stop.requirements.proofOfDelivery && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded text-xs">
                          POD
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      // Send customer notification
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Notify Customer
                  </button>
                  <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm font-medium">
                    Update Status
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Metrics View */}
        {viewMode === "METRICS" && selectedRoute && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Distance"
              value={`${selectedRoute.totalDistance.toFixed(1)} km`}
              icon={Route}
              color="blue"
            />
            <MetricCard
              title="Total Time"
              value={`${(selectedRoute.totalTime / 60).toFixed(1)} hrs`}
              icon={Clock}
              color="green"
            />
            <MetricCard
              title="Stops"
              value={selectedRoute.stops.length}
              icon={Package}
              color="purple"
            />
            <MetricCard
              title="On-Time Rate"
              value="95%"
              icon={Target}
              color="orange"
            />
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

function MetricCard({ title, value, icon: Icon, color }: any) {
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
      className={`rounded-lg p-4 border ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </motion.div>
  );
}

function RouteMapVisualization({ route }: { route: DeliveryRoute | null }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedStop, setSelectedStop] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (!route) return;
    // Auto-center map on route
    const centerX =
      route.stops.reduce(
        (sum, stop) => sum + (stop.location.coordinates?.lng || 0),
        0,
      ) / route.stops.length;
    const centerY =
      route.stops.reduce(
        (sum, stop) => sum + (stop.location.coordinates?.lat || 0),
        0,
      ) / route.stops.length;
    setPan({ x: -centerX * 100 + 400, y: -centerY * 100 + 300 });
  }, [route]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.max(0.5, Math.min(3, prev - e.deltaY * 0.001)));
  };

  const startAnimation = () => {
    setIsAnimating(true);
    setAnimationProgress(0);
    const interval = setInterval(() => {
      setAnimationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnimating(false);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  if (!route) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-[500px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>No route selected</p>
            <p className="text-sm mt-2">
              Optimize a route to see it on the map
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Convert coordinates to SVG positions
  const stops = route.stops.map((stop, idx) => {
    const lat = stop.location.coordinates?.lat || 0;
    const lng = stop.location.coordinates?.lng || 0;
    return {
      ...stop,
      x: lng * 100 + pan.x,
      y: lat * 100 + pan.y,
      index: idx,
    };
  });

  // Calculate route path
  const routePath = stops
    .map((stop, idx) => {
      if (idx === 0) return `M ${stop.x} ${stop.y}`;
      return `L ${stop.x} ${stop.y}`;
    })
    .join(" ");

  // Animated route path
  const animatedPath = stops
    .slice(0, Math.floor((animationProgress / 100) * stops.length) + 1)
    .map((stop, idx) => {
      if (idx === 0) return `M ${stop.x} ${stop.y}`;
      return `L ${stop.x} ${stop.y}`;
    })
    .join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Route Map
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={startAnimation}
            disabled={isAnimating}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="Animate Route"
          >
            {isAnimating ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="Reset Zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div
        className={`relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${
          isFullscreen ? "fixed inset-4 z-50" : "h-[600px]"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 800 600"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
        >
          {/* Grid */}
          <defs>
            <pattern
              id="grid"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="rgba(0,0,0,0.05)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Route Path */}
          <path
            d={routePath}
            fill="none"
            stroke="rgba(99, 102, 241, 0.3)"
            strokeWidth="3"
            strokeDasharray="5,5"
          />

          {/* Animated Route Path */}
          {isAnimating && (
            <path
              d={animatedPath}
              fill="none"
              stroke="rgba(99, 102, 241, 0.8)"
              strokeWidth="4"
              strokeLinecap="round"
            >
              <animate
                attributeName="stroke-dasharray"
                values="0,1000;1000,0"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
          )}

          {/* Stops */}
          {stops.map((stop, idx) => {
            const isSelected = selectedStop === stop.id;
            const isReached =
              isAnimating &&
              idx <= Math.floor((animationProgress / 100) * stops.length);            return (
              <g key={stop.id}>
                {/* Connection Line */}
                {idx > 0 && (
                  <line
                    x1={stops[idx - 1].x}
                    y1={stops[idx - 1].y}
                    x2={stop.x}
                    y2={stop.y}
                    stroke={
                      isReached
                        ? "rgba(34, 197, 94, 0.6)"
                        : "rgba(99, 102, 241, 0.4)"
                    }
                    strokeWidth="2"
                    strokeDasharray={isReached ? "0" : "5,5"}
                  />
                )}                {/* Stop Circle */}
                <circle
                  cx={stop.x}
                  cy={stop.y}
                  r={isSelected ? 12 : 8}
                  fill={
                    isReached ? "#22c55e" : isSelected ? "#fbbf24" : "#6366f1"
                  }
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer"
                  onClick={() => setSelectedStop(isSelected ? null : stop.id)}
                />

                {/* Stop Number */}
                <text
                  x={stop.x}
                  y={stop.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {stop.sequence}
                </text>

                {/* Stop Label */}
                <text
                  x={stop.x}
                  y={stop.y - 20}
                  textAnchor="middle"
                  fill={isSelected ? "#1f2937" : "#6b7280"}
                  fontSize="12"
                  fontWeight="medium"
                  className="pointer-events-none"
                >
                  Stop {stop.sequence}
                </text>
              </g>
            );
          })}          {/* Vehicle Icon */}
          {stops.length > 0 && (
            <g>
              <circle
                cx={stops[0].x}
                cy={stops[0].y}
                r="15"
                fill="rgba(34, 197, 94, 0.2)"
                stroke="#22c55e"
                strokeWidth="2"
              />
              <foreignObject
                x={stops[0].x - 8}
                y={stops[0].y - 8}
                width="16"
                height="16"
              >
                <div className="flex items-center justify-center text-green-500">
                  <Truck className="w-4 h-4" />
                </div>
              </foreignObject>
            </g>
          )}
        </svg>        {/* Controls Overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm">
            <div className="flex items-center gap-4">
              <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
              <span>Stops: {stops.length}</span>
              <span>Distance: {route.totalDistance.toFixed(1)} km</span>
            </div>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-xs">
            <div className="flex flex-col gap-1">
              <div>🖱️ Drag to pan</div>
              <div>🔍 Scroll to zoom</div>
              <div>👆 Click stops for details</div>
            </div>
          </div>
        </div>        {/* Stop Info Panel */}
        {selectedStop && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-w-xs"
          >
            {(() => {
              const stop = route.stops.find((s) => s.id === selectedStop);
              if (!stop) return null;
              return (
                <div>
                  <h4 className="font-bold mb-2">Stop {stop.sequence}</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Address:
                      </span>
                      <p className="font-medium">
                        {stop.location.address.street},{" "}
                        {stop.location.address.city}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Time Window:
                      </span>
                      <p className="font-medium">
                        {stop.timeWindow.earliest.toLocaleTimeString()} -{" "}
                        {stop.timeWindow.latest.toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Service Time:
                      </span>
                      <p className="font-medium">{stop.serviceTime} min</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Status:
                      </span>
                      <span
                        className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                          stop.status === "DELIVERED"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : stop.status === "IN_TRANSIT"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {stop.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

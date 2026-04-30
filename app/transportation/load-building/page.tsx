/**
 * Load Building Page
 *
 * Comprehensive load building with graphical planning interface
 * Modern, professional, sexy UI with full drill-down capabilities
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Truck,
  Zap,
  Settings,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  Box,
  Layers,
  Target,
  AlertTriangle,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
} from "lucide-react";
import PageTemplate from "@/components/PageTemplate";
import GraphicalPlanningInterface from "@/components/transportation/GraphicalPlanningInterface";
import type {
  LoadItem,
  Vehicle,
  LoadPlan,
  LoadBuildingRequest,
  LoadBuildingResult,
} from "@/lib/services/transportation";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { apiFetch } from "@/utils/apiFetch";
import type { Shipment } from "@/types/tms";
import { isProd } from "@/lib/services/transportation/strictMode";

export default function LoadBuildingPage() {
  const [items, setItems] = useState<LoadItem[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loadPlan, setLoadPlan] = useState<LoadPlan | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [viewMode, setViewMode] = useState<"PLANNING" | "METRICS" | "3D">(
    "PLANNING",
  );
  const [optimizationMode, setOptimizationMode] = useState<
    "MANUAL" | "AUTO" | "HYBRID"
  >("HYBRID");
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Production-safe defaults:
    // - Do NOT auto-inject demo items.
    // - Provide vehicle templates so the feature is usable immediately.
    setVehicle({
      id: "vehicle-template-truck",
      type: "TRUCK",
      capacity: {
        weight: 20000,
        volume: 100,
        length: 1200,
        width: 240,
        height: 260,
      },
      constraints: {
        maxWeight: 20000,
        maxVolume: 100,
        maxHeight: 260,
        hazmatAllowed: true,
        temperatureControlled: false,
      },
    });

    // Load shipments so users can import their real cargo lines into load items.
    let mounted = true;
    async function loadShipments() {
      try {
        const res = await apiFetch("/api/transportation/shipments?limit=200");
        if (!res.ok) return;
        const data = (await res.json()) as Shipment[];
        if (!mounted) return;
        setShipments(Array.isArray(data) ? data : []);
      } catch {
        // ignore
      }
    }
    void loadShipments();
    return () => {
      mounted = false;
    };
  }, []);

  function validateItemsForOptimization(itemsToCheck: LoadItem[]): string[] {
    const errors: string[] = [];
    if (itemsToCheck.length === 0)
      errors.push("Add at least one item before optimizing.");
    for (const it of itemsToCheck) {
      if (!it.description || it.description.trim().length === 0)
        errors.push(`Item ${it.id}: description is required.`);
      if (!Number.isFinite(it.quantity) || it.quantity <= 0)
        errors.push(`Item ${it.id}: quantity must be > 0.`);
      if (!Number.isFinite(it.weight) || it.weight <= 0)
        errors.push(`Item ${it.id}: weight must be > 0.`);
      if (!Number.isFinite(it.volume) || it.volume <= 0)
        errors.push(`Item ${it.id}: volume must be > 0.`);
      const d = it.dimensions;
      if (
        !d ||
        !Number.isFinite(d.length) ||
        !Number.isFinite(d.width) ||
        !Number.isFinite(d.height) ||
        d.length <= 0 ||
        d.width <= 0 ||
        d.height <= 0
      ) {
        errors.push(`Item ${it.id}: dimensions (L×W×H) must all be > 0.`);
      }
    }
    return errors;
  }

  function importItemsFromSelectedShipment(): void {
    const s = shipments.find((x) => String(x.id) === selectedShipmentId);
    if (!s) return;
    const mapped: LoadItem[] = (s.items || []).map((si) => ({
      id: String(si.id || `li-${Date.now()}`),
      description: String(si.description || si.sku || "Item"),
      quantity: Number(si.quantity || 1),
      weight: Number(si.weight || 0),
      volume: Number(si.volume || 0),
      // Shipment items don't carry per-line dimensions in our core model.
      // We require the user to fill dimensions before optimization.
      dimensions: { length: 0, width: 0, height: 0 },
      stackable: true,
      orientation: "ANY",
    }));

    setItems(mapped);
    setLoadPlan(null);
    setError(
      mapped.length > 0
        ? "Imported shipment items. Please enter dimensions for each item before optimizing."
        : "Selected shipment has no item lines to import.",
    );
  }

  const handleOptimize = async () => {
    if (!vehicle) return;
    const issues = validateItemsForOptimization(items);
    if (issues.length > 0) {
      setError(issues[0]);
      return;
    }

    setIsOptimizing(true);
    try {
      setError(null);
      const request: LoadBuildingRequest = {
        items,
        vehicle,
        objectives: ["MAXIMIZE_UTILIZATION", "MAXIMIZE_STABILITY"],
        constraints: {
          maxWeight: vehicle.capacity.weight,
          maxVolume: vehicle.capacity.volume,
          maxHeight: vehicle.capacity.height,
          temperatureSeparation: true,
          fragileProtection: true,
        },
        optimization: {
          algorithm: "GENETIC",
          maxIterations: 1000,
          timeLimit: 30,
        },
        createdBy: "user",
      };

      const response = await apiFetch("/api/transportation/load-building", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "build-load",
          request,
        }),
      });

      const result: LoadBuildingResult = await response.json();
      setLoadPlan(result.loadPlan);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error optimizing load", err, {
        module: "transportation",
        service: "load-building",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "load-building",
      });
      setError(err.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <PageTemplate
      title="Load Building"
      description="Advanced load building with multi-temperature zones, wagon balancing, and 3D optimization"
      icon="ri-stack-line"
      stats={[
        { label: "Items", value: items.length, icon: "ri-box-line" },
        {
          label: "Weight",
          value: `${items.reduce((sum, i) => sum + i.weight * i.quantity, 0)}kg`,
          icon: "ri-weight-line",
        },
        {
          label: "Volume",
          value: `${items.reduce((sum, i) => sum + i.volume * i.quantity, 0).toFixed(1)}m³`,
          icon: "ri-cube-line",
        },
        {
          label: "Utilization",
          value: loadPlan
            ? `${loadPlan.metrics.volumeUtilization.toFixed(1)}%`
            : "N/A",
          icon: "ri-bar-chart-line",
        },
      ]}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <select
              value={selectedShipmentId}
              onChange={(e) => setSelectedShipmentId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
            >
              <option value="">Import items from shipment…</option>
              {shipments.map((s) => (
                <option key={String(s.id)} value={String(s.id)}>
                  {(s as any).shipmentNumber || String(s.id)}
                </option>
              ))}
            </select>
            <button
              onClick={importItemsFromSelectedShipment}
              disabled={!selectedShipmentId}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm disabled:opacity-50"
              title="Import shipment item lines into load items (dimensions must be filled before optimization)."
            >
              Import
            </button>
          </div>
          <button
            onClick={handleOptimize}
            disabled={!vehicle || isOptimizing}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Optimize Load
              </>
            )}
          </button>
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Items
          </button>
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Plan
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5" />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {items.length === 0 && (
          <div className="rounded-lg border border-white/10 bg-white/5 text-white/80 p-4 text-sm">
            This page is now production-safe (no demo items are auto-loaded).
            Import real shipment items above, or add items manually (coming
            next).
            {isProd() && (
              <div className="mt-2 text-white/60">
                Production rule: optimization is blocked until all item
                weights/volumes/dimensions are provided.
              </div>
            )}
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
          {[
            { id: "PLANNING", label: "Planning", icon: Package },
            { id: "METRICS", label: "Metrics", icon: BarChart3 },
            { id: "3D", label: "3D View", icon: Box },
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

        {/* Optimization Mode */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium mb-2">
            Optimization Mode
          </label>
          <div className="flex items-center gap-3">
            {["MANUAL", "AUTO", "HYBRID"].map((mode) => (
              <button
                key={mode}
                onClick={() => setOptimizationMode(mode as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  optimizationMode === mode
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {viewMode === "PLANNING" && vehicle && (
          <GraphicalPlanningInterface
            items={items}
            vehicle={vehicle}
            onPlanCreated={(plan) => setLoadPlan(plan)}
            onItemMoved={(itemId, position) => {
              logger.debug("Item moved", undefined, {
                module: "transportation",
                service: "load-building",
                itemId,
              });
            }}
          />
        )}

        {viewMode === "METRICS" && loadPlan && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Weight Utilization"
              value={`${loadPlan.metrics.weightUtilization.toFixed(1)}%`}
              icon={Target}
              color="green"
              max={100}
              current={loadPlan.metrics.weightUtilization}
            />
            <MetricCard
              title="Volume Utilization"
              value={`${loadPlan.metrics.volumeUtilization.toFixed(1)}%`}
              icon={Layers}
              color="blue"
              max={100}
              current={loadPlan.metrics.volumeUtilization}
            />
            <MetricCard
              title="Space Efficiency"
              value={`${loadPlan.metrics.spaceEfficiency.toFixed(1)}%`}
              icon={Box}
              color="purple"
              max={100}
              current={loadPlan.metrics.spaceEfficiency}
            />
            <MetricCard
              title="Stability"
              value={`${loadPlan.metrics.stability.toFixed(1)}%`}
              icon={Target}
              color="orange"
              max={100}
              current={loadPlan.metrics.stability}
            />
          </div>
        )}

        {viewMode === "3D" && loadPlan && (
          <Load3DVisualization
            loadPlan={loadPlan}
            items={items}
            vehicle={vehicle}
          />
        )}

        {/* Warnings and Recommendations */}
        {loadPlan && (
          <div className="space-y-4">
            {loadPlan.constraints && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  Constraints Status
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Weight Limit:
                    </span>
                    <span
                      className={`ml-2 font-medium ${loadPlan.constraints.weightLimit ? "text-green-600" : "text-red-600"}`}
                    >
                      {loadPlan.constraints.weightLimit ? "✓" : "✗"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Volume Limit:
                    </span>
                    <span
                      className={`ml-2 font-medium ${loadPlan.constraints.volumeLimit ? "text-green-600" : "text-red-600"}`}
                    >
                      {loadPlan.constraints.volumeLimit ? "✓" : "✗"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Height Limit:
                    </span>
                    <span
                      className={`ml-2 font-medium ${loadPlan.constraints.heightLimit ? "text-green-600" : "text-red-600"}`}
                    >
                      {loadPlan.constraints.heightLimit ? "✓" : "✗"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Hazmat Separation:
                    </span>
                    <span
                      className={`ml-2 font-medium ${loadPlan.constraints.hazmatSeparation ? "text-green-600" : "text-red-600"}`}
                    >
                      {loadPlan.constraints.hazmatSeparation ? "✓" : "✗"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {loadPlan.optimization && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="font-bold mb-2">Optimization Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Algorithm:
                    </span>
                    <span className="ml-2 font-medium">
                      {loadPlan.optimization.algorithm}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Iterations:
                    </span>
                    <span className="ml-2 font-medium">
                      {loadPlan.optimization.iterations}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Execution Time:
                    </span>
                    <span className="ml-2 font-medium">
                      {loadPlan.optimization.executionTime}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Score:
                    </span>
                    <span className="ml-2 font-medium">
                      {loadPlan.optimization.score.toFixed(1)}/100
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

function MetricCard({ title, value, icon: Icon, color, max, current }: any) {
  const colorClasses = {
    green:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400",
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400",
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
      <div className="text-2xl font-bold mb-2">{value}</div>
      {max && current !== undefined && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (current / max) * 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-2 rounded-full ${
              color === "green"
                ? "bg-green-500"
                : color === "blue"
                  ? "bg-blue-500"
                  : color === "purple"
                    ? "bg-purple-500"
                    : "bg-orange-500"
            }`}
          />
        </div>
      )}
    </motion.div>
  );
}

function Load3DVisualization({
  loadPlan,
  items,
  vehicle,
}: {
  loadPlan: LoadPlan;
  items: LoadItem[];
  vehicle: Vehicle | null;
}) {
  const [rotation, setRotation] = useState({ x: -20, y: 45 });
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setRotation({
      x: rotation.x - deltaY * 0.5,
      y: rotation.y + deltaX * 0.5,
    });
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.max(0.5, Math.min(2, prev - e.deltaY * 0.001)));
  };

  if (!vehicle) return null;

  // Calculate 3D positions for items
  const itemPositions = items.map((item, idx) => {
    const x =
      (idx % 4) * (vehicle.capacity.width / 4) - vehicle.capacity.width / 2;
    const y =
      Math.floor(idx / 4) * (vehicle.capacity.length / 4) -
      vehicle.capacity.length / 2;
    const z = 0;
    return { ...item, x, y, z };
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Box className="w-5 h-5" />
          3D Load Visualization
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRotation({ x: -20, y: 45 })}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="Reset View"
          >
            <RotateCw className="w-4 h-4" />
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
        className={`relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden ${
          isFullscreen ? "fixed inset-4 z-50" : "h-[600px]"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        {/* 3D Container */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            perspective: "1000px",
            perspectiveOrigin: "50% 50%",
          }}
        >
          <div
            className="relative"
            style={{
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom})`,
              transformStyle: "preserve-3d",
              transition: isDragging ? "none" : "transform 0.1s ease-out",
            }}
          >
            {/* Vehicle Container */}
            <div
              className="relative border-2 border-blue-500/50 bg-blue-500/10"
              style={{
                width: `${vehicle.capacity.width * 2}px`,
                height: `${vehicle.capacity.length * 2}px`,
                transform: "translateZ(0)",
              }}
            >
              {/* Vehicle Floor */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-blue-200/30 to-blue-300/30 border border-blue-400/50"
                style={{
                  transform: "translateZ(0)",
                }}
              />              {/* Vehicle Walls */}
              <div
                className="absolute top-0 left-0 right-0 bg-blue-400/20 border-b border-blue-500/50"
                style={{
                  height: `${vehicle.capacity.height * 2}px`,
                  transform: `translateZ(${vehicle.capacity.height * 2}px)`,
                }}
              />              {/* Items */}
              {itemPositions.map((item, idx) => {
                const itemHeight = (item.dimensions?.height || 20) * 2;
                const itemWidth = (item.dimensions?.width || 20) * 2;
                const itemLength = (item.dimensions?.length || 20) * 2;
                const isSelected = selectedItem === item.id;                return (
                  <motion.div
                    key={item.id}
                    className={`absolute border-2 cursor-pointer ${
                      isSelected
                        ? "border-yellow-400 shadow-lg shadow-yellow-400/50"
                        : "border-blue-400/50 hover:border-blue-400"
                    }`}
                    style={{
                      left: `${item.x + vehicle.capacity.width}px`,
                      top: `${item.y + vehicle.capacity.length}px`,
                      width: `${itemWidth}px`,
                      height: `${itemLength}px`,
                      transform: `translateZ(${itemHeight / 2}px)`,
                      backgroundColor: isSelected
                        ? "rgba(250, 204, 21, 0.3)"
                        : `rgba(59, 130, 246, ${0.2 + (idx % 3) * 0.1})`,
                    }}
                    onClick={() => setSelectedItem(isSelected ? null : item.id)}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg">
                      {item.description?.substring(0, 3).toUpperCase()}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>        {/* Controls Overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm">
            <div className="flex items-center gap-4">
              <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
              <span>
                Rotation: X {rotation.x.toFixed(0)}° Y {rotation.y.toFixed(0)}°
              </span>
            </div>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-xs">
            <div className="flex flex-col gap-1">
              <div>🖱️ Drag to rotate</div>
              <div>🔍 Scroll to zoom</div>
              <div>👆 Click items to select</div>
            </div>
          </div>
        </div>        {/* Item Info Panel */}
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-w-xs"
          >
            {(() => {
              const item = items.find((i) => i.id === selectedItem);
              if (!item) return null;
              return (
                <div>
                  <h4 className="font-bold mb-2">{item.description}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Quantity:
                      </span>
                      <span className="font-medium">{item.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Weight:
                      </span>
                      <span className="font-medium">{item.weight}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Volume:
                      </span>
                      <span className="font-medium">{item.volume}m³</span>
                    </div>
                    {item.dimensions && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Dimensions:
                        </span>
                        <span className="font-medium">
                          {item.dimensions.length}×{item.dimensions.width}×
                          {item.dimensions.height}cm
                        </span>
                      </div>
                    )}
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

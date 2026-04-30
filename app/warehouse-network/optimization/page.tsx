/**
 * Warehouse Network Optimization Dashboard
 * AI-powered route optimization, inventory allocation, and network-wide optimization
 * World-class UX with full drill-downs and visualizations
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Network,
  TrendingUp,
  MapPin,
  Package,
  Truck,
  Target,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Download,
  Share2,
  Zap,
  Activity,
  BarChart3,
  Settings,
} from "lucide-react";
import { aiOptimizationService } from "@/lib/services/warehouse-network/aiOptimizationService";
import { warehouseNetworkService } from "@/lib/services/warehouse-network/warehouseNetworkService";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function WarehouseNetworkOptimizationPage() {
  const router = useRouter();
  const [optimizationType, setOptimizationType] = useState<
    "ROUTE" | "INVENTORY" | "NETWORK"
  >("ROUTE");
  const [optimization, setOptimization] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (warehouses.length > 0) {
      performOptimization();
    }
  }, [optimizationType, warehouses]);

  const loadWarehouses = async () => {
    try {
      const network = await warehouseNetworkService.getNetwork();
      setWarehouses(network.warehouses || []);
    } catch (error) {
      console.error("Failed to load warehouses:", error);
    }
  };

  const performOptimization = async () => {
    setLoading(true);
    try {
      let result;
      if (optimizationType === "ROUTE") {
        result = await aiOptimizationService.optimizeRoute({
          fromWarehouseId: warehouses[0]?.id || "",
          toWarehouseId: warehouses[1]?.id || "",
        });
      } else if (optimizationType === "INVENTORY") {
        result = await aiOptimizationService.optimizeInventoryAllocation({
          warehouses: warehouses.map((w) => w.id),
          totalInventory: 1000,
        });
      } else {
        result = await aiOptimizationService.optimizeNetwork({
          warehouses: warehouses.map((w) => w.id),
        });
      }
      setOptimization(result);
    } catch (error) {
      console.error("Optimization failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const routeData = useMemo(() => {
    if (!optimization?.routes) return [];
    return optimization.routes.map((r: any, idx: number) => ({
      route: `Route ${idx + 1}`,
      distance: r.distance,
      time: r.transitTime,
      cost: r.cost,
      efficiency: r.efficiency || 85,
    }));
  }, [optimization]);

  const allocationData = useMemo(() => {
    if (!optimization?.allocation) return [];
    return optimization.allocation.map((a: any) => ({
      warehouse: a.warehouseName || a.warehouseId,
      current: a.currentInventory || 0,
      recommended: a.recommendedInventory || 0,
      utilization: a.utilization || 0,
    }));
  }, [optimization]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <HeaderSection
          onBack={() => router.back()}
          optimizationType={optimizationType}
          onTypeChange={setOptimizationType}
          onRefresh={performOptimization}
        />

        {/* Key Metrics */}
        <KeyMetricsSection optimization={optimization} />

        {/* Optimization Type Tabs */}
        <OptimizationTabsSection
          type={optimizationType}
          onTypeChange={setOptimizationType}
        />

        {/* Route Optimization */}
        {optimizationType === "ROUTE" && (
          <RouteOptimizationSection
            optimization={optimization}
            data={routeData}
            selected={selectedRoute}
            onSelect={setSelectedRoute}
          />
        )}

        {/* Inventory Allocation */}
        {optimizationType === "INVENTORY" && (
          <InventoryAllocationSection
            optimization={optimization}
            data={allocationData}
          />
        )}

        {/* Network Optimization */}
        {optimizationType === "NETWORK" && (
          <NetworkOptimizationSection optimization={optimization} />
        )}

        {/* Expected Benefits */}
        {optimization?.expectedBenefits && (
          <ExpectedBenefitsSection benefits={optimization.expectedBenefits} />
        )}

        {/* Recommendations */}
        {optimization?.recommendations && (
          <RecommendationsSection
            recommendations={optimization.recommendations}
          />
        )}
      </div>
    </div>
  );
}

function HeaderSection({
  onBack,
  optimizationType,
  onTypeChange,
  onRefresh,
}: {
  onBack: () => void;
  optimizationType: string;
  onTypeChange: (type: any) => void;
  onRefresh: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-blue-600" />
              Network Optimization
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              AI-powered warehouse network optimization and route planning
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function KeyMetricsSection({ optimization }: { optimization: any }) {
  if (!optimization) return null;

  const metrics = [
    {
      label: "Cost Reduction",
      value: `${optimization.expectedBenefits?.costReduction || 0}%`,
      icon: TrendingUp,
      color: "green",
    },
    {
      label: "Time Savings",
      value: `${optimization.expectedBenefits?.timeSavings || 0}%`,
      icon: Zap,
      color: "blue",
    },
    {
      label: "Efficiency Gain",
      value: `${optimization.expectedBenefits?.efficiencyGain || 0}%`,
      icon: Activity,
      color: "purple",
    },
    {
      label: "Confidence",
      value: `${optimization.confidence || 0}%`,
      icon: Target,
      color: "orange",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      {metrics.map((metric, idx) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className={`w-12 h-12 rounded-xl bg-${metric.color}-100 dark:bg-${metric.color}-900/30 flex items-center justify-center`}
            >
              <metric.icon
                className={`w-6 h-6 text-${metric.color}-600 dark:text-${metric.color}-400`}
              />
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              {metric.label}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {metric.value}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function OptimizationTabsSection({
  type,
  onTypeChange,
}: {
  type: string;
  onTypeChange: (t: any) => void;
}) {
  const tabs = [
    { id: "ROUTE", label: "Route Optimization", icon: Truck },
    { id: "INVENTORY", label: "Inventory Allocation", icon: Package },
    { id: "NETWORK", label: "Network-Wide", icon: Network },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex gap-2 bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-xl border border-slate-200 dark:border-slate-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTypeChange(tab.id)}
              className={`flex-1 px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                type === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function RouteOptimizationSection({
  optimization,
  data,
  selected,
  onSelect,
}: {
  optimization: any;
  data: any[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  if (!optimization?.routes) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 mb-8"
    >
      {/* Routes Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          Route Comparison
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="route" stroke="#64748b" />
            <YAxis yAxisId="left" stroke="#64748b" />
            <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="distance"
              fill="#3b82f6"
              name="Distance (km)"
            />
            <Bar
              yAxisId="left"
              dataKey="time"
              fill="#10b981"
              name="Time (hours)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="efficiency"
              stroke="#f59e0b"
              strokeWidth={3}
              name="Efficiency %"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Route Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {optimization.routes.map((route: any, idx: number) => (
          <motion.div
            key={idx}
            onClick={() => onSelect(route.id || `route-${idx}`)}
            className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
              selected === (route.id || `route-${idx}`)
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-slate-200 dark:border-slate-700 hover:border-blue-300 bg-white dark:bg-slate-800"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Route {idx + 1}
              </h3>
              {route.optimal && (
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
                  Optimal
                </span>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Distance:
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {route.distance} km
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Transit Time:
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {route.transitTime} hours
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Cost:
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  ${route.cost?.toLocaleString() || "0"}
                </span>
              </div>
              {route.efficiency && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Efficiency:
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {route.efficiency}%
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function InventoryAllocationSection({
  optimization,
  data,
}: {
  optimization: any;
  data: any[];
}) {
  if (!optimization?.allocation) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 mb-8"
    >
      {/* Allocation Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          Inventory Allocation
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="warehouse" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="current" fill="#94a3b8" name="Current" />
            <Bar dataKey="recommended" fill="#3b82f6" name="Recommended" />
            <Line
              type="monotone"
              dataKey="utilization"
              stroke="#f59e0b"
              strokeWidth={3}
              name="Utilization %"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Allocation Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {optimization.allocation.map((alloc: any, idx: number) => (
          <div
            key={idx}
            className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700"
          >
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              {alloc.warehouseName || alloc.warehouseId}
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Current
                  </span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {alloc.currentInventory || 0}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-slate-400 dark:bg-slate-500 h-2 rounded-full"
                    style={{ width: `${alloc.utilization || 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Recommended
                  </span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {alloc.recommendedInventory || 0}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${((alloc.recommendedInventory || 0) / (alloc.capacity || 100)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function NetworkOptimizationSection({ optimization }: { optimization: any }) {
  if (!optimization) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 mb-8"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Network-Wide Optimization
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Total Cost Reduction
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {optimization.totalCostReduction || 0}%
          </p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Network Efficiency
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {optimization.networkEfficiency || 0}%
          </p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Optimization Score
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {optimization.optimizationScore || 0}/100
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function ExpectedBenefitsSection({ benefits }: { benefits: any }) {
  if (!benefits) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 mb-8"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Expected Benefits
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Cost Reduction
            </h3>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {benefits.costReduction || 0}%
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {benefits.costReductionReasoning ||
              "Expected cost savings from optimization"}
          </p>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Time Savings
            </h3>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {benefits.timeSavings || 0}%
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {benefits.timeSavingsReasoning ||
              "Expected time savings from optimization"}
          </p>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Efficiency Gain
            </h3>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {benefits.efficiencyGain || 0}%
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {benefits.efficiencyGainReasoning ||
              "Expected efficiency improvement"}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function RecommendationsSection({
  recommendations,
}: {
  recommendations: any[];
}) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 mb-8"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Optimization Recommendations
      </h2>
      <div className="space-y-4">
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {rec.action}
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {rec.reasoning}
            </p>
            {rec.expectedImpact && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Expected Impact:{" "}
                <span className="font-medium">{rec.expectedImpact}</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

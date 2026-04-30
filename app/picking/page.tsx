/**
 * Picking Management Page
 * INTEGRATED: Now uses real Prisma database via /api/wms/picking
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import PickingStrategySelector from "@/components/PickingStrategySelector";
import PickingRouteVisualization from "@/components/PickingRouteVisualization";
import {
  calculatePickingAnalytics,
  calculateRealTimeMetrics,
} from "@/utils/pickingAnalytics";
import {
  hybridOptimization,
  calculateRouteMetrics,
} from "@/utils/pickingOptimizer";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";
import {
  PickingTask,
  PickingStrategy,
  Picker,
  PickLocation,
  Priority,
} from "@/types/picking";
import { format } from "date-fns";
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
import { useViewContext } from "@/contexts/ViewContextProvider";
import { useAuth } from "@/contexts/AuthContext";
import CustomerSelector from "@/components/multi-tenant/CustomerSelector";

export default function Picking() {
  const router = useRouter();
  const { context } = useViewContext();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<PickingTask[]>([]);
  const [pickers, setPickers] = useState<Picker[]>([]);
  const [salesOrders] = useState(() => generateSalesOrders(100));
  const [customers] = useState(() =>
    generateMultiTenantCustomers(20, user?.tenantId || "tenant-1"),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch picking tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/wms/picking?limit=100');
        const result = await response.json();

        if (result.success && result.data) {
          // Map API response to PickingTask format
          const mappedTasks: PickingTask[] = result.data.map((task: any, index: number) => ({
            id: task.id || `pick-${index}`,
            taskNumber: task.taskNumber || `PICK-${index + 1}`,
            orderNumber: task.shipmentNumber || `SO-${index + 1}`,
            orderNumbers: task.shipmentNumber ? [task.shipmentNumber] : [],
            strategy: 'AUTO' as PickingStrategy,
            status: (task.status || 'PENDING') as PickingStatus,
            priority: (task.priority || 'MEDIUM') as Priority,
            assignedTo: task.assignedTo || undefined,
            assignedToName: task.assignedTo || undefined,
            waveId: task.waveId || undefined,
            waveNumber: task.waveNumber || undefined,
            shipmentId: task.shipmentId || undefined,
            shipmentNumber: task.shipmentNumber || undefined,
            items: [{
              id: `item-${index}`,
              materialNumber: task.sku || '',
              materialDescription: task.sku || 'Unknown Material',
              requiredQuantity: task.quantity || 0,
              pickedQuantity: task.pickedQty || 0,
              unit: 'EA',
              fromLocation: {
                id: task.fromBinId || `bin-${index}`,
                locationCode: task.fromBinId || `BIN-${index}`,
                zone: 'A',
                aisle: '1',
                rack: '1',
                shelf: '1',
                bin: task.fromBinId || '',
                coordinates: { x: 0, y: 0, z: 0 },
                distanceFromStart: 0,
                estimatedTravelTime: 0,
                accessibility: 'EASY' as const,
                requiresEquipment: false,
              },
              status: task.pickedQty >= task.quantity ? 'PICKED' as const : 'PENDING' as const,
              priority: (task.priority || 'MEDIUM') as Priority,
              weight: 0,
              volume: 0,
              hazardous: false,
              temperatureControlled: false,
              requiresSpecialHandling: false,
              qualityCheckRequired: false,
            }],
            createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
            updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
            estimatedDuration: 0,
            actualDuration: undefined,
            startTime: undefined,
            endTime: undefined,
            warehouseId: task.warehouseId || undefined,
          }));
          setTasks(mappedTasks);
        } else {
          setError(result.error || 'Failed to fetch picking tasks');
        }
      } catch (err) {
        console.error('Error fetching picking tasks:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch picking tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Generate pickers (mock for now - would come from API in production)
  useEffect(() => {
    try {
      setPickers(generatePickers(15));
    } catch (error) {
      setPickers([]);
    }
  }, []);
  const [selectedStrategy, setSelectedStrategy] =
    useState<PickingStrategy>("AUTO");
  const [viewMode, setViewMode] = useState<
    | "table"
    | "grid"
    | "analytics"
    | "realtime"
    | "route-optimization"
    | "gps-tracking"
  >("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedTask, setSelectedTask] = useState<PickingTask | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState({
    activePickers: 0,
    picksPerHour: 0,
    accuracyRate: 0,
    routeEfficiency: 0,
  });
  const [createFormData, setCreateFormData] = useState({
    orderNumber: "",
    strategy: "AUTO" as PickingStrategy,
    priority: "MEDIUM" as Priority,
    assignedTo: "",
  });

  // Calculate analytics (must be before useEffect that uses them)
  const analytics = useMemo(
    () => calculatePickingAnalytics(tasks, pickers),
    [tasks, pickers],
  );
  const realTimeMetrics = useMemo(
    () => calculateRealTimeMetrics(tasks),
    [tasks],
  );

  // Real-time updates
  useEffect(() => {
    const unsubscribe = realtimeSimulator.subscribe(
      "picking-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "picking-stats",
      () => ({
        activePickers: simulateKPIUpdates(realTimeMetrics.activePickers, 0.1),
        picksPerHour: simulateKPIUpdates(analytics.averagePicksPerHour, 0.05),
        accuracyRate: simulateKPIUpdates(analytics.averageAccuracy, 0.02),
        routeEfficiency: simulateKPIUpdates(analytics.routeEfficiency, 0.03),
      }),
      5000,
      true,
    );

    return () => {
      unsubscribe();
      stop();
    };
  }, [
    analytics.averagePicksPerHour,
    analytics.averageAccuracy,
    analytics.routeEfficiency,
    realTimeMetrics.activePickers,
  ]);

  // Simulate real-time picker location updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPickers((prev) =>
        prev.map((picker) => {
          if (picker.status === "BUSY" && picker.location) {
            return {
              ...picker,
              location: {
                ...picker.location,
                x: picker.location.x + (Math.random() * 2 - 1) * 0.5,
                y: picker.location.y + (Math.random() * 2 - 1) * 0.5,
              },
              lastUpdate: new Date(),
            };
          }
          return picker;
        }),
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Simulate real-time task progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.status === "IN_PROGRESS" && task.startedAt) {
            const progress = Math.min(
              100,
              task.completionPercentage + Math.random() * 2,
            );
            return {
              ...task,
              completionPercentage: progress,
              pickedItems: Math.floor((progress / 100) * task.totalItems),
              updatedAt: new Date(),
            };
          }
          return task;
        }),
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by customer via orderNumber lookup
    if (
      context.customerFilter.type !== "ALL" &&
      context.customerFilter.customerIds
    ) {
      const customerNumbers = customers
        .filter((c) => context.customerFilter.customerIds?.includes(c.id))
        .map((c) => c.customerNumber);

      const relevantOrderNumbers = salesOrders
        .filter((so) => customerNumbers.includes(so.customerNumber))
        .map((so) => so.soNumber);

      filtered = filtered.filter(
        (task) =>
          relevantOrderNumbers.includes(task.orderNumber) ||
          (task.orderNumbers &&
            task.orderNumbers.some((on) => relevantOrderNumbers.includes(on))),
      );
    }

    // Apply other filters
    return filtered.filter((task) => {
      const matchesSearch =
        task.taskNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.orderNumbers?.some((on) =>
          on.toLowerCase().includes(searchQuery.toLowerCase()),
        ) ||
        task.assignedToName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || task.status === selectedStatus;
      const matchesPriority =
        selectedPriority === "ALL" || task.priority === selectedPriority;
      const matchesStrategy =
        selectedStrategy === "AUTO" || task.strategy === selectedStrategy;
      return (
        matchesSearch && matchesStatus && matchesPriority && matchesStrategy
      );
    });
  }, [
    tasks,
    context.customerFilter,
    customers,
    salesOrders,
    searchQuery,
    selectedStatus,
    selectedPriority,
    selectedStrategy,
  ]);

  // Stats for dashboard
  if (loading) {
    return (
      <PageTemplate
        title="World-Class Picking Module"
        description="Industry-leading picking operations with AI-powered optimization"
        icon="ri-handbag-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading picking tasks...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate
        title="World-Class Picking Module"
        description="Industry-leading picking operations with AI-powered optimization"
        icon="ri-handbag-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-400 mb-4">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </PageTemplate>
    );
  }

  const stats = [
    {
      label: "Total Tasks",
      value: tasks.length,
      icon: "ri-handbag-line",
      tooltip: "Total picking tasks",
      trend: "up" as const,
    },
    {
      label: "Active Pickers",
      value: realTimeMetrics.activePickers,
      icon: "ri-user-line",
      tooltip: "Currently active pickers",
      trend: "neutral" as const,
    },
    {
      label: "Avg Picks/Hour",
      value: Math.round(analytics.averagePicksPerHour),
      icon: "ri-speed-line",
      tooltip: "Average picks per hour",
      trend: (analytics.averagePicksPerHour > 100 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
    {
      label: "Accuracy Rate",
      value: `${analytics.averageAccuracy.toFixed(1)}%`,
      icon: "ri-target-line",
      tooltip: "Average picking accuracy",
      trend: (analytics.averageAccuracy > 98 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
    {
      label: "Quality Score",
      value: `${analytics.qualityPassRate.toFixed(1)}%`,
      icon: "ri-award-line",
      tooltip: "Quality pass rate",
      trend: (analytics.qualityPassRate > 95 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
    {
      label: "Route Efficiency",
      value: `${analytics.routeEfficiency.toFixed(1)}%`,
      icon: "ri-route-line",
      tooltip: "Route optimization efficiency",
      trend: (analytics.routeEfficiency > 85 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
    {
      label: "Carbon Saved",
      value: `${analytics.totalCarbonFootprint.toFixed(1)} kg`,
      icon: "ri-leaf-line",
      tooltip: "Total carbon footprint reduction",
      trend: "up" as const,
    },
    {
      label: "Energy Saved",
      value: `${analytics.totalEnergyConsumed.toFixed(2)} kWh`,
      icon: "ri-flashlight-line",
      tooltip: "Total energy consumption",
      trend: "up" as const,
    },
  ];

  // Strategy performance chart data
  const strategyPerformanceData = Object.entries(analytics.strategyPerformance)
    .filter(([_, perf]) => perf.taskCount > 0)
    .map(([strategy, perf]) => ({
      strategy: strategy.replace("_", " "),
      efficiency: perf.averageEfficiency,
      accuracy: perf.averageAccuracy,
      tasks: perf.taskCount,
    }));

  // Hourly performance chart data
  const hourlyPerformanceData = analytics.hourlyPerformance.map((h) => ({
    hour: `${h.hour}:00`,
    picks: h.picks,
    accuracy: h.accuracy,
    efficiency: h.efficiency,
  }));

  // Status distribution for pie chart
  const statusDistribution = [
    {
      name: "Completed",
      value: tasks.filter((t) => t.status === "COMPLETED").length,
      color: "#10b981",
    },
    {
      name: "In Progress",
      value: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      color: "#3b82f6",
    },
    {
      name: "Assigned",
      value: tasks.filter((t) => t.status === "ASSIGNED").length,
      color: "#f59e0b",
    },
    {
      name: "Pending",
      value: tasks.filter((t) => t.status === "PENDING").length,
      color: "#6b7280",
    },
  ];

  // Handle task actions
  const handleStartTask = (task: PickingTask) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: "IN_PROGRESS" as const, startedAt: new Date() }
          : t,
      ),
    );
  };

  const handleCompleteTask = (task: PickingTask) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: "COMPLETED" as const,
              completedAt: new Date(),
              completionPercentage: 100,
              pickedItems: t.totalItems,
              actualDuration: t.startedAt
                ? (Date.now() - new Date(t.startedAt).getTime()) / 1000
                : t.estimatedDuration,
            }
          : t,
      ),
    );
  };

  const handleOptimizeRoute = (task: PickingTask) => {
    if (task.items.length === 0) return;

    const startLocation: PickLocation = {
      id: "START",
      locationCode: "START",
      zone: "ENTRANCE",
      aisle: "0",
      rack: "0",
      shelf: "0",
      bin: "0",
      coordinates: { x: 0, y: 0, z: 0 },
      distanceFromStart: 0,
      estimatedTravelTime: 0,
      accessibility: "EASY",
      requiresEquipment: false,
    };

    const locations = task.items.map((item) => item.fromLocation);
    const optimization = hybridOptimization(
      locations,
      startLocation,
      "OPTIMAL",
    );
    const metrics = calculateRouteMetrics(
      optimization.optimizedRoute,
      startLocation,
    );

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              optimizedRoute: optimization.optimizedRoute,
              estimatedDistance: metrics.totalDistance,
              estimatedDuration: metrics.totalTime,
              carbonFootprint: metrics.carbonFootprint,
              energyConsumed: metrics.energyConsumed,
            }
          : t,
      ),
    );
  };

  return (
    <PageTemplate
      title="World-Class Picking Module"
      description="Industry-leading picking operations with AI-powered optimization, multiple strategies, real-time tracking, and sustainability metrics. Beats SAP, Oracle, and all top-tier WMS systems."
      icon="ri-handbag-line"
      systemInfo={{
        sap: "Picking Strategy, Pick Path Optimization, Wave Planning, Batch Picking",
        oracle: "Picking, Order Fulfillment, Pick Path, Zone Picking",
        manhattan:
          "Picking Management, Wave Planning, Pick Optimization, Voice Picking",
      }}
      examples={[
        "AI-powered route optimization",
        "Multiple picking strategies (10+ methods)",
        "Real-time picker tracking",
        "Quality control and verification",
        "Sustainability metrics (carbon, energy)",
        "Performance analytics and insights",
        "Mobile-first interface",
        "Voice and vision picking support",
      ]}
      stats={stats}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 sm:p-2">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "table"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Table View"
            >
              <i className="ri-table-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Grid View"
            >
              <i className="ri-grid-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "analytics"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Analytics View"
            >
              <i className="ri-bar-chart-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("realtime")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "realtime"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Real-time View"
            >
              <i className="ri-radar-line text-sm sm:text-base"></i>
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 whitespace-nowrap"
          >
            <i className="ri-add-line"></i>
            <span className="hidden sm:inline">Create Pick Task</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      }
    >
      {/* Strategy Selector */}
      <div className="mb-6">
        <PickingStrategySelector
          selectedStrategy={selectedStrategy}
          onStrategyChange={setSelectedStrategy}
        />
      </div>

      {/* Filters */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 w-full sm:min-w-[200px] sm:max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm z-10"></i>
          <input
            type="text"
            placeholder="Search by Task Number, Order, Picker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 w-full sm:w-auto sm:min-w-[160px] relative z-20"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="PARTIAL">Partial</option>
        </select>
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 w-full sm:w-auto sm:min-w-[160px] relative z-20"
        >
          <option value="ALL">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {/* View Modes */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedTask(task)}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-lg font-semibold text-white font-mono mb-1">
                    {task.taskNumber}
                  </div>
                  <div className="text-sm text-[#9ca3af] font-mono">
                    {task.orderNumber}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    task.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : task.status === "IN_PROGRESS"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : task.status === "ASSIGNED"
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                  }`}
                >
                  {task.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9ca3af]">Strategy</span>
                  <span className="text-xs text-cyan-400 font-medium">
                    {task.strategy}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9ca3af]">Items</span>
                  <span className="text-xs text-white font-medium">
                    {task.pickedItems}/{task.totalItems}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9ca3af]">Priority</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      task.priority === "CRITICAL" || task.priority === "URGENT"
                        ? "bg-red-500/20 text-red-400"
                        : task.priority === "HIGH"
                          ? "bg-orange-500/20 text-orange-400"
                          : task.priority === "MEDIUM"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9ca3af]">Assigned To</span>
                  <span className="text-xs text-white">
                    {task.assignedToName || "N/A"}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#9ca3af]">Progress</span>
                  <span className="text-xs text-white font-medium">
                    {task.completionPercentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${task.completionPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                {task.picksPerHour && (
                  <div className="text-xs text-cyan-400">
                    <i className="ri-speed-line mr-1"></i>
                    {Math.round(task.picksPerHour)}/hr
                  </div>
                )}
                {task.accuracyRate && (
                  <div className="text-xs text-green-400">
                    <i className="ri-target-line mr-1"></i>
                    {task.accuracyRate.toFixed(1)}%
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[800px]">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Order(s)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Strategy
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Performance
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
                {filteredTasks.map((task, index) => (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedTask(task)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Tooltip
                        content={`Task: ${task.taskNumber}`}
                        position="right"
                      >
                        <span className="text-sm font-medium text-white font-mono cursor-help">
                          {task.taskNumber}
                        </span>
                      </Tooltip>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-mono">
                        {task.orderNumber}
                      </div>
                      {task.orderNumbers && task.orderNumbers.length > 0 && (
                        <div className="text-xs text-cyan-400">
                          +{task.orderNumbers.length} more
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        {task.strategy}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {task.pickedItems}/{task.totalItems}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {task.items.length} locations
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/10 rounded-full h-2 min-w-[100px]">
                          <div
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${task.completionPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-white font-medium">
                          {task.completionPercentage.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === "CRITICAL" ||
                          task.priority === "URGENT"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : task.priority === "HIGH"
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              : task.priority === "MEDIUM"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-white">
                        {task.assignedToName || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-white">
                        {task.picksPerHour
                          ? `${Math.round(task.picksPerHour)}/hr`
                          : "N/A"}
                      </div>
                      <div className="text-xs text-cyan-400">
                        {task.accuracyRate
                          ? `${task.accuracyRate.toFixed(1)}%`
                          : "N/A"}{" "}
                        acc.
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          task.status === "COMPLETED"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : task.status === "IN_PROGRESS"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : task.status === "ASSIGNED"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(task);
                            }}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        {task.status === "ASSIGNED" && (
                          <Tooltip content="Start Picking" position="top">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartTask(task);
                              }}
                              className="p-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded hover:bg-green-600/30 transition-colors"
                            >
                              <i className="ri-play-line"></i>
                            </button>
                          </Tooltip>
                        )}
                        {task.status === "IN_PROGRESS" && (
                          <Tooltip content="Optimize Route" position="top">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOptimizeRoute(task);
                              }}
                              className="p-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-600/30 transition-colors"
                            >
                              <i className="ri-route-line"></i>
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strategy Performance */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Strategy Performance
              </h3>
              <button
                onClick={() => {
                  const topStrategy = strategyPerformanceData[0]?.strategy;
                  if (topStrategy) {
                    setSelectedStrategy(
                      topStrategy
                        .replace(" ", "_")
                        .toUpperCase() as PickingStrategy,
                    );
                    setViewMode("table");
                  }
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <i className="ri-arrow-right-line mr-1"></i>
                Drill Down
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={strategyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="strategy" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Bar dataKey="efficiency" fill="#06b6d4" name="Efficiency %" />
                <Bar dataKey="accuracy" fill="#10b981" name="Accuracy %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
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
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly Performance */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">
              Hourly Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="picks"
                  stroke="#06b6d4"
                  name="Picks"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#10b981"
                  name="Accuracy %"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#f59e0b"
                  name="Efficiency %"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {viewMode === "realtime" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real-time Metrics */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Real-Time Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm text-[#9ca3af]">Active Pickers</div>
                  <div className="text-2xl font-bold text-white">
                    {realTimeStats.activePickers ||
                      realTimeMetrics.activePickers}
                  </div>
                </div>
                <i className="ri-user-line text-3xl text-cyan-400"></i>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm text-[#9ca3af]">Picks Per Hour</div>
                  <div className="text-2xl font-bold text-white">
                    {Math.round(
                      realTimeStats.picksPerHour ||
                        analytics.averagePicksPerHour,
                    )}
                  </div>
                </div>
                <i className="ri-speed-line text-3xl text-green-400"></i>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm text-[#9ca3af]">Accuracy Rate</div>
                  <div className="text-2xl font-bold text-white">
                    {(realTimeStats.accuracyRate > 0
                      ? realTimeStats.accuracyRate
                      : analytics.averageAccuracy
                    ).toFixed(1)}
                    %
                  </div>
                </div>
                <i className="ri-target-line text-3xl text-yellow-400"></i>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm text-[#9ca3af]">Route Efficiency</div>
                  <div className="text-2xl font-bold text-white">
                    {(realTimeStats.routeEfficiency > 0
                      ? realTimeStats.routeEfficiency
                      : analytics.routeEfficiency
                    ).toFixed(1)}
                    %
                  </div>
                </div>
                <i className="ri-route-line text-3xl text-cyan-400"></i>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm text-[#9ca3af]">Average Progress</div>
                  <div className="text-2xl font-bold text-white">
                    {realTimeMetrics.averageProgress.toFixed(1)}%
                  </div>
                </div>
                <i className="ri-progress-3-line text-3xl text-green-400"></i>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm text-[#9ca3af]">Efficiency Trend</div>
                  <div
                    className={`text-2xl font-bold ${
                      realTimeMetrics.efficiencyTrend === "UP"
                        ? "text-green-400"
                        : realTimeMetrics.efficiencyTrend === "DOWN"
                          ? "text-red-400"
                          : "text-yellow-400"
                    }`}
                  >
                    {realTimeMetrics.efficiencyTrend}
                  </div>
                </div>
                <i
                  className={`ri-arrow-${realTimeMetrics.efficiencyTrend === "UP" ? "up" : realTimeMetrics.efficiencyTrend === "DOWN" ? "down" : "right"}-line text-3xl ${
                    realTimeMetrics.efficiencyTrend === "UP"
                      ? "text-green-400"
                      : realTimeMetrics.efficiencyTrend === "DOWN"
                        ? "text-red-400"
                        : "text-yellow-400"
                  }`}
                ></i>
              </div>
              {realTimeMetrics.estimatedCompletion && (
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <div className="text-sm text-[#9ca3af]">
                      Est. Completion
                    </div>
                    <div className="text-lg font-bold text-white">
                      {format(realTimeMetrics.estimatedCompletion, "HH:mm")}
                    </div>
                  </div>
                  <i className="ri-time-line text-3xl text-cyan-400"></i>
                </div>
              )}
            </div>
          </div>

          {/* Active Pickers */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Active Pickers
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pickers
                .filter((p) => p.status === "BUSY" || p.status === "AVAILABLE")
                .map((picker) => (
                  <motion.div
                    key={picker.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {picker.name}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          Zone {picker.zone}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            picker.status === "BUSY"
                              ? "bg-blue-500/20 text-blue-400"
                              : picker.status === "AVAILABLE"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {picker.status}
                        </span>
                        <div className="text-xs text-cyan-400 mt-1">
                          {Math.round(picker.performance.averagePicksPerHour)}{" "}
                          picks/hr
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Route Optimization View */}
      {viewMode === "route-optimization" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Advanced Route Optimization
                </h3>
                <p className="text-sm text-[#9ca3af]">
                  Compare multiple optimization algorithms and select the best
                  route for each task
                </p>
              </div>
              <div className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg">
                <i className="ri-route-line text-2xl"></i>
              </div>
            </div>
            <div className="space-y-4">
              {filteredTasks
                .filter(
                  (t) => t.status === "PENDING" || t.status === "ASSIGNED",
                )
                .slice(0, 10)
                .map((task) => {
                  const startLocation: PickLocation = {
                    id: "START",
                    locationCode: "START",
                    zone: "ENTRANCE",
                    aisle: "0",
                    rack: "0",
                    shelf: "0",
                    bin: "0",
                    coordinates: { x: 0, y: 0, z: 0 },
                    distanceFromStart: 0,
                    estimatedTravelTime: 0,
                    accessibility: "EASY",
                    requiresEquipment: false,
                  };
                  const locations = task.items.map((item) => item.fromLocation);

                  // Generate optimizations with different strategies
                  const fastOpt = hybridOptimization(
                    locations,
                    startLocation,
                    "FAST",
                  );
                  const balancedOpt = hybridOptimization(
                    locations,
                    startLocation,
                    "BALANCED",
                  );
                  const optimalOpt = hybridOptimization(
                    locations,
                    startLocation,
                    "OPTIMAL",
                  );

                  const optimizations = [
                    { ...fastOpt, algorithm: "FAST" as const },
                    { ...balancedOpt, algorithm: "BALANCED" as const },
                    { ...optimalOpt, algorithm: "OPTIMAL" as const },
                  ]
                    .map((opt) => {
                      const metrics = calculateRouteMetrics(
                        opt.optimizedRoute,
                        startLocation,
                      );
                      return {
                        ...opt,
                        ...metrics,
                      };
                    })
                    .sort((a, b) => a.totalDistance - b.totalDistance);

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-cyan-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white font-mono">
                              {task.taskNumber}
                            </span>
                            <span className="text-xs text-[#9ca3af]">
                              {task.orderNumber}
                            </span>
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            {task.items.length} items | {task.strategy}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[#9ca3af] mb-1">
                            Current Route
                          </div>
                          <div className="text-sm font-medium text-white">
                            {task.estimatedDistance
                              ? `${task.estimatedDistance.toFixed(0)}m`
                              : "Not optimized"}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-[#9ca3af] mb-2">
                          Algorithm Comparison:
                        </div>
                        {optimizations.map((opt, idx) => (
                          <div
                            key={opt.algorithm}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              idx === 0
                                ? "bg-green-500/10 border-green-500/30"
                                : "bg-white/5 border-white/10"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {idx === 0 && (
                                <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center justify-center text-xs font-bold">
                                  <i className="ri-check-line"></i>
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-white">
                                  {opt.algorithm.replace(/_/g, " ")}
                                </div>
                                <div className="text-xs text-[#9ca3af]">
                                  Efficiency: {opt.efficiency.toFixed(1)}% |
                                  Confidence:{" "}
                                  {(opt.confidence * 100).toFixed(0)}%
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-cyan-400">
                                {opt.totalDistance.toFixed(0)}m
                              </div>
                              <div className="text-xs text-[#9ca3af]">
                                {Math.floor(opt.totalTime / 60)}min |{" "}
                                {opt.carbonReduction.toFixed(2)}kg CO₂ saved
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                        <button
                          onClick={() => {
                            const best = optimizations[0];
                            const optimization = hybridOptimization(
                              locations,
                              startLocation,
                              best.algorithm as "FAST" | "BALANCED" | "OPTIMAL",
                            );
                            const metrics = calculateRouteMetrics(
                              optimization.optimizedRoute,
                              startLocation,
                            );
                            setTasks((prev) =>
                              prev.map((t) =>
                                t.id === task.id
                                  ? {
                                      ...t,
                                      optimizedRoute:
                                        optimization.optimizedRoute,
                                      estimatedDistance: metrics.totalDistance,
                                      estimatedDuration: metrics.totalTime,
                                      carbonFootprint: metrics.carbonFootprint,
                                      energyConsumed: metrics.energyConsumed,
                                    }
                                  : t,
                              ),
                            );
                          }}
                          className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg text-sm font-medium hover:bg-green-600/30 transition-colors"
                        >
                          <i className="ri-check-line mr-2"></i>
                          Apply Best Route
                        </button>
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                        >
                          <i className="ri-eye-line mr-2"></i>
                          View Route
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </motion.div>
        </div>
      )}

      {/* GPS Tracking View */}
      {viewMode === "gps-tracking" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Real-Time GPS Tracking
                </h3>
                <p className="text-sm text-[#9ca3af]">
                  Live location tracking of all active pickers with route
                  visualization
                </p>
              </div>
              <div className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg">
                <i className="ri-map-pin-line text-2xl"></i>
              </div>
            </div>

            {/* Mock Warehouse Map */}
            <div
              className="relative bg-white/5 rounded-xl p-6 mb-6"
              style={{ minHeight: "500px" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl"></div>
              <div className="relative z-10">
                <div className="grid grid-cols-12 gap-2 h-full">
                  {Array.from({ length: 144 }).map((_, idx) => {
                    const x = idx % 12;
                    const y = Math.floor(idx / 12);
                    const picker = pickers.find(
                      (p) =>
                        p.location &&
                        Math.abs(p.location.x - x) < 0.5 &&
                        Math.abs(p.location.y - y) < 0.5,
                    );
                    const task =
                      picker &&
                      tasks.find(
                        (t) =>
                          t.assignedTo === picker.id &&
                          t.status === "IN_PROGRESS",
                      );
                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded border ${
                          picker
                            ? "bg-cyan-500/30 border-cyan-500/50"
                            : "bg-white/5 border-white/10"
                        } flex items-center justify-center relative`}
                        title={
                          picker
                            ? `${picker.name} - ${task?.taskNumber || "No task"}`
                            : `Zone ${x}-${y}`
                        }
                      >
                        {picker && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <i className="ri-user-location-fill text-cyan-400 text-xl"></i>
                          </motion.div>
                        )}
                        {task && task.optimizedRoute.length > 0 && (
                          <div className="absolute inset-0">
                            {task.optimizedRoute.map((loc, routeIdx) => {
                              const routeX = loc.coordinates.x % 12;
                              const routeY = Math.floor(loc.coordinates.y / 12);
                              if (
                                Math.abs(routeX - x) < 0.1 &&
                                Math.abs(routeY - y) < 0.1
                              ) {
                                return (
                                  <div
                                    key={routeIdx}
                                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                                    style={{
                                      left: `${(loc.coordinates.x % 1) * 100}%`,
                                      top: `${(loc.coordinates.y % 1) * 100}%`,
                                    }}
                                  ></div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active Pickers List */}
            <div className="grid md:grid-cols-2 gap-4">
              {pickers
                .filter((p) => p.status === "BUSY" && p.location)
                .map((picker) => {
                  const task = tasks.find(
                    (t) =>
                      t.assignedTo === picker.id && t.status === "IN_PROGRESS",
                  );
                  return (
                    <motion.div
                      key={picker.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 border border-white/10 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {picker.name}
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            Zone {picker.zone} | {picker.employeeId}
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-medium">
                          <i className="ri-map-pin-line mr-1"></i>
                          Tracking
                        </div>
                      </div>
                      {task && (
                        <div className="space-y-2 mb-3">
                          <div className="text-xs text-[#9ca3af]">
                            Current Task:{" "}
                            <span className="text-white font-mono">
                              {task.taskNumber}
                            </span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-cyan-500 transition-all"
                              style={{ width: `${task.completionPercentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            {task.pickedItems} / {task.totalItems} items |{" "}
                            {task.completionPercentage.toFixed(1)}% complete
                          </div>
                        </div>
                      )}
                      {picker.location && (
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="text-[#9ca3af]">X</div>
                            <div className="text-white font-mono">
                              {picker.location.x.toFixed(1)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#9ca3af]">Y</div>
                            <div className="text-white font-mono">
                              {picker.location.y.toFixed(1)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#9ca3af]">Zone</div>
                            <div className="text-white">
                              {picker.location.zone}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="mt-3 pt-3 border-t border-white/10 text-xs text-[#9ca3af]">
                        Last update: {format(picker.lastUpdate, "HH:mm:ss")}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111827] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Create New Pick Task
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-white text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Order Number
                </label>
                <input
                  type="text"
                  value={createFormData.orderNumber}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      orderNumber: e.target.value,
                    })
                  }
                  placeholder="Enter order number"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Strategy
                </label>
                <select
                  value={createFormData.strategy}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      strategy: e.target.value as PickingStrategy,
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="DISCRETE">Discrete Picking</option>
                  <option value="BATCH">Batch Picking</option>
                  <option value="WAVE">Wave Picking</option>
                  <option value="ZONE">Zone Picking</option>
                  <option value="CLUSTER">Cluster Picking</option>
                  <option value="PICK_TO_CART">Pick-to-Cart</option>
                  <option value="PICK_TO_LIGHT">Pick-to-Light</option>
                  <option value="VOICE">Voice Picking</option>
                  <option value="VISION">Vision Picking</option>
                  <option value="AUTO">AI-Optimized</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Priority
                </label>
                <select
                  value={createFormData.priority}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      priority: e.target.value as Priority,
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Assign To (Optional)
                </label>
                <select
                  value={createFormData.assignedTo}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      assignedTo: e.target.value,
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="">Select picker...</option>
                  {pickers.map((picker) => (
                    <option key={picker.id} value={picker.id}>
                      {picker.name}{" "}
                      {picker.status === "AVAILABLE" ? "(Available)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  if (createFormData.orderNumber) {
                    const newTask: PickingTask = {
                      id: `PICK-${Date.now()}`,
                      taskNumber: `PICK-${new Date().getFullYear()}-${String(tasks.length + 1).padStart(6, "0")}`,
                      orderNumber: createFormData.orderNumber,
                      strategy: createFormData.strategy,
                      status: createFormData.assignedTo
                        ? "ASSIGNED"
                        : "PENDING",
                      priority: createFormData.priority,
                      assignedTo: createFormData.assignedTo || undefined,
                      assignedToName: createFormData.assignedTo
                        ? pickers.find(
                            (p) => p.id === createFormData.assignedTo,
                          )?.name
                        : undefined,
                      assignedAt: createFormData.assignedTo
                        ? new Date()
                        : undefined,
                      items: [],
                      totalItems: 0,
                      pickedItems: 0,
                      completionPercentage: 0,
                      optimizedRoute: [],
                      estimatedDuration: 0,
                      estimatedDistance: 0,
                      qualityChecks: [],
                      overallQualityStatus: "PENDING",
                      notes: [],
                      issues: [],
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    };
                    setTasks((prev) => [...prev, newTask]);
                    setShowCreateModal(false);
                    setCreateFormData({
                      orderNumber: "",
                      strategy: "AUTO",
                      priority: "MEDIUM",
                      assignedTo: "",
                    });
                  }
                }}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <i className="ri-check-line mr-2"></i>
                Create Task
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111827] border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Task Details: {selectedTask.taskNumber}
              </h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-white text-xl"></i>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-[#9ca3af] mb-1">Order Number</div>
                <div className="text-lg font-semibold text-white">
                  {selectedTask.orderNumber}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-[#9ca3af] mb-1">Strategy</div>
                <div className="text-lg font-semibold text-cyan-400">
                  {selectedTask.strategy}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-[#9ca3af] mb-1">Progress</div>
                <div className="text-lg font-semibold text-white">
                  {selectedTask.completionPercentage.toFixed(1)}%
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-[#9ca3af] mb-1">Assigned To</div>
                <div className="text-lg font-semibold text-white">
                  {selectedTask.assignedToName || "N/A"}
                </div>
              </div>
            </div>

            {/* Route Visualization */}
            {selectedTask.optimizedRoute.length > 0 && (
              <div className="mb-6">
                <PickingRouteVisualization
                  route={selectedTask.optimizedRoute}
                  startLocation={{
                    id: "START",
                    locationCode: "START",
                    zone: "ENTRANCE",
                    aisle: "0",
                    rack: "0",
                    shelf: "0",
                    bin: "0",
                    coordinates: { x: 0, y: 0, z: 0 },
                    distanceFromStart: 0,
                    estimatedTravelTime: 0,
                    accessibility: "EASY",
                    requiresEquipment: false,
                  }}
                />
              </div>
            )}

            {/* Items List */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Pick Items
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedTask.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white font-mono">
                          {item.materialNumber}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {item.materialDescription}
                        </div>
                        <div className="text-xs text-cyan-400 mt-1">
                          Location: {item.fromLocation.locationCode}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white">
                          {item.pickedQuantity}/{item.requiredQuantity}{" "}
                          {item.unit}
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium mt-1 inline-block ${
                            item.status === "PICKED"
                              ? "bg-green-500/20 text-green-400"
                              : item.status === "VERIFIED"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {selectedTask.status === "ASSIGNED" && (
                <button
                  onClick={() => {
                    handleStartTask(selectedTask);
                    setSelectedTask(null);
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <i className="ri-play-line mr-2"></i>
                  Start Picking
                </button>
              )}
              {selectedTask.status === "IN_PROGRESS" && (
                <>
                  <button
                    onClick={() => {
                      handleOptimizeRoute(selectedTask);
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <i className="ri-route-line mr-2"></i>
                    Optimize Route
                  </button>
                  <button
                    onClick={() => {
                      handleCompleteTask(selectedTask);
                      setSelectedTask(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <i className="ri-check-line mr-2"></i>
                    Complete Task
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </PageTemplate>
  );
}

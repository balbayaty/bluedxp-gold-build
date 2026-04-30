"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import CountingMethodSelector from "@/components/CountingMethodSelector";
import RealTimeCountingInterface from "@/components/RealTimeCountingInterface";
import VarianceAnalysis from "@/components/VarianceAnalysis";
import {
  getCycleCounts,
  createCountSession,
  submitTaskCount,
  completeCycleCount,
} from "@/app/actions/wms/cycleCountActions";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

export default function CycleCounting() {
  const [counts, setCounts] = useState<any[]>([]); // Use any for now or CycleCount type if compatible
  const [counters, setCounters] = useState<Counter[]>([]);

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      const data = await getCycleCounts();
      setCounts(data as any);
      setCounters(generateCounters(15)); // Keep mock counters for now

      // Preserve Selection
      if (selectedCount) {
        const updated = data.find((c: any) => c.id === selectedCount.id);
        if (updated) setSelectedCount(updated);
      }
    } catch (e) {
      console.error("Failed to load counts", e);
    }
  };
  const [selectedMethod, setSelectedMethod] =
    useState<CountingMethod>("AI_OPTIMIZED");
  const [viewMode, setViewMode] = useState<
    "table" | "grid" | "analytics" | "counting"
  >("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedCount, setSelectedCount] = useState<CycleCount | null>(null);
  const [selectedItem, setSelectedItem] = useState<CountItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    method: "AI_OPTIMIZED" as CountingMethod,
    locationScope: "SINGLE" as "SINGLE" | "ZONE" | "AISLE" | "WAREHOUSE",
    locations: [] as string[],
    blindCount: false,
    requireVerification: true,
    tolerancePercentage: 1,
  });

  // Calculate analytics
  const analytics = useMemo(
    () => calculateCycleCountingAnalytics(counts, counters),
    [counts, counters],
  );

  // Filter counts
  const filteredCounts = useMemo(() => {
    return counts.filter((count) => {
      const matchesSearch =
        count.countNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        count.items.some(
          (item) =>
            item.materialNumber
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            item.location.locationCode
              .toLowerCase()
              .includes(searchQuery.toLowerCase()),
        );
      const matchesStatus =
        selectedStatus === "ALL" || count.status === selectedStatus;
      const matchesMethod =
        selectedMethod === "AI_OPTIMIZED" || count.countType === selectedMethod;

      // Filter by severity if any item has variance
      const matchesSeverity =
        selectedSeverity === "ALL" ||
        count.items.some((item) => item.varianceSeverity === selectedSeverity);

      return matchesSearch && matchesStatus && matchesMethod && matchesSeverity;
    });
  }, [counts, searchQuery, selectedStatus, selectedMethod, selectedSeverity]);

  // Stats for dashboard
  const stats = [
    {
      label: "Total Counts",
      value: counts.length,
      icon: "ri-file-list-3-line",
      tooltip: "Total cycle counts",
      trend: "up" as const,
    },
    {
      label: "In Progress",
      value: counts.filter((c) => c.status === "IN_PROGRESS").length,
      icon: "ri-time-line",
      tooltip: "Counts currently in progress",
      trend: "neutral" as const,
    },
    {
      label: "Accuracy Rate",
      value: `${analytics.averageAccuracy.toFixed(1)}%`,
      icon: "ri-target-line",
      tooltip: "Average counting accuracy",
      trend: (analytics.averageAccuracy > 98 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
    {
      label: "Avg Variance",
      value: `${analytics.averageVariance.toFixed(2)}%`,
      icon: "ri-bar-chart-line",
      tooltip: "Average variance percentage",
      trend: (analytics.averageVariance < 1 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
    {
      label: "Items Counted",
      value: counts.reduce((sum, c) => sum + c.countedItems, 0),
      icon: "ri-checkbox-circle-line",
      tooltip: "Total items counted",
      trend: "up" as const,
    },
    {
      label: "Within Tolerance",
      value: `${analytics.toleranceRate.toFixed(1)}%`,
      icon: "ri-check-double-line",
      tooltip: "Items within tolerance",
      trend: (analytics.toleranceRate > 95 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
    {
      label: "Variance Value",
      value: `AED ${analytics.totalVarianceValue.toFixed(2)}`,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total variance value",
      trend: "neutral" as const,
    },
    {
      label: "Active Counters",
      value: counters.filter(
        (c) => c.status === "COUNTING" || c.status === "AVAILABLE",
      ).length,
      icon: "ri-user-line",
      tooltip: "Currently active counters",
      trend: "neutral" as const,
    },
  ];

  // Method performance chart data
  const methodPerformanceData = Object.entries(analytics.methodPerformance)
    .filter(([_, perf]) => perf.countCount > 0)
    .map(([method, perf]) => ({
      method: method.replace("_", " "),
      accuracy: perf.averageAccuracy,
      variance: perf.averageVariance,
      counts: perf.countCount,
    }));

  // Daily performance chart data
  const dailyPerformanceData = analytics.dailyPerformance.map((d) => ({
    date: d.date.split("-")[2], // Day only
    counts: d.counts,
    accuracy: d.accuracy,
    variance: d.variance,
  }));

  // Variance by severity for pie chart
  const varianceBySeverity = [
    {
      name: "Minor",
      value: analytics.varianceBySeverity.MINOR,
      color: "#f59e0b",
    },
    {
      name: "Moderate",
      value: analytics.varianceBySeverity.MODERATE,
      color: "#f97316",
    },
    {
      name: "Major",
      value: analytics.varianceBySeverity.MAJOR,
      color: "#ef4444",
    },
    {
      name: "Critical",
      value: analytics.varianceBySeverity.CRITICAL,
      color: "#dc2626",
    },
  ];

  // Root cause distribution for pie chart
  const rootCauseData = Object.entries(analytics.rootCauseDistribution)
    .filter(([_, count]) => count > 0)
    .map(([cause, count]) => ({
      name: cause.replace("_", " "),
      value: count,
      color:
        cause === "COUNTING_ERROR"
          ? "#3b82f6"
          : cause === "THEFT"
            ? "#ef4444"
            : cause === "LOCATION_ERROR"
              ? "#f59e0b"
              : cause === "RECEIVING_ERROR"
                ? "#10b981"
                : cause === "SHIPPING_ERROR"
                  ? "#8b5cf6"
                  : "#6b7280",
    }));

  // Handle count actions
  const handleStartCount = (count: CycleCount) => {
    const updatedCount = {
      ...count,
      status: "IN_PROGRESS" as const,
      startedAt: new Date(),
    };
    setCounts((prev) =>
      prev.map((c) => (c.id === count.id ? updatedCount : c)),
    );
    // Update selectedCount if it's the same count
    if (selectedCount?.id === count.id) {
      setSelectedCount(updatedCount);
    }
  };

  const handleCompleteCount = async (count: CycleCount) => {
    // Server Action
    await completeCycleCount(count.id);

    // Refresh
    await loadCounts();

    // UI Cleanup
    setViewMode("table");
    setSelectedCount(null);
    setSelectedItem(null);
  };

  const handleEnterCount = async (item: CountItem, quantity: number) => {
    if (!selectedCount) return;

    // Server Action
    await submitTaskCount(item.id, quantity);

    // Refresh UI
    await loadCounts();

    // We rely on loadCounts to update selectedCount and thus selectedItem (indirectly).
    // But we need to update selectedItem explicitly if we are in 'counting' mode to reflect the new state immediately?
    // loadCounts handles selectedCount.
    // We should re-select the item from the new data.

    // Optimistic / Immediate feedback handled by re-render after loadCounts
  };

  const handleAnalyzeRootCause = (item: CountItem) => {
    if (!selectedCount || !item.variance) return;

    const rootCause = detectRootCause(
      item.variance,
      item.variancePercentage || 0,
      item,
    );

    const rootCauseAnalysis = {
      id: `RCA-${item.id}`,
      itemId: item.id,
      category: rootCause.category as any,
      description: rootCause.description,
      probability: rootCause.probability,
      evidence: rootCause.evidence,
      recommendedAction:
        "Review counting procedures and location accessibility",
      analyzedAt: new Date(),
      analyzedBy: "AI Analyst",
    };

    setCounts((prev) =>
      prev.map((c) =>
        c.id === selectedCount.id
          ? {
              ...c,
              rootCauseAnalysis: [
                ...(c.rootCauseAnalysis || []).filter(
                  (rca) => rca.itemId !== item.id,
                ),
                rootCauseAnalysis,
              ],
            }
          : c,
      ),
    );
  };

  const handleCreateCount = async () => {
    // Call Server Action
    await createCountSession({
      description: `Cycle Count ${new Date().toLocaleDateString()}`,
      type: createFormData.method,
    });

    // Reload
    await loadCounts();
    setShowCreateModal(false);

    // Reset Form
    setCreateFormData({
      method: "AI_OPTIMIZED",
      locationScope: "SINGLE",
      locations: [],
      blindCount: false,
      requireVerification: true,
      tolerancePercentage: 1,
    });
  };

  const handlePostAdjustments = (count: CycleCount) => {
    setCounts((prev) =>
      prev.map((c) =>
        c.id === count.id
          ? {
              ...c,
              status: "ADJUSTED" as const,
              adjustmentStatus: "POSTED" as const,
              adjustedAt: new Date(),
              adjustedBy: "System",
            }
          : c,
      ),
    );
    setShowAdjustmentModal(false);
  };

  return (
    <PageTemplate
      title="World-Class Cycle Counting Module"
      description="Industry-leading cycle counting operations with AI-powered optimization, multiple counting methods, real-time counting interface, variance analysis, and root cause detection. Beats SAP, Oracle, and all top-tier WMS systems."
      icon="ri-file-list-3-line"
      systemInfo={{
        sap: "MI01 - Create Physical Inventory, MI04 - Enter Count, MI07 - Enter Count Differences, ABC Cycle Counting",
        oracle:
          "Cycle Count, Physical Inventory, Count Entry, ABC Classification",
        manhattan:
          "Cycle Count Management, Inventory Accuracy, Variance Analysis",
      }}
      examples={[
        "AI-powered counting optimization",
        "Multiple counting methods (12+ methods)",
        "Real-time counting interface",
        "Barcode/QR code scanning",
        "Variance analysis and root cause detection",
        "Automatic adjustment workflows",
        "Cycle count scheduling",
        "Accuracy tracking and analytics",
        "Mobile-first counting interface",
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
              onClick={() => setViewMode("counting")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "counting"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Counting View"
            >
              <i className="ri-scanner-line text-sm sm:text-base"></i>
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 whitespace-nowrap"
          >
            <i className="ri-add-line"></i>
            <span className="hidden sm:inline">Create Cycle Count</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      }
    >
      {/* Counting Method Selector */}
      <div className="mb-6">
        <CountingMethodSelector
          selectedMethod={selectedMethod}
          onMethodChange={setSelectedMethod}
        />
      </div>

      {/* Filters */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 w-full sm:min-w-[200px] sm:max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm z-10"></i>
          <input
            type="text"
            placeholder="Search by Count Number, Material, Location..."
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
          <option value="PLANNED">Planned</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="REVIEW_REQUIRED">Review Required</option>
          <option value="ADJUSTED">Adjusted</option>
        </select>
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 w-full sm:w-auto sm:min-w-[160px] relative z-20"
        >
          <option value="ALL">All Severities</option>
          <option value="NONE">None</option>
          <option value="MINOR">Minor</option>
          <option value="MODERATE">Moderate</option>
          <option value="MAJOR">Major</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {/* View Modes */}
      {viewMode === "counting" && (
        <>
          {selectedCount && selectedItem ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RealTimeCountingInterface
                item={selectedItem}
                onCountEntered={(qty) => {
                  handleEnterCount(selectedItem, qty);
                  // Update selectedItem with the latest data
                  const updatedCount = counts.find(
                    (c) => c.id === selectedCount.id,
                  );
                  if (updatedCount) {
                    const updatedItem = updatedCount.items.find(
                      (i) => i.id === selectedItem.id,
                    );
                    if (updatedItem) {
                      setSelectedItem(updatedItem);
                    }
                  }
                }}
                onComplete={() => {
                  const updatedCount = counts.find(
                    (c) => c.id === selectedCount.id,
                  );
                  if (!updatedCount) return;

                  const nextItem = updatedCount.items.find(
                    (item) =>
                      item.status === "PENDING" || item.status === "COUNTING",
                  );
                  if (nextItem) {
                    setSelectedItem(nextItem);
                    setSelectedCount(updatedCount);
                  } else {
                    handleCompleteCount(updatedCount);
                    setViewMode("table");
                    setSelectedCount(null);
                    setSelectedItem(null);
                  }
                }}
                onSkip={() => {
                  const updatedCount = counts.find(
                    (c) => c.id === selectedCount.id,
                  );
                  if (!updatedCount) return;

                  const nextItem = updatedCount.items.find(
                    (item) =>
                      item.status === "PENDING" || item.status === "COUNTING",
                  );
                  if (nextItem) {
                    setSelectedItem(nextItem);
                    setSelectedCount(updatedCount);
                  }
                }}
                blindCount={selectedCount.parameters.blindCount}
              />
              <VarianceAnalysis
                item={selectedItem}
                rootCauseAnalysis={selectedCount.rootCauseAnalysis?.find(
                  (rca) => rca.itemId === selectedItem.id,
                )}
                onAnalyze={() => {
                  handleAnalyzeRootCause(selectedItem);
                  // Refresh selectedCount after analysis
                  const updatedCount = counts.find(
                    (c) => c.id === selectedCount.id,
                  );
                  if (updatedCount) {
                    setSelectedCount(updatedCount);
                  }
                }}
              />
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
              <i className="ri-scanner-line text-6xl text-[#9ca3af] mb-4"></i>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Count Selected
              </h3>
              <p className="text-[#9ca3af] mb-6">
                Select a count from the table or grid view to start counting
              </p>
              <button
                onClick={() => setViewMode("table")}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <i className="ri-table-line mr-2"></i>
                Go to Table View
              </button>
            </div>
          )}
        </>
      )}

      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCounts.map((count, index) => (
            <motion.div
              key={count.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedCount(count)}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-lg font-semibold text-white font-mono mb-1">
                    {count.countNumber}
                  </div>
                  <div className="text-xs text-cyan-400 font-medium">
                    {count.countType.replace("_", " ")}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    count.status === "COMPLETED" || count.status === "ADJUSTED"
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : count.status === "IN_PROGRESS"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : count.status === "ASSIGNED"
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                  }`}
                >
                  {count.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9ca3af]">Items</span>
                  <span className="text-xs text-white font-medium">
                    {count.countedItems}/{count.totalItems}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9ca3af]">Accuracy</span>
                  <span className="text-xs text-green-400 font-medium">
                    {count.results.accuracyRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9ca3af]">Variance</span>
                  <span
                    className={`text-xs font-medium ${
                      Math.abs(count.results.averageVariance) <= 1
                        ? "text-green-400"
                        : Math.abs(count.results.averageVariance) <= 5
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {count.results.averageVariance > 0 ? "+" : ""}
                    {count.results.averageVariance.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9ca3af]">Assigned To</span>
                  <span className="text-xs text-white">
                    {count.assignedToName || "N/A"}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#9ca3af]">Progress</span>
                  <span className="text-xs text-white font-medium">
                    {count.completionPercentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${count.completionPercentage}%` }}
                  ></div>
                </div>
              </div>

              {count.results.itemsWithVariance > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <div className="text-xs text-red-400">
                    <i className="ri-alert-line mr-1"></i>
                    {count.results.itemsWithVariance} items with variance
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Count Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Accuracy
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Assigned To
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
                {filteredCounts.map((count, index) => (
                  <motion.tr
                    key={count.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedCount(count)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Tooltip
                        content={`Count: ${count.countNumber}`}
                        position="right"
                      >
                        <span className="text-sm font-medium text-white font-mono cursor-help">
                          {count.countNumber}
                        </span>
                      </Tooltip>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        {count.countType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {count.countedItems}/{count.totalItems}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {count.items.length} locations
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/10 rounded-full h-2 min-w-[100px]">
                          <div
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${count.completionPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-white font-medium">
                          {count.completionPercentage.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {count.results.accuracyRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-green-400">
                        {count.results.itemsWithinTolerance} within tolerance
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium ${
                          Math.abs(count.results.averageVariance) <= 1
                            ? "text-green-400"
                            : Math.abs(count.results.averageVariance) <= 5
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
                      >
                        {count.results.averageVariance > 0 ? "+" : ""}
                        {count.results.averageVariance.toFixed(2)}%
                      </div>
                      {count.results.itemsWithVariance > 0 && (
                        <div className="text-xs text-red-400">
                          {count.results.itemsWithVariance} items
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-white">
                        {count.assignedToName || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          count.status === "COMPLETED" ||
                          count.status === "ADJUSTED"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : count.status === "IN_PROGRESS"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : count.status === "ASSIGNED"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {count.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCount(count);
                            }}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        {count.status === "ASSIGNED" && (
                          <Tooltip content="Start Counting" position="top">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartCount(count);
                                if (count.items.length > 0) {
                                  setSelectedItem(count.items[0]);
                                  setViewMode("counting");
                                }
                              }}
                              className="p-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded hover:bg-green-600/30 transition-colors"
                            >
                              <i className="ri-play-line"></i>
                            </button>
                          </Tooltip>
                        )}
                        {count.status === "COMPLETED" &&
                          count.adjustments.length > 0 && (
                            <Tooltip content="Post Adjustments" position="top">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCount(count);
                                  setShowAdjustmentModal(true);
                                }}
                                className="p-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-600/30 transition-colors"
                              >
                                <i className="ri-check-double-line"></i>
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
          {/* Method Performance */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Method Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={methodPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="method" stroke="#9ca3af" fontSize={12} />
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
                <Bar dataKey="accuracy" fill="#06b6d4" name="Accuracy %" />
                <Bar dataKey="variance" fill="#ef4444" name="Variance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Variance by Severity */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Variance by Severity
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={varianceBySeverity}
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
                  {varianceBySeverity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Performance */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">
              Daily Performance (Last 30 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
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
                  dataKey="counts"
                  stroke="#06b6d4"
                  name="Counts"
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
                  dataKey="variance"
                  stroke="#f59e0b"
                  name="Variance %"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Root Cause Distribution */}
          {rootCauseData.length > 0 && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">
                Root Cause Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rootCauseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
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
                  <Bar dataKey="value" fill="#8b5cf6" name="Occurrences" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Count Detail Modal */}
      {selectedCount && viewMode !== "counting" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111827] border border-white/10 rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Count Details: {selectedCount.countNumber}
              </h2>
              <button
                onClick={() => {
                  setSelectedCount(null);
                  setSelectedItem(null);
                }}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-white text-xl"></i>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-[#9ca3af] mb-1">Method</div>
                <div className="text-lg font-semibold text-cyan-400">
                  {selectedCount.countType.replace("_", " ")}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-[#9ca3af] mb-1">Progress</div>
                <div className="text-lg font-semibold text-white">
                  {selectedCount.completionPercentage.toFixed(1)}%
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-[#9ca3af] mb-1">Accuracy</div>
                <div className="text-lg font-semibold text-green-400">
                  {selectedCount.results.accuracyRate.toFixed(1)}%
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-[#9ca3af] mb-1">Assigned To</div>
                <div className="text-lg font-semibold text-white">
                  {selectedCount.assignedToName || "N/A"}
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Count Items
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedCount.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedItem(item);
                      if (
                        selectedCount.status === "IN_PROGRESS" ||
                        selectedCount.status === "ASSIGNED"
                      ) {
                        setViewMode("counting");
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white font-mono mb-1">
                          {item.materialNumber}
                        </div>
                        <div className="text-xs text-[#9ca3af] mb-2">
                          {item.materialDescription}
                        </div>
                        <div className="text-xs text-cyan-400">
                          Location: {item.location.locationCode}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white mb-1">
                          Book: {item.bookQuantity.toFixed(2)} {item.unit}
                        </div>
                        {item.countedQuantity !== undefined ? (
                          <>
                            <div className="text-sm font-semibold text-green-400 mb-1">
                              Counted: {item.countedQuantity.toFixed(2)}{" "}
                              {item.unit}
                            </div>
                            {item.variance !== undefined && (
                              <div
                                className={`text-xs font-medium ${
                                  Math.abs(item.variancePercentage || 0) <= 1
                                    ? "text-green-400"
                                    : Math.abs(item.variancePercentage || 0) <=
                                        5
                                      ? "text-yellow-400"
                                      : "text-red-400"
                                }`}
                              >
                                {item.variance > 0 ? "+" : ""}
                                {item.variance.toFixed(2)} (
                                {item.variancePercentage?.toFixed(2)}%)
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-xs text-[#9ca3af]">
                            Not counted
                          </div>
                        )}
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium mt-1 inline-block ${
                            item.status === "VERIFIED"
                              ? "bg-green-500/20 text-green-400"
                              : item.status === "COUNTED"
                                ? "bg-blue-500/20 text-blue-400"
                                : item.status === "COUNTING"
                                  ? "bg-yellow-500/20 text-yellow-400"
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
              {selectedCount.status === "ASSIGNED" && (
                <button
                  onClick={() => {
                    handleStartCount(selectedCount);
                    if (selectedCount.items.length > 0) {
                      setSelectedItem(selectedCount.items[0]);
                      setViewMode("counting");
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <i className="ri-play-line mr-2"></i>
                  Start Counting
                </button>
              )}
              {selectedCount.status === "IN_PROGRESS" &&
                selectedCount.items.some(
                  (item) =>
                    item.status === "PENDING" || item.status === "COUNTING",
                ) && (
                  <button
                    onClick={() => {
                      const nextItem = selectedCount.items.find(
                        (item) =>
                          item.status === "PENDING" ||
                          item.status === "COUNTING",
                      );
                      if (nextItem) {
                        setSelectedItem(nextItem);
                        setViewMode("counting");
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <i className="ri-scanner-line mr-2"></i>
                    Continue Counting
                  </button>
                )}
              {selectedCount.status === "COMPLETED" &&
                selectedCount.adjustments.length > 0 && (
                  <button
                    onClick={() => {
                      setShowAdjustmentModal(true);
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <i className="ri-check-double-line mr-2"></i>
                    Review & Post Adjustments
                  </button>
                )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Count Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111827] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Create New Cycle Count
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
                  Counting Method
                </label>
                <select
                  value={createFormData.method}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      method: e.target.value as CountingMethod,
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="ABC_ANALYSIS">ABC Analysis</option>
                  <option value="RANDOM">Random</option>
                  <option value="LOCATION_BASED">Location-Based</option>
                  <option value="FREQUENCY_BASED">Frequency-Based</option>
                  <option value="VALUE_BASED">Value-Based</option>
                  <option value="CONTROL_GROUP">Control Group</option>
                  <option value="BLIND_COUNT">Blind Count</option>
                  <option value="OPEN_COUNT">Open Count</option>
                  <option value="SPOT_CHECK">Spot Check</option>
                  <option value="CONTINUOUS">Continuous</option>
                  <option value="AI_OPTIMIZED">AI-Optimized</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Location Scope
                </label>
                <select
                  value={createFormData.locationScope}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      locationScope: e.target.value as any,
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="SINGLE">Single Location</option>
                  <option value="ZONE">Zone</option>
                  <option value="AISLE">Aisle</option>
                  <option value="WAREHOUSE">Warehouse</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Locations (comma-separated)
                </label>
                <input
                  type="text"
                  value={createFormData.locations.join(", ")}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      locations: e.target.value
                        .split(",")
                        .map((loc) => loc.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="A-01-01-1, A-01-02-1, B-02-01-1"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createFormData.blindCount}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        blindCount: e.target.checked,
                      })
                    }
                    className="w-4 h-4 bg-white/5 border border-white/10 rounded text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-white">Blind Count</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createFormData.requireVerification}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        requireVerification: e.target.checked,
                      })
                    }
                    className="w-4 h-4 bg-white/5 border border-white/10 rounded text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-white">
                    Require Verification
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Tolerance Percentage
                </label>
                <input
                  type="number"
                  value={createFormData.tolerancePercentage}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      tolerancePercentage: parseFloat(e.target.value) || 1,
                    })
                  }
                  min="0"
                  max="10"
                  step="0.1"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleCreateCount}
                disabled={createFormData.locations.length === 0}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <i className="ri-check-line mr-2"></i>
                Create Count
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

      {/* Adjustment Modal */}
      {showAdjustmentModal && selectedCount && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111827] border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Review & Post Adjustments
              </h2>
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-white text-xl"></i>
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-alert-line text-yellow-400 text-lg"></i>
                  <span className="text-sm font-semibold text-white">
                    {selectedCount.adjustments.length} adjustments ready to post
                  </span>
                </div>
                <div className="text-xs text-[#9ca3af]">
                  Total adjustment value: AED{" "}
                  {selectedCount.results.totalVarianceValue.toFixed(2)}
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedCount.adjustments.map((adjustment) => (
                  <div
                    key={adjustment.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white font-mono mb-1">
                          {adjustment.materialNumber}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          Location: {adjustment.location}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-white mb-1">
                          {adjustment.adjustmentQuantity > 0 ? "+" : ""}
                          {adjustment.adjustmentQuantity.toFixed(2)}{" "}
                          {
                            selectedCount.items.find(
                              (i) => i.id === adjustment.itemId,
                            )?.unit
                          }
                        </div>
                        <div
                          className={`text-xs font-medium ${
                            adjustment.adjustmentValue > 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          AED {Math.abs(adjustment.adjustmentValue).toFixed(2)}
                        </div>
                        {adjustment.rootCause && (
                          <div className="text-xs text-cyan-400 mt-1">
                            {adjustment.rootCause.replace("_", " ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePostAdjustments(selectedCount)}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <i className="ri-check-double-line mr-2"></i>
                Post All Adjustments
              </button>
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </PageTemplate>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import { getInventoryLinks } from "@/utils/moduleInterconnectivity";
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
} from "recharts";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";

interface Hold {
  id: string;
  holdNumber: string;
  materialNumber: string;
  materialDescription: string;
  batchNumber?: string;
  serialNumber?: string;
  location: string;
  quantity: number;
  unit: string;
  holdType:
    | "QUALITY"
    | "CUSTOMS"
    | "DAMAGE"
    | "QUARANTINE"
    | "CUSTOMER_HOLD"
    | "REGULATORY"
    | "OTHER";
  reason: string;
  status: "ACTIVE" | "RELEASED" | "DISPOSED" | "TRANSFERRED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  placedBy: string;
  placedDate: Date | string;
  releasedBy?: string;
  releasedDate?: Date | string;
  releaseReason?: string;
  inspectionLotNumber?: string;
  orderNumber?: string;
  customerNumber?: string;
  estimatedValue?: number;
  currency?: string;
  notes?: string;
  requiresApproval: boolean;
  approvedBy?: string;
  approvalDate?: Date | string;
  createdAt: Date | string;
}

export default function HoldManagement() {
  const router = useRouter();
  const [holds, setHolds] = useState<Hold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch holds from API
  useEffect(() => {
    const fetchHolds = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/wms/holds?limit=100');
        const result = await response.json();
        
        if (result.success && result.data) {
          // Map API response to component interface
          const mappedHolds: Hold[] = result.data.map((hold: any) => ({
            id: hold.id,
            holdNumber: hold.holdNumber,
            materialNumber: hold.materialNumber,
            materialDescription: hold.materialDescription,
            batchNumber: hold.batchNumber,
            serialNumber: hold.serialNumber,
            location: hold.location,
            quantity: hold.quantity,
            unit: hold.unit,
            holdType: hold.holdType,
            reason: hold.reason,
            status: hold.status,
            priority: hold.priority || 'MEDIUM' as const,
            placedBy: hold.placedBy,
            placedDate: hold.placedDate,
            releasedBy: hold.releasedBy,
            releasedDate: hold.releasedDate,
            releaseReason: hold.releaseReason,
            createdAt: hold.createdAt,
          }));
          setHolds(mappedHolds);
        } else {
          setError(result.error || 'Failed to fetch holds');
        }
      } catch (err) {
        console.error('Error fetching holds:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch holds');
      } finally {
        setLoading(false);
      }
    };

    fetchHolds();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "table" | "grid" | "analytics" | "realtime"
  >("table");
  const [selectedHold, setSelectedHold] = useState<Hold | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalHolds: 0,
    active: 0,
    critical: 0,
    totalValue: 0,
  });

  const filteredHolds = useMemo(() => {
    return holds.filter((hold) => {
      const matchesSearch =
        hold.holdNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hold.materialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hold.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hold.reason.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || hold.status === selectedStatus;
      const matchesType =
        selectedType === "ALL" || hold.holdType === selectedType;
      const matchesPriority =
        selectedPriority === "ALL" || hold.priority === selectedPriority;
      return matchesSearch && matchesStatus && matchesType && matchesPriority;
    });
  }, [holds, searchQuery, selectedStatus, selectedType, selectedPriority]);

  // Analytics
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    holds.forEach((h) => {
      counts[h.status] = (counts[h.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [holds]);

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    holds.forEach((h) => {
      counts[h.holdType] = (counts[h.holdType] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type: type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      count,
    }));
  }, [holds]);

  const priorityDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    holds.forEach((h) => {
      counts[h.priority] = (counts[h.priority] || 0) + 1;
    });
    return Object.entries(counts).map(([priority, count]) => ({
      priority,
      count,
    }));
  }, [holds]);

  const dailyTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; placed: number; released: number }
    > = {};

    holds.forEach((h) => {
      const date = h.placedDate
        ? format(new Date(h.placedDate), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, placed: 0, released: 0 };
      }
      dailyData[date].placed++;
      if (h.status === "RELEASED" || h.status === "DISPOSED") {
        dailyData[date].released++;
      }
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((d) => ({
        date: format(new Date(d.date), "MMM dd"),
        placed: d.placed,
        released: d.released,
        resolutionRate: d.placed > 0 ? (d.released / d.placed) * 100 : 0,
      }));
  }, [holds]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const total = holds.length;
    const active = holds.filter((h) => h.status === "ACTIVE").length;
    const critical = holds.filter(
      (h) => h.status === "ACTIVE" && h.priority === "CRITICAL",
    ).length;
    const totalValue = holds
      .filter((h) => h.status === "ACTIVE")
      .reduce((sum, h) => sum + (h.estimatedValue || 0), 0);

    return {
      total,
      active,
      critical,
      totalValue,
    };
  }, [holds]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "hold-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "hold-stats",
      () => ({
        totalHolds: simulateKPIUpdates(aggregateStats.total, 0),
        active: simulateKPIUpdates(aggregateStats.active, 0.1),
        critical: simulateKPIUpdates(aggregateStats.critical, 0.1),
        totalValue: simulateKPIUpdates(aggregateStats.totalValue, 0.05),
      }),
      5000,
      true,
    );

    return () => {
      unsubscribe();
      stop();
    };
  }, [
    realTimeEnabled,
    aggregateStats.total,
    aggregateStats.active,
    aggregateStats.critical,
    aggregateStats.totalValue,
  ]);

  // Simulate real-time status changes
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      setHolds((prev) =>
        prev.map((h) => {
          if (h.status === "ACTIVE" && Math.random() < 0.02) {
            return {
              ...h,
              status: "RELEASED" as const,
              releasedBy: "Current User",
              releasedDate: new Date(),
              releaseReason: "Quality approved",
            };
          }
          return h;
        }),
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const stats = [
    {
      label: "Total Holds",
      value: realTimeEnabled ? realTimeStats.totalHolds : aggregateStats.total,
      icon: "ri-lock-line",
      tooltip: "Total hold records",
      trend: "up" as const,
    },
    {
      label: "Active Holds",
      value: realTimeEnabled ? realTimeStats.active : aggregateStats.active,
      icon: "ri-alert-line",
      tooltip: "Currently active holds",
      trend: "neutral" as const,
    },
    {
      label: "Critical Holds",
      value: realTimeEnabled ? realTimeStats.critical : aggregateStats.critical,
      icon: "ri-error-warning-line",
      tooltip: "Critical priority holds",
      trend: "neutral" as const,
    },
    {
      label: "Total Value on Hold",
      value: `AED ${(realTimeEnabled ? realTimeStats.totalValue : aggregateStats.totalValue).toLocaleString()}`,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total value of materials on hold",
      trend: "neutral" as const,
    },
  ];

  const COLORS = [
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  const handleView = (hold: Hold) => {
    setSelectedHold(hold);
    setShowViewModal(true);
  };

  const handleRelease = (hold: Hold) => {
    setHolds((prev) =>
      prev.map((h) =>
        h.id === hold.id
          ? {
              ...h,
              status: "RELEASED" as const,
              releasedBy: "Current User",
              releasedDate: new Date(),
              releaseReason: "Manual release",
            }
          : h,
      ),
    );
  };

  return (
    <PageTemplate
      title="Hold Management"
      description="Stock holds and quarantines - Manage quality holds, customs holds, damage holds, and regulatory holds with full traceability and release workflow"
      icon="ri-lock-line"
      systemInfo={{
        sap: "Quality Hold, Block Stock, Quarantine Management",
        oracle: "Hold Management, Stock Holds, Quarantine",
        manhattan: "Hold Management, Stock Blocks, Quarantine",
      }}
      examples={[
        "Manage quality holds",
        "Handle customs holds",
        "Track damage holds",
        "Manage quarantine periods",
        "Regulatory compliance holds",
        "Customer holds",
      ]}
      stats={stats}
      loading={loading}
      error={error}
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
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              realTimeEnabled
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/5 text-[#9ca3af] border border-white/10"
            }`}
          >
            <i
              className={`ri-${realTimeEnabled ? "radio-button-line" : "checkbox-blank-circle-line"} mr-1`}
            ></i>
            Real-time
          </button>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search by Hold Number, Material, Location, Reason..."
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
          <option value="ACTIVE">Active</option>
          <option value="RELEASED">Released</option>
          <option value="DISPOSED">Disposed</option>
          <option value="TRANSFERRED">Transferred</option>
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Types</option>
          <option value="QUALITY">Quality</option>
          <option value="CUSTOMS">Customs</option>
          <option value="DAMAGE">Damage</option>
          <option value="QUARANTINE">Quarantine</option>
          <option value="CUSTOMER_HOLD">Customer Hold</option>
          <option value="REGULATORY">Regulatory</option>
          <option value="OTHER">Other</option>
        </select>
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {/* View Modes */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Hold Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Priority
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
                {filteredHolds.map((hold, index) => (
                  <motion.tr
                    key={hold.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {hold.holdNumber}
                      </div>
                      {hold.placedDate && (
                        <div className="text-xs text-[#9ca3af]">
                          {format(new Date(hold.placedDate), "MMM dd, yyyy")}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/inventory?material=${hold.materialNumber}`,
                          )
                        }
                        className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-left"
                      >
                        {hold.materialNumber}
                      </button>
                      <div className="text-xs text-[#9ca3af]">
                        {hold.materialDescription}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/storage-locations?location=${hold.location}`,
                          )
                        }
                        className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                      >
                        {hold.location}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          hold.holdType === "QUALITY"
                            ? "bg-blue-500/20 text-blue-400"
                            : hold.holdType === "CUSTOMS"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : hold.holdType === "DAMAGE"
                                ? "bg-red-500/20 text-red-400"
                                : hold.holdType === "QUARANTINE"
                                  ? "bg-orange-500/20 text-orange-400"
                                  : hold.holdType === "REGULATORY"
                                    ? "bg-purple-500/20 text-purple-400"
                                    : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {hold.holdType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white max-w-xs truncate">
                        {hold.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {hold.quantity.toFixed(2)}
                      </div>
                      <div className="text-xs text-[#9ca3af]">{hold.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          hold.priority === "CRITICAL"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : hold.priority === "HIGH"
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              : hold.priority === "MEDIUM"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {hold.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          hold.status === "ACTIVE"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : hold.status === "RELEASED"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : hold.status === "DISPOSED"
                                ? "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {hold.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Hold Details" position="top">
                          <button
                            onClick={() => handleView(hold)}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        {hold.status === "ACTIVE" && (
                          <Tooltip content="Release Hold" position="top">
                            <button
                              onClick={() => handleRelease(hold)}
                              className="p-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded hover:bg-green-600/30 transition-colors"
                            >
                              <i className="ri-lock-unlock-line"></i>
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

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHolds.map((hold, index) => (
            <motion.div
              key={hold.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
              onClick={() => handleView(hold)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white font-mono mb-1">
                    {hold.holdNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {hold.materialNumber}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      hold.status === "ACTIVE"
                        ? "bg-red-500/20 text-red-400"
                        : hold.status === "RELEASED"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {hold.status}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      hold.priority === "CRITICAL"
                        ? "bg-red-500/20 text-red-400"
                        : hold.priority === "HIGH"
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {hold.priority}
                  </span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Type:</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      hold.holdType === "QUALITY"
                        ? "bg-blue-500/20 text-blue-400"
                        : hold.holdType === "CUSTOMS"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : hold.holdType === "DAMAGE"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {hold.holdType.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Location:</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(
                        `/storage-locations?location=${hold.location}`,
                      );
                    }}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-xs"
                  >
                    {hold.location}
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Quantity:</span>
                  <span className="text-white font-medium">
                    {hold.quantity.toFixed(2)} {hold.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Reason:</span>
                  <span className="text-white text-xs max-w-[150px] truncate">
                    {hold.reason}
                  </span>
                </div>
                {hold.estimatedValue && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Value:</span>
                    <span className="text-yellow-400 font-medium">
                      {hold.currency} {hold.estimatedValue.toLocaleString()}
                    </span>
                  </div>
                )}
                {hold.placedDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Placed:</span>
                    <span className="text-white text-xs">
                      {format(new Date(hold.placedDate), "MMM dd, yyyy")}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
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
                        fill={COLORS[index % COLORS.length]}
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
                Hold Type Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeDistribution}>
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
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Priority Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priorityDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="priority" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="count" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Daily Hold Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
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
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="placed"
                    fill="#ef4444"
                    name="Placed"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="released"
                    fill="#10b981"
                    name="Released"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="resolutionRate"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Resolution Rate %"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      )}

      {/* Real-time View */}
      {viewMode === "realtime" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Real-Time Metrics
              </h3>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  realTimeEnabled
                    ? "bg-green-500/20 text-green-400"
                    : "bg-gray-500/20 text-gray-400"
                }`}
              >
                <i
                  className={`ri-${realTimeEnabled ? "radio-button-line" : "checkbox-blank-circle-line"} mr-1`}
                ></i>
                {realTimeEnabled ? "Live" : "Paused"}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">Total Holds</div>
                <div className="text-2xl font-bold text-white">
                  {realTimeStats.totalHolds}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">Active</div>
                <div className="text-2xl font-bold text-red-400">
                  {realTimeStats.active}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">Critical</div>
                <div className="text-2xl font-bold text-orange-400">
                  {realTimeStats.critical}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">Total Value</div>
                <div className="text-2xl font-bold text-yellow-400">
                  AED {realTimeStats.totalValue.toLocaleString()}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Recent Activity
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredHolds
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .slice(0, 10)
                .map((hold) => (
                  <div
                    key={hold.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        {hold.holdNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {hold.materialNumber} •{" "}
                        {hold.holdType.replace(/_/g, " ")} • {hold.reason}
                        {hold.placedDate &&
                          ` • ${format(new Date(hold.placedDate), "MMM dd, HH:mm")}`}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <div
                        className={`text-xs px-2 py-1 rounded ${
                          hold.status === "ACTIVE"
                            ? "bg-red-500/20 text-red-400"
                            : hold.status === "RELEASED"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {hold.status}
                      </div>
                      {hold.priority === "CRITICAL" && (
                        <div className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">
                          {hold.priority}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedHold(null);
        }}
        title={`Hold Details - ${selectedHold?.holdNumber || ""}`}
        size="lg"
      >
        {selectedHold && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Hold Number</div>
                <div className="text-white font-medium font-mono">
                  {selectedHold.holdNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedHold.status === "ACTIVE"
                      ? "bg-red-500/20 text-red-400"
                      : selectedHold.status === "RELEASED"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedHold.status}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Material</div>
                <button
                  onClick={() =>
                    router.push(
                      `/inventory?material=${selectedHold.materialNumber}`,
                    )
                  }
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  {selectedHold.materialNumber}
                </button>
                <div className="text-xs text-[#9ca3af] mt-1">
                  {selectedHold.materialDescription}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Hold Type</div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    selectedHold.holdType === "QUALITY"
                      ? "bg-blue-500/20 text-blue-400"
                      : selectedHold.holdType === "CUSTOMS"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : selectedHold.holdType === "DAMAGE"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedHold.holdType.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Location</div>
                <button
                  onClick={() =>
                    router.push(
                      `/storage-locations?location=${selectedHold.location}`,
                    )
                  }
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  {selectedHold.location}
                </button>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Priority</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedHold.priority === "CRITICAL"
                      ? "bg-red-500/20 text-red-400"
                      : selectedHold.priority === "HIGH"
                        ? "bg-orange-500/20 text-orange-400"
                        : selectedHold.priority === "MEDIUM"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedHold.priority}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Quantity</div>
                <div className="text-white font-medium">
                  {selectedHold.quantity.toFixed(2)} {selectedHold.unit}
                </div>
              </div>
              {selectedHold.batchNumber && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Batch Number
                  </div>
                  <button
                    onClick={() =>
                      router.push(`/batches?batch=${selectedHold.batchNumber}`)
                    }
                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                  >
                    {selectedHold.batchNumber}
                  </button>
                </div>
              )}
              {selectedHold.serialNumber && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Serial Number
                  </div>
                  <button
                    onClick={() =>
                      router.push(
                        `/serials?serial=${selectedHold.serialNumber}`,
                      )
                    }
                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                  >
                    {selectedHold.serialNumber}
                  </button>
                </div>
              )}
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Reason</div>
                <div className="text-white">{selectedHold.reason}</div>
              </div>
              {selectedHold.inspectionLotNumber && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Inspection Lot
                  </div>
                  <button
                    onClick={() =>
                      router.push(
                        `/inspection-lots?lot=${selectedHold.inspectionLotNumber}`,
                      )
                    }
                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                  >
                    {selectedHold.inspectionLotNumber}
                  </button>
                </div>
              )}
              {selectedHold.orderNumber && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Order Number
                  </div>
                  <button
                    onClick={() =>
                      router.push(
                        `/sales-orders?so=${selectedHold.orderNumber}`,
                      )
                    }
                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                  >
                    {selectedHold.orderNumber}
                  </button>
                </div>
              )}
              {selectedHold.placedBy && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Placed By</div>
                  <div className="text-white">{selectedHold.placedBy}</div>
                  {selectedHold.placedDate && (
                    <div className="text-xs text-[#9ca3af] mt-1">
                      {format(
                        new Date(selectedHold.placedDate),
                        "MMM dd, yyyy HH:mm",
                      )}
                    </div>
                  )}
                </div>
              )}
              {selectedHold.releasedBy && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Released By</div>
                  <div className="text-white">{selectedHold.releasedBy}</div>
                  {selectedHold.releasedDate && (
                    <div className="text-xs text-[#9ca3af] mt-1">
                      {format(
                        new Date(selectedHold.releasedDate),
                        "MMM dd, yyyy HH:mm",
                      )}
                    </div>
                  )}
                  {selectedHold.releaseReason && (
                    <div className="text-xs text-green-400 mt-1">
                      {selectedHold.releaseReason}
                    </div>
                  )}
                </div>
              )}
              {selectedHold.estimatedValue && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Estimated Value
                  </div>
                  <div className="text-yellow-400 font-medium">
                    {selectedHold.currency}{" "}
                    {selectedHold.estimatedValue.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
            {selectedHold.notes && (
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Notes</div>
                <div className="text-white bg-white/5 p-3 rounded-lg">
                  {selectedHold.notes}
                </div>
              </div>
            )}
            <div className="pt-4 border-t border-white/10">
              <ModuleLinks
                links={getInventoryLinks(selectedHold.materialNumber)}
              />
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}

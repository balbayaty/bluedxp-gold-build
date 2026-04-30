"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import {
  generateInventoryStock,
  generateStorageLocations,
} from "@/utils/mockDataGenerators";
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

interface Transfer {
  id: string;
  transferNumber: string;
  materialNumber: string;
  materialDescription: string;
  fromLocation: string;
  toLocation: string;
  fromWarehouse?: string;
  toWarehouse?: string;
  transferType:
    | "LOCATION_TO_LOCATION"
    | "WAREHOUSE_TO_WAREHOUSE"
    | "PLANT_TO_PLANT";
  quantity: number;
  unit: string;
  batchNumber?: string;
  serialNumber?: string;
  status:
    | "PLANNED"
    | "APPROVED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "REJECTED";
  transferDate: Date | string;
  plannedDate?: Date | string;
  completedDate?: Date | string;
  transferredBy?: string;
  approvedBy?: string;
  approvalDate?: Date | string;
  reason?: string;
  notes?: string;
  requiresApproval: boolean;
  createdAt: Date | string;
}

export default function TransferPosting() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch transfers from API
  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/wms/transfer-posting?limit=100');
        const result = await response.json();

        if (result.success && result.data) {
          // Map API response to Transfer format
          const mappedTransfers: Transfer[] = result.data.map((transfer: any) => ({
            id: transfer.id,
            transferNumber: transfer.transferNumber,
            materialNumber: transfer.materialNumber,
            materialDescription: transfer.materialDescription,
            fromLocation: transfer.fromLocation,
            toLocation: transfer.toLocation,
            fromWarehouse: transfer.fromWarehouse,
            toWarehouse: transfer.toWarehouse,
            transferType: transfer.transferType,
            quantity: transfer.quantity,
            unit: transfer.unit,
            batchNumber: transfer.batchNumber,
            serialNumber: transfer.serialNumber,
            status: transfer.status,
            transferDate: transfer.transferDate ? new Date(transfer.transferDate) : new Date(),
            plannedDate: transfer.plannedDate ? new Date(transfer.plannedDate) : undefined,
            completedDate: transfer.completedDate ? new Date(transfer.completedDate) : undefined,
            transferredBy: transfer.transferredBy,
            approvedBy: transfer.approvedBy,
            approvalDate: transfer.approvalDate ? new Date(transfer.approvalDate) : undefined,
            reason: transfer.reason,
            notes: transfer.notes,
            requiresApproval: transfer.requiresApproval || false,
            createdAt: transfer.createdAt ? new Date(transfer.createdAt) : new Date(),
          }));
          setTransfers(mappedTransfers);
        } else {
          setError(result.error || 'Failed to fetch transfers');
        }
      } catch (err) {
        console.error('Error fetching transfers:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch transfers');
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, []);

  // Mock data for dropdowns (still needed for UI)
  const [stock] = useState(() => generateInventoryStock(100));
  const [locations] = useState(() => generateStorageLocations(50));

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "table" | "grid" | "analytics" | "realtime"
  >("table");
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(
    null,
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalTransfers: 0,
    inProgress: 0,
    pendingApproval: 0,
    completionRate: 0,
  });

  const filteredTransfers = useMemo(() => {
    return transfers.filter((transfer) => {
      const matchesSearch =
        transfer.transferNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        transfer.materialNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        transfer.fromLocation
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        transfer.toLocation.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || transfer.status === selectedStatus;
      const matchesType =
        selectedType === "ALL" || transfer.transferType === selectedType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [transfers, searchQuery, selectedStatus, selectedType]);

  // Analytics
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    transfers.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [transfers]);

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    transfers.forEach((t) => {
      counts[t.transferType] = (counts[t.transferType] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type: type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      count,
    }));
  }, [transfers]);

  const dailyTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; planned: number; completed: number }
    > = {};

    transfers.forEach((t) => {
      const date = t.transferDate
        ? format(new Date(t.transferDate), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, planned: 0, completed: 0 };
      }
      if (t.status === "PLANNED" || t.status === "APPROVED") {
        dailyData[date].planned++;
      }
      if (t.status === "COMPLETED") {
        dailyData[date].completed++;
      }
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((d) => ({
        date: format(new Date(d.date), "MMM dd"),
        planned: d.planned,
        completed: d.completed,
        efficiency: d.planned > 0 ? (d.completed / d.planned) * 100 : 0,
      }));
  }, [transfers]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const total = transfers.length;
    const inProgress = transfers.filter(
      (t) => t.status === "IN_PROGRESS",
    ).length;
    const pendingApproval = transfers.filter(
      (t) => t.status === "PLANNED" && t.requiresApproval,
    ).length;
    const completed = transfers.filter((t) => t.status === "COMPLETED").length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      inProgress,
      pendingApproval,
      completed,
      completionRate,
    };
  }, [transfers]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "transfer-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "transfer-stats",
      () => ({
        totalTransfers: simulateKPIUpdates(aggregateStats.total, 0),
        inProgress: simulateKPIUpdates(aggregateStats.inProgress, 0.1),
        pendingApproval: simulateKPIUpdates(
          aggregateStats.pendingApproval,
          0.1,
        ),
        completionRate: simulateKPIUpdates(aggregateStats.completionRate, 0.02),
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
    aggregateStats.inProgress,
    aggregateStats.pendingApproval,
    aggregateStats.completionRate,
  ]);

  // Simulate real-time status changes
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      setTransfers((prev) =>
        prev.map((t) => {
          if (
            t.status === "PLANNED" &&
            t.requiresApproval &&
            Math.random() < 0.02
          ) {
            return {
              ...t,
              status: "APPROVED" as const,
              approvedBy: `Manager ${Math.floor(Math.random() * 5) + 1}`,
              approvalDate: new Date(),
            };
          }
          if (t.status === "APPROVED" && Math.random() < 0.02) {
            return {
              ...t,
              status: "IN_PROGRESS" as const,
              transferredBy: `User ${Math.floor(Math.random() * 10) + 1}`,
            };
          }
          if (t.status === "IN_PROGRESS" && Math.random() < 0.02) {
            return {
              ...t,
              status: "COMPLETED" as const,
              completedDate: new Date(),
            };
          }
          return t;
        }),
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  if (loading) {
    return (
      <PageTemplate
        title="Transfer Posting"
        description="Stock transfer and movement management"
        icon="ri-arrow-left-right-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading transfers...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate
        title="Transfer Posting"
        description="Stock transfer and movement management"
        icon="ri-arrow-left-right-line"
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
      label: "Total Transfers",
      value: realTimeEnabled
        ? realTimeStats.totalTransfers
        : aggregateStats.total,
      icon: "ri-arrow-left-right-line",
      tooltip: "Total stock transfer transactions",
      trend: "up" as const,
    },
    {
      label: "In Progress",
      value: realTimeEnabled
        ? realTimeStats.inProgress
        : aggregateStats.inProgress,
      icon: "ri-time-line",
      tooltip: "Transfers currently in progress",
      trend: "neutral" as const,
    },
    {
      label: "Pending Approval",
      value: realTimeEnabled
        ? realTimeStats.pendingApproval
        : aggregateStats.pendingApproval,
      icon: "ri-file-warning-line",
      tooltip: "Transfers awaiting approval",
      trend: "neutral" as const,
    },
    {
      label: "Completion Rate",
      value: `${(realTimeEnabled ? realTimeStats.completionRate : aggregateStats.completionRate).toFixed(1)}%`,
      icon: "ri-checkbox-circle-line",
      tooltip: "Transfer completion rate",
      trend: "up" as const,
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

  const handleView = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setShowViewModal(true);
  };

  const handleApprove = (transfer: Transfer) => {
    setTransfers((prev) =>
      prev.map((t) =>
        t.id === transfer.id
          ? {
              ...t,
              status: "APPROVED" as const,
              approvedBy: "Current User",
              approvalDate: new Date(),
            }
          : t,
      ),
    );
  };

  const handleExecute = (transfer: Transfer) => {
    setTransfers((prev) =>
      prev.map((t) =>
        t.id === transfer.id
          ? {
              ...t,
              status: "IN_PROGRESS" as const,
              transferredBy: "Current User",
            }
          : t,
      ),
    );
  };

  if (loading) {
    return (
      <PageTemplate
        title="Transfer Posting"
        description="Stock transfer transactions"
        icon="ri-arrow-left-right-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading transfers...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate
        title="Transfer Posting"
        description="Stock transfer transactions"
        icon="ri-arrow-left-right-line"
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

  return (
    <PageTemplate
      title="Transfer Posting"
      description="Stock transfer transactions - Transfer materials between storage locations, plants, or warehouses with full traceability and approval workflow"
      icon="ri-arrow-left-right-line"
      systemInfo={{
        sap: "MIGO - Transfer Posting, MB1B - Transfer, MB1C - Transfer Between Plants",
        oracle: "Transfer, Material Transfer, Inter-Organization Transfer",
        manhattan:
          "Transfer Management, Location Transfer, Inter-Warehouse Transfer",
      }}
      examples={[
        "Transfer between storage locations",
        "Transfer between plants",
        "Transfer between warehouses",
        "Track transfer history",
        "Handle batch transfers",
        "Manage transfer approvals",
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
            placeholder="Search by Transfer Number, Material, Location..."
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
          <option value="APPROVED">Approved</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Types</option>
          <option value="LOCATION_TO_LOCATION">Location to Location</option>
          <option value="WAREHOUSE_TO_WAREHOUSE">Warehouse to Warehouse</option>
          <option value="PLANT_TO_PLANT">Plant to Plant</option>
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
                    Transfer Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    From → To
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Batch
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
                {filteredTransfers.map((transfer, index) => (
                  <motion.tr
                    key={transfer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {transfer.transferNumber}
                      </div>
                      {transfer.transferDate && (
                        <div className="text-xs text-[#9ca3af]">
                          {format(
                            new Date(transfer.transferDate),
                            "MMM dd, yyyy",
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/inventory?material=${transfer.materialNumber}`,
                          )
                        }
                        className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-left"
                      >
                        {transfer.materialNumber}
                      </button>
                      <div className="text-xs text-[#9ca3af]">
                        {transfer.materialDescription}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/storage-locations?location=${transfer.fromLocation}`,
                            )
                          }
                          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                        >
                          {transfer.fromLocation}
                        </button>
                        <i className="ri-arrow-right-line text-cyan-400"></i>
                        <button
                          onClick={() =>
                            router.push(
                              `/storage-locations?location=${transfer.toLocation}`,
                            )
                          }
                          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                        >
                          {transfer.toLocation}
                        </button>
                      </div>
                      {transfer.fromWarehouse && transfer.toWarehouse && (
                        <div className="text-xs text-[#9ca3af] mt-1">
                          {transfer.fromWarehouse} → {transfer.toWarehouse}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-white bg-white/5 px-2 py-1 rounded">
                        {transfer.transferType
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {transfer.quantity.toFixed(2)}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {transfer.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transfer.batchNumber ? (
                        <button
                          onClick={() =>
                            router.push(
                              `/batches?batch=${transfer.batchNumber}`,
                            )
                          }
                          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                        >
                          {transfer.batchNumber}
                        </button>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          transfer.status === "COMPLETED"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : transfer.status === "IN_PROGRESS"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : transfer.status === "APPROVED"
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                : transfer.status === "PLANNED"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  : transfer.status === "REJECTED"
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {transfer.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Transfer Details" position="top">
                          <button
                            onClick={() => handleView(transfer)}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        {transfer.status === "PLANNED" &&
                          transfer.requiresApproval && (
                            <Tooltip content="Approve Transfer" position="top">
                              <button
                                onClick={() => handleApprove(transfer)}
                                className="p-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded hover:bg-green-600/30 transition-colors"
                              >
                                <i className="ri-check-line"></i>
                              </button>
                            </Tooltip>
                          )}
                        {(transfer.status === "APPROVED" ||
                          (transfer.status === "PLANNED" &&
                            !transfer.requiresApproval)) && (
                          <Tooltip content="Execute Transfer" position="top">
                            <button
                              onClick={() => handleExecute(transfer)}
                              className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                            >
                              <i className="ri-play-line"></i>
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
          {filteredTransfers.map((transfer, index) => (
            <motion.div
              key={transfer.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
              onClick={() => handleView(transfer)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white font-mono mb-1">
                    {transfer.transferNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {transfer.materialNumber}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    transfer.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : transfer.status === "IN_PROGRESS"
                        ? "bg-blue-500/20 text-blue-400"
                        : transfer.status === "APPROVED"
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {transfer.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">From:</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(
                        `/storage-locations?location=${transfer.fromLocation}`,
                      );
                    }}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-xs"
                  >
                    {transfer.fromLocation}
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">To:</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(
                        `/storage-locations?location=${transfer.toLocation}`,
                      );
                    }}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-xs"
                  >
                    {transfer.toLocation}
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Quantity:</span>
                  <span className="text-white font-medium">
                    {transfer.quantity.toFixed(2)} {transfer.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Type:</span>
                  <span className="text-white text-xs">
                    {transfer.transferType.replace(/_/g, " ")}
                  </span>
                </div>
                {transfer.batchNumber && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Batch:</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/batches?batch=${transfer.batchNumber}`);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-xs"
                    >
                      {transfer.batchNumber}
                    </button>
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
                Transfer Type Distribution
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Daily Transfer Trend
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
                  dataKey="planned"
                  fill="#3b82f6"
                  name="Planned"
                />
                <Bar
                  yAxisId="left"
                  dataKey="completed"
                  fill="#10b981"
                  name="Completed"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Efficiency %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
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
                <div className="text-xs text-[#9ca3af] mb-1">
                  Total Transfers
                </div>
                <div className="text-2xl font-bold text-white">
                  {realTimeStats.totalTransfers}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">In Progress</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {realTimeStats.inProgress}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Pending Approval
                </div>
                <div className="text-2xl font-bold text-yellow-400">
                  {realTimeStats.pendingApproval}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Completion Rate
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {realTimeStats.completionRate.toFixed(1)}%
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
              {filteredTransfers
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .slice(0, 10)
                .map((transfer) => (
                  <div
                    key={transfer.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        {transfer.transferNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {transfer.materialNumber} • {transfer.fromLocation} →{" "}
                        {transfer.toLocation}
                        {transfer.transferDate &&
                          ` • ${format(new Date(transfer.transferDate), "MMM dd, HH:mm")}`}
                      </div>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        transfer.status === "COMPLETED"
                          ? "bg-green-500/20 text-green-400"
                          : transfer.status === "IN_PROGRESS"
                            ? "bg-cyan-500/20 text-cyan-400"
                            : transfer.status === "APPROVED"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {transfer.status.replace(/_/g, " ")}
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
          setSelectedTransfer(null);
        }}
        title={`Transfer Details - ${selectedTransfer?.transferNumber || ""}`}
        size="lg"
      >
        {selectedTransfer && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Transfer Number
                </div>
                <div className="text-white font-medium font-mono">
                  {selectedTransfer.transferNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedTransfer.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedTransfer.status === "IN_PROGRESS"
                        ? "bg-blue-500/20 text-blue-400"
                        : selectedTransfer.status === "APPROVED"
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {selectedTransfer.status.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Material</div>
                <button
                  onClick={() =>
                    router.push(
                      `/inventory?material=${selectedTransfer.materialNumber}`,
                    )
                  }
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  {selectedTransfer.materialNumber}
                </button>
                <div className="text-xs text-[#9ca3af] mt-1">
                  {selectedTransfer.materialDescription}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Transfer Type</div>
                <div className="text-white">
                  {selectedTransfer.transferType
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">From Location</div>
                <button
                  onClick={() =>
                    router.push(
                      `/storage-locations?location=${selectedTransfer.fromLocation}`,
                    )
                  }
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  {selectedTransfer.fromLocation}
                </button>
                {selectedTransfer.fromWarehouse && (
                  <div className="text-xs text-[#9ca3af] mt-1">
                    {selectedTransfer.fromWarehouse}
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">To Location</div>
                <button
                  onClick={() =>
                    router.push(
                      `/storage-locations?location=${selectedTransfer.toLocation}`,
                    )
                  }
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  {selectedTransfer.toLocation}
                </button>
                {selectedTransfer.toWarehouse && (
                  <div className="text-xs text-[#9ca3af] mt-1">
                    {selectedTransfer.toWarehouse}
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Quantity</div>
                <div className="text-white font-medium">
                  {selectedTransfer.quantity.toFixed(2)} {selectedTransfer.unit}
                </div>
              </div>
              {selectedTransfer.batchNumber && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Batch Number
                  </div>
                  <button
                    onClick={() =>
                      router.push(
                        `/batches?batch=${selectedTransfer.batchNumber}`,
                      )
                    }
                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                  >
                    {selectedTransfer.batchNumber}
                  </button>
                </div>
              )}
              {selectedTransfer.serialNumber && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Serial Number
                  </div>
                  <button
                    onClick={() =>
                      router.push(
                        `/serials?serial=${selectedTransfer.serialNumber}`,
                      )
                    }
                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                  >
                    {selectedTransfer.serialNumber}
                  </button>
                </div>
              )}
              {selectedTransfer.reason && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Reason</div>
                  <div className="text-white">{selectedTransfer.reason}</div>
                </div>
              )}
              {selectedTransfer.transferDate && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Transfer Date
                  </div>
                  <div className="text-white">
                    {format(
                      new Date(selectedTransfer.transferDate),
                      "MMM dd, yyyy HH:mm",
                    )}
                  </div>
                </div>
              )}
              {selectedTransfer.approvedBy && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Approved By</div>
                  <div className="text-white">
                    {selectedTransfer.approvedBy}
                  </div>
                  {selectedTransfer.approvalDate && (
                    <div className="text-xs text-[#9ca3af] mt-1">
                      {format(
                        new Date(selectedTransfer.approvalDate),
                        "MMM dd, yyyy",
                      )}
                    </div>
                  )}
                </div>
              )}
              {selectedTransfer.transferredBy && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Transferred By
                  </div>
                  <div className="text-white">
                    {selectedTransfer.transferredBy}
                  </div>
                </div>
              )}
            </div>
            {selectedTransfer.notes && (
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Notes</div>
                <div className="text-white bg-white/5 p-3 rounded-lg">
                  {selectedTransfer.notes}
                </div>
              </div>
            )}
            <div className="pt-4 border-t border-white/10">
              <ModuleLinks
                links={getInventoryLinks(selectedTransfer.materialNumber)}
              />
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}

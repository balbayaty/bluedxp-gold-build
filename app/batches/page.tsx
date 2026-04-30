"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import { getBatchLinks } from "@/utils/moduleInterconnectivity";
import { format, differenceInDays } from "date-fns";
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
} from "recharts";

interface Batch {
  id: string;
  batchNumber: string;
  materialNumber: string;
  materialDescription: string;
  quantity: number;
  unit: string;
  location: string;
  productionDate?: Date | string;
  expiryDate?: Date | string;
  status: "AVAILABLE" | "RESERVED" | "QUARANTINE" | "EXPIRED";
  vendorBatch?: string;
  certificateNumber?: string;
  shelfLife?: number;
  complianceStatus?: "COMPLIANT" | "NON_COMPLIANT" | "PENDING";
  fefoPriority?: number;
}

export default function BatchManagement() {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch batches from API
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/wms/batches?limit=100');
        const result = await response.json();
        
        if (result.success && result.data) {
          // Map API response to component interface
          const mappedBatches: Batch[] = result.data.map((batch: any) => ({
            id: batch.id,
            batchNumber: batch.batchNumber,
            materialNumber: batch.materialNumber,
            materialDescription: batch.materialDescription,
            quantity: batch.quantity,
            unit: batch.unit,
            location: batch.locations?.[0] || 'UNKNOWN',
            productionDate: batch.productionDate,
            expiryDate: batch.expiryDate,
            status: batch.status,
            vendorBatch: undefined,
            certificateNumber: undefined,
            shelfLife: batch.expiryDate && batch.productionDate 
              ? differenceInDays(new Date(batch.expiryDate), new Date(batch.productionDate))
              : undefined,
            complianceStatus: undefined,
            fefoPriority: batch.expiryDate 
              ? differenceInDays(new Date(batch.expiryDate), new Date())
              : undefined,
          }));
          setBatches(mappedBatches);
        } else {
          setError(result.error || 'Failed to fetch batches');
        }
      } catch (err) {
        console.error('Error fetching batches:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch batches');
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCompliance, setSelectedCompliance] = useState<string>("ALL");
  const [sortMethod, setSortMethod] = useState<"FEFO" | "LIFO" | "NONE">(
    "FEFO",
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [showTraceModal, setShowTraceModal] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Batch | null>(null);

  const filteredBatches = useMemo(() => {
    let filtered = batches.filter((batch) => {
      const matchesSearch =
        batch.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.materialNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        batch.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || batch.status === selectedStatus;
      const matchesCompliance =
        selectedCompliance === "ALL" ||
        batch.complianceStatus === selectedCompliance;
      return matchesSearch && matchesStatus && matchesCompliance;
    });

    // Apply FEFO/LIFO sorting
    if (sortMethod === "FEFO") {
      filtered = [...filtered].sort((a, b) => {
        if (!a.expiryDate || !b.expiryDate) return 0;
        return (
          new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        );
      });
    } else if (sortMethod === "LIFO") {
      filtered = [...filtered].sort((a, b) => {
        if (!a.productionDate || !b.productionDate) return 0;
        return (
          new Date(b.productionDate).getTime() -
          new Date(a.productionDate).getTime()
        );
      });
    }

    return filtered;
  }, [batches, searchQuery, selectedStatus, selectedCompliance, sortMethod]);

  const expiryAlerts = useMemo(() => {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return batches.filter((batch) => {
      if (!batch.expiryDate) return false;
      const expiry = new Date(batch.expiryDate);
      return expiry <= thirtyDays && expiry > now;
    }).length;
  }, [batches]);

  const expiredBatches = useMemo(() => {
    return batches.filter((batch) => {
      if (!batch.expiryDate) return false;
      return new Date(batch.expiryDate) < new Date();
    }).length;
  }, [batches]);

  const complianceStats = useMemo(() => {
    const compliant = batches.filter(
      (b) => b.complianceStatus === "COMPLIANT",
    ).length;
    const nonCompliant = batches.filter(
      (b) => b.complianceStatus === "NON_COMPLIANT",
    ).length;
    const pending = batches.filter(
      (b) => b.complianceStatus === "PENDING",
    ).length;
    return { compliant, nonCompliant, pending };
  }, [batches]);

  const expiryDistribution = useMemo(() => {
    const now = new Date();
    const ranges = [
      { name: "Expired", count: 0, color: "#ef4444" },
      { name: "0-30 Days", count: 0, color: "#f59e0b" },
      { name: "31-60 Days", count: 0, color: "#eab308" },
      { name: "61-90 Days", count: 0, color: "#84cc16" },
      { name: "90+ Days", count: 0, color: "#10b981" },
    ];

    batches.forEach((batch) => {
      if (!batch.expiryDate) return;
      const daysToExpiry = differenceInDays(new Date(batch.expiryDate), now);
      if (daysToExpiry < 0) ranges[0].count++;
      else if (daysToExpiry <= 30) ranges[1].count++;
      else if (daysToExpiry <= 60) ranges[2].count++;
      else if (daysToExpiry <= 90) ranges[3].count++;
      else ranges[4].count++;
    });

    return ranges;
  }, [batches]);

  const stats = [
    {
      label: "Total Batches",
      value: batches.length,
      icon: "ri-file-list-line",
      tooltip: "Total batches in system",
      trend: "up" as const,
    },
    {
      label: "Available",
      value: batches.filter((b) => b.status === "AVAILABLE").length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Batches available for use",
      trend: "up" as const,
    },
    {
      label: "Expiry Alerts",
      value: expiryAlerts,
      icon: "ri-alarm-warning-line",
      tooltip: "Batches expiring within 30 days",
      trend: expiryAlerts > 0 ? ("down" as const) : ("neutral" as const),
    },
    {
      label: "Compliant",
      value: complianceStats.compliant,
      icon: "ri-shield-check-line",
      tooltip: "Compliant batches",
      trend: "up" as const,
    },
  ];

  const handleView = (item: Batch) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleTrace = (item: Batch) => {
    setSelectedItem(item);
    setShowTraceModal(true);
  };

  const handleCompliance = (item: Batch) => {
    setSelectedItem(item);
    setShowComplianceModal(true);
  };

  const handleNavigateToStock = (item: Batch) => {
    router.push(`/inventory?batch=${item.batchNumber}`);
  };

  const handleNavigateToMaterial = (item: Batch) => {
    router.push(`/materials?material=${item.materialNumber}`);
  };

  const handleNavigateToInspection = (item: Batch) => {
    router.push(`/inspection-lots?batch=${item.batchNumber}`);
  };

  return (
    <PageTemplate
      title="Batch Management"
      description="Batch tracking and traceability - Track batches from production to consumption with full traceability, expiry management, FEFO/LIFO, and compliance"
      icon="ri-file-list-line"
      systemInfo={{
        sap: "MSC1N - Batch Master, MMBE - Batch Stock Overview, MCHB - Batch Stock",
        oracle: "Batch Management, Lot Tracking, Batch Traceability",
        manhattan: "Batch Management, Lot Control, Traceability",
      }}
      examples={[
        "Track batch numbers",
        "Manage batch expiry dates",
        "Trace batch history",
        "Handle batch reservations",
        "Monitor batch status",
        "Generate batch certificates",
        "FEFO/LIFO inventory management",
        "Compliance tracking and alerts",
      ]}
      stats={stats}
      loading={loading}
      error={error}
      actions={
        <div className="flex items-center gap-3">
          <select
            value={sortMethod}
            onChange={(e) =>
              setSortMethod(e.target.value as "FEFO" | "LIFO" | "NONE")
            }
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          >
            <option value="NONE">No Sort</option>
            <option value="FEFO">FEFO (First Expiry First Out)</option>
            <option value="LIFO">LIFO (Last In First Out)</option>
          </select>
          <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20">
            <i className="ri-add-line"></i>
            Create Batch
          </button>
        </div>
      }
    >
      {/* Alerts */}
      {(expiredBatches > 0 || expiryAlerts > 0) && (
        <div className="mb-6 space-y-2">
          {expiredBatches > 0 && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
              <i className="ri-error-warning-line text-red-400 text-xl"></i>
              <div className="flex-1">
                <div className="text-red-400 font-medium">
                  {expiredBatches} Expired Batch{expiredBatches > 1 ? "es" : ""}
                </div>
                <div className="text-red-300/80 text-sm">
                  Immediate action required
                </div>
              </div>
            </div>
          )}
          {expiryAlerts > 0 && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
              <i className="ri-alarm-warning-line text-yellow-400 text-xl"></i>
              <div className="flex-1">
                <div className="text-yellow-400 font-medium">
                  {expiryAlerts} Batch{expiryAlerts > 1 ? "es" : ""} Expiring
                  Soon
                </div>
                <div className="text-yellow-300/80 text-sm">
                  Expiring within 30 days
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Expiry Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={expiryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, count }) => `${name}: ${count}`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="count"
              >
                {expiryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
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
            Compliance Status
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={[
                { name: "Compliant", value: complianceStats.compliant },
                { name: "Non-Compliant", value: complianceStats.nonCompliant },
                { name: "Pending", value: complianceStats.pending },
              ]}
            >
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
              <Bar dataKey="value" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search by Batch Number, Material, Location..."
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
          <option value="AVAILABLE">Available</option>
          <option value="RESERVED">Reserved</option>
          <option value="QUARANTINE">Quarantine</option>
          <option value="EXPIRED">Expired</option>
        </select>
        <select
          value={selectedCompliance}
          onChange={(e) => setSelectedCompliance(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Compliance</option>
          <option value="COMPLIANT">Compliant</option>
          <option value="NON_COMPLIANT">Non-Compliant</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      {/* Batches Table */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Batch Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Material
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Production Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Days to Expiry
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Compliance
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredBatches.map((batch, index) => {
                const daysToExpiry = batch.expiryDate
                  ? differenceInDays(new Date(batch.expiryDate), new Date())
                  : null;
                return (
                  <motion.tr
                    key={batch.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Tooltip
                        content={`Batch Number: ${batch.batchNumber}`}
                        position="right"
                      >
                        <span className="text-sm font-medium text-white font-mono cursor-help">
                          {batch.batchNumber}
                        </span>
                      </Tooltip>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <Tooltip
                          content={`Material: ${batch.materialNumber}`}
                          position="right"
                        >
                          <div className="text-sm font-medium text-white font-mono cursor-help">
                            {batch.materialNumber}
                          </div>
                        </Tooltip>
                        <div className="text-xs text-[#9ca3af]">
                          {batch.materialDescription}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Tooltip
                        content={`Location: ${batch.location}`}
                        position="right"
                      >
                        <span className="text-sm text-white font-mono cursor-help">
                          {batch.location}
                        </span>
                      </Tooltip>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {batch.quantity.toFixed(2)}
                      </div>
                      <div className="text-xs text-[#9ca3af]">{batch.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {batch.productionDate && (
                        <Tooltip
                          content={`Production Date: ${format(new Date(batch.productionDate), "MMM dd, yyyy")}`}
                          position="right"
                        >
                          <span className="text-sm text-white cursor-help">
                            {format(
                              new Date(batch.productionDate),
                              "MMM dd, yyyy",
                            )}
                          </span>
                        </Tooltip>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {batch.expiryDate && (
                        <Tooltip
                          content={`Expiry Date: ${format(new Date(batch.expiryDate), "MMM dd, yyyy")}`}
                          position="right"
                        >
                          <span
                            className={`text-sm cursor-help font-medium ${
                              daysToExpiry !== null && daysToExpiry < 0
                                ? "text-red-400"
                                : daysToExpiry !== null && daysToExpiry < 30
                                  ? "text-yellow-400"
                                  : "text-white"
                            }`}
                          >
                            {format(new Date(batch.expiryDate), "MMM dd, yyyy")}
                          </span>
                        </Tooltip>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {daysToExpiry !== null && (
                        <span
                          className={`text-sm font-medium ${
                            daysToExpiry < 0
                              ? "text-red-400"
                              : daysToExpiry < 30
                                ? "text-yellow-400"
                                : daysToExpiry < 60
                                  ? "text-amber-400"
                                  : "text-green-400"
                          }`}
                        >
                          {daysToExpiry < 0
                            ? `Expired ${Math.abs(daysToExpiry)}d ago`
                            : `${daysToExpiry} days`}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          batch.status === "AVAILABLE"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : batch.status === "RESERVED"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : batch.status === "QUARANTINE"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          batch.complianceStatus === "COMPLIANT"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : batch.complianceStatus === "NON_COMPLIANT"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        }`}
                      >
                        {batch.complianceStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Batch Details" position="top">
                          <button
                            onClick={() => handleView(batch)}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        <Tooltip content="Trace Batch" position="top">
                          <button
                            onClick={() => handleTrace(batch)}
                            className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                          >
                            <i className="ri-route-line"></i>
                          </button>
                        </Tooltip>
                        <Tooltip content="Compliance Details" position="top">
                          <button
                            onClick={() => handleCompliance(batch)}
                            className="p-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-600/30 transition-colors"
                          >
                            <i className="ri-shield-check-line"></i>
                          </button>
                        </Tooltip>
                        <Tooltip content="View Stock" position="top">
                          <button
                            onClick={() => handleNavigateToStock(batch)}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-stack-line"></i>
                          </button>
                        </Tooltip>
                        <Tooltip content="View Material" position="top">
                          <button
                            onClick={() => handleNavigateToMaterial(batch)}
                            className="p-2 bg-pink-600/20 text-pink-400 border border-pink-500/30 rounded hover:bg-pink-600/30 transition-colors"
                          >
                            <i className="ri-file-list-line"></i>
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

      {/* View Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedItem(null);
        }}
        title={`Batch Details - ${selectedItem?.batchNumber || ""}`}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Batch Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedItem.batchNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Material Number
                </label>
                <button
                  onClick={() => handleNavigateToMaterial(selectedItem)}
                  className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {selectedItem.materialNumber}
                </button>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Material Description
                </label>
                <div className="text-sm text-white">
                  {selectedItem.materialDescription}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Location
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedItem.location}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Quantity
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedItem.quantity.toFixed(2)} {selectedItem.unit}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedItem.status === "AVAILABLE"
                      ? "bg-green-500/20 text-green-400"
                      : selectedItem.status === "RESERVED"
                        ? "bg-blue-500/20 text-blue-400"
                        : selectedItem.status === "QUARANTINE"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {selectedItem.status}
                </span>
              </div>
              {selectedItem.productionDate && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Production Date
                  </label>
                  <div className="text-sm text-white">
                    {format(
                      new Date(selectedItem.productionDate),
                      "MMM dd, yyyy",
                    )}
                  </div>
                </div>
              )}
              {selectedItem.expiryDate && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Expiry Date
                  </label>
                  <div
                    className={`text-sm font-medium ${
                      new Date(selectedItem.expiryDate) < new Date()
                        ? "text-red-400"
                        : differenceInDays(
                              new Date(selectedItem.expiryDate),
                              new Date(),
                            ) < 30
                          ? "text-yellow-400"
                          : "text-white"
                    }`}
                  >
                    {format(new Date(selectedItem.expiryDate), "MMM dd, yyyy")}
                  </div>
                </div>
              )}
              {selectedItem.vendorBatch && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Vendor Batch
                  </label>
                  <div className="text-sm text-white font-mono">
                    {selectedItem.vendorBatch}
                  </div>
                </div>
              )}
              {selectedItem.certificateNumber && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Certificate Number
                  </label>
                  <div className="text-sm text-white font-mono">
                    {selectedItem.certificateNumber}
                  </div>
                </div>
              )}
              {selectedItem.shelfLife && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Shelf Life
                  </label>
                  <div className="text-sm text-white">
                    {selectedItem.shelfLife} days
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Compliance Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedItem.complianceStatus === "COMPLIANT"
                      ? "bg-green-500/20 text-green-400"
                      : selectedItem.complianceStatus === "NON_COMPLIANT"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {selectedItem.complianceStatus}
                </span>
              </div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <ModuleLinks
                links={getBatchLinks(
                  selectedItem.batchNumber,
                  selectedItem.materialNumber,
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => handleNavigateToStock(selectedItem)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-stack-line"></i>
                View Stock
              </button>
              <button
                onClick={() => handleNavigateToMaterial(selectedItem)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-file-list-line"></i>
                View Material
              </button>
              <button
                onClick={() => handleNavigateToInspection(selectedItem)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-file-search-line"></i>
                View Inspections
              </button>
              <button
                onClick={() =>
                  router.push(
                    `/expiry-management?batch=${selectedItem.batchNumber}`,
                  )
                }
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-time-line"></i>
                Manage Expiry
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Trace Modal */}
      <Modal
        isOpen={showTraceModal}
        onClose={() => {
          setShowTraceModal(false);
          setSelectedItem(null);
        }}
        title={`Batch Traceability - ${selectedItem?.batchNumber || ""}`}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">
                Batch History
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="text-white">Batch Created</div>
                  <div className="text-[#9ca3af] ml-auto">
                    {selectedItem.productionDate
                      ? format(
                          new Date(selectedItem.productionDate),
                          "MMM dd, yyyy",
                        )
                      : "N/A"}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="text-white">Received at Warehouse</div>
                  <div className="text-[#9ca3af] ml-auto">
                    {selectedItem.productionDate
                      ? format(
                          new Date(selectedItem.productionDate),
                          "MMM dd, yyyy",
                        )
                      : "N/A"}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div className="text-white">Quality Inspection</div>
                  <div className="text-[#9ca3af] ml-auto">Completed</div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <div className="text-white">Current Location</div>
                  <div className="text-[#9ca3af] ml-auto">
                    {selectedItem.location}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Compliance Modal */}
      <Modal
        isOpen={showComplianceModal}
        onClose={() => {
          setShowComplianceModal(false);
          setSelectedItem(null);
        }}
        title={`Compliance Details - ${selectedItem?.batchNumber || ""}`}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Compliance Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedItem.complianceStatus === "COMPLIANT"
                      ? "bg-green-500/20 text-green-400"
                      : selectedItem.complianceStatus === "NON_COMPLIANT"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {selectedItem.complianceStatus}
                </span>
              </div>
              {selectedItem.certificateNumber && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Certificate Number
                  </label>
                  <div className="text-sm text-white font-mono">
                    {selectedItem.certificateNumber}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">
                Compliance Checks
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white">Quality Certificate</span>
                  <span className="text-green-400">✓ Verified</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white">Expiry Date Check</span>
                  <span
                    className={
                      selectedItem.expiryDate &&
                      new Date(selectedItem.expiryDate) > new Date()
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {selectedItem.expiryDate &&
                    new Date(selectedItem.expiryDate) > new Date()
                      ? "✓ Valid"
                      : "✗ Expired"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white">Storage Conditions</span>
                  <span className="text-green-400">✓ Compliant</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}

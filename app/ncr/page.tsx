"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import { generateNCRs } from "@/utils/mockDataGenerators";
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

interface NCR {
  id: string;
  ncrNumber: string;
  inspectionLotNumber: string;
  materialNumber: string;
  materialDescription: string;
  batchNumber: string;
  quantity: number;
  severity: "MINOR" | "MAJOR" | "CRITICAL";
  status:
    | "OPEN"
    | "INVESTIGATING"
    | "CORRECTIVE_ACTION"
    | "VERIFICATION"
    | "CLOSED"
    | "REOPENED";
  category: string;
  rootCause: string;
  reportedBy: string;
  reportedDate: Date | string;
  description: string;
  affectedArea: string;
  immediateAction: string;
  immediateActionBy: string;
  immediateActionDate: Date | string;
  correctiveActions: Array<{
    id: string;
    action: string;
    responsible: string;
    targetDate: Date | string;
    status: string;
    completedDate?: Date | string | null;
  }>;
  preventiveActions: Array<{
    id: string;
    action: string;
    responsible: string;
    targetDate: Date | string;
    status: string;
  }>;
  verificationRequired: boolean;
  verifiedBy?: string;
  verifiedDate?: Date | string;
  verificationNotes?: string;
  targetCloseDate: Date | string;
  actualCloseDate?: Date | string | null;
  daysOpen: number;
  costImpact: number;
  costCurrency: string;
  recurrence: number;
  relatedNCRs: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function NCRManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inspectionFilter = searchParams.get("inspection");
  const ncrFilter = searchParams.get("ncr");

  const [ncrs, setNCRs] = useState<NCR[]>(() => generateNCRs(40) as NCR[]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "analytics" | "workflow">(
    "table",
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedNCR, setSelectedNCR] = useState<NCR | null>(null);
  const [selectedAction, setSelectedAction] = useState<any>(null);

  const filteredNCRs = useMemo(() => {
    return ncrs.filter((ncr) => {
      const matchesSearch =
        ncr.ncrNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ncr.materialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ncr.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ncr.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || ncr.status === selectedStatus;
      const matchesSeverity =
        selectedSeverity === "ALL" || ncr.severity === selectedSeverity;
      const matchesCategory =
        selectedCategory === "ALL" || ncr.category === selectedCategory;
      const matchesInspection =
        !inspectionFilter || ncr.inspectionLotNumber === inspectionFilter;
      const matchesNCR = !ncrFilter || ncr.ncrNumber === ncrFilter;
      return (
        matchesSearch &&
        matchesStatus &&
        matchesSeverity &&
        matchesCategory &&
        matchesInspection &&
        matchesNCR
      );
    });
  }, [
    ncrs,
    searchQuery,
    selectedStatus,
    selectedSeverity,
    selectedCategory,
    inspectionFilter,
    ncrFilter,
  ]);

  const statusStats = useMemo(() => {
    const stats: Record<string, number> = {};
    ncrs.forEach((ncr) => {
      stats[ncr.status] = (stats[ncr.status] || 0) + 1;
    });
    return Object.entries(stats).map(([status, count]) => ({ status, count }));
  }, [ncrs]);

  const severityStats = useMemo(() => {
    const minor = ncrs.filter((n) => n.severity === "MINOR").length;
    const major = ncrs.filter((n) => n.severity === "MAJOR").length;
    const critical = ncrs.filter((n) => n.severity === "CRITICAL").length;
    return [
      { name: "Minor", value: minor, color: "#f59e0b" },
      { name: "Major", value: major, color: "#ef4444" },
      { name: "Critical", value: critical, color: "#dc2626" },
    ];
  }, [ncrs]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    ncrs.forEach((ncr) => {
      stats[ncr.category] = (stats[ncr.category] || 0) + 1;
    });
    return Object.entries(stats).map(([category, count]) => ({
      category,
      count,
    }));
  }, [ncrs]);

  const rootCauseStats = useMemo(() => {
    const stats: Record<string, number> = {};
    ncrs.forEach((ncr) => {
      stats[ncr.rootCause] = (stats[ncr.rootCause] || 0) + 1;
    });
    return Object.entries(stats).map(([rootCause, count]) => ({
      rootCause,
      count,
    }));
  }, [ncrs]);

  const trendData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: format(date, "MMM dd"),
        open: ncrs.filter((n) => {
          const reported = new Date(n.reportedDate);
          return reported.toDateString() === date.toDateString();
        }).length,
        closed: ncrs.filter((n) => {
          const closed = n.actualCloseDate ? new Date(n.actualCloseDate) : null;
          return closed && closed.toDateString() === date.toDateString();
        }).length,
      };
    });
    return last30Days;
  }, [ncrs]);

  const stats = [
    {
      label: "Total NCRs",
      value: ncrs.length,
      icon: "ri-error-warning-line",
      tooltip: "Total non-conformance reports",
      trend: "neutral" as const,
    },
    {
      label: "Open",
      value: ncrs.filter((n) => n.status !== "CLOSED").length,
      icon: "ri-alert-line",
      tooltip: "Open NCRs",
      trend: "neutral" as const,
    },
    {
      label: "Critical",
      value: ncrs.filter((n) => n.severity === "CRITICAL").length,
      icon: "ri-close-circle-line",
      tooltip: "Critical severity NCRs",
      trend: "neutral" as const,
    },
    {
      label: "Avg Days Open",
      value: `${(ncrs.filter((n) => n.status !== "CLOSED").reduce((sum, n) => sum + n.daysOpen, 0) / Math.max(ncrs.filter((n) => n.status !== "CLOSED").length, 1)).toFixed(0)}`,
      icon: "ri-time-line",
      tooltip: "Average days open",
      trend: "neutral" as const,
    },
  ];

  const handleView = (ncr: NCR) => {
    setSelectedNCR(ncr);
    setShowViewModal(true);
  };

  const handleViewAction = (
    ncr: NCR,
    action: any,
    type: "corrective" | "preventive",
  ) => {
    setSelectedNCR(ncr);
    setSelectedAction({ ...action, type });
    setShowActionModal(true);
  };

  const handleNavigateToInspection = (ncr: NCR) => {
    router.push(`/inspection-lots?inspection=${ncr.inspectionLotNumber}`);
  };

  const handleNavigateToBatch = (ncr: NCR) => {
    router.push(`/batches?batch=${ncr.batchNumber}`);
  };

  const handleNavigateToMaterial = (ncr: NCR) => {
    router.push(`/materials?material=${ncr.materialNumber}`);
  };

  return (
    <PageTemplate
      title="NCR Management"
      description="Non-conformance reports with root cause analysis, corrective actions, and preventive measures"
      icon="ri-error-warning-line"
      systemInfo={{
        sap: "NCR Management, Quality Control",
        oracle: "Non-Conformance Reports, CAPA",
        manhattan: "NCR Management, Quality Issues",
      }}
      examples={[
        "Root cause analysis (5 Whys, Fishbone)",
        "Corrective actions tracking",
        "Preventive actions planning",
        "Verification and closure workflows",
        "Cost impact analysis",
        "Recurrence tracking",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["table", "analytics", "workflow"] as const).map((mode) => (
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
                  className={`ri-${mode === "table" ? "table-line" : mode === "analytics" ? "bar-chart-line" : "flow-chart-line"} mr-1`}
                ></i>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20">
            <i className="ri-add-line"></i>
            Create NCR
          </button>
        </div>
      }
    >
      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Severity Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityStats.map((entry, index) => (
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
              Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="status"
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Category Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="category"
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
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Root Cause Analysis
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rootCauseStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="rootCause"
                  stroke="#9ca3af"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={100}
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
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:col-span-2"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              NCR Trend (Last 30 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="open" fill="#ef4444" name="Opened" />
                <Line
                  type="monotone"
                  dataKey="closed"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Closed"
                />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Workflow View */}
      {viewMode === "workflow" && (
        <div className="mb-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            NCR Workflow Stages
          </h3>
          <div className="space-y-4">
            {filteredNCRs.slice(0, 5).map((ncr) => (
              <div key={ncr.id} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-medium text-white font-mono">
                      {ncr.ncrNumber}
                    </div>
                    <div className="text-xs text-[#9ca3af]">
                      {ncr.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        ncr.severity === "CRITICAL"
                          ? "bg-red-500/20 text-red-400"
                          : ncr.severity === "MAJOR"
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {ncr.severity}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        ncr.status === "CLOSED"
                          ? "bg-green-500/20 text-green-400"
                          : ncr.status === "VERIFICATION"
                            ? "bg-blue-500/20 text-blue-400"
                            : ncr.status === "CORRECTIVE_ACTION"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {ncr.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {[
                    "OPEN",
                    "INVESTIGATING",
                    "CORRECTIVE_ACTION",
                    "VERIFICATION",
                    "CLOSED",
                  ].map((stage, idx) => (
                    <div key={idx} className="flex items-center gap-2 flex-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          ncr.status === stage
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                            : [
                                  "OPEN",
                                  "INVESTIGATING",
                                  "CORRECTIVE_ACTION",
                                  "VERIFICATION",
                                  "CLOSED",
                                ].indexOf(ncr.status) > idx
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-white">
                          {stage.replace(/_/g, " ")}
                        </div>
                      </div>
                      {idx < 4 && (
                        <i className="ri-arrow-right-line text-[#9ca3af]"></i>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search by NCR Number, Material, Batch..."
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
          <option value="OPEN">Open</option>
          <option value="INVESTIGATING">Investigating</option>
          <option value="CORRECTIVE_ACTION">Corrective Action</option>
          <option value="VERIFICATION">Verification</option>
          <option value="CLOSED">Closed</option>
          <option value="REOPENED">Reopened</option>
        </select>
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[150px]"
        >
          <option value="ALL">All Severities</option>
          <option value="MINOR">Minor</option>
          <option value="MAJOR">Major</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Categories</option>
          <option value="QUALITY">Quality</option>
          <option value="SAFETY">Safety</option>
          <option value="PROCESS">Process</option>
          <option value="MATERIAL">Material</option>
          <option value="EQUIPMENT">Equipment</option>
          <option value="DOCUMENTATION">Documentation</option>
        </select>
      </div>

      {/* NCRs Table */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    NCR Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Root Cause
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Days Open
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
                {filteredNCRs.map((ncr, index) => (
                  <motion.tr
                    key={ncr.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {ncr.ncrNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {format(new Date(ncr.reportedDate), "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleNavigateToMaterial(ncr)}
                        className="text-left hover:text-cyan-400 transition-colors"
                      >
                        <div className="text-sm text-white font-mono cursor-pointer">
                          {ncr.materialNumber}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {ncr.materialDescription}
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          ncr.severity === "CRITICAL"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : ncr.severity === "MAJOR"
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        }`}
                      >
                        {ncr.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{ncr.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {ncr.rootCause.replace(/_/g, " ")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {ncr.daysOpen} days
                      </div>
                      {ncr.actualCloseDate && (
                        <div className="text-xs text-[#9ca3af]">
                          Closed{" "}
                          {format(new Date(ncr.actualCloseDate), "MMM dd")}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          ncr.status === "CLOSED"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : ncr.status === "VERIFICATION"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : ncr.status === "CORRECTIVE_ACTION"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : ncr.status === "INVESTIGATING"
                                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                  : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {ncr.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={() => handleView(ncr)}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        <Tooltip content="View Inspection" position="top">
                          <button
                            onClick={() => handleNavigateToInspection(ncr)}
                            className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                          >
                            <i className="ri-file-search-line"></i>
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </motion.tr>
                ))}
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
          setSelectedNCR(null);
        }}
        title={`NCR Details - ${selectedNCR?.ncrNumber || ""}`}
        size="lg"
      >
        {selectedNCR && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  NCR Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedNCR.ncrNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Severity
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedNCR.severity === "CRITICAL"
                      ? "bg-red-500/20 text-red-400"
                      : selectedNCR.severity === "MAJOR"
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {selectedNCR.severity}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedNCR.status === "CLOSED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedNCR.status === "VERIFICATION"
                        ? "bg-blue-500/20 text-blue-400"
                        : selectedNCR.status === "CORRECTIVE_ACTION"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedNCR.status.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Category
                </label>
                <div className="text-sm text-white">{selectedNCR.category}</div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Material
                </label>
                <button
                  onClick={() => handleNavigateToMaterial(selectedNCR)}
                  className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {selectedNCR.materialNumber}
                </button>
                <div className="text-xs text-[#9ca3af]">
                  {selectedNCR.materialDescription}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Batch
                </label>
                <button
                  onClick={() => handleNavigateToBatch(selectedNCR)}
                  className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {selectedNCR.batchNumber}
                </button>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Root Cause
                </label>
                <div className="text-sm text-white">
                  {selectedNCR.rootCause.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Reported By
                </label>
                <div className="text-sm text-white">
                  {selectedNCR.reportedBy}
                </div>
                <div className="text-xs text-[#9ca3af]">
                  {format(new Date(selectedNCR.reportedDate), "MMM dd, yyyy")}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Days Open
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedNCR.daysOpen} days
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Cost Impact
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedNCR.costCurrency} {selectedNCR.costImpact.toFixed(2)}
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">
                Description
              </label>
              <div className="text-sm text-white bg-white/5 p-3 rounded-lg">
                {selectedNCR.description}
              </div>
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">
                Immediate Action
              </label>
              <div className="text-sm text-white bg-white/5 p-3 rounded-lg">
                {selectedNCR.immediateAction}
              </div>
              <div className="text-xs text-[#9ca3af] mt-1">
                By {selectedNCR.immediateActionBy} on{" "}
                {format(
                  new Date(selectedNCR.immediateActionDate),
                  "MMM dd, yyyy",
                )}
              </div>
            </div>
            {selectedNCR.correctiveActions.length > 0 && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Corrective Actions ({selectedNCR.correctiveActions.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedNCR.correctiveActions.map((action, idx) => (
                    <div
                      key={action.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-medium">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-white">{action.action}</div>
                        <div className="text-xs text-[#9ca3af]">
                          Responsible: {action.responsible} • Target:{" "}
                          {format(new Date(action.targetDate), "MMM dd, yyyy")}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          Status:{" "}
                          <span
                            className={
                              action.status === "COMPLETED"
                                ? "text-green-400"
                                : action.status === "IN_PROGRESS"
                                  ? "text-yellow-400"
                                  : "text-gray-400"
                            }
                          >
                            {action.status}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleViewAction(selectedNCR, action, "corrective")
                        }
                        className="p-1.5 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                      >
                        <i className="ri-eye-line text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedNCR.preventiveActions.length > 0 && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Preventive Actions ({selectedNCR.preventiveActions.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedNCR.preventiveActions.map((action, idx) => (
                    <div
                      key={action.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xs font-medium">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-white">{action.action}</div>
                        <div className="text-xs text-[#9ca3af]">
                          Responsible: {action.responsible} • Target:{" "}
                          {format(new Date(action.targetDate), "MMM dd, yyyy")}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          Status: {action.status}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleViewAction(selectedNCR, action, "preventive")
                        }
                        className="p-1.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-600/30 transition-colors"
                      >
                        <i className="ri-eye-line text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedNCR.verificationRequired && selectedNCR.verifiedBy && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-2">
                  Verification
                </h4>
                <div className="text-sm text-white">
                  Verified by {selectedNCR.verifiedBy}
                </div>
                {selectedNCR.verifiedDate && (
                  <div className="text-xs text-[#9ca3af]">
                    On{" "}
                    {format(new Date(selectedNCR.verifiedDate), "MMM dd, yyyy")}
                  </div>
                )}
                {selectedNCR.verificationNotes && (
                  <div className="text-sm text-white bg-white/5 p-3 rounded-lg mt-2">
                    {selectedNCR.verificationNotes}
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => handleNavigateToInspection(selectedNCR)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-file-search-line"></i>
                View Inspection
              </button>
              <button
                onClick={() => handleNavigateToBatch(selectedNCR)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-file-list-line"></i>
                View Batch
              </button>
              <button
                onClick={() => handleNavigateToMaterial(selectedNCR)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-box-3-line"></i>
                View Material
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Action Details Modal */}
      <Modal
        isOpen={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setSelectedAction(null);
        }}
        title={`${selectedAction?.type === "corrective" ? "Corrective" : "Preventive"} Action Details`}
        size="md"
      >
        {selectedAction && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Action
                </label>
                <div className="text-sm text-white">
                  {selectedAction.action}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedAction.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedAction.status === "IN_PROGRESS"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedAction.status}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Responsible
                </label>
                <div className="text-sm text-white">
                  {selectedAction.responsible}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Target Date
                </label>
                <div className="text-sm text-white">
                  {format(new Date(selectedAction.targetDate), "MMM dd, yyyy")}
                </div>
              </div>
              {selectedAction.completedDate && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Completed Date
                  </label>
                  <div className="text-sm text-white">
                    {format(
                      new Date(selectedAction.completedDate),
                      "MMM dd, yyyy",
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}

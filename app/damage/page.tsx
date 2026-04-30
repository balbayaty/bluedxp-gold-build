"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import { generateDamageReports } from "@/utils/mockDataGenerators";
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
} from "recharts";
import DamageReportVisionIntegration from "@/components/vision/DamageReportVisionIntegration";
import DamageReportEnhancedIntegration from "@/components/vision/enhanced/DamageReportEnhancedIntegration";
import ARDamageVisualizer from "@/components/vision/enhanced/ARDamageVisualizer";
import LiabilityVisualizer from "@/components/vision/enhanced/LiabilityVisualizer";
import { logger } from "@/lib/services/observability/logger";
import UniversalQRGenerator from "@/components/qr/UniversalQRGenerator";
import QRCodeBadge from "@/components/qr/QRCodeBadge";

export default function DamageReports() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shipmentFilter = searchParams.get("shipment");
  const soFilter = searchParams.get("so");

  const [damageReports, setDamageReports] = useState(() =>
    generateDamageReports(60),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedDamageType, setSelectedDamageType] = useState<string>("ALL");
  const [selectedRootCause, setSelectedRootCause] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">(
    "table",
  );
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const filteredReports = useMemo(() => {
    return damageReports.filter((report) => {
      const matchesSearch =
        report.reportNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.materialNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        report.materialDescription
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        report.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || report.status === selectedStatus;
      const matchesSeverity =
        selectedSeverity === "ALL" || report.severity === selectedSeverity;
      const matchesDamageType =
        selectedDamageType === "ALL" ||
        report.damageType === selectedDamageType;
      const matchesRootCause =
        selectedRootCause === "ALL" || report.rootCause === selectedRootCause;
      const matchesShipment =
        !shipmentFilter || report.shipmentNumber === shipmentFilter;
      const matchesSO = !soFilter || report.soNumber === soFilter;
      return (
        matchesSearch &&
        matchesStatus &&
        matchesSeverity &&
        matchesDamageType &&
        matchesRootCause &&
        matchesShipment &&
        matchesSO
      );
    });
  }, [
    damageReports,
    searchQuery,
    selectedStatus,
    selectedSeverity,
    selectedDamageType,
    selectedRootCause,
    shipmentFilter,
    soFilter,
  ]);

  const totalValue = useMemo(() => {
    return damageReports.reduce((sum, r) => sum + r.totalValue, 0);
  }, [damageReports]);

  const severityStats = useMemo(() => {
    const stats: Record<string, { count: number; totalValue: number }> = {};
    damageReports.forEach((report) => {
      if (!stats[report.severity]) {
        stats[report.severity] = { count: 0, totalValue: 0 };
      }
      stats[report.severity].count++;
      stats[report.severity].totalValue += report.totalValue;
    });
    return stats;
  }, [damageReports]);

  const damageTypeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    damageReports.forEach((report) => {
      stats[report.damageType] = (stats[report.damageType] || 0) + 1;
    });
    return stats;
  }, [damageReports]);

  const rootCauseStats = useMemo(() => {
    const stats: Record<string, number> = {};
    damageReports.forEach((report) => {
      stats[report.rootCause] = (stats[report.rootCause] || 0) + 1;
    });
    return stats;
  }, [damageReports]);

  const chartData = useMemo(() => {
    return Object.entries(severityStats).map(([severity, data]) => ({
      severity,
      count: data.count,
      totalValue: data.totalValue,
    }));
  }, [severityStats]);

  const damageTypeData = useMemo(() => {
    return Object.entries(damageTypeStats).map(([type, count]) => ({
      type,
      count,
    }));
  }, [damageTypeStats]);

  const rootCauseData = useMemo(() => {
    return Object.entries(rootCauseStats).map(([cause, count]) => ({
      cause,
      count,
    }));
  }, [rootCauseStats]);

  const stats = [
    {
      label: "Total Reports",
      value: damageReports.length,
      icon: "ri-alert-line",
      tooltip: "Total number of damage reports",
      trend: "up" as const,
    },
    {
      label: "Total Value",
      value: `AED ${totalValue.toLocaleString()}`,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total value of damaged items",
      trend: "neutral" as const,
    },
    {
      label: "Resolved",
      value: damageReports.filter(
        (r) => r.status === "RESOLVED" || r.status === "CLOSED",
      ).length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Number of resolved damage reports",
      trend: "up" as const,
    },
    {
      label: "Critical",
      value: damageReports.filter((r) => r.severity === "CRITICAL").length,
      icon: "ri-error-warning-line",
      tooltip: "Number of critical damage reports",
      trend: "neutral" as const,
    },
  ];

  const COLORS = {
    MINOR: "#10b981",
    MODERATE: "#f59e0b",
    MAJOR: "#ef4444",
    CRITICAL: "#dc2626",
  };

  const damageTypes = [
    "ALL",
    ...Array.from(new Set(damageReports.map((r) => r.damageType))),
  ];
  const rootCauses = [
    "ALL",
    ...Array.from(new Set(damageReports.map((r) => r.rootCause))),
  ];

  return (
    <PageTemplate
      title="Damage Reports"
      description="Damage tracking and root cause analysis - Track, investigate, and resolve damage incidents with detailed analytics and corrective actions"
      icon="ri-alert-line"
      systemInfo={{
        sap: "Damage Reports - Quality Management (QM)",
        oracle: "Damage Tracking - Quality Management",
        manhattan: "Damage Management - Incident Tracking & Analysis",
      }}
      examples={[
        "Report and track damage incidents",
        "Analyze root causes of damage",
        "Track damage by type and severity",
        "Investigate and resolve damage reports",
        "Monitor corrective actions and resolutions",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["table", "grid", "analytics"] as const).map((mode) => (
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
                  className={`ri-${mode === "table" ? "table-line" : mode === "grid" ? "grid-line" : "bar-chart-line"} mr-1`}
                ></i>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <Tooltip content="Create New Damage Report" position="bottom">
            <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20">
              <i className="ri-add-line"></i>
              Report Damage
            </button>
          </Tooltip>
          <Tooltip content="Analyze Damage with AI Vision" position="bottom">
            <button
              onClick={() => router.push("/ai-vision")}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20"
            >
              <i className="ri-eye-line"></i>
              AI Vision Analysis
            </button>
          </Tooltip>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search by Report Number, Material, Batch..."
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
          <option value="REPORTED">Reported</option>
          <option value="INVESTIGATING">Investigating</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="PENDING">Pending</option>
        </select>
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Severity</option>
          <option value="MINOR">Minor</option>
          <option value="MODERATE">Moderate</option>
          <option value="MAJOR">Major</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select
          value={selectedDamageType}
          onChange={(e) => setSelectedDamageType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Damage Types</option>
          {damageTypes
            .filter((t) => t !== "ALL")
            .map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
        </select>
        <select
          value={selectedRootCause}
          onChange={(e) => setSelectedRootCause(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Root Causes</option>
          {rootCauses
            .filter((c) => c !== "ALL")
            .map((cause) => (
              <option key={cause} value={cause}>
                {cause.replace(/_/g, " ")}
              </option>
            ))}
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
                    Report Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Damage Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Root Cause
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
                {filteredReports.map((report, index) => (
                  <motion.tr
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {report.reportNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {format(new Date(report.reportedDate), "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/materials?material=${report.materialNumber}`,
                          )
                        }
                        className="text-left hover:text-cyan-400 transition-colors"
                      >
                        <div className="text-sm text-white font-mono cursor-pointer">
                          {report.materialNumber}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {report.materialDescription}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/batches?batch=${report.batchNumber}`);
                          }}
                          className="text-xs text-[#9ca3af] hover:text-cyan-400 transition-colors cursor-pointer"
                        >
                          Batch: {report.batchNumber}
                        </button>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {report.damageType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          report.severity === "CRITICAL"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : report.severity === "MAJOR"
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              : report.severity === "MODERATE"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-green-500/20 text-green-400 border border-green-500/30"
                        }`}
                      >
                        {report.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {report.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        AED {report.totalValue.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {report.rootCause.replace(/_/g, " ")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          report.status === "RESOLVED" ||
                          report.status === "CLOSED"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : report.status === "INVESTIGATING"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setShowViewModal(true);
                            }}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        {report.photos && report.photos.length > 0 && (
                          <Tooltip content="View Photos" position="top">
                            <button
                              onClick={() => {
                                setSelectedReport(report);
                                setSelectedPhotoIndex(0);
                                setShowPhotosModal(true);
                              }}
                              className="p-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-600/30 transition-colors"
                            >
                              <i className="ri-image-line"></i>
                            </button>
                          </Tooltip>
                        )}
                        {report.soNumber && (
                          <Tooltip content="View Sales Order" position="top">
                            <button
                              onClick={() =>
                                router.push(
                                  `/sales-orders?so=${report.soNumber}`,
                                )
                              }
                              className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                            >
                              <i className="ri-shopping-cart-2-line"></i>
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

      {viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
              onClick={() => {
                setSelectedReport(report);
                setShowViewModal(true);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white font-mono mb-1">
                    {report.reportNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {report.materialNumber}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <QRCodeBadge
                    entityId={report.id}
                    entityType="damage"
                    entityName={report.reportNumber}
                    documentType="report"
                    documentUrl={`/damage?id=${report.id}`}
                    module="damage"
                    size="sm"
                  />
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      report.severity === "CRITICAL"
                        ? "bg-red-500/20 text-red-400"
                        : report.severity === "MAJOR"
                          ? "bg-orange-500/20 text-orange-400"
                          : report.severity === "MODERATE"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {report.severity}
                  </span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Damage Type:</span>
                  <span className="text-white">{report.damageType}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Quantity:</span>
                  <span className="text-white">{report.quantity}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Total Value:</span>
                  <span className="text-white font-medium">
                    AED {report.totalValue.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Root Cause:</span>
                  <span className="text-white">
                    {report.rootCause.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Status:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      report.status === "RESOLVED" || report.status === "CLOSED"
                        ? "bg-green-500/20 text-green-400"
                        : report.status === "INVESTIGATING"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {report.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {viewMode === "analytics" && (
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Damage by Severity
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="severity" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="count" fill="#06b6d4" name="Count" />
                <Bar
                  dataKey="totalValue"
                  fill="#10b981"
                  name="Total Value (SAR)"
                />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Damage Types Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={damageTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, count }) => `${type}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {damageTypeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        Object.values(COLORS)[
                          index % Object.keys(COLORS).length
                        ]
                      }
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
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:col-span-2"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Root Cause Analysis
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rootCauseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="cause"
                  stroke="#9ca3af"
                  fontSize={12}
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
                <Bar dataKey="count" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedReport(null);
        }}
        title={`Damage Report Details - ${selectedReport?.reportNumber || ""}`}
        size="lg"
      >
        {selectedReport && (
          <div className="space-y-4">
            {/* QR Code Section */}
            <div className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
              <UniversalQRGenerator
                entityId={selectedReport.id}
                entityType="damage"
                entityName={selectedReport.reportNumber}
                documentType="report"
                documentUrl={`/damage?id=${selectedReport.id}`}
                module="damage"
                showAdvanced={false}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Report Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedReport.reportNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedReport.status === "RESOLVED" ||
                    selectedReport.status === "CLOSED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedReport.status === "INVESTIGATING"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedReport.status}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Material Number
                </label>
                <button
                  onClick={() =>
                    router.push(
                      `/materials?material=${selectedReport.materialNumber}`,
                    )
                  }
                  className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {selectedReport.materialNumber}
                </button>
                <div className="text-xs text-[#9ca3af]">
                  {selectedReport.materialDescription}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Batch Number
                </label>
                <button
                  onClick={() =>
                    router.push(`/batches?batch=${selectedReport.batchNumber}`)
                  }
                  className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {selectedReport.batchNumber}
                </button>
              </div>
              {selectedReport.serialNumber && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Serial Number
                  </label>
                  <button
                    onClick={() =>
                      router.push(
                        `/serials?serial=${selectedReport.serialNumber}`,
                      )
                    }
                    className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                  >
                    {selectedReport.serialNumber}
                  </button>
                </div>
              )}
              {selectedReport.soNumber && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Sales Order
                  </label>
                  <button
                    onClick={() =>
                      router.push(`/sales-orders?so=${selectedReport.soNumber}`)
                    }
                    className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                  >
                    {selectedReport.soNumber}
                  </button>
                </div>
              )}
              {selectedReport.shipmentNumber && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Shipment
                  </label>
                  <button
                    onClick={() =>
                      router.push(
                        `/tracking?shipment=${selectedReport.shipmentNumber}`,
                      )
                    }
                    className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                  >
                    {selectedReport.shipmentNumber}
                  </button>
                </div>
              )}
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Location
                </label>
                <div className="text-sm text-white">
                  {selectedReport.location}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Damage Type
                </label>
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {selectedReport.damageType}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Severity
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedReport.severity === "CRITICAL"
                      ? "bg-red-500/20 text-red-400"
                      : selectedReport.severity === "MAJOR"
                        ? "bg-orange-500/20 text-orange-400"
                        : selectedReport.severity === "MODERATE"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {selectedReport.severity}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Quantity
                </label>
                <div className="text-sm text-white">
                  {selectedReport.quantity}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Unit Value
                </label>
                <div className="text-sm text-white">
                  AED {selectedReport.unitValue.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Total Value
                </label>
                <div className="text-sm text-white font-medium">
                  AED {selectedReport.totalValue.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Root Cause
                </label>
                <div className="text-sm text-white">
                  {selectedReport.rootCause.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Reported By
                </label>
                <div className="text-sm text-white">
                  {selectedReport.reportedBy}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Reported Date
                </label>
                <div className="text-sm text-white">
                  {format(
                    new Date(selectedReport.reportedDate),
                    "MMM dd, yyyy",
                  )}
                </div>
              </div>
              {selectedReport.resolvedDate && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Resolved Date
                  </label>
                  <div className="text-sm text-white">
                    {format(
                      new Date(selectedReport.resolvedDate),
                      "MMM dd, yyyy",
                    )}
                  </div>
                </div>
              )}
            </div>
            {selectedReport.investigationNotes && (
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Investigation Notes
                </label>
                <div className="text-sm text-white bg-white/5 p-3 rounded-lg">
                  {selectedReport.investigationNotes}
                </div>
              </div>
            )}
            {selectedReport.correctiveAction && (
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Corrective Action
                </label>
                <div className="text-sm text-white bg-white/5 p-3 rounded-lg">
                  {selectedReport.correctiveAction}
                </div>
                {selectedReport.resolvedBy && (
                  <div className="text-xs text-[#9ca3af] mt-1">
                    Resolved by {selectedReport.resolvedBy} on{" "}
                    {selectedReport.resolvedDate
                      ? format(
                          new Date(selectedReport.resolvedDate),
                          "MMM dd, yyyy",
                        )
                      : ""}
                  </div>
                )}
              </div>
            )}
            {selectedReport.photos && selectedReport.photos.length > 0 && (
              <div>
                <label className="text-xs text-[#9ca3af] mb-2 block">
                  Photo Evidence ({selectedReport.photos.length} photos)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {selectedReport.photos.map((photo: any, idx: number) => (
                    <button
                      key={photo.id}
                      onClick={() => {
                        setSelectedPhotoIndex(idx);
                        setShowPhotosModal(true);
                      }}
                      className="bg-white/5 rounded-lg p-2 hover:bg-white/10 transition-colors"
                    >
                      <div className="bg-white/5 rounded aspect-square flex items-center justify-center mb-1">
                        <i className="ri-image-line text-2xl text-[#9ca3af]"></i>
                      </div>
                      <div className="text-xs text-[#9ca3af] truncate">
                        {photo.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Vision Integration - V1 (Basic) */}
            <div className="mt-4">
              <DamageReportVisionIntegration
                onDamageDetected={(damage) => {
                  logger.info("AI Vision detected damage", undefined, {
                    module: "damage",
                    service: "vision-detection",
                    damageType: damage.type,
                  });
                  // Auto-update damage report with AI findings
                  if (selectedReport) {
                    setDamageReports((prev) =>
                      prev.map((r) =>
                        r.id === selectedReport.id
                          ? {
                              ...r,
                              damageType: damage.type,
                              severity: damage.severity,
                              description: damage.description,
                            }
                          : r,
                      ),
                    );
                  }
                }}
                formFields={[
                  {
                    id: "damageType",
                    name: "damageType",
                    type: "text",
                    label: "Damage Type",
                  },
                  {
                    id: "severity",
                    name: "severity",
                    type: "select",
                    label: "Severity",
                  },
                  {
                    id: "description",
                    name: "description",
                    type: "textarea",
                    label: "Description",
                  },
                ]}
                onFieldFill={(fieldId, value, confidence) => {
                  logger.debug("Auto-filled field", undefined, {
                    module: "damage",
                    service: "vision-detection",
                    fieldId,
                    confidence,
                  });
                }}
              />
            </div>

            {/* AI Vision Integration - V2 (Enhanced with Self-Learning, Liability, 3D Viewer) */}
            {selectedReport &&
              selectedReport.photos &&
              selectedReport.photos.length > 0 && (
                <div className="mt-6">
                  <DamageReportEnhancedIntegration
                    damageRecordId={selectedReport.id}
                    photos={selectedReport.photos.map((photo: any) => ({
                      id: photo.id || `photo-${Date.now()}`,
                      photoUrl: photo.photoUrl || photo.url || photo,
                      thumbnailUrl: photo.thumbnailUrl,
                      caption:
                        photo.description ||
                        photo.caption ||
                        `Damage photo ${selectedReport.photos.indexOf(photo) + 1}`,
                    }))}
                    onAnalysisComplete={(result) => {
                      logger.info(
                        "Enhanced AI Vision analysis complete",
                        undefined,
                        {
                          module: "damage",
                          service: "enhanced-vision",
                        },
                      );
                      // Auto-update damage report with enhanced findings
                      if (selectedReport && result) {
                        setDamageReports((prev) =>
                          prev.map((r) =>
                            r.id === selectedReport.id
                              ? ({
                                  ...r,
                                  damageType:
                                    result.analysis?.qualityIssues?.[0]?.type ||
                                    r.damageType,
                                  severity:
                                    result.analysis?.qualityIssues?.[0]?.severity?.toUpperCase() ||
                                    r.severity,
                                  rootCause:
                                    result.analysis?.rootCauseAnalysis
                                      ?.rootCauses?.[0]?.cause || r.rootCause,
                                } as any)
                              : r,
                          ),
                        );
                      }
                    }}
                    onLiabilityAssessed={(assessment) => {
                      logger.info("Liability assessment complete", undefined, {
                        module: "damage",
                        service: "liability-assessment",
                      });
                      // Update damage report with liability information
                      if (selectedReport && assessment) {
                        setDamageReports((prev) =>
                          prev.map((r) =>
                            r.id === selectedReport.id
                              ? ({
                                  ...r,
                                  ...(assessment.warehouseFault && {
                                    warehouseFault: assessment.warehouseFault,
                                  }),
                                  ...(assessment.claimableAmount && {
                                    claimableAmount: assessment.claimableAmount,
                                  }),
                                  ...(assessment.claimNumber && {
                                    insuranceClaimNumber:
                                      assessment.claimNumber,
                                  }),
                                } as any)
                              : r,
                          ),
                        );
                      }
                    }}
                    onIntegrationComplete={(result) => {
                      logger.info(
                        "Cross-module integration complete",
                        undefined,
                        {
                          module: "damage",
                          service: "cross-module-integration",
                          actionCount: result?.actions?.length || 0,
                        },
                      );
                      // Handle cross-module actions (NCR created, incident created, etc.)
                      if (result?.actions) {
                        result.actions.forEach((action: any) => {
                          logger.debug("Action triggered", undefined, {
                            module: "damage",
                            service: "cross-module-integration",
                            actionType: action.type,
                            targetModule: action.module,
                          });
                          // Could show notifications here
                        });
                      }
                    }}
                  />
                </div>
              )}

            {/* AR Damage Visualizer & Liability Assessment */}
            {selectedReport &&
              selectedReport.photos &&
              selectedReport.photos.length > 0 && (
                <div className="mt-6 space-y-6">
                  {/* AR Damage Visualizer */}
                  <div className="bg-white/5 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <i className="ri-augmented-reality-line text-blue-400"></i>
                      AR Damage Visualization
                    </h4>
                    <ARDamageVisualizer
                      imageUrl={
                        selectedReport.photos[0]?.photoUrl ||
                        selectedReport.photos[0]?.url ||
                        selectedReport.photos[0]
                      }
                      damageAnalysis={selectedReport.visionAnalysis}
                    />
                  </div>

                  {/* Liability Visualizer */}
                  <div className="bg-white/5 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <i className="ri-scales-3-line text-orange-400"></i>
                      Liability Assessment
                    </h4>
                    <LiabilityVisualizer
                      analysisId={selectedReport.id}
                      visionAnalysis={selectedReport.visionAnalysis}
                      damageData={{
                        type: selectedReport.damageType || "Unknown",
                        severity:
                          selectedReport.severity?.toLowerCase() || "moderate",
                        estimatedCost: selectedReport.estimatedCost || 10000,
                        parties: [
                          "Carrier",
                          "Warehouse",
                          "Customer",
                          "Third Party",
                        ],
                      }}
                    />
                  </div>
                </div>
              )}

            {selectedReport.insuranceClaimNumber && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Insurance Claim
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Claim Number
                    </label>
                    <div className="text-sm text-white font-mono">
                      {selectedReport.insuranceClaimNumber}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Status
                    </label>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedReport.insuranceClaimStatus === "APPROVED"
                          ? "bg-green-500/20 text-green-400"
                          : selectedReport.insuranceClaimStatus === "REJECTED"
                            ? "bg-red-500/20 text-red-400"
                            : selectedReport.insuranceClaimStatus ===
                                "SUBMITTED"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {selectedReport.insuranceClaimStatus}
                    </span>
                  </div>
                  {selectedReport.insuranceClaimAmount && (
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">
                        Claim Amount
                      </label>
                      <div className="text-sm text-white font-medium">
                        {selectedReport.costCurrency}{" "}
                        {selectedReport.insuranceClaimAmount.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {selectedReport.disposalRequired && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-2">
                  Disposal Information
                </h4>
                <div className="text-sm text-white">Disposal Required: Yes</div>
                {selectedReport.disposalMethod && (
                  <div className="text-sm text-white mt-1">
                    Method: {selectedReport.disposalMethod}
                  </div>
                )}
              </div>
            )}
            {selectedReport.supplierNotification && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-2">
                  Supplier Notification
                </h4>
                <div className="text-sm text-white">
                  Supplier has been notified
                </div>
                {selectedReport.supplierResponse && (
                  <div className="text-sm text-white mt-1 bg-white/5 p-2 rounded">
                    {selectedReport.supplierResponse}
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() =>
                  router.push(
                    `/materials?material=${selectedReport.materialNumber}`,
                  )
                }
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-box-3-line"></i>
                View Material
              </button>
              <button
                onClick={() =>
                  router.push(`/batches?batch=${selectedReport.batchNumber}`)
                }
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-file-list-line"></i>
                View Batch
              </button>
              {selectedReport.soNumber && (
                <button
                  onClick={() =>
                    router.push(`/sales-orders?so=${selectedReport.soNumber}`)
                  }
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-shopping-cart-2-line"></i>
                  View Sales Order
                </button>
              )}
              {selectedReport.shipmentNumber && (
                <button
                  onClick={() =>
                    router.push(
                      `/tracking?shipment=${selectedReport.shipmentNumber}`,
                    )
                  }
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-map-pin-line"></i>
                  View Shipment
                </button>
              )}
              {selectedReport.photos && selectedReport.photos.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedPhotoIndex(0);
                    setShowPhotosModal(true);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-image-line"></i>
                  View Photos ({selectedReport.photos.length})
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Photos Modal */}
      <Modal
        isOpen={showPhotosModal}
        onClose={() => {
          setShowPhotosModal(false);
          setSelectedPhotoIndex(0);
        }}
        title={`Damage Photos - ${selectedReport?.reportNumber || ""}`}
        size="lg"
      >
        {selectedReport &&
          selectedReport.photos &&
          selectedReport.photos.length > 0 && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 flex items-center justify-center aspect-video">
                <div className="text-center">
                  <i className="ri-image-line text-6xl text-[#9ca3af] mb-4"></i>
                  <div className="text-white font-medium mb-2">
                    {selectedReport.photos[selectedPhotoIndex].description}
                  </div>
                  <div className="text-sm text-[#9ca3af]">
                    Photo {selectedPhotoIndex + 1} of{" "}
                    {selectedReport.photos.length}
                  </div>
                  <div className="text-xs text-[#6b7280] mt-2">
                    Taken by {selectedReport.photos[selectedPhotoIndex].takenBy}{" "}
                    on{" "}
                    {format(
                      new Date(
                        selectedReport.photos[selectedPhotoIndex].takenDate,
                      ),
                      "MMM dd, yyyy",
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() =>
                    setSelectedPhotoIndex(Math.max(0, selectedPhotoIndex - 1))
                  }
                  disabled={selectedPhotoIndex === 0}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <i className="ri-arrow-left-line"></i>
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {selectedReport.photos.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === selectedPhotoIndex
                          ? "bg-cyan-500"
                          : "bg-white/20"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() =>
                    setSelectedPhotoIndex(
                      Math.min(
                        selectedReport.photos.length - 1,
                        selectedPhotoIndex + 1,
                      ),
                    )
                  }
                  disabled={
                    selectedPhotoIndex === selectedReport.photos.length - 1
                  }
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next
                  <i className="ri-arrow-right-line"></i>
                </button>
              </div>
            </div>
          )}
      </Modal>
    </PageTemplate>
  );
}

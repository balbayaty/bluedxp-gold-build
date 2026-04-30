"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
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
import { QRCodeBadge } from "@/components/qr/QRCodeBadge";
import { UniversalQRGenerator } from "@/components/qr/UniversalQRGenerator";

interface InspectionLot {
  id: string;
  inspectionLotNumber: string;
  materialNumber: string;
  materialDescription: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  status:
    | "CREATED"
    | "IN_PROGRESS"
    | "PASSED"
    | "FAILED"
    | "RELEASED"
    | "QUARANTINED";
  inspectionType: string;
  qualityStandard: string;
  inspector: string;
  inspectionDate: Date | string;
  result: "PASSED" | "FAILED" | "IN_PROGRESS";
  stages: Array<{
    stageName: string;
    sequence: number;
    status: string;
    passed: boolean | null;
    inspector: string;
    inspectionDate: Date | string | null;
    notes: string | null;
  }>;
  certificateNumber?: string;
  ncrNumber?: string;
  vendorNumber: string;
  vendorName: string;
  poNumber: string;
  grNumber: string;
  location: string;
  quarantineLocation?: string;
  qualityScore: number;
  defectsFound: number;
  defectsDescription?: string;
  requiresReinspection: boolean;
  reinspectionDate?: Date | string;
  releasedDate?: Date | string;
  releasedBy?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function InspectionLots() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const batchFilter = searchParams.get("batch");
  const materialFilter = searchParams.get("material");

  const [lots, setLots] = useState<InspectionLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStandard, setSelectedStandard] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "analytics" | "workflow">(
    "table",
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [selectedLot, setSelectedLot] = useState<InspectionLot | null>(null);
  const [selectedStage, setSelectedStage] = useState<any>(null);

  // Fetch inspection lots from API
  useEffect(() => {
    async function fetchInspectionLots() {
      try {
        setLoading(true);
        const response = await fetch("/api/wms/inspection-lots?tenantId=default");
        const result = await response.json();
        
        if (result.success && result.data) {
          setLots(result.data);
        } else {
          setLots([]);
        }
      } catch (error) {
        console.error("Error fetching inspection lots:", error);
        setLots([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchInspectionLots();
  }, []);

  const filteredLots = useMemo(() => {
    return lots.filter((lot) => {
      const matchesSearch =
        lot.inspectionLotNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        lot.materialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lot.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lot.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || lot.status === selectedStatus;
      const matchesType =
        selectedType === "ALL" || lot.inspectionType === selectedType;
      const matchesStandard =
        selectedStandard === "ALL" || lot.qualityStandard === selectedStandard;
      const matchesBatch = !batchFilter || lot.batchNumber === batchFilter;
      const matchesMaterial =
        !materialFilter || lot.materialNumber === materialFilter;
      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesStandard &&
        matchesBatch &&
        matchesMaterial
      );
    });
  }, [
    lots,
    searchQuery,
    selectedStatus,
    selectedType,
    selectedStandard,
    batchFilter,
    materialFilter,
  ]);

  const statusStats = useMemo(() => {
    const stats: Record<string, number> = {};
    lots.forEach((lot) => {
      stats[lot.status] = (stats[lot.status] || 0) + 1;
    });
    return Object.entries(stats).map(([status, count]) => ({ status, count }));
  }, [lots]);

  const resultStats = useMemo(() => {
    const passed = lots.filter((l) => l.result === "PASSED").length;
    const failed = lots.filter((l) => l.result === "FAILED").length;
    const inProgress = lots.filter((l) => l.result === "IN_PROGRESS").length;
    return [
      { name: "Passed", value: passed, color: "#10b981" },
      { name: "Failed", value: failed, color: "#ef4444" },
      { name: "In Progress", value: inProgress, color: "#f59e0b" },
    ];
  }, [lots]);

  const qualityScoreTrend = useMemo(() => {
    return lots
      .filter((l) => l.status === "RELEASED" || l.status === "PASSED")
      .slice(-15)
      .map((lot, idx) => ({
        lot: lot.inspectionLotNumber.substring(0, 10),
        score: lot.qualityScore,
        defects: lot.defectsFound,
      }));
  }, [lots]);

  const standardDistribution = useMemo(() => {
    const stats: Record<string, number> = {};
    lots.forEach((lot) => {
      stats[lot.qualityStandard] = (stats[lot.qualityStandard] || 0) + 1;
    });
    return Object.entries(stats).map(([standard, count]) => ({
      standard,
      count,
    }));
  }, [lots]);

  const stats = [
    {
      label: "Total Inspections",
      value: lots.length,
      icon: "ri-file-search-line",
      tooltip: "Total inspection lots",
      trend: "up" as const,
    },
    {
      label: "Passed",
      value: lots.filter((l) => l.result === "PASSED").length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Passed inspections",
      trend: "up" as const,
    },
    {
      label: "Failed",
      value: lots.filter((l) => l.result === "FAILED").length,
      icon: "ri-close-circle-line",
      tooltip: "Failed inspections",
      trend: "neutral" as const,
    },
    {
      label: "Avg Quality Score",
      value: `${(lots.reduce((sum, l) => sum + l.qualityScore, 0) / lots.length).toFixed(1)}%`,
      icon: "ri-star-line",
      tooltip: "Average quality score",
      trend: "up" as const,
    },
  ];

  const handleView = (lot: InspectionLot) => {
    setSelectedLot(lot);
    setShowViewModal(true);
  };

  const handleViewStage = (lot: InspectionLot, stage: any) => {
    setSelectedLot(lot);
    setSelectedStage(stage);
    setShowStageModal(true);
  };

  const handleNavigateToBatch = (lot: InspectionLot) => {
    router.push(`/batches?batch=${lot.batchNumber}`);
  };

  const handleNavigateToMaterial = (lot: InspectionLot) => {
    router.push(`/materials?material=${lot.materialNumber}`);
  };

  const handleNavigateToNCR = (lot: InspectionLot) => {
    if (lot.ncrNumber) {
      router.push(`/ncr?ncr=${lot.ncrNumber}`);
    }
  };

  const handleNavigateToCertificate = (lot: InspectionLot) => {
    if (lot.certificateNumber) {
      router.push(`/certificates?cert=${lot.certificateNumber}`);
    }
  };

  return (
    <PageTemplate
      loading={loading}
      error={null}
      title="Inspection Lots"
      description="Multi-stage quality inspections with ISO/FDA/CE compliance, inspection workflows, and quality certificates integration"
      icon="ri-file-search-line"
      systemInfo={{
        sap: "QA11 - Inspection Lot, Quality Management",
        oracle: "Inspection Lots, Quality Control",
        manhattan: "Inspection Management, QC Workflows",
      }}
      examples={[
        "Multi-stage inspections (Visual, Dimensional, Functional, Chemical)",
        "Quality standards compliance (ISO 9001, ISO 14001, FDA, CE, HALAL)",
        "Inspection workflows and stage tracking",
        "Quality certificates generation",
        "NCR integration for failed inspections",
        "Quality score analytics",
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
            Create Inspection
          </button>
          <Tooltip
            content="Analyze Inspection Images with AI Vision"
            position="bottom"
          >
            <button
              onClick={() => router.push("/ai-vision")}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20"
            >
              <i className="ri-eye-line"></i>
              AI Vision
            </button>
          </Tooltip>
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
              Inspection Results
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={resultStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {resultStats.map((entry, index) => (
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
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:col-span-2"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Quality Score Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={qualityScoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="lot"
                  stroke="#9ca3af"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
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
                <Bar
                  yAxisId="left"
                  dataKey="score"
                  fill="#10b981"
                  name="Quality Score (%)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="defects"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Defects"
                />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:col-span-2"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Quality Standards Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={standardDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="standard"
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
        </div>
      )}

      {/* Workflow View */}
      {viewMode === "workflow" && (
        <div className="mb-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Inspection Workflow Stages
          </h3>
          <div className="space-y-4">
            {filteredLots.slice(0, 5).map((lot) => (
              <div key={lot.id} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-medium text-white font-mono">
                      {lot.inspectionLotNumber}
                    </div>
                    <div className="text-xs text-[#9ca3af]">
                      {lot.materialDescription}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      lot.result === "PASSED"
                        ? "bg-green-500/20 text-green-400"
                        : lot.result === "FAILED"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {lot.result}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {lot.stages.map((stage, idx) => (
                    <div key={idx} className="flex items-center gap-2 flex-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          stage.passed === true
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : stage.passed === false
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : stage.status === "IN_PROGRESS"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {stage.sequence}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-white">
                          {stage.stageName}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {stage.status}
                        </div>
                      </div>
                      {idx < lot.stages.length - 1 && (
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
            placeholder="Search by Inspection Lot, Material, Batch..."
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
          <option value="CREATED">Created</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="PASSED">Passed</option>
          <option value="FAILED">Failed</option>
          <option value="RELEASED">Released</option>
          <option value="QUARANTINED">Quarantined</option>
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Types</option>
          <option value="INCOMING">Incoming</option>
          <option value="IN_PROCESS">In Process</option>
          <option value="FINAL">Final</option>
          <option value="SAMPLE">Sample</option>
          <option value="RETURN">Return</option>
        </select>
        <select
          value={selectedStandard}
          onChange={(e) => setSelectedStandard(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[200px]"
        >
          <option value="ALL">All Standards</option>
          <option value="ISO_9001">ISO 9001</option>
          <option value="ISO_14001">ISO 14001</option>
          <option value="FDA">FDA</option>
          <option value="CE">CE</option>
          <option value="HALAL">HALAL</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </div>

      {/* Inspection Lots Table */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Inspection Lot
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Batch
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Type/Standard
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Stages
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Quality Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Result
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
                {filteredLots.map((lot, index) => {
                  const completedStages = lot.stages.filter(
                    (s) => s.status !== "PENDING",
                  ).length;
                  return (
                    <motion.tr
                      key={lot.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="text-sm font-medium text-white font-mono">
                              {lot.inspectionLotNumber}
                            </div>
                            <div className="text-xs text-[#9ca3af]">
                              {format(
                                new Date(lot.inspectionDate),
                                "MMM dd, yyyy",
                              )}
                            </div>
                          </div>
                          <QRCodeBadge
                            entityId={lot.id}
                            entityType="document"
                            entityName={lot.inspectionLotNumber}
                            documentType="report"
                            documentUrl={`/inspection-lots?lot=${lot.inspectionLotNumber}`}
                            module="iso-ims"
                            size="sm"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleNavigateToMaterial(lot)}
                          className="text-left hover:text-cyan-400 transition-colors"
                        >
                          <div className="text-sm text-white font-mono cursor-pointer">
                            {lot.materialNumber}
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            {lot.materialDescription}
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleNavigateToBatch(lot)}
                          className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                        >
                          {lot.batchNumber}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {lot.inspectionType}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {lot.qualityStandard.replace(/_/g, " ")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {completedStages} / {lot.stages.length}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          Stages completed
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${
                                lot.qualityScore >= 90
                                  ? "bg-green-500"
                                  : lot.qualityScore >= 75
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${lot.qualityScore}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-white font-medium w-12 text-right">
                            {lot.qualityScore.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            lot.result === "PASSED"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : lot.result === "FAILED"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          }`}
                        >
                          {lot.result}
                        </span>
                        {lot.defectsFound > 0 && (
                          <div className="text-xs text-red-400 mt-1">
                            {lot.defectsFound} defect
                            {lot.defectsFound !== 1 ? "s" : ""}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            lot.status === "RELEASED"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : lot.status === "PASSED"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : lot.status === "FAILED"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : lot.status === "QUARANTINED"
                                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                    : lot.status === "IN_PROGRESS"
                                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                      : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {lot.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Tooltip content="View Details" position="top">
                            <button
                              onClick={() => handleView(lot)}
                              className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                            >
                              <i className="ri-eye-line"></i>
                            </button>
                          </Tooltip>
                          {lot.ncrNumber && (
                            <Tooltip content="View NCR" position="top">
                              <button
                                onClick={() => handleNavigateToNCR(lot)}
                                className="p-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded hover:bg-red-600/30 transition-colors"
                              >
                                <i className="ri-error-warning-line"></i>
                              </button>
                            </Tooltip>
                          )}
                          {lot.certificateNumber && (
                            <Tooltip content="View Certificate" position="top">
                              <button
                                onClick={() => handleNavigateToCertificate(lot)}
                                className="p-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded hover:bg-green-600/30 transition-colors"
                              >
                                <i className="ri-file-certificate-line"></i>
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
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
          setSelectedLot(null);
        }}
        title={`Inspection Lot Details - ${selectedLot?.inspectionLotNumber || ""}`}
        size="lg"
      >
        {selectedLot && (
          <div className="space-y-4">
            {/* QR Code Section */}
            <div className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
              <UniversalQRGenerator
                entityId={selectedLot.id}
                entityType="document"
                entityName={selectedLot.inspectionLotNumber}
                documentType="report"
                documentUrl={`/inspection-lots?lot=${selectedLot.inspectionLotNumber}`}
                module="iso-ims"
                showAdvanced={false}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Inspection Lot Number
                </label>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-white font-mono">
                    {selectedLot.inspectionLotNumber}
                  </div>
                  <QRCodeBadge
                    entityId={selectedLot.id}
                    entityType="document"
                    entityName={selectedLot.inspectionLotNumber}
                    documentType="report"
                    documentUrl={`/inspection-lots?lot=${selectedLot.inspectionLotNumber}`}
                    module="iso-ims"
                    size="sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Material
                </label>
                <button
                  onClick={() => handleNavigateToMaterial(selectedLot)}
                  className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {selectedLot.materialNumber}
                </button>
                <div className="text-xs text-[#9ca3af]">
                  {selectedLot.materialDescription}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Batch Number
                </label>
                <button
                  onClick={() => handleNavigateToBatch(selectedLot)}
                  className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {selectedLot.batchNumber}
                </button>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Quantity
                </label>
                <div className="text-sm text-white">
                  {selectedLot.quantity.toFixed(2)} {selectedLot.unit}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Inspection Type
                </label>
                <div className="text-sm text-white">
                  {selectedLot.inspectionType}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Quality Standard
                </label>
                <div className="text-sm text-white">
                  {selectedLot.qualityStandard.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Inspector
                </label>
                <div className="text-sm text-white">
                  {selectedLot.inspector}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Inspection Date
                </label>
                <div className="text-sm text-white">
                  {format(
                    new Date(selectedLot.inspectionDate),
                    "MMM dd, yyyy HH:mm",
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Quality Score
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedLot.qualityScore.toFixed(1)}%
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Result
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedLot.result === "PASSED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedLot.result === "FAILED"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {selectedLot.result}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedLot.status === "RELEASED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedLot.status === "PASSED"
                        ? "bg-blue-500/20 text-blue-400"
                        : selectedLot.status === "FAILED"
                          ? "bg-red-500/20 text-red-400"
                          : selectedLot.status === "QUARANTINED"
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedLot.status}
                </span>
              </div>
              {selectedLot.defectsFound > 0 && (
                <div className="col-span-2">
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Defects
                  </label>
                  <div className="text-sm text-red-400">
                    {selectedLot.defectsFound} defect
                    {selectedLot.defectsFound !== 1 ? "s" : ""} found
                  </div>
                  {selectedLot.defectsDescription && (
                    <div className="text-xs text-[#9ca3af] mt-1">
                      {selectedLot.defectsDescription}
                    </div>
                  )}
                </div>
              )}
            </div>
            {selectedLot.stages.length > 0 && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Inspection Stages ({selectedLot.stages.length} stages)
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedLot.stages.map((stage, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          stage.passed === true
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : stage.passed === false
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : stage.status === "IN_PROGRESS"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {stage.sequence}
                      </div>
                      <div className="flex-1">
                        <div className="text-white">{stage.stageName}</div>
                        <div className="text-xs text-[#9ca3af]">
                          {stage.status} • {stage.inspector}
                          {stage.inspectionDate &&
                            ` • ${format(new Date(stage.inspectionDate), "MMM dd")}`}
                        </div>
                        {stage.notes && (
                          <div className="text-xs text-[#9ca3af] mt-1">
                            {stage.notes}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleViewStage(selectedLot, stage)}
                        className="p-1.5 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                      >
                        <i className="ri-eye-line text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => handleNavigateToBatch(selectedLot)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-file-list-line"></i>
                View Batch
              </button>
              <button
                onClick={() => handleNavigateToMaterial(selectedLot)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-box-3-line"></i>
                View Material
              </button>
              {selectedLot.ncrNumber && (
                <button
                  onClick={() => handleNavigateToNCR(selectedLot)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-error-warning-line"></i>
                  View NCR
                </button>
              )}
              {selectedLot.certificateNumber && (
                <button
                  onClick={() => handleNavigateToCertificate(selectedLot)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-file-certificate-line"></i>
                  View Certificate
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Stage Details Modal */}
      <Modal
        isOpen={showStageModal}
        onClose={() => {
          setShowStageModal(false);
          setSelectedStage(null);
        }}
        title={`Inspection Stage - ${selectedStage?.stageName || ""}`}
        size="md"
      >
        {selectedStage && selectedLot && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Stage Name
                </label>
                <div className="text-sm text-white">
                  {selectedStage.stageName}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Sequence
                </label>
                <div className="text-sm text-white">
                  {selectedStage.sequence} / {selectedLot.stages.length}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedStage.status === "IN_PROGRESS"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : selectedStage.passed === true
                        ? "bg-green-500/20 text-green-400"
                        : selectedStage.passed === false
                          ? "bg-red-500/20 text-red-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedStage.status}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Inspector
                </label>
                <div className="text-sm text-white">
                  {selectedStage.inspector}
                </div>
              </div>
              {selectedStage.inspectionDate && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Inspection Date
                  </label>
                  <div className="text-sm text-white">
                    {format(
                      new Date(selectedStage.inspectionDate),
                      "MMM dd, yyyy HH:mm",
                    )}
                  </div>
                </div>
              )}
              {selectedStage.passed !== null && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Result
                  </label>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedStage.passed
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {selectedStage.passed ? "PASSED" : "FAILED"}
                  </span>
                </div>
              )}
            </div>
            {selectedStage.notes && (
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Notes
                </label>
                <div className="text-sm text-white bg-white/5 p-3 rounded-lg">
                  {selectedStage.notes}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}

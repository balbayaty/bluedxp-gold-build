"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import { generateQualityCertificates } from "@/utils/mockDataGenerators";
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
} from "recharts";
import UniversalQRGenerator from "@/components/qr/UniversalQRGenerator";
import QRCodeBadge from "@/components/qr/QRCodeBadge";

interface QualityCertificate {
  id: string;
  certificateNumber: string;
  inspectionLotNumber: string;
  materialNumber: string;
  materialDescription: string;
  batchNumber: string;
  certificateType: string;
  issuingBody: string;
  issueDate: Date | string;
  expiryDate: Date | string;
  validityPeriod: number;
  daysUntilExpiry: number;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "SUSPENDED" | "REVOKED";
  complianceStandard: string;
  testResults: Array<{
    parameter: string;
    value: number;
    unit: string;
    specification: string;
    result: "PASS" | "FAIL";
  }>;
  approvedBy: string;
  approvedDate: Date | string;
  documentUrl: string;
  digitalSignature: boolean;
  qrCode: string;
  renewalRequired: boolean;
  renewalStatus?: string;
  renewalApplicationDate?: Date | string;
  relatedCertificates: string[];
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function QualityCertificates() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inspectionFilter = searchParams.get("inspection");
  const certFilter = searchParams.get("cert");

  const [certificates, setCertificates] = useState<QualityCertificate[]>(
    () => generateQualityCertificates(50) as QualityCertificate[],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "analytics" | "expiry">(
    "table",
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [showTestResultsModal, setShowTestResultsModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] =
    useState<QualityCertificate | null>(null);

  const filteredCertificates = useMemo(() => {
    return certificates.filter((cert) => {
      const matchesSearch =
        cert.certificateNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        cert.materialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.issuingBody.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || cert.status === selectedStatus;
      const matchesType =
        selectedType === "ALL" || cert.certificateType === selectedType;
      const matchesInspection =
        !inspectionFilter || cert.inspectionLotNumber === inspectionFilter;
      const matchesCert = !certFilter || cert.certificateNumber === certFilter;
      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesInspection &&
        matchesCert
      );
    });
  }, [
    certificates,
    searchQuery,
    selectedStatus,
    selectedType,
    inspectionFilter,
    certFilter,
  ]);

  const statusStats = useMemo(() => {
    const stats: Record<string, number> = {};
    certificates.forEach((cert) => {
      stats[cert.status] = (stats[cert.status] || 0) + 1;
    });
    return Object.entries(stats).map(([status, count]) => ({ status, count }));
  }, [certificates]);

  const typeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    certificates.forEach((cert) => {
      stats[cert.certificateType] = (stats[cert.certificateType] || 0) + 1;
    });
    return Object.entries(stats).map(([type, count]) => ({ type, count }));
  }, [certificates]);

  const expiryAlerts = useMemo(() => {
    return certificates.filter(
      (c) => c.status === "EXPIRING_SOON" || c.status === "EXPIRED",
    );
  }, [certificates]);

  const expiryTrend = useMemo(() => {
    const next90Days = Array.from({ length: 90 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return {
        date: format(date, "MMM dd"),
        expiring: certificates.filter((c) => {
          const expiry = new Date(c.expiryDate);
          return expiry.toDateString() === date.toDateString();
        }).length,
      };
    });
    return next90Days.filter((d) => d.expiring > 0);
  }, [certificates]);

  const stats = [
    {
      label: "Total Certificates",
      value: certificates.length,
      icon: "ri-file-certificate-line",
      tooltip: "Total quality certificates",
      trend: "up" as const,
    },
    {
      label: "Active",
      value: certificates.filter((c) => c.status === "ACTIVE").length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active certificates",
      trend: "up" as const,
    },
    {
      label: "Expiring Soon",
      value: certificates.filter((c) => c.status === "EXPIRING_SOON").length,
      icon: "ri-time-warning-line",
      tooltip: "Certificates expiring within 30 days",
      trend: "neutral" as const,
    },
    {
      label: "Expired",
      value: certificates.filter((c) => c.status === "EXPIRED").length,
      icon: "ri-close-circle-line",
      tooltip: "Expired certificates",
      trend: "neutral" as const,
    },
  ];

  const handleView = (cert: QualityCertificate) => {
    setSelectedCertificate(cert);
    setShowViewModal(true);
  };

  const handleViewTestResults = (cert: QualityCertificate) => {
    setSelectedCertificate(cert);
    setShowTestResultsModal(true);
  };

  const handleNavigateToInspection = (cert: QualityCertificate) => {
    router.push(`/inspection-lots?inspection=${cert.inspectionLotNumber}`);
  };

  const handleNavigateToBatch = (cert: QualityCertificate) => {
    router.push(`/batches?batch=${cert.batchNumber}`);
  };

  const handleNavigateToMaterial = (cert: QualityCertificate) => {
    router.push(`/materials?material=${cert.materialNumber}`);
  };

  return (
    <PageTemplate
      title="Quality Certificates"
      description="COA and quality certificates with expiry tracking, compliance management, and test results"
      icon="ri-file-certificate-line"
      systemInfo={{
        sap: "Certificates, Quality Management",
        oracle: "Quality Certificates, COA Management",
        manhattan: "Certificates, Compliance Tracking",
      }}
      examples={[
        "Certificate of Analysis (COA)",
        "ISO 9001, ISO 14001, FDA, CE, HALAL certificates",
        "Expiry tracking and renewal management",
        "Test results and compliance verification",
        "Digital signatures and QR codes",
        "Certificate lifecycle management",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["table", "analytics", "expiry"] as const).map((mode) => (
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
                  className={`ri-${mode === "table" ? "table-line" : mode === "analytics" ? "bar-chart-line" : "time-line"} mr-1`}
                ></i>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20">
            <i className="ri-add-line"></i>
            Create Certificate
          </button>
        </div>
      }
    >
      {/* Expiry Alerts Banner */}
      {expiryAlerts.length > 0 && (
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <i className="ri-time-warning-line text-2xl text-yellow-400"></i>
            <div className="flex-1">
              <div className="text-white font-medium mb-1">
                Certificate Expiry Alerts
              </div>
              <div className="text-sm text-[#9ca3af]">
                {expiryAlerts.length} certificate
                {expiryAlerts.length !== 1 ? "s" : ""}{" "}
                {expiryAlerts.filter((c) => c.status === "EXPIRED").length > 0
                  ? "expired"
                  : "expiring soon"}
              </div>
            </div>
            <button
              onClick={() => setViewMode("expiry")}
              className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-lg transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
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
                  data={statusStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6b7280"][
                          index % 5
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
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Certificate Type Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeStats}>
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
      )}

      {/* Expiry View */}
      {viewMode === "expiry" && (
        <div className="mb-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Certificate Expiry Timeline
          </h3>
          {expiryTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={expiryTrend}>
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
                <Line
                  type="monotone"
                  dataKey="expiring"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Certificates Expiring"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-[#9ca3af]">
              No certificates expiring in the next 90 days
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search by Certificate Number, Material, Batch..."
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
          <option value="EXPIRING_SOON">Expiring Soon</option>
          <option value="EXPIRED">Expired</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="REVOKED">Revoked</option>
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Types</option>
          <option value="COA">COA</option>
          <option value="ISO_9001">ISO 9001</option>
          <option value="ISO_14001">ISO 14001</option>
          <option value="FDA">FDA</option>
          <option value="CE">CE</option>
          <option value="HALAL">HALAL</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </div>

      {/* Certificates Table */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Certificate Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Type/Standard
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Issuing Body
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Days Remaining
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
                {filteredCertificates.map((cert, index) => {
                  const isExpiringSoon =
                    cert.daysUntilExpiry <= 30 && cert.daysUntilExpiry > 0;
                  const isExpired = cert.daysUntilExpiry < 0;
                  return (
                    <motion.tr
                      key={cert.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white font-mono">
                          {cert.certificateNumber}
                        </div>
                        {cert.digitalSignature && (
                          <div className="text-xs text-green-400 mt-1">
                            <i className="ri-shield-check-line mr-1"></i>
                            Digitally Signed
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleNavigateToMaterial(cert)}
                          className="text-left hover:text-cyan-400 transition-colors"
                        >
                          <div className="text-sm text-white font-mono cursor-pointer">
                            {cert.materialNumber}
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            {cert.materialDescription}
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {cert.certificateType}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {cert.complianceStandard.replace(/_/g, " ")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {cert.issuingBody}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {format(new Date(cert.issueDate), "MMM dd, yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${
                            isExpired
                              ? "text-red-400"
                              : isExpiringSoon
                                ? "text-yellow-400"
                                : "text-white"
                          }`}
                        >
                          {format(new Date(cert.expiryDate), "MMM dd, yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${
                            isExpired
                              ? "text-red-400"
                              : isExpiringSoon
                                ? "text-yellow-400"
                                : "text-white"
                          }`}
                        >
                          {isExpired
                            ? `${Math.abs(cert.daysUntilExpiry)} days overdue`
                            : isExpiringSoon
                              ? `${cert.daysUntilExpiry} days`
                              : `${cert.daysUntilExpiry} days`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            cert.status === "ACTIVE"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : cert.status === "EXPIRING_SOON"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : cert.status === "EXPIRED"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : cert.status === "SUSPENDED"
                                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {cert.status.replace(/_/g, " ")}
                        </span>
                        {cert.renewalRequired && (
                          <div className="text-xs text-yellow-400 mt-1">
                            <i className="ri-refresh-line mr-1"></i>
                            Renewal Required
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <QRCodeBadge
                            entityId={cert.id}
                            entityType="certificate"
                            entityName={cert.certificateNumber}
                            documentType="certificate"
                            documentUrl={`/certificates?cert=${cert.certificateNumber}`}
                            module="compliance"
                            size="sm"
                          />
                          <Tooltip content="View Details" position="top">
                            <button
                              onClick={() => handleView(cert)}
                              className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                            >
                              <i className="ri-eye-line"></i>
                            </button>
                          </Tooltip>
                          <Tooltip content="View Test Results" position="top">
                            <button
                              onClick={() => handleViewTestResults(cert)}
                              className="p-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-600/30 transition-colors"
                            >
                              <i className="ri-file-list-3-line"></i>
                            </button>
                          </Tooltip>
                          <Tooltip content="View Inspection" position="top">
                            <button
                              onClick={() => handleNavigateToInspection(cert)}
                              className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                            >
                              <i className="ri-file-search-line"></i>
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
      )}

      {/* View Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedCertificate(null);
        }}
        title={`Certificate Details - ${selectedCertificate?.certificateNumber || ""}`}
        size="lg"
      >
        {selectedCertificate && (
          <div className="space-y-4">
            {/* QR Code Section */}
            <div className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
              <UniversalQRGenerator
                entityId={selectedCertificate.id}
                entityType="certificate"
                entityName={selectedCertificate.certificateNumber}
                documentType="certificate"
                documentUrl={`/certificates?cert=${selectedCertificate.certificateNumber}`}
                module="compliance"
                showAdvanced={false}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Certificate Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedCertificate.certificateNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedCertificate.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : selectedCertificate.status === "EXPIRING_SOON"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : selectedCertificate.status === "EXPIRED"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedCertificate.status.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Material
                </label>
                <button
                  onClick={() => handleNavigateToMaterial(selectedCertificate)}
                  className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {selectedCertificate.materialNumber}
                </button>
                <div className="text-xs text-[#9ca3af]">
                  {selectedCertificate.materialDescription}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Batch
                </label>
                <button
                  onClick={() => handleNavigateToBatch(selectedCertificate)}
                  className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {selectedCertificate.batchNumber}
                </button>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Certificate Type
                </label>
                <div className="text-sm text-white">
                  {selectedCertificate.certificateType}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Compliance Standard
                </label>
                <div className="text-sm text-white">
                  {selectedCertificate.complianceStandard.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Issuing Body
                </label>
                <div className="text-sm text-white">
                  {selectedCertificate.issuingBody}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Issue Date
                </label>
                <div className="text-sm text-white">
                  {format(
                    new Date(selectedCertificate.issueDate),
                    "MMM dd, yyyy",
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Expiry Date
                </label>
                <div
                  className={`text-sm font-medium ${
                    selectedCertificate.daysUntilExpiry < 0
                      ? "text-red-400"
                      : selectedCertificate.daysUntilExpiry <= 30
                        ? "text-yellow-400"
                        : "text-white"
                  }`}
                >
                  {format(
                    new Date(selectedCertificate.expiryDate),
                    "MMM dd, yyyy",
                  )}
                </div>
                <div
                  className={`text-xs ${
                    selectedCertificate.daysUntilExpiry < 0
                      ? "text-red-400"
                      : selectedCertificate.daysUntilExpiry <= 30
                        ? "text-yellow-400"
                        : "text-[#9ca3af]"
                  }`}
                >
                  {selectedCertificate.daysUntilExpiry < 0
                    ? `${Math.abs(selectedCertificate.daysUntilExpiry)} days overdue`
                    : selectedCertificate.daysUntilExpiry <= 30
                      ? `${selectedCertificate.daysUntilExpiry} days remaining`
                      : `${selectedCertificate.daysUntilExpiry} days remaining`}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Validity Period
                </label>
                <div className="text-sm text-white">
                  {selectedCertificate.validityPeriod} days
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Approved By
                </label>
                <div className="text-sm text-white">
                  {selectedCertificate.approvedBy}
                </div>
                <div className="text-xs text-[#9ca3af]">
                  {format(
                    new Date(selectedCertificate.approvedDate),
                    "MMM dd, yyyy",
                  )}
                </div>
              </div>
              {selectedCertificate.digitalSignature && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Digital Signature
                  </label>
                  <div className="text-sm text-green-400">
                    <i className="ri-shield-check-line mr-1"></i>
                    Verified
                  </div>
                </div>
              )}
              {selectedCertificate.qrCode && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    QR Code
                  </label>
                  <div className="text-sm text-white font-mono">
                    {selectedCertificate.qrCode}
                  </div>
                </div>
              )}
            </div>
            {selectedCertificate.renewalRequired && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-yellow-400 mb-2">
                  Renewal Required
                </h4>
                {selectedCertificate.renewalStatus && (
                  <div className="text-sm text-white">
                    Status: {selectedCertificate.renewalStatus}
                  </div>
                )}
                {selectedCertificate.renewalApplicationDate && (
                  <div className="text-xs text-[#9ca3af] mt-1">
                    Application Date:{" "}
                    {format(
                      new Date(selectedCertificate.renewalApplicationDate),
                      "MMM dd, yyyy",
                    )}
                  </div>
                )}
              </div>
            )}
            {selectedCertificate.testResults &&
              selectedCertificate.testResults.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-white">
                      Test Results ({selectedCertificate.testResults.length}{" "}
                      parameters)
                    </h4>
                    <button
                      onClick={() => handleViewTestResults(selectedCertificate)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedCertificate.testResults
                      .slice(0, 3)
                      .map((result, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <div>
                            <div className="text-white">{result.parameter}</div>
                            <div className="text-xs text-[#9ca3af]">
                              Spec: {result.specification}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-medium">
                              {result.value} {result.unit}
                            </div>
                            <span
                              className={`text-xs ${
                                result.result === "PASS"
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {result.result}
                            </span>
                          </div>
                        </div>
                      ))}
                    {selectedCertificate.testResults.length > 3 && (
                      <div className="text-xs text-[#9ca3af] text-center pt-2">
                        +{selectedCertificate.testResults.length - 3} more
                        parameters
                      </div>
                    )}
                  </div>
                </div>
              )}
            {selectedCertificate.notes && (
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Notes
                </label>
                <div className="text-sm text-white bg-white/5 p-3 rounded-lg">
                  {selectedCertificate.notes}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => handleNavigateToInspection(selectedCertificate)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-file-search-line"></i>
                View Inspection
              </button>
              <button
                onClick={() => handleNavigateToBatch(selectedCertificate)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-file-list-line"></i>
                View Batch
              </button>
              <button
                onClick={() => handleNavigateToMaterial(selectedCertificate)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-box-3-line"></i>
                View Material
              </button>
              {selectedCertificate.testResults &&
                selectedCertificate.testResults.length > 0 && (
                  <button
                    onClick={() => handleViewTestResults(selectedCertificate)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="ri-file-list-3-line"></i>
                    View Test Results
                  </button>
                )}
            </div>
          </div>
        )}
      </Modal>

      {/* Test Results Modal */}
      <Modal
        isOpen={showTestResultsModal}
        onClose={() => {
          setShowTestResultsModal(false);
          setSelectedCertificate(null);
        }}
        title={`Test Results - ${selectedCertificate?.certificateNumber || ""}`}
        size="lg"
      >
        {selectedCertificate && selectedCertificate.testResults && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-white mb-4">
                Material: {selectedCertificate.materialNumber} • Batch:{" "}
                {selectedCertificate.batchNumber}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[#9ca3af]">
                        Parameter
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[#9ca3af]">
                        Value
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[#9ca3af]">
                        Specification
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[#9ca3af]">
                        Result
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {selectedCertificate.testResults.map((result, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm text-white">
                          {result.parameter}
                        </td>
                        <td className="px-4 py-2 text-sm text-white font-medium">
                          {result.value} {result.unit}
                        </td>
                        <td className="px-4 py-2 text-xs text-[#9ca3af]">
                          {result.specification}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              result.result === "PASS"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {result.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import Tooltip from "@/components/Tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

interface ComplianceRecord {
  id: string;
  authority: string;
  requirement: string;
  category: string;
  status: "COMPLIANT" | "NON_COMPLIANT" | "PENDING" | "EXPIRED";
  expiryDate: string;
  lastAudit: string;
  nextAudit: string;
  documents: number;
  score: number;
}

interface AuditRecord {
  id: string;
  authority: string;
  auditType: string;
  date: string;
  status: "PASSED" | "FAILED" | "PENDING";
  findings: number;
  score: number;
}

function RegulatoryContent() {
  const [complianceRecords, setComplianceRecords] = useState<
    ComplianceRecord[]
  >([]);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "COMPLIANT" | "NON_COMPLIANT" | "PENDING" | "EXPIRED"
  >("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock data - in real app, fetch from API
      const mockCompliance: ComplianceRecord[] = [
        {
          id: "1",
          authority: "Civil Defense",
          requirement: "Fire Safety Certificate",
          category: "Safety",
          status: "COMPLIANT",
          expiryDate: "2025-12-31",
          lastAudit: "2024-11-15",
          nextAudit: "2025-11-15",
          documents: 5,
          score: 95,
        },
        {
          id: "2",
          authority: "Ministry of Commerce",
          requirement: "Commercial License",
          category: "Business",
          status: "COMPLIANT",
          expiryDate: "2025-06-30",
          lastAudit: "2024-12-01",
          nextAudit: "2025-06-01",
          documents: 3,
          score: 100,
        },
        {
          id: "3",
          authority: "SFDA",
          requirement: "Food Safety License",
          category: "Food Safety",
          status: "PENDING",
          expiryDate: "2025-03-31",
          lastAudit: "2024-09-20",
          nextAudit: "2025-03-20",
          documents: 8,
          score: 78,
        },
        {
          id: "4",
          authority: "Municipality",
          requirement: "Building Permit",
          category: "Construction",
          status: "COMPLIANT",
          expiryDate: "2026-01-15",
          lastAudit: "2024-10-10",
          nextAudit: "2025-10-10",
          documents: 4,
          score: 92,
        },
        {
          id: "5",
          authority: "Ministry of Environment",
          requirement: "Environmental Permit",
          category: "Environment",
          status: "EXPIRED",
          expiryDate: "2024-12-31",
          lastAudit: "2023-11-20",
          nextAudit: "2025-01-20",
          documents: 6,
          score: 0,
        },
      ];

      const mockAudits: AuditRecord[] = [
        {
          id: "1",
          authority: "Civil Defense",
          auditType: "Annual Fire Safety",
          date: "2024-11-15",
          status: "PASSED",
          findings: 2,
          score: 95,
        },
        {
          id: "2",
          authority: "SFDA",
          auditType: "Food Safety Inspection",
          date: "2024-09-20",
          status: "PASSED",
          findings: 5,
          score: 78,
        },
        {
          id: "3",
          authority: "Ministry of Environment",
          auditType: "Environmental Compliance",
          date: "2024-08-10",
          status: "FAILED",
          findings: 12,
          score: 45,
        },
      ];

      setComplianceRecords(mockCompliance);
      setAuditRecords(mockAudits);
    } catch (error) {
      // Error handled - records arrays remain empty or use fallback
      setComplianceRecords([]);
      setAuditRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords =
    filter === "all"
      ? complianceRecords
      : complianceRecords.filter((r) => r.status === filter);

  const stats = {
    total: complianceRecords.length,
    compliant: complianceRecords.filter((r) => r.status === "COMPLIANT").length,
    nonCompliant: complianceRecords.filter((r) => r.status === "NON_COMPLIANT")
      .length,
    pending: complianceRecords.filter((r) => r.status === "PENDING").length,
    expired: complianceRecords.filter((r) => r.status === "EXPIRED").length,
    averageScore: Math.round(
      complianceRecords.reduce((sum, r) => sum + r.score, 0) /
        complianceRecords.length,
    ),
  };

  const statusDistribution = [
    { name: "Compliant", value: stats.compliant, color: "#10b981" },
    { name: "Pending", value: stats.pending, color: "#f59e0b" },
    { name: "Non-Compliant", value: stats.nonCompliant, color: "#ef4444" },
    { name: "Expired", value: stats.expired, color: "#6b7280" },
  ];

  const authorityDistribution = complianceRecords.reduce(
    (acc, record) => {
      acc[record.authority] = (acc[record.authority] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const authorityData = Object.entries(authorityDistribution).map(
    ([authority, count]) => ({
      authority,
      count,
    }),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLIANT":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "NON_COMPLIANT":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "EXPIRED":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLIANT":
        return "✓ Compliant";
      case "NON_COMPLIANT":
        return "✗ Non-Compliant";
      case "PENDING":
        return "⏳ Pending";
      case "EXPIRED":
        return "⚠ Expired";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Regulatory Compliance"
        icon="ri-shield-check-line"
        description="Regulatory compliance tracking and management"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Regulatory Compliance"
      description="Track and manage regulatory compliance, licenses, permits, and audit records"
      icon="ri-shield-check-line"
      stats={[
        {
          label: "Total Records",
          value: stats.total,
          icon: "ri-file-list-line",
          tooltip: "Total compliance records",
        },
        {
          label: "Compliant",
          value: stats.compliant,
          icon: "ri-checkbox-circle-line",
          tooltip: "Compliant records",
        },
        {
          label: "Average Score",
          value: `${stats.averageScore}%`,
          icon: "ri-star-line",
          tooltip: "Average compliance score",
        },
        {
          label: "Expiring Soon",
          value: complianceRecords.filter((r) => {
            const expiry = new Date(r.expiryDate);
            const now = new Date();
            const daysUntilExpiry = Math.ceil(
              (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );
            return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
          }).length,
          icon: "ri-alert-line",
          tooltip: "Records expiring in next 90 days",
        },
      ]}
      actions={
        <button
          onClick={() => alert("Add new compliance record")}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium transition-colors"
        >
          <i className="ri-add-line mr-2"></i>
          Add Record
        </button>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        {(
          ["all", "COMPLIANT", "NON_COMPLIANT", "PENDING", "EXPIRED"] as const
        ).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-cyan-500 text-white"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            {f === "all" ? "All" : f.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
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

        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            By Authority
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={authorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="authority" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                }}
              />
              <Bar dataKey="count" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Compliance Records Table */}
      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">
            Compliance Records
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Authority
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Requirement
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Expiry Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-white">
                    {record.authority}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {record.requirement}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {record.category}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(record.status)}`}
                    >
                      {getStatusBadge(record.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {format(new Date(record.expiryDate), "MMM dd, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            record.score >= 80
                              ? "bg-green-500"
                              : record.score >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${record.score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-300 w-12">
                        {record.score}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedRecord(record);
                        setShowDetailModal(true);
                      }}
                      className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded text-sm hover:bg-cyan-500/30 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Records */}
      <div className="mt-6 bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Recent Audits</h3>
        </div>
        <div className="p-4 space-y-3">
          {auditRecords.map((audit) => (
            <div
              key={audit.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-white">
                      {audit.auditType}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        audit.status === "PASSED"
                          ? "bg-green-500/20 text-green-400"
                          : audit.status === "FAILED"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {audit.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {audit.authority} •{" "}
                    {format(new Date(audit.date), "MMM dd, yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">
                    Score:{" "}
                    <span className="text-white font-semibold">
                      {audit.score}%
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {audit.findings} findings
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRecord && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={selectedRecord.requirement}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300">
                Authority
              </label>
              <p className="text-white">{selectedRecord.authority}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Category
              </label>
              <p className="text-white">{selectedRecord.category}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Status
              </label>
              <p className="text-white">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(selectedRecord.status)}`}
                >
                  {getStatusBadge(selectedRecord.status)}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Expiry Date
              </label>
              <p className="text-white">
                {format(new Date(selectedRecord.expiryDate), "MMMM dd, yyyy")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Last Audit
              </label>
              <p className="text-white">
                {format(new Date(selectedRecord.lastAudit), "MMMM dd, yyyy")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Next Audit
              </label>
              <p className="text-white">
                {format(new Date(selectedRecord.nextAudit), "MMMM dd, yyyy")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Compliance Score
              </label>
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        selectedRecord.score >= 80
                          ? "bg-green-500"
                          : selectedRecord.score >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${selectedRecord.score}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-semibold w-16">
                    {selectedRecord.score}%
                  </span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Documents
              </label>
              <p className="text-white">
                {selectedRecord.documents} documents attached
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors">
                View Documents
              </button>
              <button className="flex-1 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors">
                Edit Record
              </button>
            </div>
          </div>
        </Modal>
      )}
    </PageTemplate>
  );
}

export default function RegulatoryPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Regulatory Compliance"
          description="Track and manage regulatory compliance, licenses, permits, and audit records"
          icon="ri-shield-check-line"
        >
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">
                Error Loading Regulatory Data
              </h2>
              <p className="text-gray-500">
                Something went wrong. Please refresh the page.
              </p>
            </div>
          </div>
        </PageTemplate>
      }
    >
      <RegulatoryContent />
    </ErrorBoundary>
  );
}

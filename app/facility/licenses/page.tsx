"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { format } from "date-fns";
import { LicenseService } from "@/lib/services/facility/licensing/licenseService";
import type {
  FacilityLicense,
  LicenseStatus,
  LicenseType,
} from "@/types/facility";
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
  ResponsiveContainer,
} from "recharts";

function LicensesContent() {
  const [licenses, setLicenses] = useState<FacilityLicense[]>([]);
  const [selectedLicense, setSelectedLicense] =
    useState<FacilityLicense | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<"all" | LicenseStatus>("all");
  const [loading, setLoading] = useState(true);
  const licenseService = new LicenseService();

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const facilityId = "facility-1"; // In real app, get from context/params
      const response = await fetch(
        `/api/facility/licenses?facilityId=${facilityId}&includeCompliance=true`,
      );
      const result = await response.json();

      if (result.success && result.data) {
        setLicenses(result.data.licenses || []);
      } else {
        // Fallback to empty array
        setLicenses([]);
      }
    } catch (error) {
      console.error("Error loading licenses:", error);
      // Fallback to empty array on error
      setLicenses([]);
    } finally {
      setLoading(false);
    }
  };

  // Legacy mock data function (kept for reference, not used)
  const getMockLicenses = (): FacilityLicense[] => [
    {
      id: "1",
      facilityId: "facility-1",
      licenseType: "business",
      licenseNumber: "BL-2024-001",
      issuingAuthority: "Ministry of Commerce",
      issueDate: new Date("2024-01-15"),
      expiryDate: new Date("2025-01-15"),
      status: "active",
      // category: 'Commercial', // Removed - not in type
      // description: 'Commercial business license', // Removed - not in type
      documents: ["license-certificate.pdf", "commercial-registration.pdf"],
      fees: [],
      requirements: [],
      renewalReminderDays: 30,
      compliance: { isCompliant: true, complianceScore: 95 },
      notes: "License active and compliant",
      metadata: {},
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      facilityId: "facility-1",
      licenseType: "operational",
      licenseNumber: "OL-2024-002",
      issuingAuthority: "Municipality",
      issueDate: new Date("2024-03-01"),
      expiryDate: new Date("2025-03-01"),
      status: "active",
      category: "Operations",
      description: "Operating permit",
      documents: ["operating-permit.pdf"],
      fees: [],
      requirements: [],
      renewalReminderDays: 30,
      compliance: { isCompliant: true, complianceScore: 88 },
      notes: "Valid operating permit",
      metadata: {},
      createdAt: new Date("2024-03-01"),
      updatedAt: new Date("2024-03-01"),
    },
    {
      id: "3",
      facilityId: "facility-2",
      licenseType: "environmental",
      licenseNumber: "EL-2023-045",
      issuingAuthority: "Ministry of Environment",
      issueDate: new Date("2023-06-10"),
      expiryDate: new Date("2024-06-10"),
      status: "expired",
      category: "Environmental",
      description: "Environmental permit",
      documents: ["environmental-permit.pdf"],
      fees: [],
      requirements: [],
      renewalReminderDays: 30,
      compliance: { isCompliant: false, complianceScore: 0 },
      notes: "License expired, renewal required",
      metadata: {},
      createdAt: new Date("2023-06-10"),
      updatedAt: new Date("2024-06-10"),
    },
    {
      id: "4",
      facilityId: "facility-1",
      licenseType: "fire-safety",
      licenseNumber: "FS-2024-003",
      issuingAuthority: "Civil Defense",
      issueDate: new Date("2024-05-20"),
      expiryDate: new Date("2025-05-20"),
      status: "active",
      category: "Safety",
      description: "Fire safety certificate",
      documents: ["fire-safety-cert.pdf", "inspection-report.pdf"],
      fees: [],
      requirements: [],
      renewalReminderDays: 30,
      compliance: { isCompliant: true, complianceScore: 92 },
      notes: "Fire safety compliance verified",
      metadata: {},
      createdAt: new Date("2024-05-20"),
      updatedAt: new Date("2024-05-20"),
    },
  ];

  const filteredLicenses =
    filter === "all" ? licenses : licenses.filter((l) => l.status === filter);

  const stats = {
    total: licenses.length,
    active: licenses.filter((l) => l.status === "active").length,
    expired: licenses.filter((l) => l.status === "expired").length,
    pending: licenses.filter(
      (l) => l.status === "under-review" || l.status === "pending-renewal",
    ).length,
    expiringSoon: licenses.filter((l) => {
      if (l.status !== "active" || !l.expiryDate) return false;
      const expiry = new Date(l.expiryDate);
      const now = new Date();
      const daysUntilExpiry = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
    }).length,
  };

  const statusDistribution = [
    { name: "Active", value: stats.active, color: "#10b981" },
    { name: "Pending", value: stats.pending, color: "#f59e0b" },
    { name: "Expired", value: stats.expired, color: "#ef4444" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "expired":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "suspended":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "✓ Active";
      case "pending":
        return "⏳ Pending";
      case "expired":
        return "⚠ Expired";
      case "suspended":
        return "⛔ Suspended";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <PageTemplate title="Licenses & Permits" icon="ri-file-paper-2-line">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Licenses & Permits"
      description="Track and manage facility licenses, permits, and certifications"
      icon="ri-file-paper-2-line"
      stats={[
        {
          label: "Total Licenses",
          value: stats.total,
          icon: "ri-file-list-line",
          tooltip: "Total licenses and permits",
        },
        {
          label: "Active",
          value: stats.active,
          icon: "ri-checkbox-circle-line",
          tooltip: "Active licenses",
        },
        {
          label: "Expiring Soon",
          value: stats.expiringSoon,
          icon: "ri-alert-line",
          tooltip: "Licenses expiring in next 90 days",
        },
        {
          label: "Expired",
          value: stats.expired,
          icon: "ri-close-circle-line",
          tooltip: "Expired licenses",
        },
      ]}
      actions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium transition-colors"
        >
          <i className="ri-add-line mr-2"></i>
          Add License
        </button>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        {(
          ["all", "active", "under-review", "expired", "suspended"] as const
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
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
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
            <BarChart
              data={Array.from(
                licenses.reduce((acc, l) => {
                  acc.set(
                    l.issuingAuthority,
                    (acc.get(l.issuingAuthority) || 0) + 1,
                  );
                  return acc;
                }, new Map<string, number>()),
              ).map(([authority, count]) => ({ authority, count }))}
            >
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

      {/* Licenses Table */}
      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">
            Licenses & Permits
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  License Number
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Issuing Authority
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Expiry Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Compliance Score
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredLicenses.map((license) => (
                <tr
                  key={license.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-white font-mono">
                    {license.licenseNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {license.licenseType.replace("-", " ")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {license.issuingAuthority}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(license.status)}`}
                    >
                      {getStatusBadge(license.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {license.expiryDate
                      ? format(new Date(license.expiryDate), "MMM dd, yyyy")
                      : "N/A"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (license.compliance?.complianceScore ?? 0) >= 80
                              ? "bg-green-500"
                              : (license.compliance?.complianceScore ?? 0) >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width: `${license.compliance?.complianceScore ?? 0}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-300 w-12">
                        {license.compliance?.complianceScore ?? 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedLicense(license);
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

      {/* Detail Modal */}
      {showDetailModal && selectedLicense && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`License ${selectedLicense.licenseNumber}`}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300">
                License Type
              </label>
              <p className="text-white">
                {selectedLicense.licenseType.replace("-", " ")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Issuing Authority
              </label>
              <p className="text-white">{selectedLicense.issuingAuthority}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Category
              </label>
              <p className="text-white">{selectedLicense.category || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Description
              </label>
              <p className="text-white">
                {selectedLicense.description || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Status
              </label>
              <p className="text-white">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(selectedLicense.status)}`}
                >
                  {getStatusBadge(selectedLicense.status)}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Issue Date
              </label>
              <p className="text-white">
                {format(new Date(selectedLicense.issueDate), "MMMM dd, yyyy")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Expiry Date
              </label>
              <p className="text-white">
                {format(new Date(selectedLicense.expiryDate), "MMMM dd, yyyy")}
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
                        (selectedLicense.compliance?.complianceScore ?? 0) >= 80
                          ? "bg-green-500"
                          : (selectedLicense.compliance?.complianceScore ??
                                0) >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{
                        width: `${selectedLicense.compliance?.complianceScore ?? 0}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-white font-semibold w-16">
                    {selectedLicense.compliance?.complianceScore ?? 0}%
                  </span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Documents
              </label>
              <ul className="list-disc list-inside text-white mt-1">
                {selectedLicense.documents.map((doc, idx) => (
                  <li key={idx} className="text-gray-300">
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
            {selectedLicense.notes && (
              <div>
                <label className="text-sm font-medium text-gray-300">
                  Notes
                </label>
                <p className="text-white">{selectedLicense.notes}</p>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors">
                View Documents
              </button>
              {selectedLicense.status === "expired" && (
                <button className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-medium transition-colors">
                  Renew License
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Add New License"
        >
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              License management form coming soon. For now, licenses can be
              managed through the Facility Management dashboard.
            </p>
            <button
              onClick={() => {
                window.location.href = "/facility/dashboard";
                setShowCreateModal(false);
              }}
              className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors"
            >
              Go to Facility Dashboard
            </button>
          </div>
        </Modal>
      )}
    </PageTemplate>
  );
}

export default function LicensesPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Facility Licenses"
          description="Manage facility licenses, permits, and regulatory documents"
          icon="ri-file-paper-line"
        >
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">
                Error Loading Licenses
              </h2>
              <p className="text-gray-500">
                Something went wrong. Please refresh the page.
              </p>
            </div>
          </div>
        </PageTemplate>
      }
    >
      <LicensesContent />
    </ErrorBoundary>
  );
}

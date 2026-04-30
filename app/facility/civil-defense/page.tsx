"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { format } from "date-fns";
import { civilDefenseService } from "@/lib/services/trade-compliance/civilDefenseService";
import { fireSafetyService } from "@/lib/services/wms/fireSafetyService";
import type { CivilDefenseLicense } from "@/types/trade-compliance";
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

function CivilDefenseContent() {
  const [licenses, setLicenses] = useState<CivilDefenseLicense[]>([]);
  const [selectedLicense, setSelectedLicense] =
    useState<CivilDefenseLicense | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "APPLIED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "EXPIRED"
  >("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    setLoading(true);
    try {
      // In real app, fetch from API
      // For now, use mock data based on service structure
      const mockLicenses: CivilDefenseLicense[] = [
        {
          id: "1",
          licenseNumber: "CD-2024-ABC123",
          applicantName: "ABC Chemicals Ltd.",
          chemicalName: "Sodium Hydroxide",
          hazardClass: "CORROSIVE",
          quantity: 5000,
          unit: "kg",
          storageLocation: "Warehouse A - Zone 3",
          purpose: "Manufacturing process",
          applicationDate: "2024-01-15",
          status: "APPROVED",
          issueDate: "2024-02-01",
          expiryDate: "2025-02-01",
          inspectionDate: "2024-01-25",
          inspectionResult: "PASSED",
          requiredDocuments: ["MSDS", "Storage Plan", "Safety Certificate"],
          submittedDocuments: ["MSDS", "Storage Plan", "Safety Certificate"],
          notes: "License approved after successful inspection",
        },
        {
          id: "2",
          licenseNumber: "CD-2024-XYZ789",
          applicantName: "XYZ Manufacturing",
          chemicalName: "Acetone",
          hazardClass: "FLAMMABLE",
          quantity: 2000,
          unit: "L",
          storageLocation: "Warehouse B - Zone 1",
          purpose: "Cleaning and degreasing",
          applicationDate: "2024-11-20",
          status: "UNDER_REVIEW",
          requiredDocuments: ["MSDS", "Storage Plan", "Fire Safety Plan"],
          submittedDocuments: ["MSDS", "Storage Plan"],
          notes: "Awaiting fire safety plan submission",
        },
        {
          id: "3",
          licenseNumber: "CD-2023-DEF456",
          applicantName: "DEF Industries",
          chemicalName: "Hydrochloric Acid",
          hazardClass: "CORROSIVE",
          quantity: 3000,
          unit: "L",
          storageLocation: "Warehouse C - Zone 2",
          purpose: "Industrial cleaning",
          applicationDate: "2023-06-10",
          status: "EXPIRED",
          issueDate: "2023-07-01",
          expiryDate: "2024-07-01",
          inspectionDate: "2023-06-25",
          inspectionResult: "PASSED",
          requiredDocuments: ["MSDS", "Storage Plan", "Safety Certificate"],
          submittedDocuments: ["MSDS", "Storage Plan", "Safety Certificate"],
          notes: "License expired, renewal required",
        },
      ];

      setLicenses(mockLicenses);
    } catch (error) {
      // Error handled - licenses array remains empty or uses fallback
      setLicenses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLicenses =
    filter === "all" ? licenses : licenses.filter((l) => l.status === filter);

  const stats = {
    total: licenses.length,
    approved: licenses.filter((l) => l.status === "APPROVED").length,
    underReview: licenses.filter((l) => l.status === "UNDER_REVIEW").length,
    rejected: licenses.filter((l) => l.status === "REJECTED").length,
    expired: licenses.filter((l) => l.status === "EXPIRED").length,
  };

  const statusDistribution = [
    { name: "Approved", value: stats.approved, color: "#10b981" },
    { name: "Under Review", value: stats.underReview, color: "#f59e0b" },
    { name: "Rejected", value: stats.rejected, color: "#ef4444" },
    { name: "Expired", value: stats.expired, color: "#6b7280" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "UNDER_REVIEW":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "REJECTED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "EXPIRED":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "APPLIED":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "✓ Approved";
      case "UNDER_REVIEW":
        return "⏳ Under Review";
      case "REJECTED":
        return "✗ Rejected";
      case "EXPIRED":
        return "⚠ Expired";
      case "APPLIED":
        return "📝 Applied";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Civil Defense"
        icon="ri-fire-line"
        description="Civil Defense license management and compliance tracking"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Civil Defense"
      description="Fire safety compliance, Civil Defense license management, and inspection tracking"
      icon="ri-fire-line"
      stats={[
        {
          label: "Total Licenses",
          value: stats.total,
          icon: "ri-file-list-line",
          tooltip: "Total Civil Defense licenses",
        },
        {
          label: "Approved",
          value: stats.approved,
          icon: "ri-checkbox-circle-line",
          tooltip: "Approved licenses",
        },
        {
          label: "Under Review",
          value: stats.underReview,
          icon: "ri-time-line",
          tooltip: "Licenses under review",
        },
        {
          label: "Expiring Soon",
          value: licenses.filter((l) => {
            if (!l.expiryDate) return false;
            const expiry = new Date(l.expiryDate);
            const now = new Date();
            const daysUntilExpiry = Math.ceil(
              (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );
            return (
              daysUntilExpiry <= 90 &&
              daysUntilExpiry > 0 &&
              l.status === "APPROVED"
            );
          }).length,
          icon: "ri-alert-line",
          tooltip: "Licenses expiring in next 90 days",
        },
      ]}
      actions={
        <button
          onClick={() => setShowApplicationModal(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium transition-colors"
        >
          <i className="ri-add-line mr-2"></i>
          Apply for License
        </button>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        {(
          [
            "all",
            "APPLIED",
            "UNDER_REVIEW",
            "APPROVED",
            "REJECTED",
            "EXPIRED",
          ] as const
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
            {f === "all" ? "All" : f.replace(/_/g, " ")}
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
            Hazard Class Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                {
                  hazard: "Corrosive",
                  count: licenses.filter((l) => l.hazardClass === "CORROSIVE")
                    .length,
                },
                {
                  hazard: "Flammable",
                  count: licenses.filter((l) => l.hazardClass === "FLAMMABLE")
                    .length,
                },
                {
                  hazard: "Toxic",
                  count: licenses.filter((l) => l.hazardClass === "TOXIC")
                    .length,
                },
                {
                  hazard: "Other",
                  count: licenses.filter(
                    (l) =>
                      !["CORROSIVE", "FLAMMABLE", "TOXIC"].includes(
                        l.hazardClass,
                      ),
                  ).length,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hazard" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                }}
              />
              <Bar dataKey="count" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Licenses Table */}
      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">
            Civil Defense Licenses
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
                  Applicant
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Chemical
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Hazard Class
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Expiry Date
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
                    {license.applicantName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {license.chemicalName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {license.hazardClass}
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
                Applicant
              </label>
              <p className="text-white">{selectedLicense.applicantName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Chemical
              </label>
              <p className="text-white">{selectedLicense.chemicalName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Hazard Class
              </label>
              <p className="text-white">{selectedLicense.hazardClass}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Quantity
              </label>
              <p className="text-white">
                {selectedLicense.quantity} {selectedLicense.unit}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Storage Location
              </label>
              <p className="text-white">{selectedLicense.storageLocation}</p>
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
            {selectedLicense.issueDate && (
              <div>
                <label className="text-sm font-medium text-gray-300">
                  Issue Date
                </label>
                <p className="text-white">
                  {format(new Date(selectedLicense.issueDate), "MMMM dd, yyyy")}
                </p>
              </div>
            )}
            {selectedLicense.expiryDate && (
              <div>
                <label className="text-sm font-medium text-gray-300">
                  Expiry Date
                </label>
                <p className="text-white">
                  {format(
                    new Date(selectedLicense.expiryDate),
                    "MMMM dd, yyyy",
                  )}
                </p>
              </div>
            )}
            {selectedLicense.inspectionDate && (
              <div>
                <label className="text-sm font-medium text-gray-300">
                  Inspection Date
                </label>
                <p className="text-white">
                  {format(
                    new Date(selectedLicense.inspectionDate),
                    "MMMM dd, yyyy",
                  )}
                </p>
              </div>
            )}
            {selectedLicense.inspectionResult && (
              <div>
                <label className="text-sm font-medium text-gray-300">
                  Inspection Result
                </label>
                <p className="text-white">{selectedLicense.inspectionResult}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-300">
                Required Documents
              </label>
              <ul className="list-disc list-inside text-white mt-1">
                {selectedLicense.requiredDocuments.map((doc, idx) => (
                  <li
                    key={idx}
                    className={
                      selectedLicense.submittedDocuments.includes(doc)
                        ? "text-green-400"
                        : "text-yellow-400"
                    }
                  >
                    {doc}{" "}
                    {selectedLicense.submittedDocuments.includes(doc)
                      ? "✓"
                      : "⏳"}
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
              {selectedLicense.status === "EXPIRED" && (
                <button className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-medium transition-colors">
                  Renew License
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Application Modal */}
      {showApplicationModal && (
        <Modal
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          title="Apply for Civil Defense License"
        >
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Use the Trade Compliance module to apply for Civil Defense
              licenses for chemical products.
            </p>
            <button
              onClick={() => {
                window.location.href =
                  "/trade-compliance/licenses/civil-defense";
                setShowApplicationModal(false);
              }}
              className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors"
            >
              Go to Trade Compliance → Civil Defense
            </button>
          </div>
        </Modal>
      )}
    </PageTemplate>
  );
}

export default function CivilDefensePage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Civil Defense"
          description="Fire safety compliance, Civil Defense license management, and inspection tracking"
          icon="ri-fire-line"
        >
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">
                Error Loading Civil Defense
              </h2>
              <p className="text-gray-500">
                Something went wrong. Please refresh the page.
              </p>
            </div>
          </div>
        </PageTemplate>
      }
    >
      <CivilDefenseContent />
    </ErrorBoundary>
  );
}

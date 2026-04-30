"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import { format } from "date-fns";
import { AbaladyAdapter } from "@/lib/adapters/facility/abaladyAdapter";
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
import { useNotifications } from "@/lib/utils/notifications";
import { NotificationPatterns } from "@/lib/utils/notifications";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface BusinessLicense {
  id: string;
  licenseNumber: string;
  businessType: string;
  ownerName: string;
  ownerId: string;
  issueDate: string;
  expiryDate: string;
  status: "active" | "expired" | "suspended" | "renewal-pending";
  registrationNumber?: string;
  facilityAddress: string;
  city: string;
  complianceScore: number;
}

function AbaladyContent() {
  const notifications = useNotifications();
  const [licenses, setLicenses] = useState<BusinessLicense[]>([]);
  const [selectedLicense, setSelectedLicense] =
    useState<BusinessLicense | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "active" | "expired" | "suspended" | "renewal-pending"
  >("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLicenses();
    checkConfiguration();
  }, []);

  const checkConfiguration = () => {
    // In real app, check if Abalady adapter is configured
    const configured = localStorage.getItem("abalady-configured") === "true";
    setIsConfigured(configured);
  };

  const loadLicenses = async () => {
    setLoading(true);
    try {
      // In real app, fetch from API
      const mockLicenses: BusinessLicense[] = [
        {
          id: "1",
          licenseNumber: "BL-2024-001",
          businessType: "Warehouse & Logistics",
          ownerName: "ABC Logistics Company",
          ownerId: "CR-1234567890",
          issueDate: "2024-01-15",
          expiryDate: "2025-01-15",
          status: "active",
          registrationNumber: "CR-1234567890",
          facilityAddress: "Industrial Area, Block 5",
          city: "Riyadh",
          complianceScore: 95,
        },
        {
          id: "2",
          licenseNumber: "BL-2024-002",
          businessType: "Commercial Trading",
          ownerName: "XYZ Trading LLC",
          ownerId: "CR-0987654321",
          issueDate: "2024-03-01",
          expiryDate: "2025-03-01",
          status: "active",
          registrationNumber: "CR-0987654321",
          facilityAddress: "Business District, Tower A",
          city: "Jeddah",
          complianceScore: 88,
        },
        {
          id: "3",
          licenseNumber: "BL-2023-045",
          businessType: "Manufacturing",
          ownerName: "DEF Manufacturing",
          ownerId: "CR-1122334455",
          issueDate: "2023-06-10",
          expiryDate: "2024-06-10",
          status: "expired",
          registrationNumber: "CR-1122334455",
          facilityAddress: "Industrial Zone 2",
          city: "Dammam",
          complianceScore: 0,
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
    active: licenses.filter((l) => l.status === "active").length,
    expired: licenses.filter((l) => l.status === "expired").length,
    suspended: licenses.filter((l) => l.status === "suspended").length,
    expiringSoon: licenses.filter((l) => {
      if (l.status !== "active") return false;
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
    { name: "Expired", value: stats.expired, color: "#ef4444" },
    { name: "Suspended", value: stats.suspended, color: "#f59e0b" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "expired":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "suspended":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "renewal-pending":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "✓ Active";
      case "expired":
        return "⚠ Expired";
      case "suspended":
        return "⛔ Suspended";
      case "renewal-pending":
        return "🔄 Renewal Pending";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Abalady Integration"
        icon="ri-government-line"
        description="Business License Management and Compliance"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Abalady Integration"
      description="Municipality integration for business licenses, commercial registration, and facility permits"
      icon="ri-government-line"
      stats={[
        {
          label: "Total Licenses",
          value: stats.total,
          icon: "ri-file-list-line",
          tooltip: "Total business licenses",
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
        <div className="flex gap-2">
          {!isConfigured && (
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white text-sm font-medium transition-colors"
            >
              <i className="ri-settings-3-line mr-2"></i>
              Configure
            </button>
          )}
          <button
            onClick={() => {
              notifications.info(
                "Sync with Abalady",
                "Synchronizing business licenses with Abalady platform...",
                { duration: 4000 },
              );
            }}
            disabled={!isConfigured}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="ri-refresh-line mr-2"></i>
            Sync
          </button>
        </div>
      }
    >
      {!isConfigured && (
        <div className="mb-6 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <i className="ri-alert-line text-yellow-400"></i>
            <h3 className="font-semibold text-yellow-400">
              Abalady Integration Not Configured
            </h3>
          </div>
          <p className="text-yellow-300 text-sm mb-3">
            Configure Abalady API credentials to enable automatic license
            synchronization and management.
          </p>
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white text-sm font-medium transition-colors"
          >
            Configure Integration
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        {(
          ["all", "active", "expired", "suspended", "renewal-pending"] as const
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
            {f === "all"
              ? "All"
              : f.replace("-", " ").charAt(0).toUpperCase() +
                f.replace("-", " ").slice(1)}
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
          <h3 className="text-lg font-semibold text-white mb-4">By City</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={Array.from(
                licenses.reduce((acc, l) => {
                  acc.set(l.city, (acc.get(l.city) || 0) + 1);
                  return acc;
                }, new Map<string, number>()),
              ).map(([city, count]) => ({ city, count }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="city" stroke="#9ca3af" />
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
            Business Licenses
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
                  Business Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Owner
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  City
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
                    {license.businessType}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {license.ownerName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {license.city}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(license.status)}`}
                    >
                      {getStatusBadge(license.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {format(new Date(license.expiryDate), "MMM dd, yyyy")}
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
                Business Type
              </label>
              <p className="text-white">{selectedLicense.businessType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Owner</label>
              <p className="text-white">{selectedLicense.ownerName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Commercial Registration
              </label>
              <p className="text-white font-mono">
                {selectedLicense.registrationNumber || selectedLicense.ownerId}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Address
              </label>
              <p className="text-white">
                {selectedLicense.facilityAddress}, {selectedLicense.city}
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
                        selectedLicense.complianceScore >= 80
                          ? "bg-green-500"
                          : selectedLicense.complianceScore >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${selectedLicense.complianceScore}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-semibold w-16">
                    {selectedLicense.complianceScore}%
                  </span>
                </div>
              </div>
            </div>
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

      {/* Configuration Modal */}
      {showConfigModal && (
        <Modal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          title="Configure Abalady Integration"
        >
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Configure Abalady API credentials to enable automatic license
              synchronization.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Endpoint
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                placeholder="https://api.abalady.gov.sa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                placeholder="Enter API key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Environment
              </label>
              <select className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                <option value="sandbox">Sandbox</option>
                <option value="production">Production</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  localStorage.setItem("abalady-configured", "true");
                  setIsConfigured(true);
                  setShowConfigModal(false);
                  notifications.success(
                    NotificationPatterns.saveSuccess("Configuration").title,
                    NotificationPatterns.saveSuccess("Configuration").message,
                    NotificationPatterns.saveSuccess("Configuration"),
                  );
                }}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors"
              >
                Save Configuration
              </button>
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </PageTemplate>
  );
}

export default function AbaladyPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Abalady Integration"
          description="Saudi Ministry of Commerce business license management"
          icon="ri-government-line"
        >
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">
                Error Loading Abalady Data
              </h2>
              <p className="text-gray-500">
                Something went wrong. Please refresh the page.
              </p>
            </div>
          </div>
        </PageTemplate>
      }
    >
      <AbaladyContent />
    </ErrorBoundary>
  );
}

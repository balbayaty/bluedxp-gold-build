/**
 * QHSE Incident Management Page - ENHANCED
 * Comprehensive incident reporting, investigation, and management
 * With tabs, search, filters, charts, and cross-module interconnections
 */

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlus,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiLink2,
  FiBarChart,
  FiCalendar,
} from "react-icons/fi";
import type { Incident } from "@/types/qhse";
import CrossModuleLinks, {
  CrossModuleLink,
} from "@/components/qhse/CrossModuleLinks";
import { getQHSEIncidentLinks } from "@/utils/moduleInterconnectivity";
import UniversalQRGenerator from "@/components/qr/UniversalQRGenerator";
import QRCodeBadge from "@/components/qr/QRCodeBadge";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";

function QHSEIncidentsPageContent() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "open" | "critical" | "trends"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );

  useEffect(() => {
    fetchIncidents();
  }, [activeTab, severityFilter, statusFilter]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      let url = "/api/qhse/incidents";
      const params = new URLSearchParams();

      if (activeTab === "open") {
        params.append(
          "status",
          "REPORTED,UNDER_INVESTIGATION,INVESTIGATION_COMPLETE",
        );
      } else if (activeTab === "critical") {
        params.append("severity", "CRITICAL,HIGH");
      }

      if (severityFilter !== "all") {
        params.append("severity", severityFilter);
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (params.toString()) {
        url += "?" + params.toString();
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        let filtered = data.data || [];

        // Apply search filter
        if (searchQuery) {
          filtered = filtered.filter(
            (incident: Incident) =>
              incident.title
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              incident.incidentNumber
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              incident.description
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()),
          );
        }

        setIncidents(filtered);
      } else {
        setError(data.error || "Failed to load incidents");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery !== undefined) {
      fetchIncidents();
    }
  }, [searchQuery]);

  const getSeverityColor = (severity: Incident["severity"]) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-300";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "LOW":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status: Incident["status"]) => {
    switch (status) {
      case "REPORTED":
        return "bg-blue-100 text-blue-800";
      case "UNDER_INVESTIGATION":
        return "bg-yellow-100 text-yellow-800";
      case "INVESTIGATION_COMPLETE":
        return "bg-purple-100 text-purple-800";
      case "CORRECTIVE_ACTION_REQUIRED":
        return "bg-orange-100 text-orange-800";
      case "CLOSED":
        return "bg-green-100 text-green-800";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCrossModuleLinks = (incident: Incident): CrossModuleLink[] => {
    const links = getQHSEIncidentLinks(incident.id, {
      materialNumber: incident.materialNumber,
      locationCode: incident.locationCode,
      employeeId: incident.reportedBy,
    });

    return links.map((link) => ({
      label: link.label,
      href: link.href,
      description: link.description,
      icon: link.icon,
    }));
  };

  const stats = {
    total: incidents.length,
    open: incidents.filter(
      (i) => i.status !== "CLOSED" && i.status !== "ARCHIVED",
    ).length,
    critical: incidents.filter((i) => i.severity === "CRITICAL").length,
    underInvestigation: incidents.filter(
      (i) => i.status === "UNDER_INVESTIGATION",
    ).length,
    closed: incidents.filter((i) => i.status === "CLOSED").length,
    bySeverity: {
      CRITICAL: incidents.filter((i) => i.severity === "CRITICAL").length,
      HIGH: incidents.filter((i) => i.severity === "HIGH").length,
      MEDIUM: incidents.filter((i) => i.severity === "MEDIUM").length,
      LOW: incidents.filter((i) => i.severity === "LOW").length,
    },
  };

  if (loading && incidents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading incidents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Incident Management
          </h1>
          <p className="text-gray-600 mt-1">
            Report, investigate, and manage safety incidents
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/qhse/incidents/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            Report New Incident
          </Link>
          <Link
            href="/qhse/bulk"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            Bulk Operations
          </Link>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <FiDownload className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total}
              </p>
            </div>
            <FiAlertTriangle className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Open</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {stats.open}
              </p>
            </div>
            <FiClock className="w-8 h-8 text-orange-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Critical</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.critical}
              </p>
            </div>
            <FiAlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Investigating</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {stats.underInvestigation}
              </p>
            </div>
            <FiClock className="w-8 h-8 text-yellow-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Closed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.closed}
              </p>
            </div>
            <FiCheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {
                  incidents.filter((i) => {
                    const date = new Date(i.occurredAt);
                    const now = new Date();
                    return (
                      date.getMonth() === now.getMonth() &&
                      date.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </p>
            </div>
            <FiCalendar className="w-8 h-8 text-purple-500" />
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: "all", label: "All Incidents", icon: FiBarChart },
              { id: "open", label: "Open", icon: FiClock },
              { id: "critical", label: "Critical", icon: FiAlertTriangle },
              { id: "trends", label: "Trends", icon: FiTrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search incidents by title, number, or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                showFilters
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <FiFilter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Severity
                    </label>
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="all">All Severities</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="all">All Statuses</option>
                      <option value="REPORTED">Reported</option>
                      <option value="UNDER_INVESTIGATION">
                        Under Investigation
                      </option>
                      <option value="INVESTIGATION_COMPLETE">
                        Investigation Complete
                      </option>
                      <option value="CORRECTIVE_ACTION_REQUIRED">
                        Action Required
                      </option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSeverityFilter("all");
                        setStatusFilter("all");
                        setSearchQuery("");
                      }}
                      className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trends Tab */}
          {activeTab === "trends" && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Incident Trends
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-500">Last 7 Days</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {
                      incidents.filter((i) => {
                        const date = new Date(i.occurredAt);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return date >= weekAgo;
                      }).length
                    }
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-500">Last 30 Days</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {
                      incidents.filter((i) => {
                        const date = new Date(i.occurredAt);
                        const monthAgo = new Date();
                        monthAgo.setDate(monthAgo.getDate() - 30);
                        return date >= monthAgo;
                      }).length
                    }
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-500">By Severity</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Critical:</span>
                      <span className="font-semibold text-red-600">
                        {stats.bySeverity.CRITICAL}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>High:</span>
                      <span className="font-semibold text-orange-600">
                        {stats.bySeverity.HIGH}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Medium:</span>
                      <span className="font-semibold text-yellow-600">
                        {stats.bySeverity.MEDIUM}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Low:</span>
                      <span className="font-semibold text-blue-600">
                        {stats.bySeverity.LOW}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-500">Avg Resolution Time</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">N/A</p>
                  <p className="text-xs text-gray-500 mt-1">Days</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Incidents Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Incident #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {incidents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <FiAlertTriangle className="w-12 h-12 text-gray-400 mb-4" />
                          <p className="text-gray-500">No incidents found</p>
                          <Link
                            href="/qhse/incidents/new"
                            className="mt-4 text-blue-600 hover:text-blue-800"
                          >
                            Report your first incident
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    incidents.map((incident) => (
                      <motion.tr
                        key={incident.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedIncident(incident)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {incident.incidentNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {incident.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {incident.type.replace(/_/g, " ")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(incident.severity)}`}
                          >
                            {incident.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(incident.status)}`}
                          >
                            {incident.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(incident.occurredAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <QRCodeBadge
                              entityId={incident.id}
                              entityType="incident"
                              entityName={incident.incidentNumber}
                              documentType="report"
                              documentUrl={`/qhse/incidents/${incident.id}`}
                              module="qhse"
                              size="sm"
                            />
                            <Link
                              href={`/qhse/incidents/${incident.id}`}
                              className="text-blue-600 hover:text-blue-900"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View
                            </Link>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code & Cross-Module Links */}
      {selectedIncident && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6 border border-cyan-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <i className="ri-qr-code-line text-cyan-500"></i>
              QR Code
            </h3>
            <UniversalQRGenerator
              entityId={selectedIncident.id}
              entityType="incident"
              entityName={selectedIncident.incidentNumber}
              documentType="report"
              documentUrl={`/qhse/incidents/${selectedIncident.id}`}
              module="qhse"
              showAdvanced={false}
            />
          </div>
          <CrossModuleLinks
            title="Related Modules & Actions"
            links={getCrossModuleLinks(selectedIncident)}
          />
        </div>
      )}

      {/* Default Cross-Module Links */}
      {!selectedIncident && (
        <CrossModuleLinks
          title="Quick Navigation"
          links={[
            {
              label: "QHSE Dashboard",
              href: "/qhse/dashboard",
              icon: "ri-dashboard-3-line",
              description: "Overview",
            },
            {
              label: "Inspections",
              href: "/qhse/inspections",
              icon: "ri-clipboard-line",
              description: "View inspections",
            },
            {
              label: "Training",
              href: "/qhse/training",
              icon: "ri-graduation-cap-line",
              description: "Training records",
            },
            {
              label: "Calendar",
              href: "/qhse/calendar",
              icon: "ri-calendar-line",
              description: "View calendar",
            },
            {
              label: "Approvals",
              href: "/qhse/approvals",
              icon: "ri-check-double-line",
              description: "Pending approvals",
            },
            {
              label: "Search",
              href: "/qhse/search",
              icon: "ri-search-line",
              description: "Advanced search",
            },
          ]}
        />
      )}
    </div>
  );
}

export default function QHSEIncidentsPage() {
  return (
    <ErrorBoundary>
      <QHSEIncidentsPageContent />
    </ErrorBoundary>
  );
}

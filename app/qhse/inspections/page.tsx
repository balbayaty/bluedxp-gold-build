/**
 * QHSE Inspections & Audits Page - ENHANCED
 * Comprehensive inspection scheduling, conducting, and tracking
 * With tabs, calendar integration, checklist builder, and cross-module links
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
  FiCalendar,
  FiClipboard,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiBarChart,
  FiLink2,
} from "react-icons/fi";
import type { Inspection } from "@/types/qhse";
import CrossModuleLinks, {
  CrossModuleLink,
} from "@/components/qhse/CrossModuleLinks";
import { getQHSEInspectionLinks } from "@/utils/moduleInterconnectivity";

export default function QHSEInspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "scheduled" | "completed" | "overdue" | "calendar"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInspection, setSelectedInspection] =
    useState<Inspection | null>(null);

  useEffect(() => {
    fetchInspections();
  }, [activeTab, typeFilter, statusFilter]);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      let url = "/api/qhse/inspections";
      const params = new URLSearchParams();

      if (activeTab === "scheduled") {
        params.append("status", "SCHEDULED");
      } else if (activeTab === "completed") {
        params.append("status", "COMPLETED");
      } else if (activeTab === "overdue") {
        params.append("status", "OVERDUE");
      }

      if (typeFilter !== "all") {
        params.append("type", typeFilter);
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

        if (searchQuery) {
          filtered = filtered.filter(
            (inspection: Inspection) =>
              inspection.title
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              inspection.inspectionNumber
                .toLowerCase()
                .includes(searchQuery.toLowerCase()),
          );
        }

        setInspections(filtered);
      } else {
        setError(data.error || "Failed to load inspections");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load inspections",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery !== undefined) {
      fetchInspections();
    }
  }, [searchQuery]);

  const getStatusColor = (status: Inspection["status"]) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCrossModuleLinks = (inspection: Inspection): CrossModuleLink[] => {
    const links = getQHSEInspectionLinks(inspection.id, {
      materialNumber: inspection.materialNumber,
      locationCode: inspection.locationCode,
    });

    return links.map((link) => ({
      label: link.label,
      href: link.href,
      description: link.description,
      icon: link.icon,
    }));
  };

  const stats = {
    total: inspections.length,
    scheduled: inspections.filter((i) => i.status === "SCHEDULED").length,
    completed: inspections.filter((i) => i.status === "COMPLETED").length,
    overdue: inspections.filter((i) => i.status === "OVERDUE").length,
    inProgress: inspections.filter((i) => i.status === "IN_PROGRESS").length,
    avgCompliance:
      inspections.filter((i) => i.complianceScore !== undefined).length > 0
        ? Math.round(
            inspections
              .filter((i) => i.complianceScore !== undefined)
              .reduce((sum, i) => sum + (i.complianceScore || 0), 0) /
              inspections.filter((i) => i.complianceScore !== undefined).length,
          )
        : 0,
  };

  if (loading && inspections.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inspections...</p>
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
            Inspections & Audits
          </h1>
          <p className="text-gray-600 mt-1">
            Schedule, conduct, and track inspections
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/qhse/inspections/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            Schedule Inspection
          </Link>
          <Link
            href="/qhse/calendar"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <FiCalendar className="w-4 h-4" />
            Calendar View
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
            <FiClipboard className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Scheduled</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.scheduled}
              </p>
            </div>
            <FiCalendar className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.completed}
              </p>
            </div>
            <FiCheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.overdue}
              </p>
            </div>
            <FiAlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {stats.inProgress}
              </p>
            </div>
            <FiClock className="w-8 h-8 text-yellow-500" />
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
              <p className="text-sm font-medium text-gray-500">
                Avg Compliance
              </p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {stats.avgCompliance}%
              </p>
            </div>
            <FiBarChart className="w-8 h-8 text-purple-500" />
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: "all", label: "All Inspections", icon: FiBarChart },
              { id: "scheduled", label: "Scheduled", icon: FiCalendar },
              { id: "completed", label: "Completed", icon: FiCheckCircle },
              { id: "overdue", label: "Overdue", icon: FiAlertCircle },
              { id: "calendar", label: "Calendar View", icon: FiCalendar },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === "calendar") {
                      window.location.href = "/qhse/calendar";
                    } else {
                      setActiveTab(tab.id as any);
                    }
                  }}
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
                placeholder="Search inspections by title, number, or type..."
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
                      Type
                    </label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="all">All Types</option>
                      <option value="SAFETY">Safety</option>
                      <option value="ENVIRONMENTAL">Environmental</option>
                      <option value="QUALITY">Quality</option>
                      <option value="COMPLIANCE">Compliance</option>
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
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="OVERDUE">Overdue</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setTypeFilter("all");
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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Inspections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inspections.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <FiClipboard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No inspections found</p>
                <Link
                  href="/qhse/inspections/new"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Schedule your first inspection
                </Link>
              </div>
            ) : (
              inspections.map((inspection) => (
                <motion.div
                  key={inspection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition cursor-pointer"
                  onClick={() => setSelectedInspection(inspection)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {inspection.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {inspection.inspectionNumber}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(inspection.status)}`}
                    >
                      {inspection.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="text-gray-900 font-medium">
                        {inspection.type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Scheduled:</span>
                      <span className="text-gray-900">
                        {new Date(
                          inspection.scheduledDate,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    {inspection.complianceScore !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Compliance:</span>
                        <span
                          className={`font-semibold ${
                            inspection.complianceScore >= 90
                              ? "text-green-600"
                              : inspection.complianceScore >= 70
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {inspection.complianceScore}%
                        </span>
                      </div>
                    )}
                    {inspection.totalFindings !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Findings:</span>
                        <span className="text-gray-900">
                          {inspection.totalFindings} total
                          {inspection.criticalFindings ? (
                            <span className="text-red-600 ml-1">
                              ({inspection.criticalFindings} critical)
                            </span>
                          ) : (
                            ""
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t flex items-center justify-between">
                    <Link
                      href={`/qhse/inspections/${inspection.id}`}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Details
                      <FiLink2 className="w-4 h-4" />
                    </Link>
                    {inspection.status === "SCHEDULED" && (
                      <Link
                        href={`/qhse/calendar?inspection=${inspection.id}`}
                        className="text-purple-600 hover:text-purple-900 text-sm font-medium flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FiCalendar className="w-4 h-4" />
                        Calendar
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cross-Module Links */}
      {selectedInspection && (
        <CrossModuleLinks
          title="Related Modules & Actions"
          links={getCrossModuleLinks(selectedInspection)}
        />
      )}

      {/* Default Cross-Module Links */}
      {!selectedInspection && (
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
              label: "Calendar",
              href: "/qhse/calendar",
              icon: "ri-calendar-line",
              description: "View calendar",
            },
            {
              label: "Incidents",
              href: "/qhse/incidents",
              icon: "ri-error-warning-line",
              description: "View incidents",
            },
            {
              label: "Training",
              href: "/qhse/training",
              icon: "ri-graduation-cap-line",
              description: "Training records",
            },
            {
              label: "Checklist Builder",
              href: "/qhse/inspections?tab=checklists",
              icon: "ri-file-list-3-line",
              description: "Manage checklists",
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

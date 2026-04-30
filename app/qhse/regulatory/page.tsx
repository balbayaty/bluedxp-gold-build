/**
 * QHSE Regulatory Compliance Page - ENHANCED
 * Comprehensive regulatory audits and compliance tracking
 * With tabs, compliance scores, upcoming audits, and cross-module links
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FiSearch,
  FiDownload,
  FiPlus,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiBarChart,
  FiCalendar,
  FiTarget,
  FiTrendingUp,
} from "react-icons/fi";
import type { RegulatoryAudit } from "@/types/qhse";
import CrossModuleLinks from "@/components/qhse/CrossModuleLinks";

export default function QHSERegulatoryPage() {
  const [audits, setAudits] = useState<RegulatoryAudit[]>([]);
  const [upcoming, setUpcoming] = useState<RegulatoryAudit[]>([]);
  const [complianceScore, setComplianceScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "upcoming" | "completed" | "standards" | "trends"
  >("overview");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [auditsRes, upcomingRes, scoreRes] = await Promise.all([
        fetch("/api/qhse/regulatory"),
        fetch("/api/qhse/regulatory?action=upcoming"),
        fetch("/api/qhse/regulatory?action=compliance-score"),
      ]);

      const auditsData = await auditsRes.json();
      const upcomingData = await upcomingRes.json();
      const scoreData = await scoreRes.json();

      if (auditsData.success) setAudits(auditsData.data || []);
      if (upcomingData.success) setUpcoming(upcomingData.data || []);
      if (scoreData.success)
        setComplianceScore(scoreData.data?.complianceScore);
    } catch (err) {
      console.error("Error fetching regulatory data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: RegulatoryAudit["status"]) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const stats = {
    total: audits.length,
    upcoming: upcoming.length,
    completed: audits.filter((a) => a.status === "COMPLETED").length,
    inProgress: audits.filter((a) => a.status === "IN_PROGRESS").length,
    scheduled: audits.filter((a) => a.status === "SCHEDULED").length,
    avgScore:
      audits.filter((a) => a.score !== undefined).length > 0
        ? Math.round(
            audits
              .filter((a) => a.score !== undefined)
              .reduce((sum, a) => sum + (a.score || 0), 0) /
              audits.filter((a) => a.score !== undefined).length,
          )
        : 0,
  };

  const filteredAudits = searchQuery
    ? audits.filter(
        (a) =>
          a.auditNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.regulatoryStandard
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      )
    : audits;

  if (loading && audits.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading regulatory data...</p>
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
            Regulatory Compliance
          </h1>
          <p className="text-gray-600 mt-1">
            Manage regulatory audits and track compliance
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <FiPlus className="w-4 h-4" />
            Schedule Audit
          </button>
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
          className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Compliance Score
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  complianceScore !== null && complianceScore >= 90
                    ? "text-green-600"
                    : complianceScore !== null && complianceScore >= 70
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {complianceScore !== null ? complianceScore : "N/A"}%
              </p>
            </div>
            <FiTarget className="w-8 h-8 text-purple-500" />
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
              <p className="text-sm font-medium text-gray-500">Total Audits</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total}
              </p>
            </div>
            <FiFileText className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Upcoming</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.upcoming}
              </p>
            </div>
            <FiCalendar className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
              <p className="text-sm font-medium text-gray-500">Avg Score</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {stats.avgScore}%
              </p>
            </div>
            <FiBarChart className="w-8 h-8 text-purple-500" />
          </div>
        </motion.div>
      </div>

      {/* Compliance Score Banner */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Overall Compliance Score
            </h2>
            <p className="text-gray-600 mt-1">
              Based on recent audits and findings
            </p>
          </div>
          <div className="text-right">
            <p
              className={`text-5xl font-bold ${
                complianceScore !== null && complianceScore >= 90
                  ? "text-green-600"
                  : complianceScore !== null && complianceScore >= 70
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {complianceScore !== null ? complianceScore : "N/A"}%
            </p>
            <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${
                  complianceScore !== null && complianceScore >= 90
                    ? "bg-green-600"
                    : complianceScore !== null && complianceScore >= 70
                      ? "bg-yellow-600"
                      : "bg-red-600"
                }`}
                style={{ width: `${complianceScore || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: "overview", label: "Overview", icon: FiBarChart },
              { id: "upcoming", label: "Upcoming", icon: FiCalendar },
              { id: "completed", label: "Completed", icon: FiCheckCircle },
              { id: "standards", label: "Standards", icon: FiFileText },
              { id: "trends", label: "Trends", icon: FiTrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              const badge =
                tab.id === "upcoming" && stats.upcoming > 0
                  ? stats.upcoming
                  : undefined;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm relative ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {badge && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audits by number or standard..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Trends Tab */}
          {activeTab === "trends" && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Compliance Trends
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-500">Compliance Trend</p>
                  <div className="flex items-center gap-2 mt-2">
                    <FiTrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-lg font-bold text-green-600">
                      +3.2%
                    </span>
                    <span className="text-sm text-gray-500">
                      vs last quarter
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-500">Audits Completed</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-gray-900">
                      {stats.completed}
                    </span>
                    <span className="text-sm text-gray-500">this year</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-500">Avg Audit Score</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-gray-900">
                      {stats.avgScore}%
                    </span>
                    <span className="text-sm text-gray-500">overall</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Tab */}
          {activeTab === "upcoming" && (
            <div className="space-y-4 mb-6">
              {upcoming.length === 0 ? (
                <div className="text-center py-12">
                  <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No upcoming audits</p>
                </div>
              ) : (
                upcoming.map((audit) => (
                  <motion.div
                    key={audit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-4 rounded-r-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {audit.auditNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {audit.regulatoryStandard.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Scheduled:{" "}
                          {new Date(audit.scheduledDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(audit.status)}`}
                      >
                        {audit.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* All Audits Table */}
          {(activeTab === "overview" ||
            activeTab === "completed" ||
            activeTab === "standards") && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Audit #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Standard
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAudits.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No audits found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredAudits
                        .filter((a) => {
                          if (activeTab === "completed")
                            return a.status === "COMPLETED";
                          if (activeTab === "standards") return true;
                          return true;
                        })
                        .map((audit) => (
                          <motion.tr
                            key={audit.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {audit.auditNumber}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {audit.regulatoryStandard.replace(/_/g, " ")}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {audit.auditType.replace(/_/g, " ")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(audit.status)}`}
                              >
                                {audit.status.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {audit.score !== undefined ? (
                                <span
                                  className={`font-semibold ${
                                    audit.score >= 90
                                      ? "text-green-600"
                                      : audit.score >= 70
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                  }`}
                                >
                                  {audit.score}%
                                </span>
                              ) : (
                                "N/A"
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(
                                audit.scheduledDate,
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link
                                href={`/qhse/regulatory/${audit.id}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View
                              </Link>
                            </td>
                          </motion.tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cross-Module Links */}
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
            label: "ISO-IMS Module",
            href: "/iso-ims",
            icon: "ri-file-search-line",
            description: "ISO management",
          },
          {
            label: "NCR Management",
            href: "/ncr-management",
            icon: "ri-alert-line",
            description: "Non-conformances",
          },
          {
            label: "Calendar",
            href: "/qhse/calendar",
            icon: "ri-calendar-line",
            description: "View calendar",
          },
          {
            label: "Search",
            href: "/qhse/search",
            icon: "ri-search-line",
            description: "Advanced search",
          },
        ]}
      />
    </div>
  );
}

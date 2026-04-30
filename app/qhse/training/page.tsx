/**
 * QHSE Training & Compliance Page - ENHANCED
 * Comprehensive training program management and compliance tracking
 * With tabs, expiry alerts, compliance tracking, and cross-module links
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
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiBarChart,
  FiCalendar,
  FiUser,
  FiTrendingUp,
} from "react-icons/fi";
import type { TrainingProgram, TrainingRecord } from "@/types/qhse";
import CrossModuleLinks, {
  CrossModuleLink,
} from "@/components/qhse/CrossModuleLinks";
import { getQHSETrainingLinks } from "@/utils/moduleInterconnectivity";
import { PremiumLoader } from "@/components/loading";

export default function QHSETrainingPage() {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "programs" | "records" | "compliance" | "expiring"
  >("programs");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TrainingRecord | null>(
    null,
  );

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (activeTab === "programs") {
        const response = await fetch("/api/qhse/training?type=programs");
        const data = await response.json();
        if (data.success) {
          setPrograms(data.data || []);
        }
      } else if (activeTab === "records") {
        const response = await fetch("/api/qhse/training?type=records");
        const data = await response.json();
        if (data.success) {
          setRecords(data.data || []);
        }
      } else if (activeTab === "expiring") {
        const response = await fetch(
          "/api/qhse/training?type=records&filter=expiring",
        );
        const data = await response.json();
        if (data.success) {
          setRecords(data.data || []);
        }
      } else {
        // Compliance tab - fetch both
        const [programsRes, recordsRes] = await Promise.all([
          fetch("/api/qhse/training?type=programs"),
          fetch("/api/qhse/training?type=records"),
        ]);
        const programsData = await programsRes.json();
        const recordsData = await recordsRes.json();
        if (programsData.success) setPrograms(programsData.data || []);
        if (recordsData.success) setRecords(recordsData.data || []);
      }
    } catch (err) {
      console.error("Error fetching training data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: TrainingRecord["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "NOT_STARTED":
        return "bg-gray-100 text-gray-800";
      case "EXPIRED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCrossModuleLinks = (record: TrainingRecord): CrossModuleLink[] => {
    const links = getQHSETrainingLinks(record.id, {
      employeeId: record.employeeId,
      programId: record.trainingProgramId,
    });

    return links.map((link) => ({
      label: link.label,
      href: link.href,
      description: link.description,
      icon: link.icon,
    }));
  };

  const isExpiring = (record: TrainingRecord) => {
    if (!record.certificationExpiryDate) return false;
    const expiry = new Date(record.certificationExpiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (record: TrainingRecord) => {
    if (!record.certificationExpiryDate) return false;
    return new Date(record.certificationExpiryDate) < new Date();
  };

  const stats = {
    totalPrograms: programs.length,
    totalRecords: records.length,
    completed: records.filter((r) => r.status === "COMPLETED").length,
    inProgress: records.filter((r) => r.status === "IN_PROGRESS").length,
    expired: records.filter((r) => isExpired(r)).length,
    expiring: records.filter((r) => isExpiring(r)).length,
    complianceRate:
      records.length > 0
        ? Math.round(
            (records.filter((r) => r.status === "COMPLETED" && !isExpired(r))
              .length /
              records.length) *
              100,
          )
        : 0,
  };

  const filteredRecords = searchQuery
    ? records.filter(
        (r) =>
          r.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.trainingProgram?.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      )
    : records;

  const filteredPrograms = searchQuery
    ? programs.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.programNumber.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : programs;

  if (loading && programs.length === 0 && records.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#111827] to-[#0f172a]">
        <PremiumLoader
          message="Loading training & compliance data..."
          size="xl"
          variant="default"
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Training & Compliance
          </h1>
          <p className="text-gray-600 mt-1">
            Manage training programs and track compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/qhse/training/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            Create Program
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
              <p className="text-sm font-medium text-gray-500">Programs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalPrograms}
              </p>
            </div>
            <FiBookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
          transition={{ delay: 0.2 }}
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
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Expired</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.expired}
              </p>
            </div>
            <FiAlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Expiring</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {stats.expiring}
              </p>
            </div>
            <FiAlertTriangle className="w-8 h-8 text-orange-500" />
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
              <p className="text-sm font-medium text-gray-500">Compliance</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {stats.complianceRate}%
              </p>
            </div>
            <FiTrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: "programs", label: "Training Programs", icon: FiBookOpen },
              { id: "records", label: "Training Records", icon: FiUser },
              {
                id: "compliance",
                label: "Compliance Overview",
                icon: FiBarChart,
              },
              { id: "expiring", label: "Expiring Soon", icon: FiAlertTriangle },
            ].map((tab) => {
              const Icon = tab.icon;
              const badge =
                tab.id === "expiring" && stats.expiring > 0
                  ? stats.expiring
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
                    <span className="ml-1 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
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
                placeholder={
                  activeTab === "programs"
                    ? "Search programs by name or number..."
                    : "Search records by employee or program..."
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Programs Tab */}
          {activeTab === "programs" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPrograms.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <FiBookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    No training programs found
                  </p>
                  <Link
                    href="/qhse/training/new"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Create your first program
                  </Link>
                </div>
              ) : (
                filteredPrograms.map((program) => (
                  <motion.div
                    key={program.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {program.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {program.programNumber}
                        </p>
                      </div>
                      {program.isMandatory && (
                        <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                          Mandatory
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {program.description}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span className="text-gray-900 font-medium">
                          {program.type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Delivery:</span>
                        <span className="text-gray-900">
                          {program.deliveryMethod.replace(/_/g, " ")}
                        </span>
                      </div>
                      {program.duration && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Duration:</span>
                          <span className="text-gray-900">
                            {program.duration} minutes
                          </span>
                        </div>
                      )}
                      {program.certificationValidityDays && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Valid for:</span>
                          <span className="text-gray-900">
                            {program.certificationValidityDays} days
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Records Tab */}
          {activeTab === "records" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Program
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Expiry
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          No training records found
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((record) => (
                        <motion.tr
                          key={record.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            isExpired(record)
                              ? "bg-red-50"
                              : isExpiring(record)
                                ? "bg-orange-50"
                                : ""
                          }`}
                          onClick={() => setSelectedRecord(record)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.employeeName || record.employeeId}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {record.trainingProgram?.name || "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}
                            >
                              {record.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${record.progress || 0}%` }}
                                ></div>
                              </div>
                              <span>{record.progress || 0}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.dueDate
                              ? new Date(record.dueDate).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {record.certificationExpiryDate ? (
                              <span
                                className={`font-semibold ${
                                  isExpired(record)
                                    ? "text-red-600"
                                    : isExpiring(record)
                                      ? "text-orange-600"
                                      : "text-gray-900"
                                }`}
                              >
                                {new Date(
                                  record.certificationExpiryDate,
                                ).toLocaleDateString()}
                                {isExpired(record) && " (Expired)"}
                                {isExpiring(record) && " (Expiring Soon)"}
                              </span>
                            ) : (
                              "N/A"
                            )}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === "compliance" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">
                    Total Programs
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.totalPrograms}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">
                    Completed Records
                  </h3>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {stats.completed}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">
                    Compliance Rate
                  </h3>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {stats.complianceRate}%
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Compliance by Program
                </h3>
                <div className="space-y-4">
                  {programs.map((program) => {
                    const programRecords = records.filter(
                      (r) => r.trainingProgramId === program.id,
                    );
                    const completed = programRecords.filter(
                      (r) => r.status === "COMPLETED" && !isExpired(r),
                    ).length;
                    const rate =
                      programRecords.length > 0
                        ? Math.round((completed / programRecords.length) * 100)
                        : 0;
                    return (
                      <div
                        key={program.id}
                        className="border-b border-gray-200 pb-4 last:border-0"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900">
                            {program.name}
                          </span>
                          <span
                            className={`font-semibold ${
                              rate >= 90
                                ? "text-green-600"
                                : rate >= 70
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {rate}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              rate >= 90
                                ? "bg-green-600"
                                : rate >= 70
                                  ? "bg-yellow-600"
                                  : "bg-red-600"
                            }`}
                            style={{ width: `${rate}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {completed} of {programRecords.length} completed
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Expiring Tab */}
          {activeTab === "expiring" && (
            <div className="space-y-4">
              {filteredRecords.filter((r) => isExpiring(r) || isExpired(r))
                .length === 0 ? (
                <div className="text-center py-12">
                  <FiCheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No expiring or expired certifications
                  </p>
                </div>
              ) : (
                filteredRecords
                  .filter((r) => isExpiring(r) || isExpired(r))
                  .map((record) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white rounded-lg shadow border-l-4 p-6 ${
                        isExpired(record)
                          ? "border-red-500"
                          : "border-orange-500"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {record.employeeName || record.employeeId}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {record.trainingProgram?.name || "Unknown Program"}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">
                                Expiry Date:
                              </span>
                              <span
                                className={`ml-2 font-semibold ${
                                  isExpired(record)
                                    ? "text-red-600"
                                    : "text-orange-600"
                                }`}
                              >
                                {record.certificationExpiryDate
                                  ? new Date(
                                      record.certificationExpiryDate,
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </span>
                            </div>
                            {record.certificationExpiryDate && (
                              <div>
                                <span className="text-gray-500">
                                  Days Remaining:
                                </span>
                                <span
                                  className={`ml-2 font-semibold ${
                                    isExpired(record)
                                      ? "text-red-600"
                                      : "text-orange-600"
                                  }`}
                                >
                                  {isExpired(record)
                                    ? "Expired"
                                    : Math.ceil(
                                        (new Date(
                                          record.certificationExpiryDate,
                                        ).getTime() -
                                          new Date().getTime()) /
                                          (1000 * 60 * 60 * 24),
                                      )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 text-sm font-semibold rounded-full ${
                            isExpired(record)
                              ? "bg-red-100 text-red-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {isExpired(record) ? "Expired" : "Expiring Soon"}
                        </span>
                      </div>
                    </motion.div>
                  ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cross-Module Links */}
      {selectedRecord && (
        <CrossModuleLinks
          title="Related Modules & Actions"
          links={getCrossModuleLinks(selectedRecord)}
        />
      )}

      {/* Default Cross-Module Links */}
      {!selectedRecord && (
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
              label: "HR Module",
              href: "/hr/employees",
              icon: "ri-user-line",
              description: "Employee records",
            },
            {
              label: "Incidents",
              href: "/qhse/incidents",
              icon: "ri-error-warning-line",
              description: "View incidents",
            },
            {
              label: "Inspections",
              href: "/qhse/inspections",
              icon: "ri-clipboard-line",
              description: "View inspections",
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
      )}
    </div>
  );
}

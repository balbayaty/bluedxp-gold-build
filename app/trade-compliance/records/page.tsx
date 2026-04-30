/**
 * Trade Compliance Records Page
 * View and manage all trade compliance records
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface TradeComplianceRecordDisplay {
  id: string;
  recordNumber: string;
  tradeDirection: "IMPORT" | "EXPORT" | "RE_EXPORT" | "TRANSIT";
  tradeType: "COMMERCIAL" | "PERSONAL" | "SAMPLE" | "RETURN" | "REPAIR";
  originCountry: string;
  destinationCountry: string;
  productCategory: string;
  status:
    | "DRAFT"
    | "IN_PROGRESS"
    | "PENDING_LICENSE"
    | "APPROVED"
    | "REJECTED"
    | "BLOCKED";
  complianceScore: number;
  createdAt: string;
  updatedAt: string;
}

export default function TradeComplianceRecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<TradeComplianceRecordDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/trade-compliance/records");
      const data = await response.json();

      if (data.success && data.records) {
        // Transform records to display format
        const displayRecords: TradeComplianceRecordDisplay[] = data.records.map(
          (record: any) => ({
            id: record.id,
            recordNumber: `REC-${record.id}`,
            tradeDirection: record.tradeDirection,
            tradeType: record.tradeType,
            originCountry: record.originCountry,
            destinationCountry: record.destinationCountry,
            productCategory: record.products?.[0]?.category || "OTHER",
            status: record.complianceStatus || "DRAFT",
            complianceScore: record.complianceScore || 0,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
          }),
        );
        setRecords(displayRecords);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error("Error loading records:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.recordNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.originCountry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.destinationCountry
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || record.status === statusFilter;
    const matchesDirection =
      directionFilter === "all" || record.tradeDirection === directionFilter;

    return matchesSearch && matchesStatus && matchesDirection;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-500/20 text-green-400";
      case "REJECTED":
        return "bg-red-500/20 text-red-400";
      case "BLOCKED":
        return "bg-red-500/20 text-red-400";
      case "PENDING_LICENSE":
        return "bg-yellow-500/20 text-yellow-400";
      case "IN_PROGRESS":
        return "bg-blue-500/20 text-blue-400";
      case "DRAFT":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "IMPORT":
        return "⬇️";
      case "EXPORT":
        return "⬆️";
      case "RE_EXPORT":
        return "🔄";
      case "TRANSIT":
        return "➡️";
      default:
        return "📦";
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - Following UI/UX Standards */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0 mt-0.5">
                <i className="ri-file-list-line text-white text-lg sm:text-xl"></i>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1.5 sm:mb-2 leading-tight">
                  Trade Compliance Records
                </h1>
                <p className="text-[#9ca3af] text-sm sm:text-base leading-relaxed">
                  View and manage all import/export trade compliance records
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
              <button
                onClick={() => router.push("/trade-compliance/create")}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <i className="ri-file-add-line"></i>
                <span className="hidden sm:inline">Create New Record</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af]"></i>
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING_LICENSE">Pending License</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="BLOCKED">Blocked</option>
            </select>

            {/* Direction Filter */}
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">All Directions</option>
              <option value="IMPORT">Import</option>
              <option value="EXPORT">Export</option>
              <option value="RE_EXPORT">Re-Export</option>
              <option value="TRANSIT">Transit</option>
            </select>
          </div>
        </motion.div>

        {/* Records Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden"
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#9ca3af] text-sm">Loading records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-12 text-center">
              <i className="ri-file-add-line mx-auto text-6xl text-[#6b7280] mb-4 block"></i>
              <h3 className="text-xl font-semibold text-white mb-2">
                No records found
              </h3>
              <p className="text-[#9ca3af] mb-6">
                {records.length === 0
                  ? "Get started by creating your first trade compliance record"
                  : "Try adjusting your filters to see more results"}
              </p>
              {records.length === 0 && (
                <button
                  onClick={() => router.push("/trade-compliance/create")}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors text-sm font-medium"
                >
                  <i className="ri-file-add-line"></i>
                  Create First Record
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Record Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Direction
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Compliance Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
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
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {record.recordNumber}
                        </div>
                        <div className="text-sm text-[#9ca3af]">
                          {record.tradeType}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {getDirectionIcon(record.tradeDirection)}
                          </span>
                          <span className="text-sm text-white">
                            {record.tradeDirection}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {record.originCountry} → {record.destinationCountry}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-white">
                          {record.productCategory}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(record.status)}`}
                        >
                          {record.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/10 rounded-full h-2 max-w-[100px]">
                            <div
                              className={`h-2 rounded-full ${
                                record.complianceScore >= 80
                                  ? "bg-green-500"
                                  : record.complianceScore >= 60
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${record.complianceScore}%` }}
                            />
                          </div>
                          <span className="text-sm text-white">
                            {record.complianceScore}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[#9ca3af]">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/trade-compliance/records/${record.id}`,
                              )
                            }
                            className="text-cyan-400 hover:text-cyan-300 transition-colors"
                            title="View"
                            aria-label="View record"
                          >
                            <i className="ri-eye-line text-xl"></i>
                          </button>
                          <button
                            onClick={() =>
                              router.push(
                                `/trade-compliance/records/${record.id}/edit`,
                              )
                            }
                            className="text-[#9ca3af] hover:text-white transition-colors"
                            title="Edit"
                            aria-label="Edit record"
                          >
                            <i className="ri-edit-line text-xl"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Summary Stats */}
        {filteredRecords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6">
              <div className="text-sm font-medium text-[#9ca3af]">
                Total Records
              </div>
              <div className="text-2xl font-bold text-white">
                {filteredRecords.length}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6">
              <div className="text-sm font-medium text-[#9ca3af]">Approved</div>
              <div className="text-2xl font-bold text-green-400">
                {filteredRecords.filter((r) => r.status === "APPROVED").length}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6">
              <div className="text-sm font-medium text-[#9ca3af]">Pending</div>
              <div className="text-2xl font-bold text-yellow-400">
                {
                  filteredRecords.filter(
                    (r) =>
                      r.status === "PENDING_LICENSE" ||
                      r.status === "IN_PROGRESS",
                  ).length
                }
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6">
              <div className="text-sm font-medium text-[#9ca3af]">Blocked</div>
              <div className="text-2xl font-bold text-red-400">
                {
                  filteredRecords.filter(
                    (r) => r.status === "BLOCKED" || r.status === "REJECTED",
                  ).length
                }
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

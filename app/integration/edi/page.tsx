"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import { format, subHours, subDays } from "date-fns";
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

interface EDITransaction {
  id: string;
  transactionNumber: string;
  documentType: "850" | "855" | "856" | "810" | "997" | "OTHER";
  documentTypeName: string;
  partner: string;
  direction: "INBOUND" | "OUTBOUND";
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "ERROR" | "REJECTED";
  receivedAt?: Date | string;
  processedAt?: Date | string;
  errorMessage?: string;
  recordCount: number;
  processingTime?: number;
}

export default function EDIIntegration() {
  const [transactions, setTransactions] = useState<EDITransaction[]>(() => {
    const docTypes = [
      { type: "850" as const, name: "Purchase Order" },
      { type: "855" as const, name: "PO Acknowledgment" },
      { type: "856" as const, name: "ASN (Advance Ship Notice)" },
      { type: "810" as const, name: "Invoice" },
      { type: "997" as const, name: "Functional Acknowledgment" },
    ];

    return Array.from({ length: 50 }, (_, i) => {
      const docType = docTypes[Math.floor(Math.random() * docTypes.length)];
      const statuses: EDITransaction["status"][] = [
        "SUCCESS",
        "SUCCESS",
        "SUCCESS",
        "PROCESSING",
        "ERROR",
        "REJECTED",
      ];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const receivedAt = subHours(new Date(), Math.floor(Math.random() * 48));

      return {
        id: `edi-${i + 1}`,
        transactionNumber: `EDI-${String(i + 1).padStart(6, "0")}`,
        documentType: docType.type,
        documentTypeName: docType.name,
        partner: `Partner ${String.fromCharCode(65 + (i % 5))}`,
        direction: Math.random() > 0.5 ? "INBOUND" : "OUTBOUND",
        status,
        receivedAt,
        processedAt:
          status === "SUCCESS" ? subHours(receivedAt, -1) : undefined,
        errorMessage:
          status === "ERROR"
            ? "Invalid document format"
            : status === "REJECTED"
              ? "Validation failed"
              : undefined,
        recordCount: Math.floor(Math.random() * 100) + 10,
        processingTime:
          status === "SUCCESS"
            ? Math.floor(Math.random() * 500) + 50
            : undefined,
      };
    });
  });

  const [selectedTransaction, setSelectedTransaction] =
    useState<EDITransaction | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedDocType, setSelectedDocType] = useState<string>("ALL");
  const [selectedDirection, setSelectedDirection] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "overview" | "transactions" | "analytics" | "errors"
  >("overview");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesStatus =
        selectedStatus === "ALL" || t.status === selectedStatus;
      const matchesDocType =
        selectedDocType === "ALL" || t.documentType === selectedDocType;
      const matchesDirection =
        selectedDirection === "ALL" || t.direction === selectedDirection;
      return matchesStatus && matchesDocType && matchesDirection;
    });
  }, [transactions, selectedStatus, selectedDocType, selectedDirection]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [transactions]);

  // Document type distribution
  const docTypeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach((t) => {
      counts[t.documentTypeName] = (counts[t.documentTypeName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [transactions]);

  // Transaction trend (last 24 hours)
  const transactionTrend = useMemo(() => {
    const hourlyData: Record<
      string,
      { hour: string; success: number; error: number; processing: number }
    > = {};

    transactions.forEach((t) => {
      if (t.receivedAt) {
        const hour = format(new Date(t.receivedAt), "HH:00");
        if (!hourlyData[hour]) {
          hourlyData[hour] = { hour, success: 0, error: 0, processing: 0 };
        }
        if (t.status === "SUCCESS") hourlyData[hour].success += 1;
        else if (t.status === "ERROR" || t.status === "REJECTED")
          hourlyData[hour].error += 1;
        else if (t.status === "PROCESSING") hourlyData[hour].processing += 1;
      }
    });

    return Object.values(hourlyData).sort((a, b) =>
      a.hour.localeCompare(b.hour),
    );
  }, [transactions]);

  const aggregateStats = useMemo(() => {
    const total = transactions.length;
    const success = transactions.filter((t) => t.status === "SUCCESS").length;
    const error = transactions.filter(
      (t) => t.status === "ERROR" || t.status === "REJECTED",
    ).length;
    const processing = transactions.filter(
      (t) => t.status === "PROCESSING",
    ).length;
    const successRate = total > 0 ? (success / total) * 100 : 0;
    const avgProcessingTime =
      transactions
        .filter((t) => t.processingTime)
        .reduce((sum, t) => sum + (t.processingTime || 0), 0) /
        transactions.filter((t) => t.processingTime).length || 0;

    return {
      total,
      success,
      error,
      processing,
      successRate,
      avgProcessingTime,
    };
  }, [transactions]);

  const stats = [
    {
      label: "Total Transactions",
      value: aggregateStats.total,
      icon: "ri-file-transfer-line",
      tooltip: "Total EDI transactions",
      trend: "up" as const,
    },
    {
      label: "Success Rate",
      value: `${aggregateStats.successRate.toFixed(1)}%`,
      icon: "ri-checkbox-circle-line",
      tooltip: "Transaction success rate",
      trend: "up" as const,
    },
    {
      label: "Errors",
      value: aggregateStats.error,
      icon: "ri-error-warning-line",
      tooltip: "Failed transactions",
      trend: "down" as const,
    },
    {
      label: "Avg Processing",
      value: `${aggregateStats.avgProcessingTime.toFixed(0)}ms`,
      icon: "ri-time-line",
      tooltip: "Average processing time",
      trend: "down" as const,
    },
  ];

  const handleView = (transaction: EDITransaction) => {
    setSelectedTransaction(transaction);
    setShowViewModal(true);
  };

  return (
    <PageTemplate
      title="EDI Integration"
      description="Electronic Data Interchange transaction tracking, error handling, and analytics"
      icon="ri-file-transfer-line"
      systemInfo={{
        sap: "EDI Integration, Transaction Management",
        oracle: "EDI Management, Document Processing",
        manhattan: "EDI Integration, Transaction Tracking",
      }}
      examples={[
        "EDI transaction processing",
        "Document type tracking (850, 855, 856, 810, 997)",
        "Error handling and retry",
        "Partner management",
        "Transaction analytics",
        "Processing performance",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
          {(["overview", "transactions", "analytics", "errors"] as const).map(
            (mode) => (
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
                  className={`ri-${mode === "overview" ? "dashboard-line" : mode === "transactions" ? "file-list-line" : mode === "analytics" ? "bar-chart-line" : "error-warning-line"} mr-1`}
                ></i>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ),
          )}
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[150px]"
        >
          <option value="ALL">All Statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="PROCESSING">Processing</option>
          <option value="ERROR">Error</option>
          <option value="REJECTED">Rejected</option>
          <option value="PENDING">Pending</option>
        </select>
        <select
          value={selectedDocType}
          onChange={(e) => setSelectedDocType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[200px]"
        >
          <option value="ALL">All Document Types</option>
          <option value="850">850 - Purchase Order</option>
          <option value="855">855 - PO Acknowledgment</option>
          <option value="856">856 - ASN</option>
          <option value="810">810 - Invoice</option>
          <option value="997">997 - Functional Acknowledgment</option>
        </select>
        <select
          value={selectedDirection}
          onChange={(e) => setSelectedDirection(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[150px]"
        >
          <option value="ALL">All Directions</option>
          <option value="INBOUND">Inbound</option>
          <option value="OUTBOUND">Outbound</option>
        </select>
      </div>

      {/* Overview View */}
      {viewMode === "overview" && (
        <div className="space-y-6">
          {/* Status Distribution */}
          <div className="grid md:grid-cols-2 gap-6">
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
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          [
                            "#10b981",
                            "#f59e0b",
                            "#ef4444",
                            "#3b82f6",
                            "#8b5cf6",
                          ][index % 5]
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
                Document Type Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={docTypeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
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
                  <Bar dataKey="count" fill="#06b6d4" name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Transaction Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Transaction Trend (Last 24 Hours)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={transactionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} />
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
                  dataKey="success"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Success"
                />
                <Line
                  type="monotone"
                  dataKey="error"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Error"
                />
                <Line
                  type="monotone"
                  dataKey="processing"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Processing"
                />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Transactions View */}
      {viewMode === "transactions" && (
        <div className="space-y-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Document Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Partner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Direction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Received
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Processing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {transaction.transactionNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {transaction.documentType}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {transaction.documentTypeName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {transaction.partner}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            transaction.direction === "INBOUND"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-purple-500/20 text-purple-400"
                          }`}
                        >
                          {transaction.direction}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            transaction.status === "SUCCESS"
                              ? "bg-green-500/20 text-green-400"
                              : transaction.status === "ERROR" ||
                                  transaction.status === "REJECTED"
                                ? "bg-red-500/20 text-red-400"
                                : transaction.status === "PROCESSING"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {transaction.receivedAt
                            ? format(
                                new Date(transaction.receivedAt),
                                "MMM dd, HH:mm",
                              )
                            : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {transaction.processingTime
                            ? `${transaction.processingTime}ms`
                            : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleView(transaction)}
                          className="px-3 py-1 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                        >
                          <i className="ri-eye-line mr-1"></i>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Processing Performance
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {aggregateStats.avgProcessingTime.toFixed(0)}ms
                </div>
                <div className="text-sm text-[#9ca3af]">
                  Average Processing Time
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {aggregateStats.successRate.toFixed(1)}%
                </div>
                <div className="text-sm text-[#9ca3af]">Success Rate</div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {filteredTransactions
                    .reduce((sum, t) => sum + t.recordCount, 0)
                    .toLocaleString()}
                </div>
                <div className="text-sm text-[#9ca3af]">
                  Total Records Processed
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Errors View */}
      {viewMode === "errors" && (
        <div className="space-y-4">
          {filteredTransactions
            .filter((t) => t.status === "ERROR" || t.status === "REJECTED")
            .map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {transaction.transactionNumber}
                      </h3>
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                        {transaction.status}
                      </span>
                    </div>
                    <div className="text-sm text-[#9ca3af] mb-2">
                      {transaction.documentType} -{" "}
                      {transaction.documentTypeName} | {transaction.partner} |{" "}
                      {transaction.direction}
                    </div>
                    {transaction.errorMessage && (
                      <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg mt-2">
                        <i className="ri-error-warning-line mr-1"></i>
                        {transaction.errorMessage}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleView(transaction)}
                    className="px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </motion.div>
            ))}
        </div>
      )}

      {/* View Transaction Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedTransaction(null);
        }}
        title={`EDI Transaction - ${selectedTransaction?.transactionNumber || ""}`}
        size="lg"
      >
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Transaction Number
                </div>
                <div className="text-white font-medium">
                  {selectedTransaction.transactionNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Document Type</div>
                <div className="text-white font-medium">
                  {selectedTransaction.documentType} -{" "}
                  {selectedTransaction.documentTypeName}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Partner</div>
                <div className="text-white font-medium">
                  {selectedTransaction.partner}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Direction</div>
                <div className="text-white font-medium">
                  {selectedTransaction.direction}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <div
                  className={`text-white font-medium px-2 py-1 rounded inline-block ${
                    selectedTransaction.status === "SUCCESS"
                      ? "bg-green-500/20 text-green-400"
                      : selectedTransaction.status === "ERROR" ||
                          selectedTransaction.status === "REJECTED"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {selectedTransaction.status}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Record Count</div>
                <div className="text-white font-medium">
                  {selectedTransaction.recordCount}
                </div>
              </div>
              {selectedTransaction.receivedAt && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Received At</div>
                  <div className="text-white font-medium">
                    {format(new Date(selectedTransaction.receivedAt), "PPp")}
                  </div>
                </div>
              )}
              {selectedTransaction.processedAt && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Processed At
                  </div>
                  <div className="text-white font-medium">
                    {format(new Date(selectedTransaction.processedAt), "PPp")}
                  </div>
                </div>
              )}
              {selectedTransaction.processingTime && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Processing Time
                  </div>
                  <div className="text-white font-medium">
                    {selectedTransaction.processingTime}ms
                  </div>
                </div>
              )}
            </div>
            {selectedTransaction.errorMessage && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="text-sm font-medium text-red-400 mb-1">
                  Error Message
                </div>
                <div className="text-sm text-white">
                  {selectedTransaction.errorMessage}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}

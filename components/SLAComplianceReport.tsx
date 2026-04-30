// SLA Compliance Report Component
// Comprehensive reporting for SLA compliance metrics

"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ASNData, CustomerSLA, SLAComplianceStatus } from "@/types/asn";
import { format } from "date-fns";
import { getProcessedInboundData } from "@/data/processedInboundData";

interface ComplianceMetrics {
  total: number;
  compliant: number;
  warning: number;
  critical: number;
  notApplicable: number;
  complianceRate: number;
  averageDuration: number;
  targetDuration: number;
}

export default function SLAComplianceReport() {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("ALL");
  const [selectedSLA, setSelectedSLA] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">(
    "30d",
  );

  const processedData = getProcessedInboundData();
  const allASNs = processedData.all;

  // Load SLAs
  const slas = useMemo(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("customer-slas");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  // Filter ASNs based on criteria
  const filteredASNs = useMemo(() => {
    let filtered = allASNs;

    // Filter by customer
    if (selectedCustomer !== "ALL") {
      filtered = filtered.filter(
        (asn) => asn.customerNumber === selectedCustomer,
      );
    }

    // Filter by SLA
    if (selectedSLA !== "ALL") {
      filtered = filtered.filter((asn) => asn.slaId === selectedSLA);
    }

    // Filter by date range
    const now = new Date();
    const dateFilters: Record<string, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
    };

    if (dateRange !== "all" && dateFilters[dateRange]) {
      const daysAgo = dateFilters[dateRange];
      const cutoffDate = new Date(
        now.getTime() - daysAgo * 24 * 60 * 60 * 1000,
      );
      filtered = filtered.filter((asn) => {
        const asnDate = new Date(asn.createdAt);
        return asnDate >= cutoffDate;
      });
    }

    return filtered;
  }, [allASNs, selectedCustomer, selectedSLA, dateRange]);

  // Calculate compliance metrics
  const metrics = useMemo((): ComplianceMetrics => {
    const total = filteredASNs.length;
    if (total === 0) {
      return {
        total: 0,
        compliant: 0,
        warning: 0,
        critical: 0,
        notApplicable: 0,
        complianceRate: 0,
        averageDuration: 0,
        targetDuration: 0,
      };
    }

    const compliant = filteredASNs.filter(
      (asn) => asn.slaComplianceStatus === "COMPLIANT",
    ).length;
    const warning = filteredASNs.filter(
      (asn) => asn.slaComplianceStatus === "WARNING",
    ).length;
    const critical = filteredASNs.filter(
      (asn) => asn.slaComplianceStatus === "CRITICAL",
    ).length;
    const notApplicable = filteredASNs.filter(
      (asn) =>
        asn.slaComplianceStatus === "NOT_APPLICABLE" ||
        !asn.slaComplianceStatus,
    ).length;

    const applicable = total - notApplicable;
    const complianceRate = applicable > 0 ? (compliant / applicable) * 100 : 0;

    const durations = filteredASNs
      .filter((asn) => asn.slaActualDuration !== undefined)
      .map((asn) => asn.slaActualDuration!);
    const averageDuration =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    const targetDurations = filteredASNs
      .filter((asn) => asn.slaTargetDuration !== undefined)
      .map((asn) => asn.slaTargetDuration!);
    const targetDuration =
      targetDurations.length > 0
        ? targetDurations.reduce((a, b) => a + b, 0) / targetDurations.length
        : 0;

    return {
      total,
      compliant,
      warning,
      critical,
      notApplicable,
      complianceRate,
      averageDuration,
      targetDuration,
    };
  }, [filteredASNs]);

  // Get unique customers
  const customers = useMemo(() => {
    const customerSet = new Set<string>();
    allASNs.forEach((asn) => {
      if (asn.customerNumber) {
        customerSet.add(asn.customerNumber);
      }
    });
    return Array.from(customerSet);
  }, [allASNs]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusBadge = (status: SLAComplianceStatus | undefined) => {
    if (!status || status === "NOT_APPLICABLE") {
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
    switch (status) {
      case "COMPLIANT":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "WARNING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "CRITICAL":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          SLA Compliance Report
        </h2>
        <p className="text-[#9ca3af] text-sm">
          Comprehensive SLA compliance metrics and analysis
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[#9ca3af] text-sm font-medium mb-2">
              Customer
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Customers</option>
              {customers.map((customer) => {
                const asn = allASNs.find((a) => a.customerNumber === customer);
                return (
                  <option key={customer} value={customer}>
                    {asn?.customerName || customer}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-[#9ca3af] text-sm font-medium mb-2">
              SLA
            </label>
            <select
              value={selectedSLA}
              onChange={(e) => setSelectedSLA(e.target.value)}
              className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All SLAs</option>
              {slas.map((sla: CustomerSLA) => (
                <option key={sla.id} value={sla.id}>
                  {sla.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[#9ca3af] text-sm font-medium mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1f2937] border border-[#374151] rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#9ca3af] text-sm">Total Documents</span>
            <i className="ri-file-list-3-line text-blue-400 text-xl"></i>
          </div>
          <p className="text-3xl font-bold text-white">{metrics.total}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1f2937] border border-[#374151] rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#9ca3af] text-sm">Compliance Rate</span>
            <i className="ri-checkbox-circle-line text-green-400 text-xl"></i>
          </div>
          <p className="text-3xl font-bold text-white">
            {metrics.complianceRate.toFixed(1)}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1f2937] border border-[#374151] rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#9ca3af] text-sm">Average Duration</span>
            <i className="ri-time-line text-yellow-400 text-xl"></i>
          </div>
          <p className="text-lg font-bold text-white">
            {formatDuration(metrics.averageDuration)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#1f2937] border border-[#374151] rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#9ca3af] text-sm">Target Duration</span>
            <i className="ri-target-line text-blue-400 text-xl"></i>
          </div>
          <p className="text-lg font-bold text-white">
            {formatDuration(metrics.targetDuration)}
          </p>
        </motion.div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Status Breakdown
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {metrics.compliant}
            </div>
            <div className="text-sm text-[#9ca3af]">Compliant</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              {metrics.warning}
            </div>
            <div className="text-sm text-[#9ca3af]">Warning</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400 mb-1">
              {metrics.critical}
            </div>
            <div className="text-sm text-[#9ca3af]">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400 mb-1">
              {metrics.notApplicable}
            </div>
            <div className="text-sm text-[#9ca3af]">N/A</div>
          </div>
        </div>
      </div>

      {/* Detailed List */}
      <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Compliance Details
        </h3>
        <div className="space-y-3">
          {filteredASNs.length === 0 ? (
            <div className="text-center py-8 text-[#9ca3af]">
              No data available for selected filters
            </div>
          ) : (
            filteredASNs.map((asn) => (
              <div
                key={asn.id}
                className="bg-[#111827] border border-[#374151] rounded-lg p-4 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-base font-semibold text-white">
                        {asn.documentNumber}
                      </h4>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                          asn.slaComplianceStatus,
                        )}`}
                      >
                        {asn.slaComplianceStatus || "N/A"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-[#9ca3af]">Customer:</span>
                        <p className="text-white">
                          {asn.customerName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#9ca3af]">SLA:</span>
                        <p className="text-white">
                          {slas.find((s: any) => s.id === asn.slaId)?.name ||
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#9ca3af]">Actual Duration:</span>
                        <p className="text-white">
                          {asn.slaActualDuration
                            ? formatDuration(asn.slaActualDuration)
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#9ca3af]">Target Duration:</span>
                        <p className="text-white">
                          {asn.slaTargetDuration
                            ? formatDuration(asn.slaTargetDuration)
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#9ca3af]">Compliance:</span>
                        <p
                          className={`font-medium ${
                            asn.slaCompliancePercentage !== undefined &&
                            asn.slaCompliancePercentage >= 100
                              ? "text-green-400"
                              : asn.slaCompliancePercentage !== undefined &&
                                  asn.slaCompliancePercentage >= 80
                                ? "text-yellow-400"
                                : "text-red-400"
                          }`}
                        >
                          {asn.slaCompliancePercentage !== undefined
                            ? `${asn.slaCompliancePercentage.toFixed(1)}%`
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    {asn.slaBreachReason && (
                      <div className="mt-2 text-xs text-red-400">
                        {asn.slaBreachReason}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getProcessedInboundData } from "@/data/processedInboundData";
import { format } from "date-fns";
import { ASNData, ASNStatus, OrderStatus } from "@/types/asn";
import ASNDetail from "./ASNDetail";
import { initializeSikaSLAsAndKPIs } from "@/data/sikaSLAs";
import {
  extractTimeFeatures,
  generateMLFeatures,
} from "@/utils/featureEngineering";

export default function ASNPage() {
  const [asns, setAsns] = useState<ASNData[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedASN, setSelectedASN] = useState<ASNData | null>(null);

  // Initialize SIKA SLAs and KPIs on component mount
  useEffect(() => {
    initializeSikaSLAsAndKPIs();
  }, []);

  useEffect(() => {
    // Get processed inbound data with SLA compliance
    const processedData = getProcessedInboundData();
    setAsns(processedData.all);
  }, []);

  const mapToEnterpriseStatus = (status: string): ASNStatus => {
    const statusMap: Record<string, ASNStatus> = {
      pending: "CREATED",
      "in-transit": "IN_TRANSIT",
      delivered: "GR_POSTED",
      delayed: "BLOCKED",
      cancelled: "CANCELLED",
    };
    return statusMap[status.toLowerCase()] || "CREATED";
  };

  const mapProcessStatus = (
    status?: string,
  ): "COMPLETED" | "IN_PROGRESS" | "PENDING" | "ERROR" => {
    if (!status) return "PENDING";
    const statusMap: Record<
      string,
      "COMPLETED" | "IN_PROGRESS" | "PENDING" | "ERROR"
    > = {
      Completed: "COMPLETED",
      "In Progress": "IN_PROGRESS",
      Pending: "PENDING",
    };
    return statusMap[status] || "PENDING";
  };

  const getStatusBadge = (status: ASNStatus | OrderStatus) => {
    const styles: Record<string, string> = {
      CREATED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      SENT: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      ACKNOWLEDGED: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      IN_TRANSIT: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      ARRIVED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      PARTIAL_GR: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      GR_POSTED: "bg-green-500/20 text-green-400 border-green-500/30",
      INVOICED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      COMPLETED: "bg-teal-500/20 text-teal-400 border-teal-500/30",
      CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
      BLOCKED: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      CONFIRMED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      PICK_RELEASED: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      PICKING: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      PICKED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      DISPATCHED: "bg-green-500/20 text-green-400 border-green-500/30",
      DELIVERED: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    };
    return styles[status] || styles.CREATED;
  };

  const getStatusLabel = (status: ASNStatus | OrderStatus): string => {
    const labels: Record<string, string> = {
      CREATED: "Created",
      SENT: "Sent to Vendor",
      ACKNOWLEDGED: "Acknowledged",
      IN_TRANSIT: "In Transit",
      ARRIVED: "Arrived",
      PARTIAL_GR: "Partial GR",
      GR_POSTED: "GR Posted",
      INVOICED: "Invoiced",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      BLOCKED: "Blocked",
      CONFIRMED: "Confirmed",
      PICK_RELEASED: "Pick Released",
      PICKING: "Picking",
      PICKED: "Picked",
      DISPATCHED: "Dispatched",
      DELIVERED: "Delivered",
    };
    return labels[status] || String(status);
  };

  const filteredAsns = asns.filter((asn) => {
    const matchesSearch =
      asn.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asn.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asn.vendorNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asn.purchaseOrderNumber
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      asn.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === "ALL" || asn.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      {/* Page Header - Enterprise Style */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Advanced Shipping Notices
            </h1>
            <p className="text-[#9ca3af] text-base">
              Manage expected receipts and inbound deliveries
            </p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-base font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20">
            <i className="ri-add-line text-lg"></i>
            Create ASN
          </button>
        </div>

        {/* Enterprise Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[300px] max-w-md">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
            <input
              type="text"
              placeholder="Search by Document Number, Vendor, PO Number, Tracking..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1f2937] border border-[#374151] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[180px] cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="CREATED">Created</option>
            <option value="SENT">Sent to Vendor</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="ARRIVED">Arrived</option>
            <option value="PARTIAL_GR">Partial GR</option>
            <option value="GR_POSTED">GR Posted</option>
            <option value="INVOICED">Invoiced</option>
            <option value="COMPLETED">Completed</option>
            <option value="BLOCKED">Blocked</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button className="bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-sm text-white hover:bg-[#374151] transition-colors flex items-center gap-2">
            <i className="ri-filter-line text-sm"></i>
            More Filters
          </button>
        </div>
      </div>

      {/* Recent ASNs Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">ASN Documents</h2>
          <div className="text-sm text-[#9ca3af]">
            Showing{" "}
            <span className="text-white font-medium">
              {filteredAsns.length}
            </span>{" "}
            of <span className="text-white font-medium">{asns.length}</span>{" "}
            documents
          </div>
        </div>

        {/* Empty State */}
        {filteredAsns.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6 bg-[#1f2937] border border-[#374151] rounded-lg"
          >
            <div className="mb-6">
              <i className="ri-file-list-3-line text-8xl text-[#6b7280]"></i>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">
              No ASN Documents Found
            </h3>
            <p className="text-[#9ca3af] text-base mb-8 text-center max-w-md">
              You don't have any Advanced Shipping Notices yet. Create one to
              get started.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-base font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20">
              <i className="ri-add-line text-lg"></i>
              Create Your First ASN
            </button>
          </motion.div>
        )}

        {/* ASN List - Enterprise Style */}
        {filteredAsns.length > 0 && (
          <div className="space-y-4">
            {filteredAsns.map((asn, index) => (
              <motion.div
                key={asn.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#1f2937] border border-[#374151] rounded-lg p-6 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Document Header */}
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {asn.documentNumber}
                        </h3>
                        <p className="text-xs text-[#9ca3af]">
                          ASN Document Number
                        </p>
                      </div>
                      {asn.purchaseOrderNumber && (
                        <div className="border-l border-[#374151] pl-4">
                          <p className="text-sm font-medium text-white mb-1">
                            {asn.purchaseOrderNumber}
                          </p>
                          <p className="text-xs text-[#9ca3af]">
                            Purchase Order
                          </p>
                        </div>
                      )}
                      {asn.materialDocumentNumber && (
                        <div className="border-l border-[#374151] pl-4">
                          <p className="text-sm font-medium text-white mb-1">
                            {asn.materialDocumentNumber}
                          </p>
                          <p className="text-xs text-[#9ca3af]">
                            Material Document
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Vendor Information */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-[#9ca3af] mb-1">
                          Vendor Number
                        </p>
                        <p className="text-sm font-medium text-white">
                          {asn.vendorNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9ca3af] mb-1">
                          Vendor Name
                        </p>
                        <p className="text-sm font-medium text-white">
                          {asn.vendorName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9ca3af] mb-1">Plant</p>
                        <p className="text-sm font-medium text-white">
                          {asn.plant || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9ca3af] mb-1">
                          Storage Location
                        </p>
                        <p className="text-sm font-medium text-white">
                          {asn.storageLocation || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Information */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-3 border-t border-[#374151]">
                      <div>
                        <p className="text-xs text-[#9ca3af] mb-1">
                          Expected Delivery Date
                        </p>
                        <p className="text-sm text-white">
                          {asn.expectedDeliveryDate
                            ? format(
                                new Date(asn.expectedDeliveryDate),
                                "MMM dd, yyyy HH:mm",
                              )
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9ca3af] mb-1">
                          Destination
                        </p>
                        <p className="text-sm text-white">{asn.destination}</p>
                      </div>
                      {asn.trackingNumber && (
                        <div>
                          <p className="text-xs text-[#9ca3af] mb-1">
                            Tracking Number
                          </p>
                          <p className="text-sm text-white font-mono">
                            {asn.trackingNumber}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Document Metadata */}
                    <div className="flex items-center gap-6 pt-3 border-t border-[#374151] text-xs text-[#9ca3af]">
                      <div className="flex items-center gap-2">
                        <i className="ri-user-line"></i>
                        <span>Created by: {asn.createdBy || "SYSTEM"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="ri-time-line"></i>
                        <span>
                          {asn.createdAt
                            ? format(
                                new Date(asn.createdAt),
                                "MMM dd, yyyy HH:mm",
                              )
                            : "N/A"}
                        </span>
                      </div>
                      {asn.transactionCode && (
                        <div className="flex items-center gap-2">
                          <i className="ri-code-line"></i>
                          <span>T-Code: {asn.transactionCode}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-col items-end gap-4 ml-6">
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                          asn.status,
                        )}`}
                      >
                        {getStatusLabel(asn.status)}
                      </span>
                      {asn.slaComplianceStatus && (
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${
                            asn.slaComplianceStatus === "COMPLIANT"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : asn.slaComplianceStatus === "WARNING"
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                : asn.slaComplianceStatus === "CRITICAL"
                                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                                  : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                          }`}
                          title={asn.slaBreachReason || "SLA Compliance Status"}
                        >
                          <i
                            className={`ri-${
                              asn.slaComplianceStatus === "COMPLIANT"
                                ? "checkbox-circle-fill"
                                : asn.slaComplianceStatus === "WARNING"
                                  ? "error-warning-line"
                                  : asn.slaComplianceStatus === "CRITICAL"
                                    ? "close-circle-fill"
                                    : "question-line"
                            } mr-1`}
                          ></i>
                          SLA: {asn.slaComplianceStatus}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedASN(asn)}
                        className="text-[#9ca3af] hover:text-blue-400 transition-colors p-2 hover:bg-[#374151] rounded-lg"
                        title="View Details"
                      >
                        <i className="ri-eye-line text-lg"></i>
                      </button>
                      <button
                        className="text-[#9ca3af] hover:text-green-400 transition-colors p-2 hover:bg-[#374151] rounded-lg"
                        title="Post Goods Receipt"
                      >
                        <i className="ri-checkbox-circle-line text-lg"></i>
                      </button>
                      <button
                        className="text-[#9ca3af] hover:text-yellow-400 transition-colors p-2 hover:bg-[#374151] rounded-lg"
                        title="Edit"
                      >
                        <i className="ri-edit-line text-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ASN Detail Modal */}
      <AnimatePresence>
        {selectedASN && (
          <ASNDetail asn={selectedASN} onClose={() => setSelectedASN(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

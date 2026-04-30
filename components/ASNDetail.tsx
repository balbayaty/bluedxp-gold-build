"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ASNData, CustomerSLA, SLAComplianceStatus } from "@/types/asn";
import { format } from "date-fns";
import {
  calculateOffloadingDuration,
  calculatePutawayDuration,
  calculatePickingDuration,
  calculateQCDuration,
  calculateDispatchingDuration,
  calculateDuration1,
  calculateDuration2,
  calculateTotalProcessingTime,
  calculateDeliveryTime,
} from "@/utils/formulaCalculator";

interface ASNDetailProps {
  asn: ASNData;
  onClose: () => void;
}

export default function ASNDetail({ asn, onClose }: ASNDetailProps) {
  const [slaCompliance, setSlaCompliance] = useState<any>(null);
  const [customerSLAs, setCustomerSLAs] = useState<CustomerSLA[]>([]);

  // Calculate all durations from actual start/end times
  const calculatedDurations = useMemo(() => {
    return {
      offloading: calculateOffloadingDuration(asn),
      putaway: calculatePutawayDuration(asn),
      picking: calculatePickingDuration(asn),
      qc: calculateQCDuration(asn),
      dispatching: calculateDispatchingDuration(asn),
      duration1: calculateDuration1(asn),
      duration2: calculateDuration2(asn),
      total: calculateTotalProcessingTime(asn),
      delivery: calculateDeliveryTime(asn),
    };
  }, [asn]);

  // Check if all required activities are completed
  const allActivitiesCompleted = useMemo(() => {
    if (asn.processType === "INBOUND") {
      return !!(
        asn.offloadingStartTime &&
        asn.offloadingEndTime &&
        asn.putawayStartTime &&
        asn.putawayEndTime &&
        asn.goodsReceiptDate
      );
    } else if (asn.processType === "OUTBOUND") {
      return !!(
        asn.pickingStartTime &&
        asn.pickingEndTime &&
        asn.qcStartTime &&
        asn.qcEndTime &&
        asn.dispatchingStartDate &&
        asn.dispatchingEndTime
      );
    }
    return false;
  }, [asn]);

  const calculateSLACompliance = (asnData: ASNData, sla: CustomerSLA) => {
    try {
      let actualDuration = 0;
      let compliancePercentage = 0;
      let status: SLAComplianceStatus = "NOT_APPLICABLE";
      let breachDetails: string[] = [];

      // Calculate actual duration based on metric using actual start/end times
      if (sla.metric === "delivery_time") {
        actualDuration = calculatedDurations.delivery;
      } else if (sla.metric === "duration1") {
        actualDuration = calculatedDurations.duration1;
      } else if (sla.metric === "duration2") {
        actualDuration = calculatedDurations.duration2;
      } else if (sla.metric === "total") {
        actualDuration = calculatedDurations.total;
      } else if (sla.metric === "processing_time") {
        actualDuration = calculatedDurations.duration1;
      } else if (sla.metric === "custom" && sla.customFormula) {
        // Parse custom formula
        if (sla.customFormula.includes("offloadingDuration")) {
          actualDuration = calculatedDurations.offloading;
        } else if (sla.customFormula.includes("putawayDuration")) {
          actualDuration = calculatedDurations.putaway;
        } else if (sla.customFormula.includes("pickingDuration")) {
          actualDuration = calculatedDurations.picking;
        } else if (sla.customFormula.includes("qcDuration")) {
          actualDuration = calculatedDurations.qc;
        } else if (sla.customFormula.includes("dispatchingDuration")) {
          actualDuration = calculatedDurations.dispatching;
        } else {
          actualDuration = calculatedDurations.duration1;
        }
      }

      if (actualDuration > 0 && sla.targetDuration > 0) {
        compliancePercentage = (sla.targetDuration / actualDuration) * 100;

        if (compliancePercentage >= 100) {
          status = "COMPLIANT";
        } else if (compliancePercentage >= sla.warningThreshold) {
          status = "WARNING";
          breachDetails.push(
            `Actual duration (${formatDuration(actualDuration)}) exceeded ${sla.warningThreshold}% of target (${formatDuration(sla.targetDuration)})`,
          );
        } else {
          status = "CRITICAL";
          breachDetails.push(
            `Actual duration (${formatDuration(actualDuration)}) exceeded target (${formatDuration(sla.targetDuration)})`,
          );
        }
      } else {
        status = "NOT_APPLICABLE";
        breachDetails.push("Missing required time data for calculation");
      }

      // Add activity completion details
      if (!allActivitiesCompleted) {
        if (asn.processType === "INBOUND") {
          if (!asn.offloadingStartTime || !asn.offloadingEndTime) {
            breachDetails.push("Offloading not completed");
          }
          if (!asn.putawayStartTime || !asn.putawayEndTime) {
            breachDetails.push("Putaway not completed");
          }
          if (!asn.goodsReceiptDate) {
            breachDetails.push("Goods Receipt not posted");
          }
        } else if (asn.processType === "OUTBOUND") {
          if (!asn.pickingStartTime || !asn.pickingEndTime) {
            breachDetails.push("Picking not completed");
          }
          if (!asn.qcStartTime || !asn.qcEndTime) {
            breachDetails.push("QC check not completed");
          }
          if (!asn.dispatchingStartDate || !asn.dispatchingEndTime) {
            breachDetails.push("Dispatching not completed");
          }
        }
      }

      setSlaCompliance({
        sla,
        actualDuration,
        compliancePercentage,
        status:
          allActivitiesCompleted && status === "COMPLIANT"
            ? "COMPLIANT"
            : status === "COMPLIANT"
              ? "WARNING"
              : status,
        breachReason:
          breachDetails.length > 0 ? breachDetails.join("; ") : undefined,
        allActivitiesCompleted,
        calculatedDurations,
      });
    } catch (error) {
      console.error("Error calculating SLA compliance:", error);
    }
  };

  useEffect(() => {
    // Load customer SLAs
    const savedSLAs = localStorage.getItem("customer-slas");
    if (savedSLAs) {
      try {
        const slas: CustomerSLA[] = JSON.parse(savedSLAs);
        // Find SLAs for this customer
        const relevantSLAs = slas.filter(
          (sla) => sla.customerNumber === asn.customerNumber && sla.isActive,
        );
        setCustomerSLAs(relevantSLAs);

        // Calculate SLA compliance for all relevant SLAs
        if (relevantSLAs.length > 0) {
          // Try to find the best matching SLA based on conditions
          let matchedSLA = relevantSLAs[0];

          // Prefer SLAs with matching conditions
          for (const sla of relevantSLAs) {
            if (sla.conditions && sla.conditions.length > 0) {
              const matchesConditions = sla.conditions.every((condition) => {
                const fieldValue = (asn as any)[condition.field];
                const conditionValue = condition.value;

                switch (condition.operator) {
                  case "equals":
                    return String(fieldValue) === String(conditionValue);
                  case "not_equals":
                    return String(fieldValue) !== String(conditionValue);
                  case "contains":
                    return String(fieldValue)
                      .toLowerCase()
                      .includes(String(conditionValue).toLowerCase());
                  case "greater_than":
                    return Number(fieldValue) > Number(conditionValue);
                  case "less_than":
                    return Number(fieldValue) < Number(conditionValue);
                  default:
                    return true;
                }
              });

              if (matchesConditions) {
                matchedSLA = sla;
                break;
              }
            }
          }

          calculateSLACompliance(asn, matchedSLA);
        }
      } catch (error) {
        console.error("Error loading SLAs:", error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asn.customerNumber, calculatedDurations, allActivitiesCompleted]);

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

  const getSLAStatusBadge = (status: SLAComplianceStatus) => {
    const styles = {
      COMPLIANT: "bg-green-500/20 text-green-400 border-green-500/30",
      WARNING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30",
      NOT_APPLICABLE: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return styles[status] || styles.NOT_APPLICABLE;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-[#1f2937] border border-[#374151] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#1f2937] border-b border-[#374151] p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              ASN Document Details
            </h2>
            <p className="text-[#9ca3af] text-sm">{asn.documentNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-white transition-colors p-2 hover:bg-[#374151] rounded-lg"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Document Information */}
          <section className="bg-[#111827] border border-[#374151] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <i className="ri-file-list-3-line text-blue-400"></i>
              Document Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[#9ca3af] mb-1">Document Number</p>
                <p className="text-sm font-medium text-white">
                  {asn.documentNumber}
                </p>
              </div>
              {asn.purchaseOrderNumber && (
                <div>
                  <p className="text-xs text-[#9ca3af] mb-1">Purchase Order</p>
                  <p className="text-sm font-medium text-white">
                    {asn.purchaseOrderNumber}
                  </p>
                </div>
              )}
              {asn.materialDocumentNumber && (
                <div>
                  <p className="text-xs text-[#9ca3af] mb-1">
                    Material Document
                  </p>
                  <p className="text-sm font-medium text-white">
                    {asn.materialDocumentNumber}
                  </p>
                </div>
              )}
              {asn.externalReference && (
                <div>
                  <p className="text-xs text-[#9ca3af] mb-1">
                    External Reference
                  </p>
                  <p className="text-sm font-medium text-white">
                    {asn.externalReference}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-[#9ca3af] mb-1">Status</p>
                <p className="text-sm font-medium text-white">{asn.status}</p>
              </div>
              {asn.transactionCode && (
                <div>
                  <p className="text-xs text-[#9ca3af] mb-1">
                    Transaction Code
                  </p>
                  <p className="text-sm font-medium text-white font-mono">
                    {asn.transactionCode}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Vendor Information */}
          <section className="bg-[#111827] border border-[#374151] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <i className="ri-building-line text-blue-400"></i>
              Vendor Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[#9ca3af] mb-1">Vendor Number</p>
                <p className="text-sm font-medium text-white">
                  {asn.vendorNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#9ca3af] mb-1">Vendor Name</p>
                <p className="text-sm font-medium text-white">
                  {asn.vendorName}
                </p>
              </div>
              {asn.carrier && (
                <div>
                  <p className="text-xs text-[#9ca3af] mb-1">Carrier</p>
                  <p className="text-sm font-medium text-white">
                    {asn.carrier}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Delivery Information */}
          <section className="bg-[#111827] border border-[#374151] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <i className="ri-truck-line text-blue-400"></i>
              Delivery Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[#9ca3af] mb-1">
                  Expected Delivery Date
                </p>
                <p className="text-sm font-medium text-white">
                  {asn.expectedDeliveryDate
                    ? format(
                        new Date(asn.expectedDeliveryDate),
                        "MMM dd, yyyy HH:mm",
                      )
                    : "N/A"}
                </p>
              </div>
              {asn.actualDeliveryDate && (
                <div>
                  <p className="text-xs text-[#9ca3af] mb-1">
                    Actual Delivery Date
                  </p>
                  <p className="text-sm font-medium text-white">
                    {format(
                      new Date(asn.actualDeliveryDate),
                      "MMM dd, yyyy HH:mm",
                    )}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-[#9ca3af] mb-1">Destination</p>
                <p className="text-sm font-medium text-white">
                  {asn.destination}
                </p>
              </div>
              {asn.trackingNumber && (
                <div>
                  <p className="text-xs text-[#9ca3af] mb-1">Tracking Number</p>
                  <p className="text-sm font-medium text-white font-mono">
                    {asn.trackingNumber}
                  </p>
                </div>
              )}
              {asn.plant && (
                <div>
                  <p className="text-xs text-[#9ca3af] mb-1">Plant</p>
                  <p className="text-sm font-medium text-white">{asn.plant}</p>
                </div>
              )}
              {asn.storageLocation && (
                <div>
                  <p className="text-xs text-[#9ca3af] mb-1">
                    Storage Location
                  </p>
                  <p className="text-sm font-medium text-white">
                    {asn.storageLocation}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Goods Receipt Information */}
          {asn.goodsReceiptDate && (
            <section className="bg-[#111827] border border-[#374151] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-inbox-line text-green-400"></i>
                Goods Receipt Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {asn.goodsReceiptNumber && (
                  <div>
                    <p className="text-xs text-[#9ca3af] mb-1">GR Number</p>
                    <p className="text-sm font-medium text-white">
                      {asn.goodsReceiptNumber}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-[#9ca3af] mb-1">GR Date</p>
                  <p className="text-sm font-medium text-white">
                    {format(
                      new Date(asn.goodsReceiptDate),
                      "MMM dd, yyyy HH:mm",
                    )}
                  </p>
                </div>
                {asn.receivedBy && (
                  <div>
                    <p className="text-xs text-[#9ca3af] mb-1">Received By</p>
                    <p className="text-sm font-medium text-white">
                      {asn.receivedBy}
                    </p>
                  </div>
                )}
                {asn.receivedQuantity !== undefined && (
                  <div>
                    <p className="text-xs text-[#9ca3af] mb-1">
                      Received Quantity
                    </p>
                    <p className="text-sm font-medium text-white">
                      {asn.receivedQuantity}
                    </p>
                  </div>
                )}
                {asn.receivedWeight !== undefined && (
                  <div>
                    <p className="text-xs text-[#9ca3af] mb-1">
                      Received Weight
                    </p>
                    <p className="text-sm font-medium text-white">
                      {asn.receivedWeight} kg
                    </p>
                  </div>
                )}
                {asn.receivedItems !== undefined && (
                  <div>
                    <p className="text-xs text-[#9ca3af] mb-1">
                      Received Items
                    </p>
                    <p className="text-sm font-medium text-white">
                      {asn.receivedItems}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* SLA Compliance Status */}
          <section className="bg-[#111827] border border-[#374151] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <i className="ri-time-line text-yellow-400"></i>
              SLA Compliance Status
            </h3>
            {slaCompliance ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-semibold text-white">
                    {slaCompliance.sla.name}
                  </h4>
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getSLAStatusBadge(
                      slaCompliance.status,
                    )}`}
                  >
                    {slaCompliance.status === "COMPLIANT" &&
                    slaCompliance.allActivitiesCompleted
                      ? "✅ COMPLIANT - All Activities Received"
                      : slaCompliance.status === "COMPLIANT"
                        ? "⚠️ COMPLIANT - Missing Activities"
                        : String(slaCompliance.status)
                            .replace(/_/g, " ")
                            .toLowerCase()
                            .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                </div>

                {/* Activity Completion Status */}
                <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-4 mb-4">
                  <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <i className="ri-checkbox-circle-line text-blue-400"></i>
                    Activity Completion Status
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {asn.processType === "INBOUND" ? (
                      <>
                        <div className="flex items-center gap-2">
                          <i
                            className={`ri-${asn.offloadingStartTime && asn.offloadingEndTime ? "checkbox-circle-fill text-green-400" : "checkbox-blank-circle-line text-red-400"}`}
                          ></i>
                          <span className="text-sm text-white">
                            Offloading:{" "}
                            {asn.offloadingStartTime && asn.offloadingEndTime
                              ? "Completed"
                              : "Not Completed"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <i
                            className={`ri-${asn.putawayStartTime && asn.putawayEndTime ? "checkbox-circle-fill text-green-400" : "checkbox-blank-circle-line text-red-400"}`}
                          ></i>
                          <span className="text-sm text-white">
                            Putaway:{" "}
                            {asn.putawayStartTime && asn.putawayEndTime
                              ? "Completed"
                              : "Not Completed"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <i
                            className={`ri-${asn.goodsReceiptDate ? "checkbox-circle-fill text-green-400" : "checkbox-blank-circle-line text-red-400"}`}
                          ></i>
                          <span className="text-sm text-white">
                            Goods Receipt:{" "}
                            {asn.goodsReceiptDate ? "Posted" : "Not Posted"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <i
                            className={`ri-${asn.pickingStartTime && asn.pickingEndTime ? "checkbox-circle-fill text-green-400" : "checkbox-blank-circle-line text-red-400"}`}
                          ></i>
                          <span className="text-sm text-white">
                            Picking:{" "}
                            {asn.pickingStartTime && asn.pickingEndTime
                              ? "Completed"
                              : "Not Completed"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <i
                            className={`ri-${asn.qcStartTime && asn.qcEndTime ? "checkbox-circle-fill text-green-400" : "checkbox-blank-circle-line text-red-400"}`}
                          ></i>
                          <span className="text-sm text-white">
                            QC Check:{" "}
                            {asn.qcStartTime && asn.qcEndTime
                              ? "Completed"
                              : "Not Completed"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <i
                            className={`ri-${asn.dispatchingStartDate && asn.dispatchingEndTime ? "checkbox-circle-fill text-green-400" : "checkbox-blank-circle-line text-red-400"}`}
                          ></i>
                          <span className="text-sm text-white">
                            Dispatching:{" "}
                            {asn.dispatchingStartDate && asn.dispatchingEndTime
                              ? "Completed"
                              : "Not Completed"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Compliance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-[#9ca3af] mb-1">
                      SLA Target Duration
                    </p>
                    <p className="text-sm font-medium text-white">
                      {formatDuration(slaCompliance.sla.targetDuration)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9ca3af] mb-1">
                      Actual Duration ({slaCompliance.sla.metric})
                    </p>
                    <p className="text-sm font-medium text-white">
                      {formatDuration(slaCompliance.actualDuration)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9ca3af] mb-1">
                      Compliance Percentage
                    </p>
                    <p
                      className={`text-sm font-medium ${slaCompliance.compliancePercentage >= 100 ? "text-green-400" : slaCompliance.compliancePercentage >= slaCompliance.sla.warningThreshold ? "text-yellow-400" : "text-red-400"}`}
                    >
                      {slaCompliance.compliancePercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Detailed Duration Breakdown */}
                {slaCompliance.calculatedDurations && (
                  <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <i className="ri-time-line text-cyan-400"></i>
                      Calculated Durations (from Start/End Times)
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      {calculatedDurations.offloading > 0 && (
                        <div>
                          <span className="text-[#9ca3af]">Offloading: </span>
                          <span className="text-white font-medium">
                            {formatDuration(calculatedDurations.offloading)}
                          </span>
                        </div>
                      )}
                      {calculatedDurations.putaway > 0 && (
                        <div>
                          <span className="text-[#9ca3af]">Putaway: </span>
                          <span className="text-white font-medium">
                            {formatDuration(calculatedDurations.putaway)}
                          </span>
                        </div>
                      )}
                      {calculatedDurations.picking > 0 && (
                        <div>
                          <span className="text-[#9ca3af]">Picking: </span>
                          <span className="text-white font-medium">
                            {formatDuration(calculatedDurations.picking)}
                          </span>
                        </div>
                      )}
                      {calculatedDurations.qc > 0 && (
                        <div>
                          <span className="text-[#9ca3af]">QC: </span>
                          <span className="text-white font-medium">
                            {formatDuration(calculatedDurations.qc)}
                          </span>
                        </div>
                      )}
                      {calculatedDurations.dispatching > 0 && (
                        <div>
                          <span className="text-[#9ca3af]">Dispatching: </span>
                          <span className="text-white font-medium">
                            {formatDuration(calculatedDurations.dispatching)}
                          </span>
                        </div>
                      )}
                      {calculatedDurations.duration1 > 0 && (
                        <div>
                          <span className="text-[#9ca3af]">Duration 1: </span>
                          <span className="text-white font-medium">
                            {formatDuration(calculatedDurations.duration1)}
                          </span>
                        </div>
                      )}
                      {calculatedDurations.duration2 > 0 && (
                        <div>
                          <span className="text-[#9ca3af]">Duration 2: </span>
                          <span className="text-white font-medium">
                            {formatDuration(calculatedDurations.duration2)}
                          </span>
                        </div>
                      )}
                      {calculatedDurations.total > 0 && (
                        <div>
                          <span className="text-[#9ca3af]">Total: </span>
                          <span className="text-white font-medium">
                            {formatDuration(calculatedDurations.total)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Breach Details */}
                {slaCompliance.breachReason && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                      <i className="ri-error-warning-line"></i>
                      Compliance Issues
                    </h5>
                    <p className="text-sm text-red-300">
                      {slaCompliance.breachReason}
                    </p>
                  </div>
                )}

                {/* Success Message */}
                {slaCompliance.status === "COMPLIANT" &&
                  slaCompliance.allActivitiesCompleted && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                        <i className="ri-checkbox-circle-fill"></i>
                        All Requirements Met
                      </h5>
                      <p className="text-sm text-green-300">
                        All activities completed and within SLA targets.
                      </p>
                    </div>
                  )}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="ri-information-line text-4xl text-[#6b7280] mb-3"></i>
                <p className="text-[#9ca3af] text-sm mb-2">
                  No SLA configured for this customer
                </p>
                <p className="text-[#6b7280] text-xs">
                  Configure customer-specific SLAs in the SLA & KPI Management
                  section
                </p>
              </div>
            )}
          </section>

          {/* Processing Information */}
          {(asn.duration1 || asn.duration2 || asn.personnel) && (
            <section className="bg-[#111827] border border-[#374151] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-settings-3-line text-blue-400"></i>
                Processing Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {asn.duration1 !== undefined && (
                  <div>
                    <p className="text-xs text-[#9ca3af] mb-1">Duration 1</p>
                    <p className="text-sm font-medium text-white">
                      {formatDuration(asn.duration1)}
                    </p>
                  </div>
                )}
                {asn.duration2 !== undefined && (
                  <div>
                    <p className="text-xs text-[#9ca3af] mb-1">Duration 2</p>
                    <p className="text-sm font-medium text-white">
                      {formatDuration(asn.duration2)}
                    </p>
                  </div>
                )}
                {asn.personnel && (
                  <div>
                    <p className="text-xs text-[#9ca3af] mb-1">
                      Responsible Person
                    </p>
                    <p className="text-sm font-medium text-white">
                      {asn.personnel}
                    </p>
                  </div>
                )}
                {asn.assetId && (
                  <div>
                    <p className="text-xs text-[#9ca3af] mb-1">Asset ID</p>
                    <p className="text-sm font-medium text-white">
                      {asn.assetId}
                    </p>
                  </div>
                )}
                {asn.assetType && (
                  <div>
                    <p className="text-xs text-[#9ca3af] mb-1">Asset Type</p>
                    <p className="text-sm font-medium text-white">
                      {asn.assetType}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Document Metadata */}
          <section className="bg-[#111827] border border-[#374151] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <i className="ri-history-line text-blue-400"></i>
              Document History
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-[#9ca3af] mb-1">Created By</p>
                <p className="text-sm font-medium text-white">
                  {asn.createdBy || "SYSTEM"}
                </p>
                <p className="text-xs text-[#6b7280] mt-1">
                  {asn.createdAt
                    ? format(new Date(asn.createdAt), "MMM dd, yyyy HH:mm")
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#9ca3af] mb-1">Last Changed By</p>
                <p className="text-sm font-medium text-white">
                  {asn.changedBy || "SYSTEM"}
                </p>
                <p className="text-xs text-[#6b7280] mt-1">
                  {asn.lastUpdate
                    ? format(new Date(asn.lastUpdate), "MMM dd, yyyy HH:mm")
                    : "N/A"}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#1f2937] border-t border-[#374151] p-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#9ca3af] hover:text-white hover:bg-[#374151] rounded-lg transition-colors"
          >
            Close
          </button>
          <button className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Post Goods Receipt
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

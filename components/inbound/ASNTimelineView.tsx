"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ASNData } from "@/types/asn";
import { format } from "date-fns";
import { ASNTimelineEvent } from "@/types/warehouseOperations";

interface ASNTimelineViewProps {
  asns: ASNData[];
  onSelectASN: (asn: ASNData) => void;
}

export function ASNTimelineView({ asns, onSelectASN }: ASNTimelineViewProps) {
  const [selectedASN, setSelectedASN] = useState<ASNData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Generate timeline events for each ASN
  const timelineData = useMemo(() => {
    return asns.map((asn) => {
      const events: ASNTimelineEvent[] = [];

      // ASN Received
      if (asn.emailDate || asn.createdAt) {
        events.push({
          id: `${asn.id}-received`,
          timestamp: asn.emailDate || asn.createdAt || new Date(),
          eventType: "ASN_RECEIVED",
          title: "ASN Received",
          description: `ASN ${asn.documentNumber} received from ${asn.vendorName}`,
          status: "SUCCESS",
        });
      }

      // Acknowledged
      if (asn.status === "ACKNOWLEDGED" || asn.status === "SENT") {
        events.push({
          id: `${asn.id}-acknowledged`,
          timestamp: asn.lastUpdate || asn.createdAt || new Date(),
          eventType: "ACKNOWLEDGED",
          title: "Acknowledged",
          description: "Vendor acknowledged ASN",
          status: "SUCCESS",
        });
      }

      // In Transit
      if (asn.status === "IN_TRANSIT") {
        events.push({
          id: `${asn.id}-transit`,
          timestamp: asn.lastUpdate || new Date(),
          eventType: "IN_TRANSIT",
          title: "In Transit",
          description: `Shipment in transit${asn.trackingNumber ? ` - Tracking: ${asn.trackingNumber}` : ""}`,
          status: "INFO",
        });
      }

      // Arrived
      if (asn.vehicleArrivalDate || asn.status === "ARRIVED") {
        events.push({
          id: `${asn.id}-arrived`,
          timestamp:
            asn.vehicleArrivalDate || asn.actualDeliveryDate || new Date(),
          eventType: "ARRIVED",
          title: "Arrived at Warehouse",
          description: `Vehicle arrived at receiving dock`,
          status: "SUCCESS",
        });
      }

      // Customs (if cross-border)
      if (asn.shipmentClassification === "CROSS_BORDER") {
        events.push({
          id: `${asn.id}-customs`,
          timestamp: asn.vehicleArrivalDate || new Date(),
          eventType: "CUSTOMS_STARTED",
          title: "Customs Processing",
          description: "Customs clearance in progress",
          status: "INFO",
        });
      }

      // Quality Gates
      if (asn.status === "ARRIVED" || asn.status === "PARTIAL_GR") {
        events.push({
          id: `${asn.id}-quality-1`,
          timestamp: asn.vehicleArrivalDate || new Date(),
          eventType: "QUALITY_GATE_1",
          title: "Quality Gate 1: Visual Inspection",
          description: "Initial visual inspection completed",
          status: "SUCCESS",
        });
      }

      // Offloading
      if (asn.offloadingStartTime) {
        events.push({
          id: `${asn.id}-offloading-start`,
          timestamp: asn.offloadingStartTime,
          eventType: "OFFLOADING_STARTED",
          title: "Offloading Started",
          description: "Offloading process initiated",
          status: "INFO",
        });
      }

      if (asn.offloadingEndTime) {
        events.push({
          id: `${asn.id}-offloading-end`,
          timestamp: asn.offloadingEndTime,
          eventType: "OFFLOADING_COMPLETED",
          title: "Offloading Completed",
          description: `Duration: ${asn.offloadingDuration ? `${Math.floor(asn.offloadingDuration / 60)} min` : "N/A"}`,
          status: "SUCCESS",
          duration: asn.offloadingDuration,
        });
      }

      // Putaway
      if (asn.putawayStartTime) {
        events.push({
          id: `${asn.id}-putaway-start`,
          timestamp: asn.putawayStartTime,
          eventType: "PUTAWAY_STARTED",
          title: "Putaway Started",
          description: `Location: ${asn.locationAllocated || "TBD"}`,
          status: "INFO",
        });
      }

      if (asn.putawayEndTime) {
        events.push({
          id: `${asn.id}-putaway-end`,
          timestamp: asn.putawayEndTime,
          eventType: "PUTAWAY_COMPLETED",
          title: "Putaway Completed",
          description: `Final location: ${asn.locationAllocated || "N/A"}`,
          status: "SUCCESS",
          duration: asn.putawayDuration,
        });
      }

      // GR Posted
      if (asn.goodsReceiptDate || asn.status === "GR_POSTED") {
        events.push({
          id: `${asn.id}-gr`,
          timestamp: asn.goodsReceiptDate || new Date(),
          eventType: "GR_POSTED",
          title: "Goods Receipt Posted",
          description: `GR Number: ${asn.goodsReceiptNumber || "N/A"}`,
          status: "SUCCESS",
        });
      }

      // Completed
      if (asn.status === "COMPLETED") {
        events.push({
          id: `${asn.id}-completed`,
          timestamp: asn.lastUpdate || new Date(),
          eventType: "COMPLETED",
          title: "Process Completed",
          description: "All steps completed successfully",
          status: "SUCCESS",
        });
      }

      // Sort by timestamp
      events.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateA - dateB;
      });

      // Calculate durations
      events.forEach((event, index) => {
        if (index > 0) {
          const prevEvent = events[index - 1];
          const duration =
            new Date(event.timestamp).getTime() -
            new Date(prevEvent.timestamp).getTime();
          event.duration = Math.floor(duration / 1000); // in seconds
        }
      });

      return {
        asn,
        events,
      };
    });
  }, [asns]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof timelineData> = {};
    timelineData.forEach((item) => {
      const firstEvent = item.events[0];
      if (firstEvent) {
        const dateKey = format(new Date(firstEvent.timestamp), "yyyy-MM-dd");
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(item);
      }
    });
    return groups;
  }, [timelineData]);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "ASN_RECEIVED":
        return "ri-mail-line";
      case "ACKNOWLEDGED":
        return "ri-checkbox-circle-line";
      case "IN_TRANSIT":
        return "ri-truck-line";
      case "ARRIVED":
        return "ri-map-pin-line";
      case "CUSTOMS_STARTED":
        return "ri-global-line";
      case "CUSTOMS_CLEARED":
        return "ri-check-double-line";
      case "QUALITY_GATE_1":
        return "ri-shield-check-line";
      case "QUALITY_GATE_2":
        return "ri-shield-star-line";
      case "QUALITY_GATE_3":
        return "ri-award-line";
      case "OFFLOADING_STARTED":
        return "ri-download-line";
      case "OFFLOADING_COMPLETED":
        return "ri-check-line";
      case "PUTAWAY_STARTED":
        return "ri-stack-line";
      case "PUTAWAY_COMPLETED":
        return "ri-check-line";
      case "GR_POSTED":
        return "ri-file-check-line";
      case "EXCEPTION":
        return "ri-error-warning-line";
      case "COMPLETED":
        return "ri-checkbox-circle-fill";
      default:
        return "ri-circle-line";
    }
  };

  const getEventColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-500";
      case "WARNING":
        return "bg-yellow-500";
      case "ERROR":
        return "bg-red-500";
      default:
        return "bg-cyan-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Timeline Controls */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">
            ASN Timeline View
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{asns.length}</div>
            <div className="text-sm text-[#9ca3af]">Total ASNs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {
                asns.filter(
                  (a) => a.status === "COMPLETED" || a.status === "GR_POSTED",
                ).length
              }
            </div>
            <div className="text-sm text-[#9ca3af]">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400">
              {
                asns.filter(
                  (a) => a.status === "IN_TRANSIT" || a.status === "ARRIVED",
                ).length
              }
            </div>
            <div className="text-sm text-[#9ca3af]">In Progress</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">
              {asns.filter((a) => a.status === "PARTIAL_GR").length}
            </div>
            <div className="text-sm text-[#9ca3af]">Partial</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.entries(groupedByDate)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([dateKey, items]) => (
            <div
              key={dateKey}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h4 className="text-lg font-semibold text-white mb-6">
                {format(new Date(dateKey), "EEEE, MMMM dd, yyyy")}
              </h4>

              <div className="space-y-6">
                {items.map(({ asn, events }) => (
                  <motion.div
                    key={asn.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative"
                  >
                    {/* ASN Header */}
                    <div
                      className="flex items-center gap-4 mb-4 cursor-pointer hover:bg-white/5 p-3 rounded-lg transition-colors"
                      onClick={() => {
                        setSelectedASN(asn);
                        onSelectASN(asn);
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-semibold text-white font-mono">
                            {asn.documentNumber}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium border ${
                              asn.status === "COMPLETED"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : asn.status === "GR_POSTED"
                                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                                  : asn.status === "ARRIVED"
                                    ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                                    : asn.status === "IN_TRANSIT"
                                      ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                                      : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                            }`}
                          >
                            {asn.status}
                          </span>
                          {asn.shipmentClassification === "CROSS_BORDER" && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-xs">
                              <i className="ri-global-line mr-1"></i>
                              Cross-Border
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-[#9ca3af]">
                          {asn.vendorName}
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="relative pl-8 border-l-2 border-white/10">
                      {events.map((event, index) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative mb-6 last:mb-0"
                        >
                          {/* Timeline Dot */}
                          <div className="absolute -left-[21px] top-1">
                            <div
                              className={`w-4 h-4 rounded-full ${getEventColor(event.status)} border-2 border-black`}
                            ></div>
                          </div>

                          {/* Event Content */}
                          <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <i
                                  className={`${getEventIcon(event.eventType)} text-xl ${
                                    event.status === "SUCCESS"
                                      ? "text-green-400"
                                      : event.status === "WARNING"
                                        ? "text-yellow-400"
                                        : event.status === "ERROR"
                                          ? "text-red-400"
                                          : "text-cyan-400"
                                  }`}
                                ></i>
                                <div>
                                  <h5 className="text-sm font-semibold text-white">
                                    {event.title}
                                  </h5>
                                  {event.description && (
                                    <p className="text-xs text-[#9ca3af] mt-1">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-cyan-400 font-mono">
                                  {format(
                                    new Date(event.timestamp),
                                    "HH:mm:ss",
                                  )}
                                </div>
                                {event.duration && (
                                  <div className="text-xs text-[#9ca3af] mt-1">
                                    +{Math.floor(event.duration / 60)}m{" "}
                                    {event.duration % 60}s
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

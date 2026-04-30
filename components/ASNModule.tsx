"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import ASNHeader from "./ASNHeader";
import ASNStats from "./ASNStats";
import ASNFilters from "./ASNFilters";
import ASNTable from "./ASNTable";
import ASNChart from "./ASNChart";
import ASNMap from "./ASNMap";
import { ASNData, ViewMode } from "@/types/asn";
import { cleanedSampleData } from "@/data/sampleData";
import { format } from "date-fns";

// Convert cleaned data to ASNData format
const convertToASNData = (cleaned: any): ASNData => {
  const now = new Date().toISOString();
  return {
    id: cleaned.id,
    documentNumber: cleaned.id,
    entity: cleaned.entity || "DEFAULT",
    vendorNumber: cleaned.personnel || "VND-001",
    vendorName: cleaned.personnel || cleaned.entity || "Unknown Vendor",
    shipmentNumber: cleaned.primaryId,
    expectedDeliveryDate:
      cleaned.expectedDate instanceof Date
        ? cleaned.expectedDate.toISOString()
        : cleaned.expectedDate || now,
    actualDeliveryDate:
      cleaned.actualDate instanceof Date
        ? cleaned.actualDate.toISOString()
        : cleaned.actualDate,
    status: cleaned.status || "CREATED",
    priority: "MEDIUM" as const,
    complianceStatus: cleaned.confirmation
      ? "COMPLIANT"
      : ("UNDER_REVIEW" as const),
    trackingNumber: cleaned.code || cleaned.id,
    carrier: cleaned.personnel || "Unknown",
    createdAt:
      cleaned.createdAt instanceof Date
        ? cleaned.createdAt.toISOString()
        : cleaned.createdAt || now,
    lastUpdate:
      cleaned.lastUpdate instanceof Date
        ? cleaned.lastUpdate.toISOString()
        : cleaned.lastUpdate || now,
    destination:
      cleaned.locationName || cleaned.location || "DEFAULT_WAREHOUSE",
  };
};

// Use cleaned sample data
const mockASNData: ASNData[] = cleanedSampleData.map(convertToASNData);

export default function ASNModule() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [complianceFilter, setComplianceFilter] = useState<string>("all");
  const [asnData, setASNData] = useState<ASNData[]>(mockASNData);

  // Load data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("asn-data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setASNData(parsed);
      } catch (e) {
        console.error("Error loading saved data:", e);
      }
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("asn-data", JSON.stringify(asnData));
  }, [asnData]);

  // Function to update ASN status
  const updateASNStatus = (id: string, newStatus: ASNData["status"]) => {
    setASNData((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: newStatus,
              lastUpdate: new Date().toISOString(),
              actualDeliveryDate:
                newStatus === "DELIVERED" || newStatus === "GR_POSTED"
                  ? new Date().toISOString()
                  : item.actualDeliveryDate,
            }
          : item,
      ),
    );
  };

  const filteredData = useMemo(() => {
    return asnData.filter((asn) => {
      const matchesSearch =
        asn.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asn.shipmentNumber &&
          asn.shipmentNumber
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        (asn.vendorName &&
          asn.vendorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (asn.trackingNumber &&
          asn.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || asn.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || asn.priority === priorityFilter;
      const matchesCompliance =
        complianceFilter === "all" || asn.complianceStatus === complianceFilter;

      return (
        matchesSearch && matchesStatus && matchesPriority && matchesCompliance
      );
    });
  }, [searchQuery, statusFilter, priorityFilter, complianceFilter, asnData]);

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <ASNHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Stats Cards */}
        <ASNStats data={asnData} />

        {/* Filters */}
        <ASNFilters
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          complianceFilter={complianceFilter}
          onStatusFilterChange={setStatusFilter}
          onPriorityFilterChange={setPriorityFilter}
          onComplianceFilterChange={setComplianceFilter}
        />

        {/* Main Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6"
        >
          {viewMode === "table" && (
            <ASNTable data={filteredData} onStatusUpdate={updateASNStatus} />
          )}
          {viewMode === "grid" && (
            <ASNTable
              data={filteredData}
              gridView
              onStatusUpdate={updateASNStatus}
            />
          )}
          {viewMode === "chart" && <ASNChart data={filteredData} />}
          {viewMode === "map" && <ASNMap data={filteredData} />}
        </motion.div>
      </div>
    </div>
  );
}

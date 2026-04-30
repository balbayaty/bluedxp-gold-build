"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import {
  generateSalesOrders,
  generateCarriers,
} from "@/utils/mockDataGenerators";
import {
  getSalesOrderLinks,
  getShipmentLinks,
} from "@/utils/moduleInterconnectivity";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";

interface DeliveryNote {
  id: string;
  deliveryNoteNumber: string;
  soNumber: string;
  customerNumber: string;
  customerName: string;
  deliveryDate: Date | string;
  issuedDate: Date | string;
  issuedBy: string;
  status: "DRAFT" | "ISSUED" | "PRINTED" | "SIGNED" | "DELIVERED" | "CANCELLED";
  items: Array<{
    materialNumber: string;
    materialDescription: string;
    quantity: number;
    unit: string;
    batchNumber?: string;
    serialNumber?: string;
  }>;
  totalQuantity: number;
  totalWeight: number;
  totalVolume: number;
  carrierName?: string;
  trackingNumber?: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryInstructions?: string;
  signature?: {
    signedBy: string;
    signedAt: Date | string;
    signatureData?: string;
  };
  printedAt?: Date | string;
  printedBy?: string;
  createdAt: Date | string;
}

const generateDeliveryNotes = (count: number = 100): DeliveryNote[] => {
  const salesOrders = generateSalesOrders(150);
  const carriers = generateCarriers(10);

  return Array.from({ length: count }, (_, i) => {
    const so = salesOrders[Math.floor(Math.random() * salesOrders.length)];
    const carrier =
      Math.random() > 0.3
        ? carriers[Math.floor(Math.random() * carriers.length)]
        : undefined;
    const issuedDate = new Date(Date.now() - Math.random() * 30 * 86400000);
    const deliveryDate = new Date(
      issuedDate.getTime() + Math.random() * 7 * 86400000,
    );
    const statuses: DeliveryNote["status"][] = [
      "DRAFT",
      "ISSUED",
      "PRINTED",
      "SIGNED",
      "DELIVERED",
      "CANCELLED",
    ];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const items = so.items?.slice(0, Math.floor(Math.random() * 5) + 1) || [];
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalWeight = totalQuantity * (Math.random() * 10 + 5);
    const totalVolume = totalQuantity * (Math.random() * 0.1 + 0.05);

    return {
      id: `DN-${String(i + 1).padStart(6, "0")}`,
      deliveryNoteNumber: `DN-${new Date().getFullYear()}-${String(i + 1).padStart(6, "0")}`,
      soNumber: so.soNumber,
      customerNumber: so.customerNumber,
      customerName: so.customerName,
      deliveryDate,
      issuedDate,
      issuedBy: `User ${Math.floor(Math.random() * 10) + 1}`,
      status,
      items: items.map((item) => ({
        materialNumber: item.materialNumber,
        materialDescription: `Material ${item.materialNumber}`,
        quantity: item.quantity,
        unit: item.unit,
        batchNumber:
          Math.random() > 0.5
            ? `BATCH-${String(Math.floor(Math.random() * 1000) + 1).padStart(6, "0")}`
            : undefined,
        serialNumber:
          Math.random() > 0.7
            ? `SERIAL-${String(Math.floor(Math.random() * 10000) + 1).padStart(8, "0")}`
            : undefined,
      })),
      totalQuantity,
      totalWeight: parseFloat(totalWeight.toFixed(2)),
      totalVolume: parseFloat(totalVolume.toFixed(2)),
      carrierName: carrier?.carrierName,
      trackingNumber: carrier
        ? `TRK-${String(i + 1).padStart(10, "0")}`
        : undefined,
      deliveryAddress: `Address ${Math.floor(Math.random() * 100) + 1}, Street ${Math.floor(Math.random() * 50) + 1}`,
      deliveryCity: ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain"][
        Math.floor(Math.random() * 4)
      ],
      deliveryInstructions:
        Math.random() > 0.6 ? "Handle with care" : undefined,
      signature:
        status === "SIGNED" || status === "DELIVERED"
          ? {
              signedBy: `Customer ${Math.floor(Math.random() * 10) + 1}`,
              signedAt: new Date(
                deliveryDate.getTime() + Math.random() * 86400000,
              ),
            }
          : undefined,
      printedAt: ["PRINTED", "SIGNED", "DELIVERED"].includes(status)
        ? new Date(issuedDate.getTime() + Math.random() * 86400000)
        : undefined,
      printedBy: ["PRINTED", "SIGNED", "DELIVERED"].includes(status)
        ? `User ${Math.floor(Math.random() * 10) + 1}`
        : undefined,
      createdAt: issuedDate,
    };
  });
};

export default function DeliveryNote() {
  const router = useRouter();
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>(() =>
    generateDeliveryNotes(120),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">(
    "table",
  );
  const [selectedNote, setSelectedNote] = useState<DeliveryNote | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalNotes: 0,
    issued: 0,
    delivered: 0,
    pendingSignature: 0,
  });

  const filteredNotes = useMemo(() => {
    return deliveryNotes.filter((note) => {
      const matchesSearch =
        note.deliveryNoteNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        note.soNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || note.status === selectedStatus;
      const matchesCustomer =
        selectedCustomer === "ALL" || note.customerNumber === selectedCustomer;
      return matchesSearch && matchesStatus && matchesCustomer;
    });
  }, [deliveryNotes, searchQuery, selectedStatus, selectedCustomer]);

  // Analytics
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    deliveryNotes.forEach((n) => {
      counts[n.status] = (counts[n.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [deliveryNotes]);

  const dailyTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; issued: number; delivered: number }
    > = {};

    deliveryNotes.forEach((n) => {
      const date = format(new Date(n.issuedDate), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, issued: 0, delivered: 0 };
      }
      dailyData[date].issued++;
      if (n.status === "DELIVERED") {
        dailyData[date].delivered++;
      }
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
      .map((d) => ({
        date: format(new Date(d.date), "MMM dd"),
        issued: d.issued,
        delivered: d.delivered,
      }));
  }, [deliveryNotes]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const totalNotes = deliveryNotes.length;
    const issued = deliveryNotes.filter((n) =>
      ["ISSUED", "PRINTED", "SIGNED", "DELIVERED"].includes(n.status),
    ).length;
    const delivered = deliveryNotes.filter(
      (n) => n.status === "DELIVERED",
    ).length;
    const pendingSignature = deliveryNotes.filter(
      (n) => n.status === "PRINTED",
    ).length;

    return {
      totalNotes,
      issued,
      delivered,
      pendingSignature,
    };
  }, [deliveryNotes]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "delivery-note-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "delivery-note-stats",
      () => ({
        totalNotes: aggregateStats.totalNotes,
        issued: simulateKPIUpdates(aggregateStats.issued, 0.05),
        delivered: simulateKPIUpdates(aggregateStats.delivered, 0.05),
        pendingSignature: simulateKPIUpdates(
          aggregateStats.pendingSignature,
          0.1,
        ),
      }),
      5000,
      true,
    );

    return () => {
      unsubscribe();
      stop();
    };
  }, [
    realTimeEnabled,
    aggregateStats.totalNotes,
    aggregateStats.issued,
    aggregateStats.delivered,
    aggregateStats.pendingSignature,
  ]);

  const uniqueCustomers = useMemo(() => {
    return Array.from(new Set(deliveryNotes.map((n) => n.customerName))).sort();
  }, [deliveryNotes]);

  const stats = [
    {
      label: "Total Notes",
      value: realTimeEnabled
        ? realTimeStats.totalNotes
        : aggregateStats.totalNotes,
      icon: "ri-file-paper-line",
      tooltip: "Total delivery notes",
      trend: "up" as const,
    },
    {
      label: "Issued",
      value: realTimeEnabled ? realTimeStats.issued : aggregateStats.issued,
      icon: "ri-checkbox-circle-line",
      tooltip: "Issued delivery notes",
      trend: "up" as const,
    },
    {
      label: "Delivered",
      value: realTimeEnabled
        ? realTimeStats.delivered
        : aggregateStats.delivered,
      icon: "ri-truck-line",
      tooltip: "Delivered notes",
      trend: "up" as const,
    },
    {
      label: "Pending Signature",
      value: realTimeEnabled
        ? realTimeStats.pendingSignature
        : aggregateStats.pendingSignature,
      icon: "ri-pen-nib-line",
      tooltip: "Notes pending signature",
      trend: "neutral" as const,
    },
  ];

  const COLORS = [
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  const handleView = (note: DeliveryNote) => {
    setSelectedNote(note);
    setShowViewModal(true);
  };

  const handlePrint = (note: DeliveryNote) => {
    setSelectedNote(note);
    setShowPrintModal(true);
    // Simulate printing
    setTimeout(() => {
      setDeliveryNotes((prev) =>
        prev.map((n) =>
          n.id === note.id
            ? {
                ...n,
                status: "PRINTED" as const,
                printedAt: new Date(),
                printedBy: "Current User",
              }
            : n,
        ),
      );
    }, 1000);
  };

  const handleSign = (note: DeliveryNote) => {
    setDeliveryNotes((prev) =>
      prev.map((n) =>
        n.id === note.id
          ? {
              ...n,
              status: "SIGNED" as const,
              signature: {
                signedBy: "Customer",
                signedAt: new Date(),
              },
            }
          : n,
      ),
    );
  };

  return (
    <PageTemplate
      title="Delivery Note Management"
      description="Delivery note generation, printing, signature tracking, and delivery confirmation with full document lifecycle management"
      icon="ri-file-paper-line"
      systemInfo={{
        sap: "Delivery Note, Shipping Documents",
        oracle: "Delivery Note, Shipping Documents",
        manhattan: "Delivery Note, Shipping Documents",
      }}
      examples={[
        "Generate delivery notes from sales orders",
        "Print delivery notes",
        "Track signatures",
        "Delivery confirmation",
        "Document lifecycle tracking",
      ]}
      stats={stats}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 sm:p-2">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "table"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Table View"
            >
              <i className="ri-table-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Grid View"
            >
              <i className="ri-grid-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "analytics"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Analytics View"
            >
              <i className="ri-bar-chart-line text-sm sm:text-base"></i>
            </button>
          </div>
          <button
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              realTimeEnabled
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/5 text-[#9ca3af] border border-white/10"
            }`}
          >
            <i
              className={`ri-${realTimeEnabled ? "radio-button-line" : "checkbox-blank-circle-line"} mr-1`}
            ></i>
            Real-time
          </button>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search delivery notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="ISSUED">Issued</option>
          <option value="PRINTED">Printed</option>
          <option value="SIGNED">Signed</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Customers</option>
          {uniqueCustomers.map((customer) => (
            <option key={customer} value={customer}>
              {customer}
            </option>
          ))}
        </select>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Delivery Note
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Sales Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Delivery Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredNotes.map((note, index) => (
                  <motion.tr
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {note.deliveryNoteNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {format(new Date(note.issuedDate), "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(`/sales-orders?so=${note.soNumber}`)
                        }
                        className="text-sm text-cyan-400 hover:text-cyan-300 font-mono"
                      >
                        {note.soNumber}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {note.customerName}
                      </div>
                      <div className="text-xs text-[#9ca3af] font-mono">
                        {note.customerNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {format(new Date(note.deliveryDate), "MMM dd, yyyy")}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {note.deliveryCity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {note.items.length} items
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {note.totalQuantity} {note.items[0]?.unit || "EA"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          note.status === "DELIVERED"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : note.status === "SIGNED"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : note.status === "PRINTED"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : note.status === "ISSUED"
                                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                  : note.status === "CANCELLED"
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {note.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={() => handleView(note)}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        {["ISSUED", "DRAFT"].includes(note.status) && (
                          <Tooltip content="Print" position="top">
                            <button
                              onClick={() => handlePrint(note)}
                              className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                            >
                              <i className="ri-printer-line"></i>
                            </button>
                          </Tooltip>
                        )}
                        {note.status === "PRINTED" && (
                          <Tooltip content="Mark as Signed" position="top">
                            <button
                              onClick={() => handleSign(note)}
                              className="p-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded hover:bg-green-600/30 transition-colors"
                            >
                              <i className="ri-pen-nib-line"></i>
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1 font-mono">
                    {note.deliveryNoteNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {format(new Date(note.issuedDate), "MMM dd, yyyy")}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    note.status === "DELIVERED"
                      ? "bg-green-500/20 text-green-400"
                      : note.status === "SIGNED"
                        ? "bg-blue-500/20 text-blue-400"
                        : note.status === "PRINTED"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {note.status}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Sales Order:</span>
                  <button
                    onClick={() =>
                      router.push(`/sales-orders?so=${note.soNumber}`)
                    }
                    className="text-cyan-400 hover:text-cyan-300 font-mono text-xs"
                  >
                    {note.soNumber}
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Customer:</span>
                  <span className="text-white text-xs">
                    {note.customerName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Delivery Date:</span>
                  <span className="text-white text-xs">
                    {format(new Date(note.deliveryDate), "MMM dd")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Items:</span>
                  <span className="text-white">
                    {note.items.length} items, {note.totalQuantity}{" "}
                    {note.items[0]?.unit || "EA"}
                  </span>
                </div>
                {note.trackingNumber && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Tracking:</span>
                    <button
                      onClick={() =>
                        router.push(`/tracking?tracking=${note.trackingNumber}`)
                      }
                      className="text-cyan-400 hover:text-cyan-300 font-mono text-xs"
                    >
                      {note.trackingNumber}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleView(note)}
                  className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                >
                  <i className="ri-eye-line mr-1"></i>
                  View
                </button>
                {["ISSUED", "DRAFT"].includes(note.status) && (
                  <button
                    onClick={() => handlePrint(note)}
                    className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-sm font-medium hover:bg-blue-600/30 transition-colors"
                  >
                    <i className="ri-printer-line"></i>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
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
                      fill={COLORS[index % COLORS.length]}
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
              Daily Delivery Note Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="issued"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="Issued"
                />
                <Line
                  type="monotone"
                  dataKey="delivered"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Delivered"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedNote(null);
        }}
        title={`Delivery Note - ${selectedNote?.deliveryNoteNumber || ""}`}
        size="lg"
      >
        {selectedNote && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Delivery Note Number
                </div>
                <div className="text-white font-medium font-mono">
                  {selectedNote.deliveryNoteNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Sales Order</div>
                <button
                  onClick={() =>
                    router.push(`/sales-orders?so=${selectedNote.soNumber}`)
                  }
                  className="text-cyan-400 hover:text-cyan-300 font-mono"
                >
                  {selectedNote.soNumber}
                </button>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Customer</div>
                <div className="text-white">{selectedNote.customerName}</div>
                <div className="text-xs text-[#9ca3af] font-mono">
                  {selectedNote.customerNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedNote.status === "DELIVERED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedNote.status === "SIGNED"
                        ? "bg-blue-500/20 text-blue-400"
                        : selectedNote.status === "PRINTED"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedNote.status}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Issued Date</div>
                <div className="text-white">
                  {format(new Date(selectedNote.issuedDate), "PPp")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Delivery Date</div>
                <div className="text-white">
                  {format(new Date(selectedNote.deliveryDate), "PPp")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Delivery Address
                </div>
                <div className="text-white">{selectedNote.deliveryAddress}</div>
                <div className="text-xs text-[#9ca3af]">
                  {selectedNote.deliveryCity}
                </div>
              </div>
              {selectedNote.trackingNumber && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Tracking Number
                  </div>
                  <button
                    onClick={() =>
                      router.push(
                        `/tracking?tracking=${selectedNote.trackingNumber}`,
                      )
                    }
                    className="text-cyan-400 hover:text-cyan-300 font-mono"
                  >
                    {selectedNote.trackingNumber}
                  </button>
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">Items</div>
              <div className="bg-white/5 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[#9ca3af]">
                        Material
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[#9ca3af]">
                        Quantity
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[#9ca3af]">
                        Batch
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {selectedNote.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2">
                          <div className="text-sm text-white font-mono">
                            {item.materialNumber}
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            {item.materialDescription}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-white">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-2 text-xs text-[#9ca3af] font-mono">
                          {item.batchNumber || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Total Quantity
                </div>
                <div className="text-lg font-semibold text-white">
                  {selectedNote.totalQuantity}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Total Weight</div>
                <div className="text-lg font-semibold text-white">
                  {selectedNote.totalWeight.toFixed(2)} kg
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Total Volume</div>
                <div className="text-lg font-semibold text-white">
                  {selectedNote.totalVolume.toFixed(2)} m³
                </div>
              </div>
            </div>
            {selectedNote.signature && (
              <div>
                <div className="text-sm text-[#9ca3af] mb-2">Signature</div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-sm text-white">
                    Signed by: {selectedNote.signature.signedBy}
                  </div>
                  <div className="text-xs text-[#9ca3af] mt-1">
                    {format(new Date(selectedNote.signature.signedAt), "PPp")}
                  </div>
                </div>
              </div>
            )}
            {selectedNote.printedAt && (
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Printed</div>
                <div className="text-white text-sm">
                  {selectedNote.printedBy} on{" "}
                  {format(new Date(selectedNote.printedAt), "PPp")}
                </div>
              </div>
            )}
            <ModuleLinks
              links={[
                ...getSalesOrderLinks(selectedNote.soNumber),
                ...(selectedNote.trackingNumber
                  ? getShipmentLinks(selectedNote.trackingNumber)
                  : []),
              ]}
            />
          </div>
        )}
      </Modal>

      {/* Print Modal */}
      <Modal
        isOpen={showPrintModal}
        onClose={() => {
          setShowPrintModal(false);
          setSelectedNote(null);
        }}
        title="Print Delivery Note"
        size="md"
      >
        {selectedNote && (
          <div className="space-y-4">
            <p className="text-white">
              Printing delivery note{" "}
              <strong>{selectedNote.deliveryNoteNumber}</strong>...
            </p>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-[#9ca3af] mb-2">Print Preview</div>
              <div className="text-xs text-white space-y-1">
                <div>Delivery Note: {selectedNote.deliveryNoteNumber}</div>
                <div>Sales Order: {selectedNote.soNumber}</div>
                <div>Customer: {selectedNote.customerName}</div>
                <div>Items: {selectedNote.items.length} items</div>
              </div>
            </div>
            <button
              onClick={() => {
                setShowPrintModal(false);
                setSelectedNote(null);
              }}
              className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}

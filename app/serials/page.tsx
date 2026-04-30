"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface SerialNumber {
  id: string;
  serialNumber: string;
  materialNumber: string;
  materialDescription: string;
  batchNumber?: string;
  location: string;
  status:
    | "AVAILABLE"
    | "RESERVED"
    | "IN_USE"
    | "QUARANTINE"
    | "SCRAPPED"
    | "SOLD";
  currentLocation: string;
  customerNumber?: string;
  customerName?: string;
  orderNumber?: string;
  productionDate?: Date | string;
  warrantyExpiry?: Date | string;
  lastMovementDate?: Date | string;
  movementHistory: Array<{
    date: Date | string;
    from: string;
    to: string;
    reason: string;
    user: string;
  }>;
}

export default function SerialNumber() {
  const [serials, setSerials] = useState<SerialNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch serials from API
  useEffect(() => {
    const fetchSerials = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/wms/serials?limit=200');
        const result = await response.json();
        
        if (result.success && result.data) {
          // Map API response to component interface
          const mappedSerials: SerialNumber[] = result.data.map((serial: any) => ({
            id: serial.id,
            serialNumber: serial.serialNumber,
            materialNumber: serial.materialNumber,
            materialDescription: serial.materialDescription,
            batchNumber: serial.batchNumber,
            location: serial.location,
            status: serial.status,
            currentLocation: serial.currentLocation,
            customerNumber: serial.customerNumber,
            customerName: serial.customerName,
            orderNumber: serial.orderNumber,
            productionDate: serial.productionDate,
            warrantyExpiry: serial.warrantyExpiry,
            lastMovementDate: serial.lastMovementDate,
            movementHistory: serial.movementHistory || [],
          }));
          setSerials(mappedSerials);
        } else {
          setError(result.error || 'Failed to fetch serials');
        }
      } catch (err) {
        console.error('Error fetching serials:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch serials');
      } finally {
        setLoading(false);
      }
    };

    fetchSerials();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("ALL");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showTraceModal, setShowTraceModal] = useState(false);
  const [selectedSerial, setSelectedSerial] = useState<SerialNumber | null>(
    null,
  );

  const filteredSerials = useMemo(() => {
    return serials.filter((serial) => {
      const matchesSearch =
        serial.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        serial.materialNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        serial.materialDescription
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (serial.batchNumber &&
          serial.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus =
        selectedStatus === "ALL" || serial.status === selectedStatus;
      const matchesMaterial =
        selectedMaterial === "ALL" ||
        serial.materialNumber === selectedMaterial;
      return matchesSearch && matchesStatus && matchesMaterial;
    });
  }, [serials, searchQuery, selectedStatus, selectedMaterial]);

  const statusStats = useMemo(() => {
    const stats: Record<string, number> = {};
    serials.forEach((s) => {
      stats[s.status] = (stats[s.status] || 0) + 1;
    });
    return stats;
  }, [serials]);

  const movementData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: format(date, "MMM dd"),
        movements: serials.filter((s) => {
          const lastMove = s.movementHistory[s.movementHistory.length - 1];
          return (
            lastMove &&
            format(new Date(lastMove.date), "yyyy-MM-dd") ===
              format(date, "yyyy-MM-dd")
          );
        }).length,
      };
    });
    return last30Days;
  }, [serials]);

  const stats = [
    {
      label: "Total Serials",
      value: serials.length,
      icon: "ri-barcode-line",
      tooltip: "Total serial numbers tracked",
      trend: "up" as const,
    },
    {
      label: "Available",
      value: statusStats.AVAILABLE || 0,
      icon: "ri-checkbox-circle-line",
      tooltip: "Serials available for use",
      trend: "up" as const,
    },
    {
      label: "In Use",
      value: statusStats.IN_USE || 0,
      icon: "ri-handbag-line",
      tooltip: "Serials currently in use",
      trend: "neutral" as const,
    },
    {
      label: "Quarantine",
      value: statusStats.QUARANTINE || 0,
      icon: "ri-alert-line",
      tooltip: "Serials in quarantine",
      trend: "neutral" as const,
    },
  ];

  const handleView = (serial: SerialNumber) => {
    setSelectedSerial(serial);
    setShowViewModal(true);
  };

  const handleTrace = (serial: SerialNumber) => {
    setSelectedSerial(serial);
    setShowTraceModal(true);
  };

  const materialsList = useMemo(() => {
    return [
      "ALL",
      ...Array.from(new Set(serials.map((s) => s.materialNumber))),
    ];
  }, [serials]);

  return (
    <PageTemplate
      title="Serial Number Management"
      description="Serial number tracking and full lifecycle traceability - Track individual serial numbers from production to customer delivery with complete movement history"
      icon="ri-barcode-line"
      systemInfo={{
        sap: "MSC2N - Serial Number Master, MMBE - Serial Stock Overview, MCHB - Serial Stock",
        oracle:
          "Serial Number Management, Serial Tracking, Serial Traceability",
        manhattan: "Serial Number Control, Serial Tracking, Serial Lifecycle",
      }}
      examples={[
        "Track individual serial numbers",
        "Full lifecycle traceability",
        "Movement history tracking",
        "Warranty management",
        "Serial-to-customer mapping",
        "Quality traceability",
      ]}
      stats={stats}
      loading={loading}
      error={error}
      actions={
        <div className="flex items-center gap-3">
          <Tooltip content="Export Serial Report" position="bottom">
            <button className="bg-white/5 border border-white/10 hover:border-cyan-500/50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <i className="ri-download-line"></i>
              Export
            </button>
          </Tooltip>
          <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20">
            <i className="ri-add-line"></i>
            Register Serial
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
            placeholder="Search by Serial Number, Material, Batch..."
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
          <option value="AVAILABLE">Available</option>
          <option value="RESERVED">Reserved</option>
          <option value="IN_USE">In Use</option>
          <option value="QUARANTINE">Quarantine</option>
          <option value="SCRAPPED">Scrapped</option>
          <option value="SOLD">Sold</option>
        </select>
        <select
          value={selectedMaterial}
          onChange={(e) => setSelectedMaterial(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[200px]"
        >
          {materialsList.slice(0, 20).map((mat) => (
            <option key={mat} value={mat}>
              {mat === "ALL" ? "All Materials" : mat}
            </option>
          ))}
        </select>
      </div>

      {/* Analytics */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={Object.entries(statusStats).map(([status, count]) => ({
                status,
                count,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="status" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="count" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Movement Activity (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={movementData}>
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
              <Line
                type="monotone"
                dataKey="movements"
                stroke="#10b981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Serials Table */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Serial Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Material
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Batch
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Warranty
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredSerials.slice(0, 50).map((serial, index) => (
                <motion.tr
                  key={serial.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Tooltip
                      content={`Serial Number: ${serial.serialNumber}`}
                      position="right"
                    >
                      <span className="text-sm font-medium text-white font-mono cursor-help">
                        {serial.serialNumber}
                      </span>
                    </Tooltip>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white font-mono">
                        {serial.materialNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {serial.materialDescription.substring(0, 30)}...
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {serial.batchNumber && (
                      <Tooltip
                        content={`Batch: ${serial.batchNumber}`}
                        position="right"
                      >
                        <span className="text-sm text-white font-mono cursor-help">
                          {serial.batchNumber}
                        </span>
                      </Tooltip>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Tooltip
                      content={`Location: ${serial.currentLocation}`}
                      position="right"
                    >
                      <span className="text-sm text-white font-mono cursor-help">
                        {serial.currentLocation}
                      </span>
                    </Tooltip>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        serial.status === "AVAILABLE"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : serial.status === "RESERVED"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : serial.status === "IN_USE"
                              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                              : serial.status === "QUARANTINE"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : serial.status === "SCRAPPED"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                      }`}
                    >
                      {serial.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {serial.customerName ? (
                      <div>
                        <div className="text-sm text-white">
                          {serial.customerName}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {serial.customerNumber}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-[#6b7280]">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {serial.warrantyExpiry ? (
                      <Tooltip
                        content={`Warranty Expiry: ${format(new Date(serial.warrantyExpiry), "MMM dd, yyyy")}`}
                        position="right"
                      >
                        <span
                          className={`text-sm cursor-help ${
                            new Date(serial.warrantyExpiry) < new Date()
                              ? "text-red-400 font-medium"
                              : new Date(serial.warrantyExpiry) <
                                  new Date(
                                    Date.now() + 30 * 24 * 60 * 60 * 1000,
                                  )
                                ? "text-yellow-400 font-medium"
                                : "text-white"
                          }`}
                        >
                          {format(
                            new Date(serial.warrantyExpiry),
                            "MMM dd, yyyy",
                          )}
                        </span>
                      </Tooltip>
                    ) : (
                      <span className="text-sm text-[#6b7280]">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Tooltip content="View Details" position="top">
                        <button
                          onClick={() => handleView(serial)}
                          className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                        >
                          <i className="ri-eye-line"></i>
                        </button>
                      </Tooltip>
                      <Tooltip content="Trace Serial" position="top">
                        <button
                          onClick={() => handleTrace(serial)}
                          className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                        >
                          <i className="ri-route-line"></i>
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedSerial(null);
        }}
        title={`Serial Number Details - ${selectedSerial?.serialNumber || ""}`}
        size="lg"
      >
        {selectedSerial && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Serial Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedSerial.serialNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedSerial.status === "AVAILABLE"
                      ? "bg-green-500/20 text-green-400"
                      : selectedSerial.status === "IN_USE"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {selectedSerial.status}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Material Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedSerial.materialNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Current Location
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedSerial.currentLocation}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Production Date
                </label>
                <div className="text-sm text-white">
                  {selectedSerial.productionDate
                    ? format(
                        new Date(selectedSerial.productionDate),
                        "MMM dd, yyyy",
                      )
                    : "N/A"}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Warranty Expiry
                </label>
                <div className="text-sm text-white">
                  {selectedSerial.warrantyExpiry
                    ? format(
                        new Date(selectedSerial.warrantyExpiry),
                        "MMM dd, yyyy",
                      )
                    : "N/A"}
                </div>
              </div>
              {selectedSerial.customerName && (
                <>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Customer
                    </label>
                    <div className="text-sm text-white">
                      {selectedSerial.customerName}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Order Number
                    </label>
                    <div className="text-sm text-white font-mono">
                      {selectedSerial.orderNumber || "N/A"}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Trace Modal */}
      <Modal
        isOpen={showTraceModal}
        onClose={() => {
          setShowTraceModal(false);
          setSelectedSerial(null);
        }}
        title={`Serial Traceability - ${selectedSerial?.serialNumber || ""}`}
        size="lg"
      >
        {selectedSerial && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white mb-3">
              Movement History
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedSerial.movementHistory.map((movement, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                    <span className="text-cyan-400 text-xs font-medium">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-white font-mono">
                        {movement.from}
                      </span>
                      <i className="ri-arrow-right-line text-cyan-400"></i>
                      <span className="text-sm text-white font-mono">
                        {movement.to}
                      </span>
                    </div>
                    <div className="text-xs text-[#9ca3af]">
                      {format(new Date(movement.date), "MMM dd, yyyy HH:mm")} •{" "}
                      {movement.reason} • {movement.user}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}

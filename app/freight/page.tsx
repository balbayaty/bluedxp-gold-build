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
import CurrencyDisplay from "@/components/CurrencyDisplay";
import { apiFetch } from "@/utils/apiFetch";

export default function FreightManagement() {
  const [freightRecords, setFreightRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState<string>("ALL");
  const [selectedPaymentStatus, setSelectedPaymentStatus] =
    useState<string>("ALL");
  const [selectedFreightType, setSelectedFreightType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">(
    "table",
  );
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalFreight: 0,
    totalValue: 0,
    pendingPayment: 0,
    paid: 0,
  });

  const filteredRecords = useMemo(() => {
    return freightRecords.filter((record) => {
      const matchesSearch =
        record.freightNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        record.shipmentNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        record.carrier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.destination.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCarrier =
        selectedCarrier === "ALL" || record.carrier === selectedCarrier;
      const matchesPaymentStatus =
        selectedPaymentStatus === "ALL" ||
        record.paymentStatus === selectedPaymentStatus;
      const matchesFreightType =
        selectedFreightType === "ALL" ||
        record.freightType === selectedFreightType;
      return (
        matchesSearch &&
        matchesCarrier &&
        matchesPaymentStatus &&
        matchesFreightType
      );
    });
  }, [
    freightRecords,
    searchQuery,
    selectedCarrier,
    selectedPaymentStatus,
    selectedFreightType,
  ]);

  const totalFreight = useMemo(() => {
    return freightRecords.reduce((sum, r) => sum + r.totalFreight, 0);
  }, [freightRecords]);

  const carrierStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {};
    freightRecords.forEach((record) => {
      if (!stats[record.carrier]) {
        stats[record.carrier] = { count: 0, total: 0 };
      }
      stats[record.carrier].count++;
      stats[record.carrier].total += record.totalFreight;
    });
    return stats;
  }, [freightRecords]);

  const paymentStats = useMemo(() => {
    const stats: Record<string, number> = {};
    freightRecords.forEach((record) => {
      stats[record.paymentStatus] = (stats[record.paymentStatus] || 0) + 1;
    });
    return stats;
  }, [freightRecords]);

  const chartData = useMemo(() => {
    return Object.entries(carrierStats).map(([carrier, data]) => ({
      carrier,
      count: data.count,
      total: data.total,
    }));
  }, [carrierStats]);

  const paymentData = useMemo(() => {
    return Object.entries(paymentStats).map(([status, count]) => ({
      status,
      count,
    }));
  }, [paymentStats]);

  const carriers = [
    "ALL",
    ...Array.from(new Set(freightRecords.map((r) => r.carrier))),
  ];

  const aggregateStats = useMemo(() => {
    return {
      totalFreight: freightRecords.length,
      totalValue: totalFreight,
      pendingPayment: paymentStats.PENDING || 0,
      paid: paymentStats.PAID || 0,
    };
  }, [
    freightRecords.length,
    totalFreight,
    paymentStats.PENDING,
    paymentStats.PAID,
  ]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const res = await apiFetch("/api/transportation/freight");
        const data = (await res.json()) as any[];
        if (!mounted) return;
        setFreightRecords(data || []);
      } catch (e) {
        if (!mounted) return;
        setLoadError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "freight-management-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "freight-management-stats",
      () => ({
        totalFreight: aggregateStats.totalFreight,
        totalValue: simulateKPIUpdates(aggregateStats.totalValue, 0.02),
        pendingPayment: simulateKPIUpdates(aggregateStats.pendingPayment, 0.1),
        paid: simulateKPIUpdates(aggregateStats.paid, 0.05),
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
    aggregateStats.totalFreight,
    aggregateStats.totalValue,
    aggregateStats.pendingPayment,
    aggregateStats.paid,
  ]);

  const stats = [
    {
      label: "Total Freight",
      value: realTimeEnabled
        ? realTimeStats.totalFreight
        : aggregateStats.totalFreight,
      icon: "ri-price-tag-3-line",
      tooltip: "Total number of freight records",
      trend: "up" as const,
    },
    {
      label: "Total Value",
      value: realTimeEnabled
        ? realTimeStats.totalValue
        : aggregateStats.totalValue,
      isCurrency: true,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total freight value across all records",
      trend: "up" as const,
    },
    {
      label: "Pending Payment",
      value: realTimeEnabled
        ? realTimeStats.pendingPayment
        : aggregateStats.pendingPayment,
      icon: "ri-time-line",
      tooltip: "Freight records with pending payment",
      trend: "neutral" as const,
    },
    {
      label: "Paid",
      value: realTimeEnabled ? realTimeStats.paid : aggregateStats.paid,
      icon: "ri-checkbox-circle-line",
      tooltip: "Freight records with paid status",
      trend: "up" as const,
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

  return (
    <PageTemplate
      title="Freight Management"
      description="Shipping costs and freight management - Track, calculate, and manage freight costs with detailed carrier and payment analytics"
      icon="ri-price-tag-3-line"
      systemInfo={{
        sap: "Freight Calculation - Transportation Management (TM)",
        oracle: "Freight Management - Shipping Cost Management",
        manhattan: "Freight Management - Carrier & Cost Tracking",
      }}
      examples={[
        "Track freight costs by carrier and shipment",
        "Calculate base rates, fuel surcharges, and fees",
        "Monitor payment status and invoices",
        "Analyze freight costs by carrier and type",
        "Manage freight invoices and payments",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["table", "grid", "analytics"] as const).map((mode) => (
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
                  className={`ri-${mode === "table" ? "table-line" : mode === "grid" ? "grid-line" : "bar-chart-line"} mr-1`}
                ></i>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
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
          <Tooltip content="Create New Freight Record" position="bottom">
            <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20">
              <i className="ri-add-line"></i>
              Create Freight
            </button>
          </Tooltip>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search by Freight Number, Shipment, Carrier, Destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <select
          value={selectedCarrier}
          onChange={(e) => setSelectedCarrier(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Carriers</option>
          {carriers
            .filter((c) => c !== "ALL")
            .map((carrier) => (
              <option key={carrier} value={carrier}>
                {carrier}
              </option>
            ))}
        </select>
        <select
          value={selectedPaymentStatus}
          onChange={(e) => setSelectedPaymentStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Payment Status</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
        </select>
        <select
          value={selectedFreightType}
          onChange={(e) => setSelectedFreightType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Freight Types</option>
          <option value="STANDARD">Standard</option>
          <option value="EXPRESS">Express</option>
          <option value="OVERNIGHT">Overnight</option>
          <option value="ECONOMY">Economy</option>
          <option value="FREIGHT">Freight</option>
        </select>
      </div>

      {/* View Modes */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Freight Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Carrier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Weight/Volume
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Base Rate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Total Freight
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredRecords.map((record, index) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white font-mono">
                          {record.freightNumber}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {record.shipmentNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-white font-medium">
                          {record.carrier}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {record.freightType}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-white">
                          {record.origin} → {record.destination}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {record.distance.toFixed(0)} km
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {record.weight.toFixed(1)} kg
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {record.volume.toFixed(2)} m³
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <CurrencyDisplay
                        amount={record.baseRate}
                        size="sm"
                        variant="default"
                      />
                      <div className="text-xs text-[#9ca3af]">
                        +{" "}
                        <CurrencyDisplay
                          amount={record.fuelSurcharge}
                          size="sm"
                          variant="muted"
                        />{" "}
                        fuel
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <CurrencyDisplay
                        amount={record.totalFreight}
                        size="sm"
                        variant="highlight"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          record.paymentStatus === "PAID"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : record.paymentStatus === "PENDING"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {record.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowViewModal(true);
                        }}
                        className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                      >
                        <i className="ri-eye-line"></i>
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
              onClick={() => {
                setSelectedRecord(record);
                setShowViewModal(true);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white font-mono mb-1">
                    {record.freightNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {record.carrier} - {record.freightType}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    record.paymentStatus === "PAID"
                      ? "bg-green-500/20 text-green-400"
                      : record.paymentStatus === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {record.paymentStatus}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Route:</span>
                  <span className="text-white">
                    {record.origin} → {record.destination}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Weight/Volume:</span>
                  <span className="text-white">
                    {record.weight.toFixed(1)} kg / {record.volume.toFixed(2)}{" "}
                    m³
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Base Rate:</span>
                  <CurrencyDisplay
                    amount={record.baseRate}
                    size="sm"
                    variant="default"
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Total Freight:</span>
                  <CurrencyDisplay
                    amount={record.totalFreight}
                    size="sm"
                    variant="highlight"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {viewMode === "analytics" && (
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Freight by Carrier
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="carrier" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar
                  dataKey="total"
                  fill="#06b6d4"
                  name="Total Freight (SAR)"
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Payment Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {paymentData.map((entry, index) => (
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
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedRecord(null);
        }}
        title={`Freight Details - ${selectedRecord?.freightNumber || ""}`}
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Freight Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedRecord.freightNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Shipment Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedRecord.shipmentNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Carrier
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedRecord.carrier}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Freight Type
                </label>
                <div className="text-sm text-white">
                  {selectedRecord.freightType}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Route
                </label>
                <div className="text-sm text-white">
                  {selectedRecord.origin} → {selectedRecord.destination}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Distance
                </label>
                <div className="text-sm text-white">
                  {selectedRecord.distance.toFixed(0)} km
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Weight
                </label>
                <div className="text-sm text-white">
                  {selectedRecord.weight.toFixed(1)} kg
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Volume
                </label>
                <div className="text-sm text-white">
                  {selectedRecord.volume.toFixed(2)} m³
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Base Rate
                </label>
                <CurrencyDisplay
                  amount={selectedRecord.baseRate}
                  size="sm"
                  variant="default"
                />
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Fuel Surcharge
                </label>
                <CurrencyDisplay
                  amount={selectedRecord.fuelSurcharge}
                  size="sm"
                  variant="default"
                />
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Handling Fee
                </label>
                <CurrencyDisplay
                  amount={selectedRecord.handlingFee}
                  size="sm"
                  variant="default"
                />
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Insurance
                </label>
                <CurrencyDisplay
                  amount={selectedRecord.insurance}
                  size="sm"
                  variant="default"
                />
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Total Freight
                </label>
                <CurrencyDisplay
                  amount={selectedRecord.totalFreight}
                  size="sm"
                  variant="highlight"
                />
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Payment Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedRecord.paymentStatus === "PAID"
                      ? "bg-green-500/20 text-green-400"
                      : selectedRecord.paymentStatus === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {selectedRecord.paymentStatus}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Invoice Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedRecord.invoiceNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Invoice Date
                </label>
                <div className="text-sm text-white">
                  {format(new Date(selectedRecord.invoiceDate), "MMM dd, yyyy")}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}

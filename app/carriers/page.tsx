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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import CurrencyDisplay from "@/components/CurrencyDisplay";
import { apiFetch } from "@/utils/apiFetch";

interface Carrier {
  id: string;
  carrierCode: string;
  carrierName: string;
  contactPerson: string;
  email: string;
  phone: string;
  serviceTypes: string[];
  status: "ACTIVE" | "INACTIVE";
  rating: number;
  totalShipments: number;
  performance?: {
    onTimeDeliveryRate: number;
    averageDeliveryTime: number;
    damageRate: number;
    costPerShipment: number;
    totalRevenue: number;
    customerSatisfaction: number;
  };
  coverage?: {
    local: boolean;
    international: boolean;
    express: boolean;
    standard: boolean;
  };
  integration?: {
    apiEnabled: boolean;
    trackingEnabled: boolean;
    labelPrinting: boolean;
  };
}

export default function CarrierManagement() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("ALL");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);

  const filteredCarriers = useMemo(() => {
    return carriers.filter((carrier) => {
      const matchesSearch =
        carrier.carrierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        carrier.carrierCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        carrier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || carrier.status === selectedStatus;
      const matchesServiceType =
        selectedServiceType === "ALL" ||
        carrier.serviceTypes.includes(selectedServiceType);
      return matchesSearch && matchesStatus && matchesServiceType;
    });
  }, [carriers, searchQuery, selectedStatus, selectedServiceType]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const res = await apiFetch("/api/transportation/carriers");
        const data = (await res.json()) as Carrier[];
        if (!mounted) return;
        setCarriers(data || []);
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

  const performanceStats = useMemo(() => {
    const active = carriers.filter((c) => c.status === "ACTIVE");
    if (active.length === 0) return null;

    return {
      avgOnTimeDelivery:
        active.reduce(
          (sum, c) => sum + (c.performance?.onTimeDeliveryRate || 0),
          0,
        ) / active.length,
      avgDeliveryTime:
        active.reduce(
          (sum, c) => sum + (c.performance?.averageDeliveryTime || 0),
          0,
        ) / active.length,
      avgDamageRate:
        active.reduce((sum, c) => sum + (c.performance?.damageRate || 0), 0) /
        active.length,
      avgCost:
        active.reduce(
          (sum, c) => sum + (c.performance?.costPerShipment || 0),
          0,
        ) / active.length,
      totalRevenue: active.reduce(
        (sum, c) => sum + (c.performance?.totalRevenue || 0),
        0,
      ),
      avgSatisfaction:
        active.reduce(
          (sum, c) => sum + (c.performance?.customerSatisfaction || 0),
          0,
        ) / active.length,
    };
  }, [carriers]);

  const serviceTypeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    carriers.forEach((c) => {
      c.serviceTypes.forEach((st) => {
        stats[st] = (stats[st] || 0) + 1;
      });
    });
    return stats;
  }, [carriers]);

  const ratingDistribution = useMemo(() => {
    const distribution = {
      "5.0": 0,
      "4.5-4.9": 0,
      "4.0-4.4": 0,
      "3.5-3.9": 0,
      "<3.5": 0,
    };
    carriers.forEach((c) => {
      if (c.rating >= 5.0) distribution["5.0"]++;
      else if (c.rating >= 4.5) distribution["4.5-4.9"]++;
      else if (c.rating >= 4.0) distribution["4.0-4.4"]++;
      else if (c.rating >= 3.5) distribution["3.5-3.9"]++;
      else distribution["<3.5"]++;
    });
    return Object.entries(distribution).map(([range, count]) => ({
      range,
      count,
    }));
  }, [carriers]);

  const stats = [
    {
      label: "Total Carriers",
      value: carriers.length,
      icon: "ri-truck-fill",
      tooltip: "Total number of carriers",
      trend: "up" as const,
    },
    {
      label: "Active",
      value: carriers.filter((c) => c.status === "ACTIVE").length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active carriers",
      trend: "up" as const,
    },
    {
      label: "Avg On-Time Rate",
      value: performanceStats
        ? `${performanceStats.avgOnTimeDelivery.toFixed(1)}%`
        : "N/A",
      icon: "ri-time-line",
      tooltip: "Average on-time delivery rate",
      trend:
        performanceStats && performanceStats.avgOnTimeDelivery >= 90
          ? ("up" as const)
          : ("neutral" as const),
    },
    {
      label: "Total Revenue",
      value: performanceStats ? performanceStats.totalRevenue : 0,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total revenue from carriers",
      trend: "up" as const,
      isCurrency: true,
    },
  ];

  const handleView = (carrier: Carrier) => {
    setSelectedCarrier(carrier);
    setShowViewModal(true);
  };

  const handlePerformance = (carrier: Carrier) => {
    setSelectedCarrier(carrier);
    setShowPerformanceModal(true);
  };

  const COLORS = ["#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <PageTemplate
      title="Carrier Management"
      description="Carrier setup, performance tracking, and management - Manage carrier relationships, track performance metrics, and optimize logistics partnerships"
      icon="ri-truck-fill"
      systemInfo={{
        sap: "Carrier Management - Transportation Setup",
        oracle: "Carrier Management, Transportation Partners",
        manhattan: "Carrier Management, Logistics Partners",
      }}
      examples={[
        "Manage carrier relationships",
        "Track performance metrics (on-time delivery, damage rates)",
        "Monitor carrier ratings and customer satisfaction",
        "Compare carrier costs and service levels",
        "Manage service types and coverage areas",
        "Integration status and capabilities",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <Tooltip content="Export Carrier Report" position="bottom">
            <button className="bg-white/5 border border-white/10 hover:border-cyan-500/50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <i className="ri-download-line"></i>
              Export
            </button>
          </Tooltip>
          <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20">
            <i className="ri-add-line"></i>
            Add Carrier
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
            placeholder="Search by Carrier Name, Code, Contact..."
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
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select
          value={selectedServiceType}
          onChange={(e) => setSelectedServiceType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Service Types</option>
          <option value="LOCAL">Local</option>
          <option value="INTERNATIONAL">International</option>
          <option value="EXPRESS">Express</option>
          <option value="STANDARD">Standard</option>
        </select>
      </div>

      {/* Analytics */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Service Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={Object.entries(serviceTypeStats).map(([type, count]) => ({
                  type,
                  count,
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, count }) => `${type}: ${count}`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="count"
              >
                {Object.entries(serviceTypeStats).map((_, index) => (
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
            Rating Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ratingDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" stroke="#9ca3af" fontSize={10} />
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
            Performance Overview
          </h3>
          {performanceStats && (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#9ca3af]">On-Time Delivery</span>
                  <span className="text-white font-medium">
                    {performanceStats.avgOnTimeDelivery.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div
                    className="bg-cyan-500 h-2 rounded-full"
                    style={{ width: `${performanceStats.avgOnTimeDelivery}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#9ca3af]">Avg Delivery Time</span>
                  <span className="text-white font-medium">
                    {performanceStats.avgDeliveryTime.toFixed(1)}h
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#9ca3af]">Damage Rate</span>
                  <span className="text-white font-medium">
                    {performanceStats.avgDamageRate.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#9ca3af]">Customer Satisfaction</span>
                  <span className="text-white font-medium">
                    {performanceStats.avgSatisfaction.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${performanceStats.avgSatisfaction}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Carriers Table */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Carrier
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Service Types
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  Shipments
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                  On-Time Rate
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
              {filteredCarriers.map((carrier, index) => (
                <motion.tr
                  key={carrier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <Tooltip
                        content={`Carrier Code: ${carrier.carrierCode}`}
                        position="right"
                      >
                        <div className="text-sm font-medium text-white cursor-help">
                          {carrier.carrierName}
                        </div>
                      </Tooltip>
                      <div className="text-xs text-[#9ca3af] font-mono">
                        {carrier.carrierCode}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-white">
                        {carrier.contactPerson}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {carrier.email}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {carrier.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {carrier.serviceTypes.map((type, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-white font-medium">
                        {carrier.rating.toFixed(1)}
                      </span>
                      <i className="ri-star-fill text-yellow-400 text-xs"></i>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Tooltip
                      content={`Total Shipments: ${carrier.totalShipments.toLocaleString()}`}
                      position="right"
                    >
                      <span className="text-sm text-white cursor-help">
                        {carrier.totalShipments.toLocaleString()}
                      </span>
                    </Tooltip>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {carrier.performance && (
                      <Tooltip
                        content={`On-Time Delivery Rate: ${carrier.performance.onTimeDeliveryRate.toFixed(1)}%`}
                        position="right"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-white/5 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                carrier.performance.onTimeDeliveryRate >= 95
                                  ? "bg-green-500"
                                  : carrier.performance.onTimeDeliveryRate >= 90
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{
                                width: `${carrier.performance.onTimeDeliveryRate}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-white cursor-help w-12 text-right">
                            {carrier.performance.onTimeDeliveryRate.toFixed(1)}%
                          </span>
                        </div>
                      </Tooltip>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        carrier.status === "ACTIVE"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                      }`}
                    >
                      {carrier.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Tooltip content="View Details" position="top">
                        <button
                          onClick={() => handleView(carrier)}
                          className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                        >
                          <i className="ri-eye-line"></i>
                        </button>
                      </Tooltip>
                      <Tooltip content="Performance Metrics" position="top">
                        <button
                          onClick={() => handlePerformance(carrier)}
                          className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                        >
                          <i className="ri-bar-chart-line"></i>
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
          setSelectedCarrier(null);
        }}
        title={`Carrier Details - ${selectedCarrier?.carrierName || ""}`}
        size="lg"
      >
        {selectedCarrier && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Carrier Code
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedCarrier.carrierCode}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedCarrier.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedCarrier.status}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Contact Person
                </label>
                <div className="text-sm text-white">
                  {selectedCarrier.contactPerson}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Email
                </label>
                <div className="text-sm text-white">
                  {selectedCarrier.email}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Phone
                </label>
                <div className="text-sm text-white">
                  {selectedCarrier.phone}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Rating
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-white font-medium">
                    {selectedCarrier.rating.toFixed(1)}
                  </span>
                  <i className="ri-star-fill text-yellow-400 text-xs"></i>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Total Shipments
                </label>
                <div className="text-sm text-white">
                  {selectedCarrier.totalShipments.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Service Types
                </label>
                <div className="flex flex-wrap gap-1">
                  {selectedCarrier.serviceTypes.map((type, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/20 text-cyan-400"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {selectedCarrier.integration && (
              <div className="pt-4 border-t border-white/10">
                <label className="text-xs text-[#9ca3af] mb-2 block">
                  Integration Capabilities
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-2">
                    <i
                      className={`ri-${selectedCarrier.integration.apiEnabled ? "check" : "close"}-line ${selectedCarrier.integration.apiEnabled ? "text-green-400" : "text-red-400"}`}
                    ></i>
                    <span className="text-sm text-white">API Enabled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i
                      className={`ri-${selectedCarrier.integration.trackingEnabled ? "check" : "close"}-line ${selectedCarrier.integration.trackingEnabled ? "text-green-400" : "text-red-400"}`}
                    ></i>
                    <span className="text-sm text-white">Tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i
                      className={`ri-${selectedCarrier.integration.labelPrinting ? "check" : "close"}-line ${selectedCarrier.integration.labelPrinting ? "text-green-400" : "text-red-400"}`}
                    ></i>
                    <span className="text-sm text-white">Label Printing</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Performance Modal */}
      <Modal
        isOpen={showPerformanceModal}
        onClose={() => {
          setShowPerformanceModal(false);
          setSelectedCarrier(null);
        }}
        title={`Performance Metrics - ${selectedCarrier?.carrierName || ""}`}
        size="lg"
      >
        {selectedCarrier && selectedCarrier.performance && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  On-Time Delivery Rate
                </label>
                <div className="text-2xl font-bold text-white">
                  {selectedCarrier.performance.onTimeDeliveryRate.toFixed(1)}%
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      selectedCarrier.performance.onTimeDeliveryRate >= 95
                        ? "bg-green-500"
                        : selectedCarrier.performance.onTimeDeliveryRate >= 90
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{
                      width: `${selectedCarrier.performance.onTimeDeliveryRate}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Average Delivery Time
                </label>
                <div className="text-2xl font-bold text-white">
                  {selectedCarrier.performance.averageDeliveryTime.toFixed(1)}h
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Damage Rate
                </label>
                <div className="text-2xl font-bold text-white">
                  {selectedCarrier.performance.damageRate.toFixed(2)}%
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Cost Per Shipment
                </label>
                <div className="text-2xl font-bold text-white">
                  <CurrencyDisplay
                    amount={selectedCarrier.performance.costPerShipment}
                    size="lg"
                  />
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Total Revenue
                </label>
                <div className="text-2xl font-bold text-white">
                  <CurrencyDisplay
                    amount={selectedCarrier.performance.totalRevenue}
                    size="lg"
                  />
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Customer Satisfaction
                </label>
                <div className="text-2xl font-bold text-white">
                  {selectedCarrier.performance.customerSatisfaction.toFixed(1)}%
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${selectedCarrier.performance.customerSatisfaction}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}

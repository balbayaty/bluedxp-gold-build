"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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
} from "recharts";
import {
  SpaceAllocation as SpaceAllocationType,
  AllocatedLocation,
} from "@/types/spaceUtilization";
import { format } from "date-fns";
import Modal from "@/components/Modal";
import Tooltip from "@/components/Tooltip";

interface SpaceAllocationProps {
  allocations: SpaceAllocationType[];
  onAllocationSelect?: (allocation: SpaceAllocationType) => void;
  className?: string;
}

export default function SpaceAllocation({
  allocations,
  onAllocationSelect,
  className = "",
}: SpaceAllocationProps) {
  const [selectedAllocation, setSelectedAllocation] =
    useState<SpaceAllocationType | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewMode, setViewMode] = useState<
    "overview" | "byCustomer" | "byType" | "utilization"
  >("overview");

  // Filter active allocations
  const activeAllocations = useMemo(() => {
    return allocations.filter((a) => a.status === "ACTIVE");
  }, [allocations]);

  // Allocation by Customer
  const allocationByCustomer = useMemo(() => {
    const customerMap = new Map<
      string,
      {
        customerName: string;
        totalArea: number;
        totalPallets: number;
        usedArea: number;
        usedPallets: number;
        utilization: number;
        count: number;
      }
    >();

    activeAllocations.forEach((allocation) => {
      const existing = customerMap.get(allocation.customerId) || {
        customerName: allocation.customerName,
        totalArea: 0,
        totalPallets: 0,
        usedArea: 0,
        usedPallets: 0,
        utilization: 0,
        count: 0,
      };

      customerMap.set(allocation.customerId, {
        customerName: allocation.customerName,
        totalArea: existing.totalArea + allocation.allocatedArea,
        totalPallets:
          existing.totalPallets + allocation.allocatedPalletPositions,
        usedArea: existing.usedArea + allocation.currentUtilization.area,
        usedPallets:
          existing.usedPallets + allocation.currentUtilization.palletPositions,
        utilization: 0, // Will calculate below
        count: existing.count + 1,
      });
    });

    return Array.from(customerMap.values())
      .map((customer) => ({
        ...customer,
        utilization: (customer.usedArea / customer.totalArea) * 100,
      }))
      .sort((a, b) => b.totalArea - a.totalArea);
  }, [activeAllocations]);

  // Allocation by Type
  const allocationByType = useMemo(() => {
    const typeMap = new Map<
      string,
      {
        type: string;
        count: number;
        totalArea: number;
        totalPallets: number;
      }
    >();

    activeAllocations.forEach((allocation) => {
      const existing = typeMap.get(allocation.allocationType) || {
        type: allocation.allocationType,
        count: 0,
        totalArea: 0,
        totalPallets: 0,
      };

      typeMap.set(allocation.allocationType, {
        type: allocation.allocationType,
        count: existing.count + 1,
        totalArea: existing.totalArea + allocation.allocatedArea,
        totalPallets:
          existing.totalPallets + allocation.allocatedPalletPositions,
      });
    });

    return Array.from(typeMap.values());
  }, [activeAllocations]);

  // Utilization Distribution
  const utilizationDistribution = useMemo(() => {
    const ranges = [
      { range: "0-25%", min: 0, max: 25 },
      { range: "25-50%", min: 25, max: 50 },
      { range: "50-75%", min: 50, max: 75 },
      { range: "75-90%", min: 75, max: 90 },
      { range: "90-100%", min: 90, max: 100 },
    ];

    return ranges.map((range) => ({
      range: range.range,
      count: activeAllocations.filter((a) => {
        const util = a.currentUtilization.percentage;
        return util >= range.min && util < range.max;
      }).length,
    }));
  }, [activeAllocations]);

  const handleAllocationClick = (allocation: SpaceAllocationType) => {
    setSelectedAllocation(allocation);
    setShowDetailsModal(true);
    onAllocationSelect?.(allocation);
  };

  const COLORS = {
    DEDICATED: "#8b5cf6",
    SHARED: "#06b6d4",
    DYNAMIC: "#10b981",
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">Total Allocations</div>
          <div className="text-2xl font-bold text-white">
            {activeAllocations.length}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">
            Total Allocated Area
          </div>
          <div className="text-2xl font-bold text-white">
            {activeAllocations
              .reduce((sum, a) => sum + a.allocatedArea, 0)
              .toLocaleString()}{" "}
            m²
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">
            Total Pallet Positions
          </div>
          <div className="text-2xl font-bold text-white">
            {activeAllocations
              .reduce((sum, a) => sum + a.allocatedPalletPositions, 0)
              .toLocaleString()}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">Avg Utilization</div>
          <div className="text-2xl font-bold text-white">
            {activeAllocations.length > 0
              ? (
                  activeAllocations.reduce(
                    (sum, a) => sum + a.currentUtilization.percentage,
                    0,
                  ) / activeAllocations.length
                ).toFixed(1)
              : 0}
            %
          </div>
        </motion.div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
        {(["overview", "byCustomer", "byType", "utilization"] as const).map(
          (mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                viewMode === mode
                  ? "bg-cyan-500 text-white"
                  : "text-[#9ca3af] hover:text-white hover:bg-white/5"
              }`}
            >
              {mode === "byCustomer"
                ? "By Customer"
                : mode === "byType"
                  ? "By Type"
                  : mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ),
        )}
      </div>

      {/* Overview - Allocations List */}
      {viewMode === "overview" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeAllocations.map((allocation) => (
            <motion.div
              key={allocation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleAllocationClick(allocation)}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 cursor-pointer hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white mb-1">
                    {allocation.customerName}
                  </h4>
                  <p className="text-xs text-[#9ca3af]">
                    {allocation.customerId}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    allocation.allocationType === "DEDICATED"
                      ? "bg-purple-500/20 text-purple-400"
                      : allocation.allocationType === "SHARED"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {allocation.allocationType}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9ca3af]">Allocated Area</span>
                  <span className="text-white font-medium">
                    {allocation.allocatedArea.toLocaleString()} m²
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9ca3af]">Used Area</span>
                  <span className="text-white font-medium">
                    {allocation.currentUtilization.area.toLocaleString()} m²
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9ca3af]">Utilization</span>
                  <span className="text-white font-medium">
                    {allocation.currentUtilization.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mt-2">
                  <div
                    className={`h-full ${
                      allocation.currentUtilization.percentage >= 90
                        ? "bg-red-500"
                        : allocation.currentUtilization.percentage >= 75
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{
                      width: `${allocation.currentUtilization.percentage}%`,
                    }}
                  ></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* By Customer */}
      {viewMode === "byCustomer" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-bar-chart-box-line text-cyan-400 text-lg"></i>
            <span>Allocation by Customer</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={allocationByCustomer}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="customerName"
                stroke="#9ca3af"
                fontSize={12}
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
              <Bar dataKey="totalArea" fill="#06b6d4" name="Total Area (m²)" />
              <Bar dataKey="usedArea" fill="#10b981" name="Used Area (m²)" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* By Type */}
      {viewMode === "byType" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-pie-chart-line text-cyan-400 text-lg"></i>
            <span>Allocation by Type</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={allocationByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, totalArea }) =>
                  `${type}: ${totalArea.toLocaleString()} m²`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="totalArea"
              >
                {allocationByType.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      COLORS[entry.type as keyof typeof COLORS] || "#374151"
                    }
                  />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Utilization Distribution */}
      {viewMode === "utilization" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-bar-chart-2-line text-cyan-400 text-lg"></i>
            <span>Utilization Distribution</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={utilizationDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" stroke="#9ca3af" fontSize={12} />
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
                dataKey="count"
                fill="#06b6d4"
                name="Number of Allocations"
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedAllocation(null);
        }}
        title={`Space Allocation - ${selectedAllocation?.customerName || ""}`}
        size="lg"
      >
        {selectedAllocation && (
          <div className="space-y-6">
            {/* Allocation Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Allocation Type
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium inline-block ${
                    selectedAllocation.allocationType === "DEDICATED"
                      ? "bg-purple-500/20 text-purple-400"
                      : selectedAllocation.allocationType === "SHARED"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {selectedAllocation.allocationType}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium inline-block ${
                    selectedAllocation.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : selectedAllocation.status === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedAllocation.status}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Allocated Area
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedAllocation.allocatedArea.toLocaleString()} m²
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Pallet Positions
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedAllocation.allocatedPalletPositions.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Current Utilization
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedAllocation.currentUtilization.percentage.toFixed(1)}%
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Monthly Fee
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedAllocation.pricing.monthlyFee.toLocaleString()}{" "}
                  {selectedAllocation.pricing.currency}
                </div>
              </div>
            </div>

            {/* Locations */}
            {selectedAllocation.locations.length > 0 && (
              <div>
                <label className="text-xs text-[#9ca3af] mb-2 block">
                  Allocated Locations
                </label>
                <div className="bg-white/5 rounded-lg p-3 max-h-48 overflow-y-auto">
                  <div className="space-y-2">
                    {selectedAllocation.locations.map((location, index) => (
                      <div key={index} className="text-xs text-white">
                        {location.locationCode} - {location.area} m² (
                        {location.palletPositions} pallets)
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Terms */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Start Date
                </label>
                <div className="text-sm text-white">
                  {format(
                    new Date(selectedAllocation.startDate),
                    "MMM dd, yyyy",
                  )}
                </div>
              </div>
              {selectedAllocation.endDate && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    End Date
                  </label>
                  <div className="text-sm text-white">
                    {format(
                      new Date(selectedAllocation.endDate),
                      "MMM dd, yyyy",
                    )}
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Auto Renew
                </label>
                <div className="text-sm text-white">
                  {selectedAllocation.autoRenew ? "Yes" : "No"}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Minimum Commitment
                </label>
                <div className="text-sm text-white">
                  {selectedAllocation.minimumCommitment.toLocaleString()} m²
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

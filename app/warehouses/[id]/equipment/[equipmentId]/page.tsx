"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { Equipment } from "@/types/warehouse-management";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface EquipmentDetailPageProps {}

const EquipmentDetailPage: React.FC<EquipmentDetailPageProps> = () => {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params?.id as string;
  const equipmentId = params?.equipmentId as string;

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [performanceHistory, setPerformanceHistory] = useState<
    Array<{ date: Date; efficiency: number }>
  >([]);

  useEffect(() => {
    loadEquipmentData();
  }, [equipmentId, warehouseId]);

  const loadEquipmentData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/warehouse/${warehouseId}/equipment/${equipmentId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setEquipment(data.equipment);
        setPerformanceHistory(data.performanceHistory || []);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error loading equipment:", error);
    }

    // Fallback to mock data
    const mockEquipment: Equipment = {
      id: equipmentId,
      name: "Forklift A1",
      type: "forklift",
      status: "operational",
      battery: 87,
      lastMaintenance: new Date("2024-01-15"),
      nextMaintenance: new Date("2024-02-15"),
      efficiency: 94.5,
      location: { x: 10, y: 20 },
    };
    setEquipment(mockEquipment);

    // Generate mock performance history
    const mockHistory = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
      efficiency: 94.5 + (Math.random() - 0.5) * 5,
    }));
    setPerformanceHistory(mockHistory);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <PageTemplate
        title="Loading Equipment..."
        description="Please wait while we load equipment details"
        icon="ri-tools-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <i className="ri-loader-4-line text-6xl text-cyan-400 animate-spin mb-4"></i>
            <p className="text-white text-lg">
              Loading equipment information...
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (!equipment) {
    return (
      <PageTemplate
        title="Equipment Not Found"
        description="The requested equipment could not be found"
        icon="ri-tools-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <i className="ri-error-warning-line text-6xl text-red-400 mb-4"></i>
            <p className="text-white text-lg mb-4">Equipment not found</p>
            <button
              onClick={() => router.push(`/warehouses/${warehouseId}`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Warehouse
            </button>
          </div>
        </div>
      </PageTemplate>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "maintenance":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const daysUntilMaintenance = Math.ceil(
    (new Date(equipment.nextMaintenance).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <PageTemplate
      title={equipment.name}
      description={`${equipment.type} • ${warehouseId}`}
      icon="ri-tools-line"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/warehouses/${warehouseId}`)}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30"
          >
            <i className="ri-arrow-left-line mr-1"></i>
            Back
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Status</p>
                <p className="text-2xl font-bold text-white mt-1 capitalize">
                  {equipment.status}
                </p>
              </div>
              <i className="ri-checkbox-circle-line text-3xl text-green-400"></i>
            </div>
            <span
              className={`px-3 py-1 rounded text-xs font-medium border ${getStatusColor(equipment.status)}`}
            >
              {equipment.status}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Efficiency</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {equipment.efficiency.toFixed(1)}%
                </p>
              </div>
              <i className="ri-speed-up-line text-3xl text-cyan-400"></i>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mt-2">
              <div
                className="bg-cyan-400 h-2 rounded-full"
                style={{ width: `${equipment.efficiency}%` }}
              />
            </div>
          </motion.div>

          {equipment.battery !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-[#9ca3af]">Battery Level</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {Math.round(equipment.battery)}%
                  </p>
                </div>
                <i className="ri-flashlight-line text-3xl text-purple-400"></i>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${
                    equipment.battery > 50
                      ? "bg-green-400"
                      : equipment.battery > 20
                        ? "bg-yellow-400"
                        : "bg-red-400"
                  }`}
                  style={{ width: `${equipment.battery}%` }}
                />
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Next Maintenance</p>
                <p className="text-xl font-bold text-white mt-1">
                  {daysUntilMaintenance} days
                </p>
              </div>
              <i className="ri-tools-line text-3xl text-orange-400"></i>
            </div>
            <p className="text-xs text-[#9ca3af]">
              {new Date(equipment.nextMaintenance).toLocaleDateString()}
            </p>
          </motion.div>
        </div>

        {/* Equipment Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-information-line mr-2 text-blue-400"></i>
              Equipment Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Equipment ID</span>
                <span className="text-white font-medium">{equipment.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Type</span>
                <span className="text-white font-medium capitalize">
                  {equipment.type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Location</span>
                <span className="text-white font-medium">
                  X: {equipment.location.x}, Y: {equipment.location.y}
                  {equipment.location.z !== undefined &&
                    `, Z: ${equipment.location.z}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Last Maintenance</span>
                <span className="text-white font-medium">
                  {new Date(equipment.lastMaintenance).toLocaleDateString()}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-line-chart-line mr-2 text-cyan-400"></i>
              Performance Trend (Last 30 Days)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={performanceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis stroke="#9ca3af" fontSize={12} domain={[85, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(value: number) => [
                    `${value.toFixed(1)}%`,
                    "Efficiency",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ fill: "#06b6d4", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Maintenance Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <i className="ri-calendar-line mr-2 text-yellow-400"></i>
            Maintenance Schedule
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-sm text-[#9ca3af] mb-1">Last Maintenance</p>
              <p className="text-white font-medium">
                {new Date(equipment.lastMaintenance).toLocaleDateString()}
              </p>
              <p className="text-xs text-[#9ca3af] mt-1">
                {Math.ceil(
                  (Date.now() - new Date(equipment.lastMaintenance).getTime()) /
                    (1000 * 60 * 60 * 24),
                )}{" "}
                days ago
              </p>
            </div>
            <div
              className={`p-4 rounded-lg border ${
                daysUntilMaintenance <= 7
                  ? "bg-red-500/10 border-red-500/30"
                  : daysUntilMaintenance <= 14
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-green-500/10 border-green-500/30"
              }`}
            >
              <p className="text-sm text-[#9ca3af] mb-1">Next Maintenance</p>
              <p className="text-white font-medium">
                {new Date(equipment.nextMaintenance).toLocaleDateString()}
              </p>
              <p
                className={`text-xs font-medium mt-1 ${
                  daysUntilMaintenance <= 7
                    ? "text-red-400"
                    : daysUntilMaintenance <= 14
                      ? "text-yellow-400"
                      : "text-green-400"
                }`}
              >
                {daysUntilMaintenance} days remaining
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTemplate>
  );
};

export default EquipmentDetailPage;

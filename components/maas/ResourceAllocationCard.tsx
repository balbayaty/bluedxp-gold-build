/**
 * Resource Allocation Card
 *
 * Comprehensive resource allocation management
 * - Current allocations
 * - Utilization by pillar
 * - Optimization recommendations
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  TrendingUp,
  AlertCircle,
  Maximize2,
  Minimize2,
  BarChart3,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ResourceAllocationCardProps {
  data?: any;
  expanded: boolean;
  onToggle: () => void;
}

export default function ResourceAllocationCard({
  data,
  expanded,
  onToggle,
}: ResourceAllocationCardProps) {
  // Sample allocation data
  const allocationData = [
    {
      pillar: "Smart Factory",
      allocated: 1000,
      utilized: 750,
      utilization: 75,
    },
    { pillar: "Robotics", allocated: 500, utilized: 400, utilization: 80 },
    { pillar: "Quality Labs", allocated: 300, utilized: 180, utilization: 60 },
    { pillar: "Logistics", allocated: 800, utilized: 640, utilization: 80 },
    { pillar: "Training", allocated: 200, utilized: 100, utilization: 50 },
  ];

  const totalAllocated = allocationData.reduce(
    (sum, item) => sum + item.allocated,
    0,
  );
  const totalUtilized = allocationData.reduce(
    (sum, item) => sum + item.utilized,
    0,
  );
  const overallUtilization = (totalUtilized / totalAllocated) * 100;

  const chartData = allocationData.map((item) => ({
    name: item.pillar.substring(0, 10),
    allocated: item.allocated,
    utilized: item.utilized,
    utilization: item.utilization,
  }));

  const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <Package className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Resource Allocation
              </h3>
              <p className="text-sm text-gray-400">
                Overall utilization: {overallUtilization.toFixed(1)}%
              </p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            {expanded ? (
              <Minimize2 className="w-5 h-5 text-gray-400" />
            ) : (
              <Maximize2 className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Total Allocated</p>
            <p className="text-xl font-bold text-white">
              {totalAllocated.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Total Utilized</p>
            <p className="text-xl font-bold text-white">
              {totalUtilized.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Utilization</p>
            <p className="text-xl font-bold text-white">
              {overallUtilization.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Chart */}
        {expanded && (
          <AnimatePresence>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4"
            >
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="allocated"
                      fill="#374151"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="utilized"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Allocation Details */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">
                  By Pillar
                </h4>
                {allocationData.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">
                        {item.pillar}
                      </span>
                      <span className="text-sm text-gray-400">
                        {item.utilized}/{item.allocated}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          item.utilization > 80
                            ? "bg-green-500"
                            : item.utilization > 60
                              ? "bg-blue-500"
                              : "bg-amber-500"
                        }`}
                        style={{ width: `${item.utilization}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
                      <span>Utilization: {item.utilization}%</span>
                      {item.utilization < 60 && (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Low utilization
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

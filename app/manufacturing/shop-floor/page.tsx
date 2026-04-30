"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

interface ShopFloorStatus {
  workCenter: string;
  workCenterName: string;
  status: "RUNNING" | "IDLE" | "SETUP" | "MAINTENANCE" | "DOWN";
  currentOrder?: string;
  operator?: string;
  efficiency: number;
  productionRate: number;
  downtime: number;
  lastUpdate: Date;
}

export default function ShopFloorPage() {
  const [selectedWorkCenter, setSelectedWorkCenter] = useState<string>("ALL");

  const [shopFloorStatuses] = useState<ShopFloorStatus[]>(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      workCenter: `WC-${i + 1}`,
      workCenterName: `Work Center ${i + 1}`,
      status: ["RUNNING", "IDLE", "SETUP", "MAINTENANCE", "DOWN"][
        Math.floor(Math.random() * 5)
      ] as ShopFloorStatus["status"],
      currentOrder:
        Math.random() > 0.3
          ? `WO-${String(Math.floor(Math.random() * 100)).padStart(6, "0")}`
          : undefined,
      operator: Math.random() > 0.2 ? `Operator-${(i % 10) + 1}` : undefined,
      efficiency: 80 + Math.random() * 20,
      productionRate: Math.floor(Math.random() * 100) + 50,
      downtime: Math.floor(Math.random() * 120),
      lastUpdate: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
    }));
  });

  const filteredStatuses = useMemo(() => {
    if (selectedWorkCenter === "ALL") return shopFloorStatuses;
    return shopFloorStatuses.filter(
      (sfs) => sfs.workCenter === selectedWorkCenter,
    );
  }, [shopFloorStatuses, selectedWorkCenter]);

  const stats = [
    {
      label: "Running",
      value: shopFloorStatuses.filter((sfs) => sfs.status === "RUNNING").length,
      icon: "ri-play-circle-line",
      tooltip: "Work centers running",
      trend: "up" as const,
    },
    {
      label: "Idle",
      value: shopFloorStatuses.filter((sfs) => sfs.status === "IDLE").length,
      icon: "ri-pause-circle-line",
      tooltip: "Work centers idle",
      trend: "neutral" as const,
    },
    {
      label: "Maintenance",
      value: shopFloorStatuses.filter((sfs) => sfs.status === "MAINTENANCE")
        .length,
      icon: "ri-tools-line",
      tooltip: "Work centers in maintenance",
      trend: "neutral" as const,
    },
    {
      label: "Down",
      value: shopFloorStatuses.filter((sfs) => sfs.status === "DOWN").length,
      icon: "ri-error-warning-line",
      tooltip: "Work centers down",
      trend: "down" as const,
    },
    {
      label: "Avg Efficiency",
      value: `${(shopFloorStatuses.reduce((sum, sfs) => sum + sfs.efficiency, 0) / shopFloorStatuses.length).toFixed(1)}%`,
      icon: "ri-line-chart-line",
      tooltip: "Average efficiency",
      trend: "up" as const,
    },
    {
      label: "Total Downtime",
      value: `${(shopFloorStatuses.reduce((sum, sfs) => sum + sfs.downtime, 0) / 60).toFixed(1)}h`,
      icon: "ri-time-line",
      tooltip: "Total downtime today",
      trend: "neutral" as const,
    },
  ];

  return (
    <PageTemplate
      title="Shop Floor Control"
      description="Real-time shop floor monitoring, work center status, production tracking, and operational control"
      shortDescription="Real-time shop floor monitoring and control"
      icon="ri-building-2-line"
      stats={stats}
      actions={
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <select
            value={selectedWorkCenter}
            onChange={(e) => setSelectedWorkCenter(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Work Centers</option>
            {shopFloorStatuses.map((sfs) => (
              <option key={sfs.workCenter} value={sfs.workCenter}>
                {sfs.workCenterName}
              </option>
            ))}
          </select>
          <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-2">
            <i className="ri-refresh-line"></i>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
            <i className="ri-dashboard-line text-cyan-400 text-lg"></i>
            <span>Work Center Status</span>
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStatuses.map((sfs, index) => (
              <motion.div
                key={sfs.workCenter}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white/5 border rounded-xl p-4 transition-all ${
                  sfs.status === "RUNNING"
                    ? "border-green-500/50 hover:border-green-500"
                    : sfs.status === "DOWN"
                      ? "border-red-500/50 hover:border-red-500"
                      : sfs.status === "MAINTENANCE"
                        ? "border-yellow-500/50 hover:border-yellow-500"
                        : "border-white/10 hover:border-cyan-500/50"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">
                      {sfs.workCenterName}
                    </h4>
                    <p className="text-xs text-[#9ca3af]">{sfs.workCenter}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      sfs.status === "RUNNING"
                        ? "bg-green-500/20 text-green-400"
                        : sfs.status === "DOWN"
                          ? "bg-red-500/20 text-red-400"
                          : sfs.status === "MAINTENANCE"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : sfs.status === "SETUP"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {sfs.status}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {sfs.currentOrder && (
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Current Order</span>
                      <span className="text-white font-medium">
                        {sfs.currentOrder}
                      </span>
                    </div>
                  )}
                  {sfs.operator && (
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Operator</span>
                      <span className="text-white">{sfs.operator}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#9ca3af]">Efficiency</span>
                    <span className="text-white">
                      {sfs.efficiency.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9ca3af]">Production Rate</span>
                    <span className="text-white">
                      {sfs.productionRate} units/h
                    </span>
                  </div>
                  {sfs.downtime > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Downtime</span>
                      <span className="text-yellow-400">
                        {sfs.downtime} min
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${
                          sfs.efficiency >= 90
                            ? "bg-green-500"
                            : sfs.efficiency >= 75
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${sfs.efficiency}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageTemplate>
  );
}

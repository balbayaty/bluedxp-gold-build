"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from "recharts";
import PageTemplate from "@/components/PageTemplate";

interface CapacityPlan {
  workCenter: string;
  workCenterName: string;
  availableHours: number;
  plannedHours: number;
  actualHours: number;
  utilization: number;
  efficiency: number;
  capacity: number;
  load: number;
}

export default function CapacityPlanningPage() {
  const [selectedWorkCenter, setSelectedWorkCenter] = useState<string>("ALL");

  const [capacityPlans] = useState<CapacityPlan[]>(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      workCenter: `WC-${i + 1}`,
      workCenterName: `Work Center ${i + 1}`,
      availableHours: 160,
      plannedHours: 120 + Math.random() * 40,
      actualHours: 100 + Math.random() * 30,
      utilization: 75 + Math.random() * 20,
      efficiency: 85 + Math.random() * 15,
      capacity: 160,
      load: 75 + Math.random() * 20,
    }));
  });

  const filteredPlans = useMemo(() => {
    if (selectedWorkCenter === "ALL") return capacityPlans;
    return capacityPlans.filter((cp) => cp.workCenter === selectedWorkCenter);
  }, [capacityPlans, selectedWorkCenter]);

  const chartData = useMemo(() => {
    return filteredPlans.map((cp) => ({
      name: cp.workCenter,
      available: cp.availableHours,
      planned: cp.plannedHours,
      actual: cp.actualHours,
      utilization: cp.utilization,
      efficiency: cp.efficiency,
    }));
  }, [filteredPlans]);

  const stats = [
    {
      label: "Work Centers",
      value: capacityPlans.length,
      icon: "ri-building-2-line",
      tooltip: "Total work centers",
      trend: "neutral" as const,
    },
    {
      label: "Avg Utilization",
      value: `${(capacityPlans.reduce((sum, cp) => sum + cp.utilization, 0) / capacityPlans.length).toFixed(1)}%`,
      icon: "ri-dashboard-line",
      tooltip: "Average utilization",
      trend: "up" as const,
    },
    {
      label: "Avg Efficiency",
      value: `${(capacityPlans.reduce((sum, cp) => sum + cp.efficiency, 0) / capacityPlans.length).toFixed(1)}%`,
      icon: "ri-line-chart-line",
      tooltip: "Average efficiency",
      trend: "up" as const,
    },
    {
      label: "Over Capacity",
      value: capacityPlans.filter((cp) => cp.load > 100).length,
      icon: "ri-alert-line",
      tooltip: "Work centers over capacity",
      trend: "neutral" as const,
    },
  ];

  return (
    <PageTemplate
      title="Capacity Planning"
      description="Plan and monitor work center capacity, utilization, and efficiency to optimize production scheduling"
      shortDescription="Work center capacity planning and optimization"
      icon="ri-calendar-todo-line"
      stats={stats}
      actions={
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <select
            value={selectedWorkCenter}
            onChange={(e) => setSelectedWorkCenter(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Work Centers</option>
            {capacityPlans.map((cp) => (
              <option key={cp.workCenter} value={cp.workCenter}>
                {cp.workCenterName}
              </option>
            ))}
          </select>
          <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-2">
            <i className="ri-calendar-line"></i>
            <span className="hidden sm:inline">Generate Plan</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Capacity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
            <i className="ri-bar-chart-box-line text-cyan-400 text-lg"></i>
            <span>Capacity Overview</span>
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#9ca3af"
                fontSize={12}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar
                yAxisId="left"
                dataKey="available"
                fill="#374151"
                name="Available Hours"
              />
              <Bar
                yAxisId="left"
                dataKey="planned"
                fill="#06b6d4"
                name="Planned Hours"
              />
              <Bar
                yAxisId="left"
                dataKey="actual"
                fill="#10b981"
                name="Actual Hours"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="utilization"
                stroke="#f59e0b"
                strokeWidth={3}
                name="Utilization %"
              />
              <Legend />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Work Center Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
            <i className="ri-building-2-line text-cyan-400 text-lg"></i>
            <span>Work Center Details</span>
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlans.map((cp, index) => (
              <motion.div
                key={cp.workCenter}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <h4 className="text-sm font-semibold text-white mb-3">
                  {cp.workCenterName}
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#9ca3af]">Utilization</span>
                      <span className="text-white">
                        {cp.utilization.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${
                          cp.utilization >= 80
                            ? "bg-green-500"
                            : cp.utilization >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${cp.utilization}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#9ca3af]">Efficiency</span>
                      <span className="text-white">
                        {cp.efficiency.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${
                          cp.efficiency >= 90
                            ? "bg-green-500"
                            : cp.efficiency >= 75
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${cp.efficiency}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10">
                    <div>
                      <div className="text-[#9ca3af]">Available</div>
                      <div className="text-white font-medium">
                        {cp.availableHours.toFixed(1)}h
                      </div>
                    </div>
                    <div>
                      <div className="text-[#9ca3af]">Planned</div>
                      <div className="text-white font-medium">
                        {cp.plannedHours.toFixed(1)}h
                      </div>
                    </div>
                    <div>
                      <div className="text-[#9ca3af]">Actual</div>
                      <div className="text-white font-medium">
                        {cp.actualHours.toFixed(1)}h
                      </div>
                    </div>
                    <div>
                      <div className="text-[#9ca3af]">Load</div>
                      <div
                        className={`font-medium ${cp.load > 100 ? "text-red-400" : "text-white"}`}
                      >
                        {cp.load.toFixed(1)}%
                      </div>
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

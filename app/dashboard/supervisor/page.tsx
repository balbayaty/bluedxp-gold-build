"use client";

import { useState, useMemo, useEffect } from "react";
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
import PageTemplate from "@/components/PageTemplate";
import { useAuth } from "@/contexts/AuthContext";
import { useViewContext } from "@/contexts/ViewContextProvider";

type TaskItem = {
  id: string;
  taskNumber: string;
  type: string;
  priority: string;
  status: string;
  assignee: string;
  zone: string;
};

type ExceptionItem = {
  id: string;
  type: string;
  location: string;
  item: string;
  reportedBy: string;
  time: string;
};

export default function WarehouseSupervisorDashboard() {
  const { user } = useAuth();
  const { context } = useViewContext();
  const [viewMode, setViewMode] = useState<
    "shift" | "tasks" | "exceptions" | "team"
  >("shift");
  const [whatsappAlert, setWhatsappAlert] = useState<any>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [metrics, setMetrics] = useState({
    openTasks: 0,
    activeExceptions: 0,
    shiftProgress: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch supervisor dashboard data
  useEffect(() => {
    async function loadSupervisorData() {
      const targetTenant = user?.tenantId || "tenant-1";
      setLoading(true);
      try {
        const warehouseIdParam =
          context.warehouseFilter.type === "SINGLE" &&
          context.warehouseFilter.warehouseIds?.[0]
            ? `&warehouseId=${context.warehouseFilter.warehouseIds[0]}`
            : "";

        const response = await fetch(
          `/api/dashboards/supervisor?tenantId=${targetTenant}${warehouseIdParam}`,
        );
        const result = await response.json();

        if (result.success && result.data) {
          setTasks(result.data.tasks || []);
          setExceptions(result.data.exceptions || []);
          setMetrics(result.data.metrics || {
            openTasks: 0,
            activeExceptions: 0,
            shiftProgress: 0,
          });
        } else {
          console.error("API returned error:", result.error);
        }
      } catch (error) {
        console.error("Failed to load supervisor data:", error);
        // Set empty data on error
        setTasks([]);
        setExceptions([]);
        setMetrics({ openTasks: 0, activeExceptions: 0, shiftProgress: 0 });
      } finally {
        setLoading(false);
      }
    }
    loadSupervisorData();
  }, [user?.tenantId, context.warehouseFilter]);

  // Inject WhatsApp Intelligence (Live Field Feeding)
  useEffect(() => {
    // Simulate a new distress message coming from the driver network
    const incomingMessage =
      "URGENT: Tanker 44 has a leak near highway exit 9. Chemical smell is strong. Requesting hazmat team.";

    fetch("/api/ai/whatsapp-debug", {
      method: "POST",
      body: JSON.stringify({ message: incomingMessage }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.category === "accident") {
          // Delay to simulate "Live Arrival"
          setTimeout(() => setWhatsappAlert(data), 2000);
        }
      })
      .catch((err) =>
        console.error("Failed to connect to WhatsApp Brain:", err),
      );
  }, []);

  const stats = [
    {
      label: "Open Tasks",
      value: metrics.openTasks.toString(),
      icon: "ri-task-line",
      tooltip: "Tasks requiring completion this shift",
      trend: "down" as const,
    },
    {
      label: "Active Exceptions",
      value: (metrics.activeExceptions + (whatsappAlert ? 1 : 0)).toString(),
      icon: "ri-alarm-warning-line",
      tooltip: "Operational blockers needing resolution",
      trend: "down" as const,
      color: "text-red-400",
    },
    {
      label: "Team Online",
      value: "8 / 10",
      icon: "ri-user-follow-line",
      tooltip: "Operators currently clocked in",
      trend: "neutral" as const,
    },
    {
      label: "Shift Progress",
      value: `${metrics.shiftProgress}%`,
      icon: "ri-timer-line",
      tooltip: "Percentage of shift completed",
      trend: "neutral" as const,
    },
  ];

  if (loading) {
    return (
      <PageTemplate
        title="Supervisor Dashboard"
        description="Loading supervisor data..."
        icon="ri-shield-star-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading supervisor data...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Supervisor Dashboard"
      description="Manage your shift, assign tasks to your team, and resolve operational exceptions."
      shortDescription="Shift Management"
      icon="ri-shield-star-line"
      systemInfo={{
        sap: "Supervisor Cockpit",
        oracle: "Warehouse Supervisor",
        manhattan: "Labor Management",
      }}
      stats={stats}
      actions={
        <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 flex-shrink-0">
          {(["shift", "tasks", "exceptions", "team"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 sm:px-4 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 min-h-[36px] whitespace-nowrap flex-shrink-0 ${
                viewMode === mode
                  ? "bg-cyan-500 text-white"
                  : "text-[#9ca3af] hover:text-white hover:bg-white/5"
              }`}
            >
              <i
                className={`ri-${
                  mode === "shift"
                    ? "timer-flash-line"
                    : mode === "tasks"
                      ? "task-line"
                      : mode === "exceptions"
                        ? "error-warning-line"
                        : "team-line"
                } text-sm sm:text-base`}
              ></i>
              <span className="hidden sm:inline">
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </span>
            </button>
          ))}
        </div>
      }
    >
      {/* Shift Overview */}
      {viewMode === "shift" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-6">
                Shift Goals Progress
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2 text-white">
                    <span>Outbound Orders</span>
                    <span>450 / 600</span>
                  </div>
                  <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full w-[75%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2 text-white">
                    <span>Replenishments</span>
                    <span>24 / 80</span>
                  </div>
                  <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full w-[30%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2 text-white">
                    <span>Cycle Counts</span>
                    <span>115 / 120</span>
                  </div>
                  <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full w-[95%]"></div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Notifications
              </h3>
              <div className="space-y-3">
                {/* WhatsApp Alert Injection */}
                {whatsappAlert && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-purple-600/20 border border-purple-500 rounded-lg flex gap-3 shadow-[0_0_15px_rgba(147,51,234,0.3)] animate-pulse"
                  >
                    <i className="ri-whatsapp-fill text-green-400 mt-1 text-xl"></i>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        FIELD INCIDENT REPORT
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500 text-white uppercase tracking-wider">
                          CRITICAL
                        </span>
                      </div>
                      <div className="text-xs text-gray-300 mt-1">
                        {whatsappAlert.details?.summary ||
                          "Analysis complete. Human review required."}
                      </div>
                      <div className="text-xs text-purple-300 mt-1 font-mono">
                        Loc: {whatsappAlert.details?.location || "Unknown"} |
                        Type: {whatsappAlert.category}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3">
                  <i className="ri-alarm-warning-fill text-red-500 mt-1"></i>
                  <div>
                    <div className="text-sm font-bold text-white">
                      Safety Incident Reported
                    </div>
                    <div className="text-xs text-gray-400">
                      Zone B, Aisle 4 - Spill detected.
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex gap-3">
                  <i className="ri-time-fill text-yellow-500 mt-1"></i>
                  <div>
                    <div className="text-sm font-bold text-white">
                      Truck Arrival Delayed
                    </div>
                    <div className="text-xs text-gray-400">
                      Inbound Dock 3 - 30 min delay.
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3">
                  <i className="ri-information-fill text-blue-500 mt-1"></i>
                  <div>
                    <div className="text-sm font-bold text-white">
                      Shift Huddle Reminder
                    </div>
                    <div className="text-xs text-gray-400">
                      Main floor - 2:00 PM.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Task Board */}
      {viewMode === "tasks" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">
              Task Assignment
            </h3>
            <button className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm transition-colors">
              + Add Task
            </button>
          </div>
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Zone
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Priority
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Assignee
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 text-white font-mono text-sm">
                    {task.id}
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {task.type}
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {task.zone}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        task.priority === "Critical"
                          ? "bg-red-500/20 text-red-400"
                          : task.priority === "High"
                            ? "bg-orange-500/20 text-orange-400"
                            : task.priority === "Medium"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        task.status === "Completed"
                          ? "bg-green-500/20 text-green-400"
                          : task.status === "In Progress"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {task.assignee === "Unassigned" ? (
                      <span className="text-gray-500 italic">Unassigned</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                          {task.assignee.split("-")[1]}
                        </div>
                        {task.assignee}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-cyan-400 hover:text-cyan-300 text-sm hover:underline">
                      {task.assignee === "Unassigned" ? "Assign" : "Reassign"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Exceptions View */}
      {viewMode === "exceptions" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exceptions.map((ex) => (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-red-500/40 transition-colors"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className="ri-error-warning-fill text-6xl text-red-500"></i>
              </div>

              <div className="flex justify-between items-start mb-4 relative z-10">
                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold uppercase">
                  {ex.type}
                </span>
                <span className="text-xs text-gray-400">{ex.time}</span>
              </div>

              <h4 className="text-xl font-bold text-white mb-2 relative z-10">
                {ex.location}
              </h4>
              <p className="text-gray-400 text-sm mb-6 relative z-10">
                Reported by {ex.reportedBy}
                {ex.item !== "N/A" && ` • Item: ${ex.item}`}
              </p>

              <div className="flex gap-2 relative z-10">
                <button className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm font-medium">
                  Investigate
                </button>
                <button className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                  <i className="ri-check-line"></i>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Team View */}
      {viewMode === "team" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Team Status</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              "John D. (Op-244)",
              "Sarah M. (Op-245)",
              "Mike T. (Op-246)",
              "Lisa R. (Rec-01)",
              "Tom H. (FL-03)",
            ].map((name, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-cyan-500/50 transition-colors cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${
                    i === 3 ? "bg-yellow-500" : "bg-green-600"
                  }`}
                >
                  {name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{name}</div>
                  <div className="text-xs text-gray-400">
                    {i === 3 ? "On Break" : "Active"} • Zone{" "}
                    {String.fromCharCode(65 + i)}
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-center text-gray-400 border-dashed hover:text-white hover:border-white/30 transition-colors cursor-pointer">
              <div className="text-center">
                <i className="ri-add-line text-2xl mb-1 block"></i>
                <span className="text-sm">Manage Roster</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageTemplate>
  );
}

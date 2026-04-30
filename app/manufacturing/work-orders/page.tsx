"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import PageTemplate from "@/components/PageTemplate";

interface WorkOrder {
  id: string;
  orderNumber: string;
  productionOrderId: string;
  operation: string;
  operationDescription: string;
  workCenter: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  operator?: string;
  setupTime: number;
  runTime: number;
  completion: number;
}

export default function WorkOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [workOrders] = useState<WorkOrder[]>(() => {
    return Array.from({ length: 75 }, (_, i) => ({
      id: `WO-${i + 1}`,
      orderNumber: `WO-${String(i + 1).padStart(6, "0")}`,
      productionOrderId: `PO-${Math.floor(i / 2) + 1}`,
      operation: `OP-${(i % 5) + 1}`,
      operationDescription: `Operation ${(i % 5) + 1} Description`,
      workCenter: `WC-${(i % 5) + 1}`,
      status: ["PENDING", "IN_PROGRESS", "COMPLETED", "ON_HOLD"][
        Math.floor(Math.random() * 4)
      ] as WorkOrder["status"],
      plannedStart: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
      ),
      plannedEnd: new Date(
        Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000,
      ),
      actualStart:
        Math.random() > 0.5
          ? new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000)
          : undefined,
      actualEnd:
        Math.random() > 0.3
          ? new Date(Date.now() - Math.random() * 1 * 24 * 60 * 60 * 1000)
          : undefined,
      operator: `Operator-${(i % 10) + 1}`,
      setupTime: Math.floor(Math.random() * 120) + 30,
      runTime: Math.floor(Math.random() * 480) + 120,
      completion: Math.floor(Math.random() * 100),
    }));
  });

  const filteredOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchesSearch =
        wo.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.productionOrderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.operation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || wo.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [workOrders, searchTerm, statusFilter]);

  const stats = [
    {
      label: "Total Work Orders",
      value: workOrders.length,
      icon: "ri-task-line",
      tooltip: "Total work orders",
      trend: "neutral" as const,
    },
    {
      label: "In Progress",
      value: workOrders.filter((wo) => wo.status === "IN_PROGRESS").length,
      icon: "ri-play-circle-line",
      tooltip: "Work orders in progress",
      trend: "up" as const,
    },
    {
      label: "Completed",
      value: workOrders.filter((wo) => wo.status === "COMPLETED").length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Completed work orders",
      trend: "up" as const,
    },
    {
      label: "Pending",
      value: workOrders.filter((wo) => wo.status === "PENDING").length,
      icon: "ri-time-line",
      tooltip: "Pending work orders",
      trend: "neutral" as const,
    },
  ];

  return (
    <PageTemplate
      title="Work Orders"
      description="Manage work orders, track operations, monitor shop floor activities, and control production execution"
      shortDescription="Work order management and execution"
      icon="ri-task-line"
      stats={stats}
      actions={
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search work orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 min-w-[200px]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
          <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-2">
            <i className="ri-add-line"></i>
            <span className="hidden sm:inline">New Work Order</span>
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Work Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Production Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Work Center
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Operator
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Planned Start
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Planned End
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Completion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredOrders.map((wo, index) => (
                  <motion.tr
                    key={wo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-white leading-tight">
                        {wo.orderNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {wo.productionOrderId}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {wo.operation}
                      </div>
                      <div className="text-xs text-[#9ca3af] leading-tight">
                        {wo.operationDescription}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {wo.workCenter}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          wo.status === "COMPLETED"
                            ? "bg-green-500/20 text-green-400"
                            : wo.status === "IN_PROGRESS"
                              ? "bg-blue-500/20 text-blue-400"
                              : wo.status === "ON_HOLD"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {wo.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {wo.operator || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {format(wo.plannedStart, "MMM dd, yyyy")}
                      </div>
                      {wo.actualStart && (
                        <div className="text-xs text-[#9ca3af] leading-tight">
                          Actual: {format(wo.actualStart, "MMM dd")}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {format(wo.plannedEnd, "MMM dd, yyyy")}
                      </div>
                      {wo.actualEnd && (
                        <div className="text-xs text-[#9ca3af] leading-tight">
                          Actual: {format(wo.actualEnd, "MMM dd")}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${
                              wo.completion >= 80
                                ? "bg-green-500"
                                : wo.completion >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${wo.completion}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-white w-12 text-right">
                          {wo.completion}%
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </PageTemplate>
  );
}

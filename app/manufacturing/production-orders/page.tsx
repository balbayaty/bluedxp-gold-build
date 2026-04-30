"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import PageTemplate from "@/components/PageTemplate";

interface ProductionOrder {
  id: string;
  orderNumber: string;
  material: string;
  materialDescription: string;
  quantity: number;
  unit: string;
  status:
    | "PLANNED"
    | "RELEASED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "ON_HOLD"
    | "CANCELLED";
  startDate: Date;
  endDate: Date;
  workCenter: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  completion: number;
  bomVersion: string;
  routingVersion: string;
}

export default function ProductionOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  const [productionOrders] = useState<ProductionOrder[]>(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: `PO-${i + 1}`,
      orderNumber: `PO-${String(i + 1).padStart(6, "0")}`,
      material: `MAT-${String(i + 1).padStart(6, "0")}`,
      materialDescription: `Material Description ${i + 1}`,
      quantity: Math.floor(Math.random() * 1000) + 100,
      unit: "PCS",
      status: [
        "PLANNED",
        "RELEASED",
        "IN_PROGRESS",
        "COMPLETED",
        "ON_HOLD",
        "CANCELLED",
      ][Math.floor(Math.random() * 6)] as ProductionOrder["status"],
      startDate: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      ),
      endDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      workCenter: `WC-${(i % 5) + 1}`,
      priority: ["LOW", "MEDIUM", "HIGH", "URGENT"][
        Math.floor(Math.random() * 4)
      ] as ProductionOrder["priority"],
      completion: Math.floor(Math.random() * 100),
      bomVersion: `BOM-v${(i % 3) + 1}`,
      routingVersion: `ROUT-v${(i % 3) + 1}`,
    }));
  });

  const filteredOrders = useMemo(() => {
    return productionOrders.filter((po) => {
      const matchesSearch =
        po.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.materialDescription.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || po.status === statusFilter;
      const matchesPriority =
        priorityFilter === "ALL" || po.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [productionOrders, searchTerm, statusFilter, priorityFilter]);

  const stats = [
    {
      label: "Total Orders",
      value: productionOrders.length,
      icon: "ri-file-list-3-line",
      tooltip: "Total production orders",
      trend: "neutral" as const,
    },
    {
      label: "Active Orders",
      value: productionOrders.filter((po) =>
        ["RELEASED", "IN_PROGRESS"].includes(po.status),
      ).length,
      icon: "ri-play-circle-line",
      tooltip: "Active production orders",
      trend: "up" as const,
    },
    {
      label: "Completed",
      value: productionOrders.filter((po) => po.status === "COMPLETED").length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Completed production orders",
      trend: "up" as const,
    },
    {
      label: "On Hold",
      value: productionOrders.filter((po) => po.status === "ON_HOLD").length,
      icon: "ri-pause-circle-line",
      tooltip: "Production orders on hold",
      trend: "neutral" as const,
    },
  ];

  return (
    <PageTemplate
      title="Production Orders"
      description="Manage and track production orders, monitor progress, and control manufacturing operations"
      shortDescription="Production order management and tracking"
      icon="ri-file-list-3-line"
      stats={stats}
      actions={
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search orders..."
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
            <option value="PLANNED">Planned</option>
            <option value="RELEASED">Released</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-2">
            <i className="ri-add-line"></i>
            <span className="hidden sm:inline">New Order</span>
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
                    Order Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Work Center
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Completion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredOrders.map((po, index) => (
                  <motion.tr
                    key={po.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-white leading-tight">
                        {po.orderNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {po.material}
                      </div>
                      <div className="text-xs text-[#9ca3af] leading-tight">
                        {po.materialDescription}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {po.quantity} {po.unit}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          po.status === "COMPLETED"
                            ? "bg-green-500/20 text-green-400"
                            : po.status === "IN_PROGRESS"
                              ? "bg-blue-500/20 text-blue-400"
                              : po.status === "ON_HOLD"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : po.status === "CANCELLED"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {po.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          po.priority === "URGENT"
                            ? "bg-red-500/20 text-red-400"
                            : po.priority === "HIGH"
                              ? "bg-orange-500/20 text-orange-400"
                              : po.priority === "MEDIUM"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {po.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {po.workCenter}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {format(po.startDate, "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {format(po.endDate, "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${
                              po.completion >= 80
                                ? "bg-green-500"
                                : po.completion >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${po.completion}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-white w-12 text-right">
                          {po.completion}%
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

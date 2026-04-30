"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

interface RoutingOperation {
  id: string;
  operation: string;
  operationDescription: string;
  workCenter: string;
  sequence: number;
  setupTime: number;
  runTime: number;
  queueTime: number;
  moveTime: number;
  totalTime: number;
}

interface Routing {
  id: string;
  material: string;
  materialDescription: string;
  version: string;
  status: "ACTIVE" | "DRAFT" | "OBSOLETE";
  operations: RoutingOperation[];
  totalTime: number;
}

export default function RoutingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [routings] = useState<Routing[]>(() => {
    return Array.from({ length: 20 }, (_, i) => {
      const operationCount = Math.floor(Math.random() * 8) + 3;
      const operations: RoutingOperation[] = Array.from(
        { length: operationCount },
        (_, j) => {
          const setupTime = Math.floor(Math.random() * 120) + 30;
          const runTime = Math.floor(Math.random() * 480) + 120;
          const queueTime = Math.floor(Math.random() * 60) + 10;
          const moveTime = Math.floor(Math.random() * 30) + 5;
          return {
            id: `OP-${i}-${j}`,
            operation: `OP-${j + 1}`,
            operationDescription: `Operation ${j + 1} Description`,
            workCenter: `WC-${(j % 5) + 1}`,
            sequence: j + 1,
            setupTime,
            runTime,
            queueTime,
            moveTime,
            totalTime: setupTime + runTime + queueTime + moveTime,
          };
        },
      );
      const totalTime = operations.reduce((sum, op) => sum + op.totalTime, 0);

      return {
        id: `ROUT-${i + 1}`,
        material: `MAT-${String(i + 1).padStart(6, "0")}`,
        materialDescription: `Material ${i + 1} Description`,
        version: `v${(i % 3) + 1}`,
        status: ["ACTIVE", "DRAFT", "OBSOLETE"][
          Math.floor(Math.random() * 3)
        ] as Routing["status"],
        operations,
        totalTime,
      };
    });
  });

  const filteredRoutings = useMemo(() => {
    return routings.filter((routing) => {
      const matchesSearch =
        routing.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
        routing.materialDescription
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || routing.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [routings, searchTerm, statusFilter]);

  const stats = [
    {
      label: "Total Routings",
      value: routings.length,
      icon: "ri-route-line",
      tooltip: "Total routings",
      trend: "neutral" as const,
    },
    {
      label: "Active Routings",
      value: routings.filter((r) => r.status === "ACTIVE").length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active routings",
      trend: "up" as const,
    },
    {
      label: "Avg Operations",
      value: Math.round(
        routings.reduce((sum, r) => sum + r.operations.length, 0) /
          routings.length,
      ),
      icon: "ri-stack-line",
      tooltip: "Average operations per routing",
      trend: "neutral" as const,
    },
    {
      label: "Avg Total Time",
      value: `${Math.round(routings.reduce((sum, r) => sum + r.totalTime, 0) / routings.length / 60)}h`,
      icon: "ri-time-line",
      tooltip: "Average total time",
      trend: "neutral" as const,
    },
  ];

  return (
    <PageTemplate
      title="Routing & Operations"
      description="Manage production routings, operation sequences, work center assignments, and time standards"
      shortDescription="Production routing and operations management"
      icon="ri-route-line"
      stats={stats}
      actions={
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search routings..."
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
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="OBSOLETE">Obsolete</option>
          </select>
          <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-2">
            <i className="ri-add-line"></i>
            <span className="hidden sm:inline">New Routing</span>
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
                    Material
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Operations
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Total Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredRoutings.map((routing, index) => (
                  <motion.tr
                    key={routing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-white leading-tight">
                        {routing.material}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {routing.materialDescription}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {routing.version}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          routing.status === "ACTIVE"
                            ? "bg-green-500/20 text-green-400"
                            : routing.status === "DRAFT"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {routing.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {routing.operations.length}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {(routing.totalTime / 60).toFixed(1)}h
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

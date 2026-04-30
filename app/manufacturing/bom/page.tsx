"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

interface BOMItem {
  id: string;
  material: string;
  materialDescription: string;
  quantity: number;
  unit: string;
  level: number;
  type: "RAW_MATERIAL" | "SEMI_FINISHED" | "FINISHED";
  cost: number;
}

interface BOM {
  id: string;
  material: string;
  materialDescription: string;
  version: string;
  status: "ACTIVE" | "DRAFT" | "OBSOLETE";
  items: BOMItem[];
  totalCost: number;
}

export default function BOMPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [boms] = useState<BOM[]>(() => {
    return Array.from({ length: 25 }, (_, i) => {
      const itemCount = Math.floor(Math.random() * 10) + 5;
      const items: BOMItem[] = Array.from({ length: itemCount }, (_, j) => ({
        id: `ITEM-${i}-${j}`,
        material: `MAT-${String(j + 1).padStart(6, "0")}`,
        materialDescription: `Material ${j + 1} Description`,
        quantity: Math.floor(Math.random() * 100) + 1,
        unit: "PCS",
        level: j === 0 ? 0 : Math.floor(Math.random() * 3),
        type:
          j < 3
            ? "RAW_MATERIAL"
            : j < 6
              ? "SEMI_FINISHED"
              : ("FINISHED" as BOMItem["type"]),
        cost: Math.random() * 100 + 10,
      }));
      const totalCost = items.reduce(
        (sum, item) => sum + item.cost * item.quantity,
        0,
      );

      return {
        id: `BOM-${i + 1}`,
        material: `MAT-${String(i + 1).padStart(6, "0")}`,
        materialDescription: `Material ${i + 1} Description`,
        version: `v${(i % 3) + 1}`,
        status: ["ACTIVE", "DRAFT", "OBSOLETE"][
          Math.floor(Math.random() * 3)
        ] as BOM["status"],
        items,
        totalCost,
      };
    });
  });

  const filteredBOMs = useMemo(() => {
    return boms.filter((bom) => {
      const matchesSearch =
        bom.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bom.materialDescription
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || bom.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [boms, searchTerm, statusFilter]);

  const stats = [
    {
      label: "Total BOMs",
      value: boms.length,
      icon: "ri-file-list-line",
      tooltip: "Total bill of materials",
      trend: "neutral" as const,
    },
    {
      label: "Active BOMs",
      value: boms.filter((bom) => bom.status === "ACTIVE").length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active bill of materials",
      trend: "up" as const,
    },
    {
      label: "Avg Items/BOM",
      value: Math.round(
        boms.reduce((sum, bom) => sum + bom.items.length, 0) / boms.length,
      ),
      icon: "ri-stack-line",
      tooltip: "Average items per BOM",
      trend: "neutral" as const,
    },
    {
      label: "Total Cost",
      value: `$${boms.reduce((sum, bom) => sum + bom.totalCost, 0).toFixed(0)}`,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total BOM cost",
      trend: "neutral" as const,
      isCurrency: true,
    },
  ];

  return (
    <PageTemplate
      title="Bill of Materials"
      description="Manage bill of materials, material requirements, BOM versions, and cost analysis"
      shortDescription="Bill of materials management"
      icon="ri-file-list-line"
      stats={stats}
      actions={
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search BOMs..."
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
            <span className="hidden sm:inline">New BOM</span>
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
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Total Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredBOMs.map((bom, index) => (
                  <motion.tr
                    key={bom.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-white leading-tight">
                        {bom.material}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {bom.materialDescription}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {bom.version}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          bom.status === "ACTIVE"
                            ? "bg-green-500/20 text-green-400"
                            : bom.status === "DRAFT"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {bom.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        {bom.items.length}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white leading-tight">
                        ${bom.totalCost.toFixed(2)}
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

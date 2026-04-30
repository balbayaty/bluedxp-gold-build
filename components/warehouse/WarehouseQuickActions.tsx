"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface WarehouseQuickActionsProps {
  warehouseId: string;
}

export default function WarehouseQuickActions({
  warehouseId,
}: WarehouseQuickActionsProps) {
  const router = useRouter();

  const actions = [
    {
      id: "inbound",
      label: "Goods Receipt",
      icon: "ri-inbox-line",
      color: "from-blue-500 to-cyan-500",
      route: "/goods-receipt",
      description: "Process incoming shipments",
    },
    {
      id: "outbound",
      label: "Shipment",
      icon: "ri-ship-line",
      color: "from-green-500 to-emerald-500",
      route: "/outbound",
      description: "Create outbound shipments",
    },
    {
      id: "picking",
      label: "Picking",
      icon: "ri-handbag-line",
      color: "from-orange-500 to-amber-500",
      route: "/picking",
      description: "Manage picking tasks",
    },
    {
      id: "putaway",
      label: "Putaway",
      icon: "ri-stack-line",
      color: "from-purple-500 to-pink-500",
      route: "/putaway",
      description: "Optimize putaway operations",
    },
    {
      id: "cycle-count",
      label: "Cycle Count",
      icon: "ri-file-list-3-line",
      color: "from-yellow-500 to-orange-500",
      route: "/cycle-counting",
      description: "Perform inventory counts",
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: "ri-task-line",
      color: "from-indigo-500 to-blue-500",
      route: "/task-management",
      description: "View and manage tasks",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => router.push(action.route)}
          className={`p-4 rounded-xl bg-gradient-to-br ${action.color} text-white hover:shadow-xl transition-all group relative overflow-hidden`}
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <i className={`${action.icon} text-2xl mb-2 block`}></i>
            <div className="text-sm font-semibold">{action.label}</div>
            <div className="text-xs opacity-80 mt-1">{action.description}</div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

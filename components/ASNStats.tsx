"use client";

import { motion } from "framer-motion";
import { ASNData } from "@/types/asn";

interface ASNStatsProps {
  data: ASNData[];
}

export default function ASNStats({ data }: ASNStatsProps) {
  const stats = {
    total: data.length,
    inTransit: data.filter((d) => d.status === "IN_TRANSIT").length,
    pending: data.filter((d) => d.status === "CREATED").length,
    delivered: data.filter(
      (d) =>
        d.status === "GR_POSTED" ||
        d.status === "DELIVERED" ||
        d.status === "COMPLETED",
    ).length,
    delayed: data.filter(
      (d) => d.status === "BLOCKED" || d.status === "ON_HOLD",
    ).length,
    totalItems: data.reduce((sum, d) => sum + (d.totalItems || 0), 0),
    totalWeight: data.reduce((sum, d) => sum + (d.totalWeight || 0), 0),
    compliant: data.filter((d) => d.complianceStatus === "COMPLIANT").length,
  };

  const statCards = [
    {
      label: "Total Shipments",
      value: stats.total,
      icon: "ri-activity",
      color: "from-cyan-500 to-blue-600",
      change: "+12%",
    },
    {
      label: "In Transit",
      value: stats.inTransit,
      icon: "ri-truck-line",
      color: "from-blue-500 to-indigo-600",
      change: "+5%",
    },
    {
      label: "Delivered",
      value: stats.delivered,
      icon: "ri-checkbox-circle-line",
      color: "from-green-500 to-emerald-600",
      change: "+8%",
    },
    {
      label: "Compliance Rate",
      value: `${Math.round((stats.compliant / stats.total) * 100)}%`,
      icon: "ri-shield-check-line",
      color: "from-yellow-500 to-orange-600",
      change: "+3%",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -8 }}
          className="bg-[#1E293B] border border-[#334155] rounded-lg p-6 hover:border-blue-500/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
            >
              <i className={`${stat.icon} text-white text-xl`}></i>
            </div>
            <span className="text-green-400 text-sm font-medium">
              {stat.change}
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
          <div className="text-gray-400 text-sm">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

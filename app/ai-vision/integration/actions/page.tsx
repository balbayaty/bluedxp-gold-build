/**
 * Integration Actions History
 * View all actions triggered by vision analysis across modules
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

export default function IntegrationActionsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<
    "all" | "success" | "failed" | "pending"
  >("all");

  const actions = [
    {
      id: "action-1",
      timestamp: "2 hours ago",
      module: "ISO-IMS",
      action: "Create NCR",
      status: "success",
      source: "Damage Report DR-2025-001",
      result: "NCR #NCR-2025-045 created",
    },
    {
      id: "action-2",
      timestamp: "3 hours ago",
      module: "WMS",
      action: "Update Inventory",
      status: "success",
      source: "Damage Report DR-2025-002",
      result: "Inventory updated: -5 units",
    },
    {
      id: "action-3",
      timestamp: "5 hours ago",
      module: "QHSE",
      action: "Create Incident",
      status: "success",
      source: "Incident Report IR-2025-012",
      result: "Incident #INC-2025-012 created",
    },
  ];

  const filteredActions =
    filter === "all" ? actions : actions.filter((a) => a.status === filter);

  return (
    <PageTemplate
      title="📋 Integration Actions History"
      description="View all actions triggered by AI vision analysis across all modules"
      icon="ri-play-list-line"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-2">
          {["all", "success", "failed", "pending"].map((f) => (
            <motion.button
              key={f}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f
                  ? "bg-blue-500 text-white"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </motion.button>
          ))}
        </div>

        {/* Actions List */}
        <div className="space-y-4">
          {filteredActions.map((action, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-blue-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <i className="ri-play-line text-blue-400 text-xl"></i>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">
                        {action.module}
                      </h4>
                      <p className="text-white/70 text-sm">{action.action}</p>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm ml-13">
                    Source: {action.source}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      action.status === "success"
                        ? "bg-green-500/20 text-green-400"
                        : action.status === "failed"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {action.status}
                  </span>
                  <p className="text-white/60 text-xs mt-2">
                    {action.timestamp}
                  </p>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white/60 text-xs mb-1">Result:</p>
                <p className="text-white">{action.result}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTemplate>
  );
}

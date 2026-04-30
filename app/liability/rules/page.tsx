/**
 * Liability Rules Management
 * View and manage all liability assessment rules
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

export default function LiabilityRulesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const rules = [
    {
      id: "rule-1",
      name: "Warehouse Loading Dock Rule",
      condition: 'IF area == "loading_dock" AND equipment == "forklift"',
      action: "THEN warehouse_fault = 75%",
      priority: 1,
      status: "active",
      occurrences: 12,
    },
    {
      id: "rule-2",
      name: "Carrier Transport Rule",
      condition: 'IF damageType == "crush" AND carrier IS NOT NULL',
      action: "THEN carrier_fault = 50%",
      priority: 2,
      status: "active",
      occurrences: 8,
    },
    {
      id: "rule-3",
      name: "Storage Water Damage Rule",
      condition: 'IF area == "storage" AND damageType == "water_damage"',
      action: "THEN warehouse_fault = 80%",
      priority: 3,
      status: "inactive",
      occurrences: 5,
    },
  ];

  const filteredRules =
    filter === "all" ? rules : rules.filter((r) => r.status === filter);

  return (
    <PageTemplate
      title="⚙️ Liability Rules"
      description="View and manage liability assessment rules"
      icon="ri-settings-3-line"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">All Rules</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/liability/rules/new")}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            Create Rule
          </motion.button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {["all", "active", "inactive"].map((f) => (
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

        {/* Rules List */}
        <div className="space-y-4">
          {filteredRules.map((rule, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-blue-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    {rule.name}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
                      <p className="text-blue-300 font-mono text-xs mb-1">
                        Condition:
                      </p>
                      <p className="text-white">{rule.condition}</p>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
                      <p className="text-green-300 font-mono text-xs mb-1">
                        Action:
                      </p>
                      <p className="text-white">{rule.action}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-blue-400 font-bold">
                    Priority {rule.priority}
                  </p>
                  <span
                    className={`px-2 py-1 bg-${rule.status === "active" ? "green" : "gray"}-500/20 text-${rule.status === "active" ? "green" : "gray"}-400 rounded text-xs mt-2 inline-block`}
                  >
                    {rule.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <p className="text-white/60">Occurrences</p>
                    <p className="text-white font-medium">{rule.occurrences}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-white text-sm transition-all"
                  >
                    Edit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-all"
                  >
                    Test
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-all"
                  >
                    {rule.status === "active" ? "Disable" : "Enable"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTemplate>
  );
}

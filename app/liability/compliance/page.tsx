/**
 * Compliance Checker
 * Verify legal compliance requirements for liability assessments
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

export default function ComplianceCheckerPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const complianceItems = [
    {
      id: "comp-1",
      category: "Legal",
      requirement: "UAE Civil Code - Article 282",
      description: "Liability for damage caused by negligence",
      status: "compliant",
      lastChecked: "2 days ago",
    },
    {
      id: "comp-2",
      category: "Insurance",
      requirement: "Insurance Policy Coverage",
      description: "Verify insurance coverage for claimable amounts",
      status: "compliant",
      lastChecked: "1 day ago",
    },
    {
      id: "comp-3",
      category: "Regulatory",
      requirement: "UAE Commercial Transactions Law",
      description: "Compliance with commercial liability regulations",
      status: "pending",
      lastChecked: "5 days ago",
    },
    {
      id: "comp-4",
      category: "Contractual",
      requirement: "Warehouse Agreement Terms",
      description: "Verify liability terms in warehouse agreements",
      status: "compliant",
      lastChecked: "3 days ago",
    },
  ];

  const filteredItems =
    selectedCategory === "all"
      ? complianceItems
      : complianceItems.filter(
          (item) =>
            item.category.toLowerCase() === selectedCategory.toLowerCase(),
        );

  return (
    <PageTemplate
      title="🛡️ Compliance Checker"
      description="Verify legal compliance requirements for liability assessments and insurance claims"
      icon="ri-shield-check-line"
    >
      <div className="space-y-6">
        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {["all", "legal", "insurance", "regulatory", "contractual"].map(
            (cat) => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-orange-500 text-white"
                    : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </motion.button>
            ),
          )}
        </div>

        {/* Compliance Items */}
        <div className="space-y-4">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-orange-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">
                      {item.category}
                    </span>
                    <h4 className="text-white font-semibold text-lg">
                      {item.requirement}
                    </h4>
                  </div>
                  <p className="text-white/70 text-sm">{item.description}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === "compliant"
                      ? "bg-green-500/20 text-green-400"
                      : item.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {item.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <p className="text-white/60">Last Checked</p>
                    <p className="text-white/70">{item.lastChecked}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded-lg text-white text-sm transition-all"
                >
                  Verify Now
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "Total Requirements", value: "24", color: "blue" },
            { label: "Compliant", value: "18", color: "green" },
            { label: "Pending", value: "4", color: "yellow" },
            { label: "Non-Compliant", value: "2", color: "red" },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/20 border border-${stat.color}-500/30 rounded-xl p-4`}
            >
              <p className="text-white/60 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTemplate>
  );
}

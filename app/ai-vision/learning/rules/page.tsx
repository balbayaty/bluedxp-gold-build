/**
 * Learning Rules Page
 * View all auto-generated rules from learned patterns
 */

"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

export default function LearningRulesPage() {
  const router = useRouter();

  const rules = [
    {
      id: "rule-1",
      name: "Forklift Corner Damage Rule",
      pattern: "Forklift Corner Damage",
      condition:
        'IF area == "loading_dock" AND equipment == "forklift" AND damageType == "crush"',
      action:
        'THEN likelyRootCause = "Forklift handling damage" AND prevention = "Review forklift training"',
      confidence: 88,
      occurrences: 12,
      status: "active",
      generatedDate: "2025-01-12",
    },
    {
      id: "rule-2",
      name: "Water Damage Storage Rule",
      pattern: "Water Damage Storage",
      condition: 'IF area == "storage" AND damageType == "water_damage"',
      action:
        'THEN likelyRootCause = "Storage location weather protection issue" AND prevention = "Review storage protection"',
      confidence: 82,
      occurrences: 8,
      status: "active",
      generatedDate: "2025-01-10",
    },
  ];

  return (
    <PageTemplate
      title="📋 Auto-Generated Rules"
      description="View all rules automatically generated from learned patterns"
      icon="ri-file-list-line"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            All Auto-Generated Rules
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all flex items-center gap-2"
          >
            <i className="ri-arrow-left-line"></i>
            Back
          </motion.button>
        </div>

        <div className="space-y-4">
          {rules.map((rule, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-6 hover:border-blue-400/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    {rule.name}
                  </h4>
                  <p className="text-white/70 text-sm mb-3">
                    Pattern: {rule.pattern}
                  </p>
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
                  <p className="text-blue-400 font-bold text-2xl">
                    {rule.confidence}%
                  </p>
                  <p className="text-white/60 text-xs">Confidence</p>
                </div>
              </div>
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-xs mb-1">Occurrences</p>
                  <p className="text-white font-semibold">{rule.occurrences}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-xs mb-1">Status</p>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                    {rule.status}
                  </span>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-xs mb-1">Generated</p>
                  <p className="text-white/70 text-xs">{rule.generatedDate}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-xs mb-1">Pattern</p>
                  <p className="text-white/70 text-xs">{rule.pattern}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
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
                  Disable
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTemplate>
  );
}

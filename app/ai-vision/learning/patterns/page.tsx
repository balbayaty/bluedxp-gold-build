/**
 * Learning Patterns Page
 * Deep dive into all learned patterns
 */

"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

export default function LearningPatternsPage() {
  const router = useRouter();

  const patterns = [
    {
      id: "pattern-1",
      name: "Forklift Corner Damage",
      occurrences: 12,
      confidence: 88,
      accuracy: 94,
      firstSeen: "2025-01-10",
      lastSeen: "2025-01-15",
      rulesGenerated: 2,
      status: "active",
    },
    {
      id: "pattern-2",
      name: "Water Damage Storage",
      occurrences: 8,
      confidence: 82,
      accuracy: 89,
      firstSeen: "2025-01-08",
      lastSeen: "2025-01-14",
      rulesGenerated: 1,
      status: "active",
    },
    {
      id: "pattern-3",
      name: "Crush Damage Loading",
      occurrences: 15,
      confidence: 91,
      accuracy: 96,
      firstSeen: "2025-01-05",
      lastSeen: "2025-01-16",
      rulesGenerated: 3,
      status: "active",
    },
  ];

  return (
    <PageTemplate
      title="🧠 Learned Patterns"
      description="View all patterns learned by the AI vision system"
      icon="ri-shapes-line"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            All Learned Patterns
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
          {patterns.map((pattern, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6 hover:border-purple-400/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    {pattern.name}
                  </h4>
                  <p className="text-white/70 text-sm">
                    Automatically learned from {pattern.occurrences} damage
                    photo analyses
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-purple-400 font-bold text-2xl">
                    {pattern.confidence}%
                  </p>
                  <p className="text-white/60 text-xs">Confidence</p>
                </div>
              </div>
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-xs mb-1">Occurrences</p>
                  <p className="text-white font-semibold">
                    {pattern.occurrences}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-xs mb-1">Accuracy</p>
                  <p className="text-green-400 font-semibold">
                    {pattern.accuracy}%
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-xs mb-1">Rules Generated</p>
                  <p className="text-blue-400 font-semibold">
                    {pattern.rulesGenerated}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-xs mb-1">Status</p>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                    Active
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-white text-sm transition-all"
                >
                  View Details
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-all"
                >
                  View Examples
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-all"
                >
                  Edit Pattern
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTemplate>
  );
}

/**
 * Causal Chain Visualization Component
 * Visualizes causal relationships between root causes
 */

"use client";

import { motion } from "framer-motion";
import type { CausalLink, RootCause } from "@/types/intelligence-analytics";

interface CausalChainVisualizationProps {
  rootCauses: RootCause[];
  causalChain: CausalLink[];
}

export default function CausalChainVisualization({
  rootCauses,
  causalChain,
}: CausalChainVisualizationProps) {
  const getRootCause = (id: string) => rootCauses.find((rc) => rc.id === id);

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Causal Chain</h3>

      {causalChain.length === 0 ? (
        <div className="text-center py-8 text-[#9ca3af]">
          <i className="ri-link-m text-4xl mb-2"></i>
          <p>No causal chain identified</p>
        </div>
      ) : (
        <div className="space-y-4">
          {causalChain.map((link, index) => {
            const fromCause = getRootCause(link.from);
            const toCause = getRootCause(link.to);

            return (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4"
              >
                {/* From */}
                <div className="flex-1 bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        fromCause?.type === "primary"
                          ? "bg-red-500/20 text-red-400"
                          : fromCause?.type === "secondary"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {fromCause?.type || "Unknown"}
                    </span>
                    <span className="text-xs text-[#9ca3af]">
                      {fromCause?.category || "Unknown"}
                    </span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {fromCause?.title || link.from}
                  </p>
                  <p className="text-xs text-[#9ca3af] mt-1">
                    {fromCause?.description}
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-0.5 bg-${link.type === "direct" ? "red" : link.type === "indirect" ? "yellow" : "gray"}-500`}
                  ></div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium bg-${link.type === "direct" ? "red" : link.type === "indirect" ? "yellow" : "gray"}-500/20 text-${link.type === "direct" ? "red" : link.type === "indirect" ? "yellow" : "gray"}-400`}
                  >
                    {Math.round(link.strength * 100)}%
                  </div>
                  <i
                    className={`ri-arrow-right-line text-${link.type === "direct" ? "red" : link.type === "indirect" ? "yellow" : "gray"}-400 text-xl`}
                  ></i>
                </div>

                {/* To */}
                <div className="flex-1 bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        toCause?.type === "primary"
                          ? "bg-red-500/20 text-red-400"
                          : toCause?.type === "secondary"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {toCause?.type || "Unknown"}
                    </span>
                    <span className="text-xs text-[#9ca3af]">
                      {toCause?.category || "Unknown"}
                    </span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {toCause?.title || link.to}
                  </p>
                  <p className="text-xs text-[#9ca3af] mt-1">
                    {toCause?.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

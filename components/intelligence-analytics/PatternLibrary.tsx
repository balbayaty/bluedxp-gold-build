/**
 * Pattern Library Component
 * Displays discovered patterns across modules
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Pattern } from "@/types/intelligence-analytics";
import { format } from "date-fns";

interface PatternLibraryProps {
  patterns: Pattern[];
  onPatternSelect?: (pattern: Pattern) => void;
}

export default function PatternLibrary({
  patterns,
  onPatternSelect,
}: PatternLibraryProps) {
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterModule, setFilterModule] = useState<string>("ALL");

  const filteredPatterns = patterns.filter((p) => {
    const matchesType = filterType === "ALL" || p.patternType === filterType;
    const matchesModule =
      filterModule === "ALL" || p.affectedModules.includes(filterModule);
    return matchesType && matchesModule;
  });

  const patternTypes = Array.from(new Set(patterns.map((p) => p.patternType)));
  const modules = Array.from(
    new Set(patterns.flatMap((p) => p.affectedModules)),
  );

  const typeColors: Record<string, string> = {
    RECURRING: "red",
    TREND: "blue",
    CLUSTER: "green",
    CORRELATION: "purple",
    ANOMALY: "yellow",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Pattern Library ({patterns.length})
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Types</option>
            {patternTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Modules</option>
            {modules.map((module) => (
              <option key={module} value={module}>
                {module}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatterns.map((pattern, index) => {
          const color = typeColors[pattern.patternType] || "gray";
          return (
            <motion.div
              key={pattern.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white/5 border border-white/10 rounded-xl p-4 hover:border-${color}-500/50 transition-all cursor-pointer`}
              onClick={() => onPatternSelect?.(pattern)}
            >
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium bg-${color}-500/20 text-${color}-400`}
                >
                  {pattern.patternType}
                </span>
                <div className="text-right">
                  <div className="text-sm font-bold text-cyan-400">
                    {Math.round(pattern.confidence * 100)}%
                  </div>
                  <div className="text-xs text-[#9ca3af]">Confidence</div>
                </div>
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">
                {pattern.title}
              </h4>
              <p className="text-xs text-[#9ca3af] mb-3 line-clamp-2">
                {pattern.description}
              </p>
              <div className="flex items-center justify-between text-xs">
                <div className="text-[#9ca3af]">
                  {pattern.affectedModules.length} modules
                </div>
                <div className="text-[#9ca3af]">
                  {pattern.frequency} occurrences
                </div>
              </div>
              {pattern.recommendations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-xs text-[#9ca3af] mb-1">
                    Recommendations
                  </div>
                  <ul className="space-y-1">
                    {pattern.recommendations.slice(0, 2).map((rec, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-white flex items-center gap-1"
                      >
                        <i className="ri-arrow-right-line text-green-400"></i>
                        {rec.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {filteredPatterns.length === 0 && (
        <div className="text-center py-12 text-[#9ca3af]">
          <i className="ri-shape-line text-4xl mb-2"></i>
          <p>No patterns found</p>
        </div>
      )}
    </div>
  );
}

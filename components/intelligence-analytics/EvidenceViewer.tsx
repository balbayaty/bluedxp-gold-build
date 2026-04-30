/**
 * Evidence Viewer Component
 * Displays evidence from all modules with drill-down
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Evidence } from "@/types/intelligence-analytics";
import { format } from "date-fns";

interface EvidenceViewerProps {
  evidence: Evidence[];
  title?: string;
}

export default function EvidenceViewer({
  evidence,
  title = "Evidence",
}: EvidenceViewerProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(
    null,
  );
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterModule, setFilterModule] = useState<string>("ALL");

  const filteredEvidence = evidence.filter((ev) => {
    const matchesType = filterType === "ALL" || ev.type === filterType;
    const matchesModule =
      filterModule === "ALL" || ev.source.module === filterModule;
    return matchesType && matchesModule;
  });

  const evidenceTypes = Array.from(new Set(evidence.map((e) => e.type)));
  const modules = Array.from(new Set(evidence.map((e) => e.source.module)));

  const typeColors: Record<string, string> = {
    deviation: "red",
    event: "blue",
    metric: "green",
    correlation: "purple",
    pattern: "cyan",
    document: "yellow",
    test: "orange",
    observation: "gray",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {title} ({evidence.length})
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Types</option>
            {evidenceTypes.map((type) => (
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

      <div className="grid gap-3">
        {filteredEvidence.map((ev) => {
          const color = typeColors[ev.type] || "gray";
          return (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`bg-white/5 border border-white/10 rounded-lg p-4 hover:border-${color}-500/50 transition-all cursor-pointer`}
              onClick={() => setSelectedEvidence(ev)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium bg-${color}-500/20 text-${color}-400`}
                    >
                      {ev.type}
                    </span>
                    <span className="text-xs text-[#9ca3af]">
                      {ev.source.module} • {ev.source.entityType}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-[#9ca3af]">
                      <i className="ri-star-line text-yellow-400"></i>
                      {Math.round(ev.relevance * 100)}%
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#9ca3af]">
                      <i className="ri-shield-check-line text-green-400"></i>
                      {Math.round(ev.quality * 100)}%
                    </div>
                  </div>
                  <p className="text-sm text-white mb-1">
                    {ev.source.entityId}
                  </p>
                  <p className="text-xs text-[#9ca3af]">
                    {format(new Date(ev.timestamp), "PPp")}
                  </p>
                </div>
                <button className="ml-4 p-2 text-cyan-400 hover:text-cyan-300">
                  <i className="ri-arrow-right-line"></i>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Evidence Detail Modal */}
      <AnimatePresence>
        {selectedEvidence && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedEvidence(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1f2937] border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">
                  Evidence Details
                </h3>
                <button
                  onClick={() => setSelectedEvidence(null)}
                  className="p-2 text-[#9ca3af] hover:text-white"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Type</div>
                  <div className="text-white">{selectedEvidence.type}</div>
                </div>
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Source</div>
                  <div className="text-white">
                    {selectedEvidence.source.module} •{" "}
                    {selectedEvidence.source.entityType} •{" "}
                    {selectedEvidence.source.entityId}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Relevance</div>
                  <div className="text-white">
                    {Math.round(selectedEvidence.relevance * 100)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Quality</div>
                  <div className="text-white">
                    {Math.round(selectedEvidence.quality * 100)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Timestamp</div>
                  <div className="text-white">
                    {format(new Date(selectedEvidence.timestamp), "PPp")}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Data</div>
                  <pre className="bg-white/5 rounded-lg p-4 text-xs text-white overflow-x-auto">
                    {JSON.stringify(selectedEvidence.data, null, 2)}
                  </pre>
                </div>
                {selectedEvidence.lineage &&
                  selectedEvidence.lineage.length > 0 && (
                    <div>
                      <div className="text-sm text-[#9ca3af] mb-1">Lineage</div>
                      <div className="space-y-1">
                        {selectedEvidence.lineage.map((line, idx) => (
                          <div key={idx} className="text-xs text-white">
                            {line.source} → {line.transformation || "direct"}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

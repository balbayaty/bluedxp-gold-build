"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export function QRSupplyChainDashboard() {
  const [paths, setPaths] = useState<any[]>([]);
  const [selectedPath, setSelectedPath] = useState<any>(null);

  const analyzePath = async (startQR: string, endQR: string) => {
    try {
      const res = await fetch("/api/qr/supply-chain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          startQR,
          endQR,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedPath(data.path);
      }
    } catch (error) {
      console.error("Error analyzing path:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Supply Chain Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <i className="ri-truck-line text-orange-400"></i>
          Supply Chain Optimization
        </h2>

        <div className="bg-gray-900/50 rounded-lg p-6 h-96 flex items-center justify-center mb-6">
          <div className="text-center">
            <i className="ri-truck-line text-6xl text-orange-400/30 mb-4"></i>
            <p className="text-gray-400">Supply Chain Network Visualization</p>
            <button
              onClick={() => analyzePath("qr-start", "qr-end")}
              className="mt-4 px-4 py-2 bg-orange-500 rounded-lg hover:bg-orange-600 transition"
            >
              Analyze Supply Chain
            </button>
          </div>
        </div>

        {selectedPath && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Total Time</div>
              <div className="text-2xl font-bold text-orange-400">
                {selectedPath.totalTime}h
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Total Cost</div>
              <div className="text-2xl font-bold text-red-400">
                ${selectedPath.totalCost.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Efficiency</div>
              <div className="text-2xl font-bold text-green-400">
                {(selectedPath.efficiency * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Nodes</div>
              <div className="text-2xl font-bold text-blue-400">
                {selectedPath.nodes.length}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Optimization Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
      >
        <h2 className="text-2xl font-bold mb-4">
          Optimization Recommendations
        </h2>
        <div className="space-y-3">
          {[
            {
              priority: "high",
              type: "routing",
              description: "Optimize route through customs",
              impact: "15% time reduction",
            },
            {
              priority: "medium",
              type: "consolidation",
              description: "Consolidate shipments at warehouse",
              impact: "20% cost reduction",
            },
            {
              priority: "low",
              type: "timing",
              description: "Adjust departure times",
              impact: "5% efficiency gain",
            },
          ].map((rec, idx) => (
            <div
              key={idx}
              className="bg-gray-900/50 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      rec.priority === "high"
                        ? "bg-red-500"
                        : rec.priority === "medium"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                    }`}
                  >
                    {rec.priority.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-400 capitalize">
                    {rec.type}
                  </div>
                </div>
                <div className="font-bold">{rec.description}</div>
                <div className="text-sm text-green-400">{rec.impact}</div>
              </div>
              <button className="px-4 py-2 bg-orange-500 rounded-lg hover:bg-orange-600 transition">
                Apply
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

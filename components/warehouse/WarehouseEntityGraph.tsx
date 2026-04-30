/**
 * Warehouse Entity Graph Component
 * Relationship visualization and impact analysis
 * 4IR & 5IR Aligned • Modern UI • Deep Integration
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { warehouseGraphIntegration } from "@/lib/services/wms/graphIntegration";
import type {
  WarehouseEntityGraph,
  WarehouseImpactAnalysis,
} from "@/lib/services/wms/graphIntegration";

interface WarehouseEntityGraphProps {
  warehouseId: string;
}

export default function WarehouseEntityGraph({
  warehouseId,
}: WarehouseEntityGraphProps) {
  const [graph, setGraph] = useState<WarehouseEntityGraph | null>(null);
  const [impactAnalysis, setImpactAnalysis] =
    useState<WarehouseImpactAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  useEffect(() => {
    loadGraph();
  }, [warehouseId]);

  const loadGraph = async () => {
    setIsLoading(true);
    try {
      const graphData =
        await warehouseGraphIntegration.getWarehouseGraph(warehouseId);
      setGraph(graphData);
    } catch (error) {
      console.error("Error loading graph:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeImpact = async (changeType: "delete" | "update" | "disable") => {
    try {
      const analysis = await warehouseGraphIntegration.analyzeImpact(
        warehouseId,
        changeType,
      );
      setImpactAnalysis(analysis);
    } catch (error) {
      console.error("Error analyzing impact:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="ri-loader-4-line text-4xl text-cyan-400 animate-spin"></i>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Graph Overview */}
      {graph && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <i className="ri-node-tree mr-3 text-cyan-400"></i>
              Entity Relationships
            </h2>
            <button
              onClick={loadGraph}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <i className="ri-refresh-line mr-2"></i>
              Refresh
            </button>
          </div>

          {/* Analytics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
              <p className="text-sm text-gray-400 mb-1">Total Entities</p>
              <p className="text-3xl font-bold text-white">
                {graph.analytics.totalEntities}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
              <p className="text-sm text-gray-400 mb-1">Relationships</p>
              <p className="text-3xl font-bold text-white">
                {graph.analytics.totalRelationships}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
              <p className="text-sm text-gray-400 mb-1">Entity Types</p>
              <p className="text-3xl font-bold text-white">
                {Object.keys(graph.analytics.entityTypes).length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/30">
              <p className="text-sm text-gray-400 mb-1">Relationship Types</p>
              <p className="text-3xl font-bold text-white">
                {Object.keys(graph.analytics.relationshipTypes).length}
              </p>
            </div>
          </div>

          {/* Entity Types Breakdown */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Entity Types
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(graph.analytics.entityTypes).map(
                ([type, count]) => (
                  <div
                    key={type}
                    className="p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <p className="text-sm text-gray-400">{type}</p>
                    <p className="text-xl font-bold text-white">{count}</p>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Relationships */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Relationships
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {graph.relationships.slice(0, 10).map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => setSelectedEntity(rel.targetEntityId)}
                  className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm">
                        {rel.sourceEntityType} → {rel.targetEntityType}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{rel.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Strength</p>
                      <p className="text-white font-medium">
                        {(rel.strength * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Impact Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <i className="ri-alert-line mr-2 text-yellow-400"></i>
            Impact Analysis
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => analyzeImpact("update")}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Analyze Update
            </button>
            <button
              onClick={() => analyzeImpact("delete")}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Analyze Delete
            </button>
          </div>
        </div>

        {impactAnalysis && (
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-white font-medium mb-2">
                {impactAnalysis.impactedEntities.length} entities would be
                impacted
              </p>
              <div className="space-y-2">
                {impactAnalysis.impactedEntities
                  .slice(0, 5)
                  .map((entity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-300">
                        {entity.entityType}: {entity.entityId.substring(0, 8)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          entity.impact === "high"
                            ? "bg-red-500/20 text-red-400"
                            : entity.impact === "medium"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {entity.impact}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {impactAnalysis.recommendations.length > 0 && (
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-white font-medium mb-2">Recommendations</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                  {impactAnalysis.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

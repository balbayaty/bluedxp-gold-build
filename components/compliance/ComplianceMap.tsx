"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { complianceService } from "@/lib/services/compliance/complianceService";
import { authorityHierarchyService } from "@/lib/services/compliance/authorityHierarchyService";
import { RegulatoryAuthorityNode } from "@/types/compliance-hierarchy";
import { ComplianceRecord } from "@/types/compliance";

interface ComplianceMapProps {
  tenantId: string;
}

interface MapNode {
  id: string;
  name: string;
  authority: string;
  complianceScore: number;
  status: "COMPLIANT" | "NON_COMPLIANT" | "AT_RISK";
  x: number;
  y: number;
  children: string[];
  parent?: string;
}

export default function ComplianceMap({ tenantId }: ComplianceMapProps) {
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [viewMode, setViewMode] = useState<"hierarchy" | "network" | "heatmap">(
    "hierarchy",
  );
  const [records, setRecords] = useState<ComplianceRecord[]>([]);

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    try {
      const allRecords = complianceService.getRecordsByTenant(tenantId);
      setRecords(allRecords);

      const authorities = authorityHierarchyService.getAllNodes();
      const mapNodes: MapNode[] = [];

      // Create nodes for each authority
      authorities.forEach((auth, index) => {
        const authRecords = allRecords.filter((r) => r.authority === auth.name);
        const compliant = authRecords.filter(
          (r) => r.status === "COMPLIANT",
        ).length;
        const total = authRecords.length;
        const score = total > 0 ? (compliant / total) * 100 : 100;

        const children = authorityHierarchyService
          .getChildren(auth.id)
          .map((c) => c.id);
        const parents = authorityHierarchyService
          .getParents(auth.id)
          .map((p) => p.id);

        mapNodes.push({
          id: auth.id,
          name: auth.name,
          authority: auth.name,
          complianceScore: score,
          status:
            score >= 90
              ? "COMPLIANT"
              : score >= 70
                ? "AT_RISK"
                : "NON_COMPLIANT",
          x: (index % 4) * 200 + 100,
          y: Math.floor(index / 4) * 150 + 100,
          children,
          parent: parents[0],
        });
      });

      setNodes(mapNodes);
    } catch (error) {
      console.error("Error loading compliance map:", error);
    }
  };

  const getNodeColor = (node: MapNode) => {
    if (node.status === "COMPLIANT") return "bg-green-500";
    if (node.status === "AT_RISK") return "bg-yellow-500";
    return "bg-red-500";
  };

  const getNodeSize = (node: MapNode) => {
    const baseSize = 40;
    const scoreMultiplier = node.complianceScore / 100;
    return baseSize + scoreMultiplier * 20;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Compliance Map</h2>
          <p className="text-gray-400 mt-1">
            Visual representation of compliance across authorities
          </p>
        </div>
        <div className="flex gap-2">
          {[
            { id: "hierarchy", label: "Hierarchy", icon: "ri-node-tree" },
            { id: "network", label: "Network", icon: "ri-share-line" },
            { id: "heatmap", label: "Heatmap", icon: "ri-fire-line" },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === mode.id
                  ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              <i className={`${mode.icon} mr-2`}></i>
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 min-h-[600px] relative overflow-hidden">
        <svg width="100%" height="600" className="absolute inset-0">
          {/* Draw connections */}
          {viewMode === "hierarchy" || viewMode === "network"
            ? nodes.map((node) =>
                node.children.map((childId) => {
                  const child = nodes.find((n) => n.id === childId);
                  if (!child) return null;
                  return (
                    <line
                      key={`${node.id}-${childId}`}
                      x1={node.x}
                      y1={node.y}
                      x2={child.x}
                      y2={child.y}
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="2"
                    />
                  );
                }),
              )
            : null}

          {/* Draw nodes */}
          {nodes.map((node) => {
            const size = getNodeSize(node);
            const color = getNodeColor(node);
            return (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={size / 2}
                  fill={color}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setSelectedNode(node)}
                />
                <text
                  x={node.x}
                  y={node.y + size / 2 + 15}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  className="pointer-events-none"
                >
                  {node.name}
                </text>
                <text
                  x={node.x}
                  y={node.y + size / 2 + 30}
                  textAnchor="middle"
                  fill="rgba(255, 255, 255, 0.7)"
                  fontSize="10"
                  className="pointer-events-none"
                >
                  {node.complianceScore.toFixed(0)}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Heatmap Overlay */}
        {viewMode === "heatmap" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-4 gap-4">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className={`p-4 rounded-lg cursor-pointer transition-transform hover:scale-105 ${
                    node.status === "COMPLIANT"
                      ? "bg-green-500/30 border border-green-500/50"
                      : node.status === "AT_RISK"
                        ? "bg-yellow-500/30 border border-yellow-500/50"
                        : "bg-red-500/30 border border-red-500/50"
                  }`}
                  onClick={() => setSelectedNode(node)}
                >
                  <p className="text-white font-semibold text-sm">
                    {node.name}
                  </p>
                  <p className="text-gray-300 text-xs mt-1">
                    {node.complianceScore.toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">
              {selectedNode.name}
            </h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-white"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-400">Compliance Score</p>
              <p className="text-2xl font-bold text-white">
                {selectedNode.complianceScore.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <p
                className={`text-lg font-semibold ${
                  selectedNode.status === "COMPLIANT"
                    ? "text-green-400"
                    : selectedNode.status === "AT_RISK"
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {selectedNode.status}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Records</p>
              <p className="text-2xl font-bold text-white">
                {
                  records.filter((r) => r.authority === selectedNode.authority)
                    .length
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Compliant</p>
              <p className="text-2xl font-bold text-green-400">
                {
                  records.filter(
                    (r) =>
                      r.authority === selectedNode.authority &&
                      r.status === "COMPLIANT",
                  ).length
                }
              </p>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">
              Related Records
            </h4>
            <div className="space-y-2">
              {records
                .filter((r) => r.authority === selectedNode.authority)
                .slice(0, 5)
                .map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                  >
                    <p className="text-sm text-white">{record.requirement}</p>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        record.status === "COMPLIANT"
                          ? "bg-green-500/20 text-green-400"
                          : record.status === "AT_RISK"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

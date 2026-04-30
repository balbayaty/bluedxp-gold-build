/**
 * 🗺️ QHSE COMPLIANCE MAP
 * Interactive network graph for compliance relationships
 * Modern, sexy, intelligent visualization
 */

"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  FiShield,
  FiTarget,
  FiLink,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

interface ComplianceNode {
  id: string;
  label: string;
  type: "STANDARD" | "REQUIREMENT" | "AUDIT" | "FINDING" | "ACTION";
  status: "COMPLIANT" | "NON_COMPLIANT" | "PENDING" | "IN_PROGRESS";
  x?: number;
  y?: number;
  connections: string[];
  metadata?: {
    score?: number;
    priority?: string;
    dueDate?: Date | string;
  };
}

interface ComplianceMapProps {
  nodes: ComplianceNode[];
  onNodeClick?: (nodeId: string) => void;
}

const QHSEComplianceMap: React.FC<ComplianceMapProps> = ({
  nodes,
  onNodeClick,
}) => {
  const getNodeColor = (node: ComplianceNode) => {
    switch (node.status) {
      case "COMPLIANT":
        return "bg-green-500";
      case "NON_COMPLIANT":
        return "bg-red-500";
      case "IN_PROGRESS":
        return "bg-yellow-500";
      case "PENDING":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getNodeIcon = (node: ComplianceNode) => {
    switch (node.type) {
      case "STANDARD":
        return <FiShield className="w-5 h-5" />;
      case "REQUIREMENT":
        return <FiTarget className="w-5 h-5" />;
      case "AUDIT":
        return <FiCheckCircle className="w-5 h-5" />;
      case "FINDING":
        return <FiAlertCircle className="w-5 h-5" />;
      case "ACTION":
        return <FiXCircle className="w-5 h-5" />;
    }
  };

  // Simple force-directed layout (would use D3.js or similar in production)
  const layoutNodes = useMemo(() => {
    return nodes.map((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const radius = 150;
      return {
        ...node,
        x: 250 + radius * Math.cos(angle),
        y: 250 + radius * Math.sin(angle),
      };
    });
  }, [nodes]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Compliance Network Map
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">
              Non-Compliant
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600 dark:text-gray-400">
              In Progress
            </span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-96 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
        <svg width="100%" height="100%" className="absolute inset-0">
          {/* Draw connections */}
          {layoutNodes.map((node) =>
            node.connections.map((targetId) => {
              const target = layoutNodes.find((n) => n.id === targetId);
              if (!target || !node.x || !node.y || !target.x || !target.y)
                return null;
              return (
                <line
                  key={`${node.id}-${targetId}`}
                  x1={node.x}
                  y1={node.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="#e5e7eb"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              );
            }),
          )}
        </svg>

        {/* Draw nodes */}
        {layoutNodes.map((node) => {
          if (!node.x || !node.y) return null;
          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => onNodeClick?.(node.id)}
              className="absolute cursor-pointer group"
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className={`${getNodeColor(node)} rounded-full p-3 text-white shadow-lg group-hover:shadow-xl transition-all`}
              >
                {getNodeIcon(node)}
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {node.label}
                {node.metadata?.score && (
                  <div className="text-yellow-400">
                    Score: {node.metadata.score}%
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Node Legend */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        {layoutNodes.slice(0, 5).map((node) => (
          <div
            key={node.id}
            className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className={`w-4 h-4 rounded-full ${getNodeColor(node)}`}></div>
            <div>
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                {node.label}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {node.type}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QHSEComplianceMap;

/**
 * Condition Node Component for Workflow Builder
 */

"use client";

import { Handle, Position } from "reactflow";
import { motion } from "framer-motion";

interface ConditionNodeProps {
  data: {
    label: string;
    config?: any;
  };
  selected?: boolean;
}

export default function ConditionNode({ data, selected }: ConditionNodeProps) {
  return (
    <motion.div
      className={`px-4 py-3 bg-yellow-500/20 border-2 rounded-lg min-w-[150px] ${
        selected ? "border-yellow-500" : "border-yellow-500/50"
      }`}
      whileHover={{ scale: 1.05 }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-yellow-400"
      />
      <div className="flex items-center gap-2">
        <i className="ri-question-line text-yellow-400"></i>
        <div className="text-sm font-medium text-white">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="w-3 h-3 bg-green-400 left-1/4"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 bg-red-400 right-1/4"
      />
    </motion.div>
  );
}

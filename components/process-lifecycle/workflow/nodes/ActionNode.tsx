/**
 * Action Node Component for Workflow Builder
 */

"use client";

import { Handle, Position } from "reactflow";
import { motion } from "framer-motion";

interface ActionNodeProps {
  data: {
    label: string;
    config?: any;
  };
  selected?: boolean;
}

export default function ActionNode({ data, selected }: ActionNodeProps) {
  return (
    <motion.div
      className={`px-4 py-3 bg-cyan-500/20 border-2 rounded-lg min-w-[150px] ${
        selected ? "border-cyan-500" : "border-cyan-500/50"
      }`}
      whileHover={{ scale: 1.05 }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-cyan-400"
      />
      <div className="flex items-center gap-2">
        <i className="ri-play-line text-cyan-400"></i>
        <div className="text-sm font-medium text-white">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-cyan-400"
      />
    </motion.div>
  );
}

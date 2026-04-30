"use client";

import { motion } from "framer-motion";
import { PickingStrategy } from "@/types/picking";
import Tooltip from "./Tooltip";

interface PickingStrategySelectorProps {
  selectedStrategy: PickingStrategy;
  onStrategyChange: (strategy: PickingStrategy) => void;
  disabled?: boolean;
}

const strategies: Array<{
  value: PickingStrategy;
  label: string;
  icon: string;
  description: string;
  bestFor: string;
  efficiency: number;
  sapEquivalent?: string;
  oracleEquivalent?: string;
}> = [
  {
    value: "DISCRETE",
    label: "Discrete Picking",
    icon: "ri-file-list-line",
    description: "Single order picking - One order at a time",
    bestFor: "High-value orders, complex items",
    efficiency: 85,
    sapEquivalent: "Single Order Picking",
    oracleEquivalent: "Discrete Picking",
  },
  {
    value: "BATCH",
    label: "Batch Picking",
    icon: "ri-stack-line",
    description: "Multiple orders, single picker - Group similar items",
    bestFor: "High-volume, similar items",
    efficiency: 92,
    sapEquivalent: "Batch Picking",
    oracleEquivalent: "Multi-Order Picking",
  },
  {
    value: "WAVE",
    label: "Wave Picking",
    icon: "ri-sound-module-line",
    description: "Grouped orders by criteria - Time-based waves",
    bestFor: "Scheduled fulfillment, shipping windows",
    efficiency: 88,
    sapEquivalent: "Wave Planning",
    oracleEquivalent: "Wave Management",
  },
  {
    value: "ZONE",
    label: "Zone Picking",
    icon: "ri-map-pin-line",
    description: "Zone-based picking - Specialized pickers per zone",
    bestFor: "Large warehouses, specialized zones",
    efficiency: 90,
    sapEquivalent: "Zone Picking",
    oracleEquivalent: "Zone-Based Picking",
  },
  {
    value: "CLUSTER",
    label: "Cluster Picking",
    icon: "ri-group-line",
    description: "Multi-order, multi-zone - Advanced optimization",
    bestFor: "Complex warehouses, mixed orders",
    efficiency: 95,
    sapEquivalent: "Cluster Picking",
    oracleEquivalent: "Cluster Picking",
  },
  {
    value: "PICK_TO_CART",
    label: "Pick-to-Cart",
    icon: "ri-shopping-cart-line",
    description: "Cart-based picking - Mobile cart with multiple orders",
    bestFor: "Medium-volume, multiple small orders",
    efficiency: 87,
    sapEquivalent: "Cart Picking",
    oracleEquivalent: "Cart-Based Picking",
  },
  {
    value: "PICK_TO_LIGHT",
    label: "Pick-to-Light",
    icon: "ri-lightbulb-line",
    description: "Light-directed picking - Visual guidance system",
    bestFor: "High-speed, high-accuracy picking",
    efficiency: 96,
    sapEquivalent: "Pick-to-Light",
    oracleEquivalent: "Light-Directed Picking",
  },
  {
    value: "VOICE",
    label: "Voice Picking",
    icon: "ri-mic-line",
    description: "Voice-directed picking - Hands-free operation",
    bestFor: "Hands-free, safety-critical environments",
    efficiency: 89,
    sapEquivalent: "Voice Picking",
    oracleEquivalent: "Voice-Directed Picking",
  },
  {
    value: "VISION",
    label: "Vision Picking",
    icon: "ri-eye-line",
    description: "AR/Computer vision - Augmented reality guidance",
    bestFor: "Complex items, training, accuracy",
    efficiency: 94,
    sapEquivalent: "Vision Picking",
    oracleEquivalent: "AR Picking",
  },
  {
    value: "AUTO",
    label: "AI-Optimized",
    icon: "ri-brain-line",
    description: "AI-powered strategy selection - Best method automatically",
    bestFor: "Optimal efficiency, dynamic conditions",
    efficiency: 98,
    sapEquivalent: "AI Picking",
    oracleEquivalent: "Intelligent Picking",
  },
];

export default function PickingStrategySelector({
  selectedStrategy,
  onStrategyChange,
  disabled = false,
}: PickingStrategySelectorProps) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            Picking Strategy
          </h3>
          <p className="text-sm text-[#9ca3af]">
            Select the optimal picking method for your operation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-cyan-400 font-medium">
            Efficiency:{" "}
            {strategies.find((s) => s.value === selectedStrategy)?.efficiency}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
        {strategies.map((strategy) => {
          const isSelected = selectedStrategy === strategy.value;

          return (
            <Tooltip
              key={strategy.value}
              content={
                <div className="text-white">
                  <div className="font-semibold mb-1 text-white">
                    {strategy.label}
                  </div>
                  <div className="text-xs mb-2 text-gray-300">
                    {strategy.description}
                  </div>
                  <div className="text-xs text-cyan-400 mb-1">
                    Best for: {strategy.bestFor}
                  </div>
                  <div className="text-xs text-green-400">
                    Efficiency: {strategy.efficiency}%
                  </div>
                  {strategy.sapEquivalent && (
                    <div className="text-xs text-gray-400 mt-1">
                      SAP: {strategy.sapEquivalent}
                    </div>
                  )}
                  {strategy.oracleEquivalent && (
                    <div className="text-xs text-gray-400">
                      Oracle: {strategy.oracleEquivalent}
                    </div>
                  )}
                </div>
              }
              position="top"
            >
              <motion.button
                onClick={() => !disabled && onStrategyChange(strategy.value)}
                disabled={disabled}
                whileHover={!disabled ? { scale: 1.05, y: -4 } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
                className={`
                  relative p-4 rounded-xl border-2 transition-all
                  ${
                    isSelected
                      ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                      : "bg-white/5 border-white/10 hover:border-cyan-500/30"
                  }
                  ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${
                      isSelected
                        ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
                        : "bg-white/5 text-cyan-400"
                    }
                  `}
                  >
                    <i className={`${strategy.icon} text-lg`}></i>
                  </div>
                  <div className="text-center">
                    <div
                      className={`
                      text-xs font-medium
                      ${isSelected ? "text-white" : "text-[#9ca3af]"}
                    `}
                    >
                      {strategy.label}
                    </div>
                    <div className="text-[10px] text-cyan-400 mt-0.5">
                      {strategy.efficiency}% eff.
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <i className="ri-check-line text-white text-xs"></i>
                  </motion.div>
                )}
              </motion.button>
            </Tooltip>
          );
        })}
      </div>

      {selectedStrategy && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <i className="ri-information-line text-cyan-400 text-lg mt-0.5"></i>
            <div className="flex-1">
              <div className="text-sm font-medium text-white mb-1">
                {strategies.find((s) => s.value === selectedStrategy)?.label}
              </div>
              <div className="text-xs text-[#9ca3af]">
                {
                  strategies.find((s) => s.value === selectedStrategy)
                    ?.description
                }
              </div>
              <div className="text-xs text-cyan-400 mt-2">
                Best for:{" "}
                {strategies.find((s) => s.value === selectedStrategy)?.bestFor}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

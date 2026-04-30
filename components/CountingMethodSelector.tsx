"use client";

import { motion } from "framer-motion";
import { CountingMethod } from "@/types/cycleCounting";
import Tooltip from "./Tooltip";

interface CountingMethodSelectorProps {
  selectedMethod: CountingMethod;
  onMethodChange: (method: CountingMethod) => void;
  disabled?: boolean;
}

const methods: Array<{
  value: CountingMethod;
  label: string;
  icon: string;
  description: string;
  bestFor: string;
  accuracy: number;
  efficiency: number;
  sapEquivalent?: string;
  oracleEquivalent?: string;
}> = [
  {
    value: "ABC_ANALYSIS",
    label: "ABC Analysis",
    icon: "ri-bar-chart-box-line",
    description:
      "ABC classification based counting - Prioritize high-value items",
    bestFor: "High-value inventory, value-based optimization",
    accuracy: 95,
    efficiency: 92,
    sapEquivalent: "ABC Cycle Counting",
    oracleEquivalent: "ABC Classification Counting",
  },
  {
    value: "RANDOM",
    label: "Random Counting",
    icon: "ri-shuffle-line",
    description: "Random selection of items for counting",
    bestFor: "Statistical sampling, audit purposes",
    accuracy: 88,
    efficiency: 85,
    sapEquivalent: "Random Cycle Count",
    oracleEquivalent: "Random Selection",
  },
  {
    value: "LOCATION_BASED",
    label: "Location-Based",
    icon: "ri-map-pin-line",
    description: "Count by location - Zone, aisle, or rack based",
    bestFor: "Location-specific issues, zone management",
    accuracy: 90,
    efficiency: 88,
    sapEquivalent: "Location Cycle Count",
    oracleEquivalent: "Location-Based Counting",
  },
  {
    value: "FREQUENCY_BASED",
    label: "Frequency-Based",
    icon: "ri-pulse-line",
    description: "Count frequently accessed items more often",
    bestFor: "High-turnover items, fast-moving inventory",
    accuracy: 93,
    efficiency: 90,
    sapEquivalent: "Frequency Cycle Count",
    oracleEquivalent: "Turnover-Based Counting",
  },
  {
    value: "VALUE_BASED",
    label: "Value-Based",
    icon: "ri-money-dollar-circle-line",
    description: "Prioritize high-value items for counting",
    bestFor: "Expensive items, financial accuracy",
    accuracy: 96,
    efficiency: 94,
    sapEquivalent: "Value Cycle Count",
    oracleEquivalent: "Value-Based Counting",
  },
  {
    value: "CONTROL_GROUP",
    label: "Control Group",
    icon: "ri-group-line",
    description: "Control group method for accuracy validation",
    bestFor: "Quality control, accuracy validation",
    accuracy: 98,
    efficiency: 87,
    sapEquivalent: "Control Group Method",
    oracleEquivalent: "Control Group Counting",
  },
  {
    value: "BLIND_COUNT",
    label: "Blind Count",
    icon: "ri-eye-off-line",
    description: "Count without seeing book quantity - Prevents bias",
    bestFor: "Accuracy validation, unbiased counting",
    accuracy: 97,
    efficiency: 85,
    sapEquivalent: "Blind Cycle Count",
    oracleEquivalent: "Blind Counting",
  },
  {
    value: "OPEN_COUNT",
    label: "Open Count",
    icon: "ri-eye-line",
    description: "Count with book quantity visible - Faster counting",
    bestFor: "Speed, quick verification",
    accuracy: 92,
    efficiency: 95,
    sapEquivalent: "Open Cycle Count",
    oracleEquivalent: "Open Counting",
  },
  {
    value: "SPOT_CHECK",
    label: "Spot Check",
    icon: "ri-search-line",
    description: "Quick spot checks for specific items",
    bestFor: "Quick verification, targeted checks",
    accuracy: 90,
    efficiency: 98,
    sapEquivalent: "Spot Check",
    oracleEquivalent: "Spot Verification",
  },
  {
    value: "FULL_PHYSICAL",
    label: "Full Physical",
    icon: "ri-file-list-3-line",
    description: "Complete physical inventory count",
    bestFor: "Annual inventory, complete audit",
    accuracy: 99,
    efficiency: 70,
    sapEquivalent: "Full Physical Inventory",
    oracleEquivalent: "Complete Physical Count",
  },
  {
    value: "CONTINUOUS",
    label: "Continuous",
    icon: "ri-refresh-line",
    description: "Continuous cycle counting - Always counting",
    bestFor: "High accuracy requirements, ongoing monitoring",
    accuracy: 98,
    efficiency: 88,
    sapEquivalent: "Continuous Cycle Count",
    oracleEquivalent: "Continuous Counting",
  },
  {
    value: "AI_OPTIMIZED",
    label: "AI-Optimized",
    icon: "ri-brain-line",
    description: "AI-powered method selection - Optimal strategy automatically",
    bestFor: "Optimal efficiency, dynamic conditions",
    accuracy: 99,
    efficiency: 96,
    sapEquivalent: "AI Cycle Count",
    oracleEquivalent: "Intelligent Counting",
  },
];

export default function CountingMethodSelector({
  selectedMethod,
  onMethodChange,
  disabled = false,
}: CountingMethodSelectorProps) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            Counting Method
          </h3>
          <p className="text-sm text-[#9ca3af]">
            Select the optimal counting method for your operation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-cyan-400 font-medium">
            Accuracy:{" "}
            {methods.find((m) => m.value === selectedMethod)?.accuracy}%
          </span>
          <span className="text-xs text-green-400 font-medium">
            Efficiency:{" "}
            {methods.find((m) => m.value === selectedMethod)?.efficiency}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
        {methods.map((method) => {
          const isSelected = selectedMethod === method.value;

          return (
            <Tooltip
              key={method.value}
              content={
                <div className="text-white">
                  <div className="font-semibold mb-1 text-white">
                    {method.label}
                  </div>
                  <div className="text-xs mb-2 text-gray-300">
                    {method.description}
                  </div>
                  <div className="text-xs text-cyan-400 mb-1">
                    Best for: {method.bestFor}
                  </div>
                  <div className="text-xs text-green-400 mb-1">
                    Accuracy: {method.accuracy}%
                  </div>
                  <div className="text-xs text-yellow-400">
                    Efficiency: {method.efficiency}%
                  </div>
                  {method.sapEquivalent && (
                    <div className="text-xs text-gray-400 mt-1">
                      SAP: {method.sapEquivalent}
                    </div>
                  )}
                  {method.oracleEquivalent && (
                    <div className="text-xs text-gray-400">
                      Oracle: {method.oracleEquivalent}
                    </div>
                  )}
                </div>
              }
              position="top"
            >
              <motion.button
                onClick={() => !disabled && onMethodChange(method.value)}
                disabled={disabled}
                whileHover={!disabled ? { scale: 1.05, y: -4 } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
                className={`
                  relative p-3 sm:p-4 rounded-xl border-2 transition-all
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
                    w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center
                    ${
                      isSelected
                        ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
                        : "bg-white/5 text-cyan-400"
                    }
                  `}
                  >
                    <i className={`${method.icon} text-base sm:text-lg`}></i>
                  </div>
                  <div className="text-center">
                    <div
                      className={`
                      text-xs font-medium
                      ${isSelected ? "text-white" : "text-[#9ca3af]"}
                    `}
                    >
                      {method.label}
                    </div>
                    <div className="text-[10px] text-cyan-400 mt-0.5">
                      {method.accuracy}% acc.
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

      {selectedMethod && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <i className="ri-information-line text-cyan-400 text-lg mt-0.5"></i>
            <div className="flex-1">
              <div className="text-sm font-medium text-white mb-1">
                {methods.find((m) => m.value === selectedMethod)?.label}
              </div>
              <div className="text-xs text-[#9ca3af]">
                {methods.find((m) => m.value === selectedMethod)?.description}
              </div>
              <div className="text-xs text-cyan-400 mt-2">
                Best for:{" "}
                {methods.find((m) => m.value === selectedMethod)?.bestFor}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * System Admin Time Range Selector
 * Beautiful time range selection for metrics
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export type TimeRange = "1h" | "24h" | "7d" | "30d" | "custom";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  onCustomRangeChange?: (start: Date, end: Date) => void;
}

export default function TimeRangeSelector({
  value,
  onChange,
  onCustomRangeChange,
}: TimeRangeSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  );
  const [customEnd, setCustomEnd] = useState(
    new Date().toISOString().slice(0, 16),
  );

  const ranges: { id: TimeRange; label: string; icon: string }[] = [
    { id: "1h", label: "Last Hour", icon: "ri-time-line" },
    { id: "24h", label: "Last 24 Hours", icon: "ri-calendar-line" },
    { id: "7d", label: "Last 7 Days", icon: "ri-calendar-week-line" },
    { id: "30d", label: "Last 30 Days", icon: "ri-calendar-month-line" },
    { id: "custom", label: "Custom Range", icon: "ri-calendar-2-line" },
  ];

  const handleCustomSubmit = () => {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    if (start < end) {
      onChange("custom");
      onCustomRangeChange?.(start, end);
      setShowCustom(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {ranges.map((range) => (
          <motion.button
            key={range.id}
            onClick={() => {
              if (range.id === "custom") {
                setShowCustom(!showCustom);
              } else {
                onChange(range.id);
                setShowCustom(false);
              }
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-lg border text-sm transition-all flex items-center gap-2 ${
              value === range.id
                ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
                : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
            }`}
          >
            <i className={range.icon}></i>
            <span>{range.label}</span>
          </motion.button>
        ))}
      </div>

      {showCustom && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCustomSubmit}
              className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
            >
              Apply Custom Range
            </button>
            <button
              onClick={() => setShowCustom(false)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

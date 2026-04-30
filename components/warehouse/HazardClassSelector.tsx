/**
 * Hazard Class Selector Component
 * Comprehensive hazard class selection with volume limits
 * BlueDXP Platform
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ALL_HAZARD_CLASSES } from "@/types/warehouseLocation";

interface HazardClassSelection {
  enabled: boolean;
  limit: number;
  hasLimit: boolean;
}

interface HazardClassSelectorProps {
  selectedHazards: Record<string, HazardClassSelection>;
  onChange: (hazards: Record<string, HazardClassSelection>) => void;
  showLimits?: boolean;
  compact?: boolean;
}

export default function HazardClassSelector({
  selectedHazards,
  onChange,
  showLimits = true,
  compact = false,
}: HazardClassSelectorProps) {
  const [localHazards, setLocalHazards] =
    useState<Record<string, HazardClassSelection>>(selectedHazards);

  useEffect(() => {
    setLocalHazards(selectedHazards);
  }, [selectedHazards]);

  const handleToggle = (hazardValue: string) => {
    const current = localHazards[hazardValue];
    const newHazards = { ...localHazards };

    if (current?.enabled) {
      delete newHazards[hazardValue];
    } else {
      const hazard = ALL_HAZARD_CLASSES.find((h) => h.value === hazardValue);
      newHazards[hazardValue] = {
        enabled: true,
        limit: hazard?.defaultLimit || 1000,
        hasLimit: true,
      };
    }

    setLocalHazards(newHazards);
    onChange(newHazards);
  };

  const handleLimitChange = (hazardValue: string, limit: number) => {
    const newHazards = {
      ...localHazards,
      [hazardValue]: {
        ...localHazards[hazardValue],
        limit,
      },
    };
    setLocalHazards(newHazards);
    onChange(newHazards);
  };

  const handleLimitToggle = (hazardValue: string) => {
    const newHazards = {
      ...localHazards,
      [hazardValue]: {
        ...localHazards[hazardValue],
        hasLimit: !localHazards[hazardValue].hasLimit,
      },
    };
    setLocalHazards(newHazards);
    onChange(newHazards);
  };

  const selectedCount = Object.keys(localHazards).filter(
    (k) => localHazards[k].enabled,
  ).length;

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">
            Hazard Classes ({selectedCount} selected)
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-white/5 border border-white/10 max-h-48 overflow-y-auto">
          {ALL_HAZARD_CLASSES.map((hazard) => {
            const isSelected = localHazards[hazard.value]?.enabled;
            return (
              <label
                key={hazard.value}
                className={`flex items-center gap-2 cursor-pointer text-sm p-2 rounded transition ${
                  isSelected
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "hover:bg-white/5 text-gray-400"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggle(hazard.value)}
                  className="w-4 h-4 rounded border-cyan-500 text-cyan-500"
                />
                <span>{hazard.value}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">
          Allowed Hazard Classes & Volume Limits
        </label>
        <span className="text-xs text-gray-400">
          {selectedCount} of {ALL_HAZARD_CLASSES.length} selected
        </span>
      </div>

      <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 max-h-96 overflow-y-auto">
        {ALL_HAZARD_CLASSES.map((hazard) => {
          const isSelected = localHazards[hazard.value]?.enabled;
          const hasLimit = localHazards[hazard.value]?.hasLimit;
          const limit =
            localHazards[hazard.value]?.limit || hazard.defaultLimit;

          return (
            <motion.div
              key={hazard.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg border transition ${
                isSelected
                  ? "bg-cyan-500/10 border-cyan-500/30"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-3 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(hazard.value)}
                    className="w-5 h-5 rounded border-cyan-500 text-cyan-500"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-white">
                      {hazard.label}
                    </span>
                    {isSelected && (
                      <span className="ml-2 text-xs text-cyan-400">
                        ✓ Enabled
                      </span>
                    )}
                  </div>
                </label>

                {isSelected && showLimits && (
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasLimit}
                        onChange={() => handleLimitToggle(hazard.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-400">Set Limit</span>
                    </label>

                    {hasLimit && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={limit}
                          onChange={(e) =>
                            handleLimitChange(
                              hazard.value,
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-24 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
                          min="0"
                        />
                        <span className="text-sm text-gray-400">L/kg</span>
                      </div>
                    )}

                    {!hasLimit && (
                      <span className="text-xs text-gray-500">No limit</span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedCount > 0 && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs text-blue-400">
            <i className="ri-information-line mr-1"></i>
            {selectedCount} hazard class{selectedCount !== 1 ? "es" : ""}{" "}
            selected
            {showLimits &&
              Object.values(localHazards).some((h) => h.hasLimit) && (
                <span className="ml-2">
                  • Volume limits configured for{" "}
                  {Object.values(localHazards).filter((h) => h.hasLimit).length}{" "}
                  class
                  {Object.values(localHazards).filter((h) => h.hasLimit)
                    .length !== 1
                    ? "es"
                    : ""}
                </span>
              )}
          </p>
        </div>
      )}
    </div>
  );
}

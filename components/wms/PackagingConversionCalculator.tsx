/**
 * Packaging Conversion Calculator Component
 * Calculate conversions between different packaging levels
 * Deep Architecture • Integration-First
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SKU, PackagingHierarchy, PackagingLevel } from "@/types/sku";
import { skuService } from "@/lib/services/wms/skuService";
import Modal from "@/components/Modal";

interface PackagingConversionCalculatorProps {
  sku: SKU;
  isOpen: boolean;
  onClose: () => void;
}

export default function PackagingConversionCalculator({
  sku,
  isOpen,
  onClose,
}: PackagingConversionCalculatorProps) {
  const [packagingHierarchy, setPackagingHierarchy] =
    useState<PackagingHierarchy | null>(null);
  const [fromLevel, setFromLevel] = useState<string>("");
  const [toLevel, setToLevel] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [result, setResult] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && sku.id) {
      loadPackagingHierarchy();
    }
  }, [isOpen, sku.id]);

  const loadPackagingHierarchy = async () => {
    try {
      const hierarchy = await skuService.getPackagingHierarchy(sku.id);
      setPackagingHierarchy(hierarchy);
      if (hierarchy && hierarchy.levels.length > 0) {
        setFromLevel(hierarchy.levels[0].id);
        if (hierarchy.levels.length > 1) {
          setToLevel(hierarchy.levels[hierarchy.levels.length - 1].id);
        } else {
          setToLevel(hierarchy.levels[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading packaging hierarchy:", error);
    }
  };

  const handleCalculate = async () => {
    if (!fromLevel || !toLevel || !quantity) {
      setError("Please fill in all fields");
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    setIsCalculating(true);
    setError(null);
    setResult(null);

    try {
      const converted = await skuService.calculatePackagingConversion(
        sku.id,
        fromLevel,
        toLevel,
        qty,
      );
      setResult(converted);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Calculation failed");
    } finally {
      setIsCalculating(false);
    }
  };

  const getLevelName = (levelId: string): string => {
    if (!packagingHierarchy) return "";
    const level = packagingHierarchy.levels.find((l) => l.id === levelId);
    return level ? `${level.name} (${level.code})` : "";
  };

  if (!packagingHierarchy || packagingHierarchy.levels.length === 0) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Packaging Conversion Calculator"
        size="md"
      >
        <div className="text-center py-8 text-[#9ca3af]">
          <i className="ri-error-warning-line text-4xl mb-2"></i>
          <p>No packaging hierarchy defined for this SKU</p>
          <p className="text-sm mt-2">
            Please configure packaging levels first
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Packaging Conversion Calculator"
      size="md"
    >
      <div className="space-y-6">
        {/* SKU Info */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="text-sm text-[#9ca3af] mb-1">SKU</div>
          <div className="text-white font-medium">{sku.skuCode}</div>
          <div className="text-sm text-[#9ca3af]">
            {sku.materialDescription}
          </div>
        </div>

        {/* Conversion Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Convert From
            </label>
            <select
              value={fromLevel}
              onChange={(e) => setFromLevel(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              {packagingHierarchy.levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name} ({level.code}) - Level {level.level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Convert To
            </label>
            <select
              value={toLevel}
              onChange={(e) => setToLevel(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              {packagingHierarchy.levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name} ({level.code}) - Level {level.level}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            <i className="ri-error-warning-line mr-2"></i>
            {error}
          </div>
        )}

        {/* Result */}
        {result !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-cyan-500/10 border border-cyan-500/20 rounded-lg"
          >
            <div className="text-sm text-[#9ca3af] mb-2">Conversion Result</div>
            <div className="text-3xl font-bold text-cyan-400 mb-2">
              {result.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-[#9ca3af]">
              {quantity} {getLevelName(fromLevel)} ={" "}
              {result.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
              {getLevelName(toLevel)}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleCalculate}
            disabled={isCalculating || !fromLevel || !toLevel || !quantity}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCalculating ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Calculating...
              </>
            ) : (
              <>
                <i className="ri-calculator-line mr-2"></i>
                Calculate
              </>
            )}
          </button>
        </div>

        {/* Packaging Hierarchy Info */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="text-sm font-medium text-white mb-2">
            Packaging Hierarchy
          </div>
          <div className="space-y-2">
            {packagingHierarchy.levels.map((level, index) => (
              <div key={level.id} className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-medium">
                  {level.level}
                </div>
                <span className="text-white">
                  {level.name} ({level.code})
                </span>
                {level.quantityPerParent && (
                  <span className="text-[#9ca3af]">
                    - {level.quantityPerParent} per parent
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

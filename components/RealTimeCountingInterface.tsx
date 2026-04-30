"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CountItem } from "@/types/cycleCounting";
import Tooltip from "./Tooltip";

interface RealTimeCountingInterfaceProps {
  item: CountItem;
  onCountEntered: (quantity: number) => void;
  onComplete: () => void;
  onSkip: () => void;
  blindCount?: boolean;
}

export default function RealTimeCountingInterface({
  item,
  onCountEntered,
  onComplete,
  onSkip,
  blindCount = false,
}: RealTimeCountingInterfaceProps) {
  const [countedQty, setCountedQty] = useState<string>(
    item.countedQuantity?.toString() || "",
  );
  const [scanMode, setScanMode] = useState<"MANUAL" | "BARCODE" | "QR">(
    "MANUAL",
  );

  // Update countedQty when item changes
  useEffect(() => {
    setCountedQty(item.countedQuantity?.toString() || "");
  }, [item.id, item.countedQuantity]);

  const handleQuantityChange = (value: string) => {
    // Allow only numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, "");
    setCountedQty(numericValue);
  };

  const handleSubmit = () => {
    const quantity = parseFloat(countedQty);
    if (!isNaN(quantity) && quantity >= 0) {
      onCountEntered(quantity);
    }
  };

  const variance =
    item.countedQuantity !== undefined && item.bookQuantity > 0
      ? ((item.countedQuantity - item.bookQuantity) / item.bookQuantity) * 100
      : undefined;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">
            Real-Time Counting
          </h3>
          <p className="text-sm text-[#9ca3af]">
            Enter physical count for this item
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScanMode("MANUAL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              scanMode === "MANUAL"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-white/5 text-[#9ca3af] border border-white/10"
            }`}
          >
            <i className="ri-keyboard-line mr-1"></i>
            Manual
          </button>
          <button
            onClick={() => setScanMode("BARCODE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              scanMode === "BARCODE"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-white/5 text-[#9ca3af] border border-white/10"
            }`}
          >
            <i className="ri-barcode-line mr-1"></i>
            Barcode
          </button>
          <button
            onClick={() => setScanMode("QR")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              scanMode === "QR"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-white/5 text-[#9ca3af] border border-white/10"
            }`}
          >
            <i className="ri-qr-scan-line mr-1"></i>
            QR
          </button>
        </div>
      </div>

      {/* Item Information */}
      <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-[#9ca3af] mb-1">Material Number</div>
            <div className="text-lg font-semibold text-white font-mono">
              {item.materialNumber}
            </div>
            <div className="text-sm text-[#9ca3af] mt-1">
              {item.materialDescription}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#9ca3af] mb-1">Location</div>
            <div className="text-lg font-semibold text-white font-mono">
              {item.location.locationCode}
            </div>
            <div className="text-sm text-[#9ca3af] mt-1">
              Zone {item.location.zone} • Aisle {item.location.aisle}
            </div>
          </div>
          {item.batchNumber && (
            <div>
              <div className="text-xs text-[#9ca3af] mb-1">Batch Number</div>
              <div className="text-sm font-medium text-white font-mono">
                {item.batchNumber}
              </div>
            </div>
          )}
          {item.serialNumber && (
            <div>
              <div className="text-xs text-[#9ca3af] mb-1">Serial Number</div>
              <div className="text-sm font-medium text-white font-mono">
                {item.serialNumber}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Book Quantity (if not blind count) */}
      {!blindCount && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
          <div className="text-xs text-blue-400 mb-1">
            Book Quantity (System Record)
          </div>
          <div className="text-3xl font-bold text-white">
            {item.bookQuantity.toFixed(2)}{" "}
            <span className="text-lg text-[#9ca3af]">{item.unit}</span>
          </div>
        </div>
      )}

      {/* Count Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-2">
          Enter Counted Quantity
        </label>
        <div className="relative">
          <input
            type="text"
            value={countedQty}
            onChange={(e) => handleQuantityChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
            placeholder="0.00"
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-3xl font-bold text-white text-center focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-[#9ca3af]">
            {item.unit}
          </div>
        </div>
      </div>

      {/* Variance Display */}
      {item.countedQuantity !== undefined && variance !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-xl border-2 ${
            Math.abs(variance) <= 1
              ? "bg-green-500/10 border-green-500/20"
              : Math.abs(variance) <= 5
                ? "bg-yellow-500/10 border-yellow-500/20"
                : "bg-red-500/10 border-red-500/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#9ca3af] mb-1">Variance</div>
              <div
                className={`text-2xl font-bold ${
                  Math.abs(variance) <= 1
                    ? "text-green-400"
                    : Math.abs(variance) <= 5
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {variance > 0 ? "+" : ""}
                {variance.toFixed(2)}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#9ca3af] mb-1">Counted</div>
              <div className="text-xl font-semibold text-white">
                {item.countedQuantity.toFixed(2)} {item.unit}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={!countedQty || isNaN(parseFloat(countedQty))}
          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          <i className="ri-check-line text-xl"></i>
          {item.countedQuantity !== undefined ? "Update Count" : "Submit Count"}
        </button>
        <button
          onClick={onSkip}
          className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors border border-white/10"
        >
          <i className="ri-skip-forward-line"></i>
        </button>
        {item.countedQuantity !== undefined && (
          <button
            onClick={onComplete}
            className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <i className="ri-check-double-line"></i>
            Complete
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="text-xs text-[#9ca3af] mb-2">Quick Actions</div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCountedQty(item.bookQuantity.toString())}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-medium transition-colors border border-white/10"
          >
            <i className="ri-file-copy-line mr-1"></i>
            Use Book Qty
          </button>
          <button
            onClick={() => setCountedQty("0")}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-medium transition-colors border border-white/10"
          >
            <i className="ri-close-line mr-1"></i>
            Zero
          </button>
          <button
            onClick={() => {
              const current = parseFloat(countedQty) || 0;
              setCountedQty((current + 1).toString());
            }}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-medium transition-colors border border-white/10"
          >
            <i className="ri-add-line mr-1"></i>
            +1
          </button>
          <button
            onClick={() => {
              const current = parseFloat(countedQty) || 0;
              setCountedQty(Math.max(0, current - 1).toString());
            }}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-medium transition-colors border border-white/10"
          >
            <i className="ri-subtract-line mr-1"></i>
            -1
          </button>
        </div>
      </div>
    </div>
  );
}

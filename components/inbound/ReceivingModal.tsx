"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  getPutawaySuggestion,
  confirmPutaway,
} from "@/app/actions/wms/putawayActions";
import { useAuth } from "@/contexts/AuthContext";

interface ReceivingModalProps {
  asnId: string;
  itemId: string;
  sku: string;
  description?: string;
  expectedQty: number;
  unit?: string;
  tenantId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReceivingModal({
  asnId,
  itemId,
  sku,
  description,
  expectedQty,
  unit = "EA",
  tenantId,
  onClose,
  onSuccess,
}: ReceivingModalProps) {
  const { user } = useAuth();
  const [qty, setQty] = useState(expectedQty);
  const [binCode, setBinCode] = useState("");
  const [binId, setBinId] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(true);
  const [suggestionReason, setSuggestionReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSuggestion() {
      setSuggesting(true);
      setSuggestionReason("");
      // Call our new AI Brain
      const res = await getPutawaySuggestion(sku, expectedQty, tenantId);

      if (res.success && res.data) {
        setBinCode(res.data.recommendedBinCode);
        setBinId(res.data.recommendedBinId);
        setSuggestionReason(res.data.reason);
      } else if (!res.success && res.error) {
        // If AI fails, we let user manually enter, but show warning
        console.warn(res.error);
      }
      setSuggesting(false);
    }
    if (sku) loadSuggestion();
  }, [tenantId, sku, expectedQty]);

  /**
   * Lookup bin ID from bin code via API
   */
  const lookupBinByCode = async (code: string): Promise<string | null> => {
    try {
      const response = await fetch(
        `/api/wms/locations?search=${encodeURIComponent(code)}&tenantId=${tenantId}`,
      );
      if (response.ok) {
        const data = await response.json();
        if (data.bins && data.bins.length > 0) {
          // Find exact match by code
          const exactMatch = data.bins.find(
            (b: any) =>
              b.code?.toLowerCase() === code.toLowerCase() ||
              b.binCode?.toLowerCase() === code.toLowerCase(),
          );
          return exactMatch?.id || data.bins[0]?.id || null;
        }
      }
      return null;
    } catch (err) {
      console.error("Bin lookup error:", err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let effectiveBinId = binId;

    // If user manually changed code but we don't have the ID, look it up
    if (!effectiveBinId && binCode) {
      const lookedUpId = await lookupBinByCode(binCode);
      if (lookedUpId) {
        effectiveBinId = lookedUpId;
        setBinId(lookedUpId);
      } else {
        setError(`Bin code "${binCode}" not found. Please select a valid bin.`);
        setLoading(false);
        return;
      }
    }

    if (!effectiveBinId) {
      setError("Please select or enter a valid bin location");
      setLoading(false);
      return;
    }

    const result = await confirmPutaway(
      itemId,
      effectiveBinId,
      Number(qty),
      user?.id || "system",
      tenantId,
    );

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || "Failed to receive item");
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-[#1f2937] border border-[#374151] rounded-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#374151] flex items-center justify-between bg-[#111827]">
          <h3 className="text-xl font-bold text-white">Receive Goods</h3>
          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-white transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-sm text-blue-400 font-medium">{sku}</p>
            <p className="text-xs text-blue-300">{description}</p>
          </div>

          <div>
            <label className="block text-sm text-[#9ca3af] mb-1">
              Quantity Received ({unit})
            </label>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white font-mono text-lg"
              max={expectedQty}
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm text-[#9ca3af] mb-1 flex justify-between pr-1">
              <span>Target Bin</span>
              {suggesting && (
                <span className="text-cyan-400 text-xs animate-pulse opacity-100">
                  <i className="ri-brain-line mr-1"></i>A.I. Analyzing...
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                value={binCode}
                onChange={(e) => setBinCode(e.target.value)}
                className={`w-full bg-[#111827] border rounded-lg px-4 py-2 text-white font-mono transition-colors ${
                  suggestionReason
                    ? "border-green-500/50 focus:border-green-500"
                    : "border-[#374151]"
                }`}
                placeholder="Scan or enter Bin ID"
              />
              <i className="ri-qr-scan-line absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"></i>
            </div>

            {/* AI Reason Display */}
            {suggestionReason && !suggesting && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-xs bg-green-500/10 text-green-400 p-2 rounded border border-green-500/20 flex items-start gap-2"
              >
                <i className="ri-sparkling-fill mt-0.5"></i>
                <span>{suggestionReason}</span>
              </motion.div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#374151] text-white rounded-lg hover:bg-[#4b5563]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? (
                "Posting..."
              ) : (
                <>
                  <i className="ri-check-double-line"></i>
                  Confirm Receipt
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

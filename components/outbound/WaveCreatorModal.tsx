"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createWaveAction } from "@/app/actions/wms/outboundActions";
import { useAuth } from "@/contexts/AuthContext";

export default function WaveCreatorModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [limit, setLimit] = useState(50);
  const [carrier, setCarrier] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCreateWave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await createWaveAction(
      user?.tenantId || "tenant-1",
      limit,
      isUrgent,
    );
    setLoading(false);
    if (res.success) {
      setResult(res.data);
    } else {
      alert("Error creating wave: " + res.error);
    }
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
        className="bg-[#1f2937] border border-[#374151] rounded-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#374151] flex items-center justify-between bg-[#111827]">
          <h3 className="text-xl font-bold text-white">
            Wave Planning Strategy
          </h3>
          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-white transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {result ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-check-line text-3xl"></i>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Wave Created!</h4>
            <p className="text-[#9ca3af] mb-6">
              Wave Number:{" "}
              <span className="text-white font-mono">{result.waveNumber}</span>
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#374151] text-white rounded-lg hover:bg-[#4b5563]"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateWave} className="p-6 space-y-4">
            <div>
              <label className="block text-sm text-[#9ca3af] mb-1">
                Max Orders per Wave
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-[#9ca3af] mb-1">
                Carrier Filter (Optional)
              </label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="e.g. DHL, FedEx"
                className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                id="urgent"
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500"
              />
              <label
                htmlFor="urgent"
                className="text-red-400 font-medium cursor-pointer"
              >
                Urgent / Priority Wave
              </label>
            </div>

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
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50"
              >
                {loading ? "Generating..." : "Run Wave Engine"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

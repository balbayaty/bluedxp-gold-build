/**
 * 💰 ADD CREDITS MODAL
 * 
 * Modal for adding credits to account
 * 
 * BlueDXP Platform - Enterprise-Grade Billing
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiCloseLine, RiWallet3Line } from "react-icons/ri";

interface AddCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
  currentBalance: number;
}

const AddCreditsModal: React.FC<AddCreditsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentBalance,
}) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const presetAmounts = [50, 100, 250, 500, 1000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }

    setLoading(true);
    try {
      // In production, call API to add credits
      // await fetch("/api/billing/credits/add", { method: "POST", body: JSON.stringify({ amount: numAmount }) });
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      onSuccess(numAmount);
      setAmount("");
      setSelectedAmount(null);
    } catch (error) {
      console.error("Error adding credits:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-[#0f1419] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <RiWallet3Line className="text-green-400 text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Add Credits</h3>
                <p className="text-sm text-[#9ca3af]">Current balance: ${currentBalance.toFixed(2)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <RiCloseLine className="text-[#9ca3af] text-xl" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Preset Amounts */}
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-3">
                Quick Select
              </label>
              <div className="grid grid-cols-5 gap-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(preset);
                      setAmount(preset.toString());
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedAmount === preset
                        ? "bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] text-white"
                        : "bg-white/5 border border-white/10 text-[#9ca3af] hover:bg-white/10"
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                Custom Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setSelectedAmount(null);
                  }}
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#05a4ff]"
                />
              </div>
            </div>

            {/* New Balance Preview */}
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9ca3af]">New Balance:</span>
                  <span className="text-lg font-bold text-green-400">
                    ${(currentBalance + parseFloat(amount)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Add Credits"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddCreditsModal;

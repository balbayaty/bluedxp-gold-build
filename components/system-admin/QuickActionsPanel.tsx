/**
 * Quick Actions Panel
 * Floating quick actions for common tasks
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ActionButtons from "./ActionButtons";

export default function QuickActionsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 p-6 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-96 max-h-[500px] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Quick Actions
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <ActionButtons />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-all ${
          isOpen
            ? "bg-red-500/20 border-2 border-red-500/30 text-red-400"
            : "bg-cyan-500/20 border-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30"
        }`}
      >
        <i className={isOpen ? "ri-close-line" : "ri-flashlight-line"}></i>
      </motion.button>
    </div>
  );
}

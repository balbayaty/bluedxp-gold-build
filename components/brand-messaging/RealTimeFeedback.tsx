"use client";

import React from "react";
import { motion } from "framer-motion";

interface RealTimeFeedbackProps {
  status: "idle" | "generating" | "success" | "error";
  message?: string;
  progress?: number;
}

export const RealTimeFeedback: React.FC<RealTimeFeedbackProps> = ({
  status,
  message,
  progress,
}) => {
  if (status === "idle") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-20 right-6 bg-slate-800 rounded-xl p-4 border border-slate-600 shadow-2xl z-50 max-w-sm"
    >
      <div className="flex items-center gap-3">
        {status === "generating" && (
          <>
            <svg
              className="animate-spin h-5 w-5 text-blue-400"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">
                Generating...
              </div>
              {progress !== undefined && (
                <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                  <motion.div
                    className="bg-blue-500 h-1.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-green-400 text-xl">✓</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">
                Message Generated!
              </div>
              {message && (
                <div className="text-xs text-slate-400">{message}</div>
              )}
            </div>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-red-400 text-xl">✗</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">Error</div>
              {message && <div className="text-xs text-red-300">{message}</div>}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

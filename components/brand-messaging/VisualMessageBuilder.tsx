"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import type { BrandMessage } from "@/types/brand-messaging";

interface VisualMessageBuilderProps {
  message: BrandMessage;
}

export const VisualMessageBuilder: React.FC<VisualMessageBuilderProps> = ({
  message,
}) => {
  const [previewMode, setPreviewMode] = useState<
    "header" | "button" | "notification" | "empty" | "error"
  >("header");

  const renderPreview = () => {
    switch (previewMode) {
      case "header":
        return (
          <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700">
            <h1 className="text-3xl font-bold text-white mb-2" dir="ltr">
              {message.content.en}
            </h1>
            <h1 className="text-3xl font-bold text-white" dir="rtl">
              {message.content.ar}
            </h1>
          </div>
        );
      case "button":
        return (
          <div className="p-8 bg-slate-900 rounded-xl border border-slate-700">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold"
            >
              {message.content.en}
            </motion.button>
            <div className="mt-4" dir="rtl">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold"
              >
                {message.content.ar}
              </motion.button>
            </div>
          </div>
        );
      case "notification":
        return (
          <div className="p-8 bg-slate-900 rounded-xl border border-slate-700">
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-4">
              <div className="text-sm font-medium text-blue-300 mb-1">
                Notification
              </div>
              <div className="text-white">{message.content.en}</div>
            </div>
            <div
              className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4"
              dir="rtl"
            >
              <div className="text-sm font-medium text-blue-300 mb-1">
                إشعار
              </div>
              <div className="text-white">{message.content.ar}</div>
            </div>
          </div>
        );
      case "empty":
        return (
          <div className="p-12 bg-slate-900 rounded-xl border border-slate-700 text-center">
            <div className="text-6xl mb-4">📭</div>
            <div className="text-xl text-white mb-2" dir="ltr">
              {message.content.en}
            </div>
            <div className="text-xl text-white" dir="rtl">
              {message.content.ar}
            </div>
          </div>
        );
      case "error":
        return (
          <div className="p-8 bg-slate-900 rounded-xl border border-slate-700">
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <div className="text-sm font-medium text-red-300 mb-1">Error</div>
              <div className="text-white">{message.content.en}</div>
            </div>
            <div
              className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg p-4"
              dir="rtl"
            >
              <div className="text-sm font-medium text-red-300 mb-1">خطأ</div>
              <div className="text-white">{message.content.ar}</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Visual Preview</h3>
        <div className="flex gap-2">
          {(
            ["header", "button", "notification", "empty", "error"] as const
          ).map((mode) => (
            <button
              key={mode}
              onClick={() => setPreviewMode(mode)}
              className={`px-3 py-1 text-xs rounded-lg transition-all ${
                previewMode === mode
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={previewMode}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {renderPreview()}
      </motion.div>
    </div>
  );
};

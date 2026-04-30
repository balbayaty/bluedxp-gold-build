"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BrandMessage } from "@/types/brand-messaging";
import { MessageVariations } from "./MessageVariations";
import { ExportOptions } from "./ExportOptions";
import { VisualMessageBuilder } from "./VisualMessageBuilder";

interface MessagePreviewProps {
  message: BrandMessage;
  onVariationSelect?: (message: BrandMessage) => void;
}

export const MessagePreview: React.FC<MessagePreviewProps> = ({
  message,
  onVariationSelect,
}) => {
  const [activeLanguage, setActiveLanguage] = useState<"en" | "ar">("en");
  const [showDetails, setShowDetails] = useState(false);
  const [showVariations, setShowVariations] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<BrandMessage>(message);

  // Update current message when prop changes
  React.useEffect(() => {
    setCurrentMessage(message);
  }, [message]);

  const currentText =
    activeLanguage === "ar"
      ? currentMessage.content.ar
      : currentMessage.content.en;

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Message Preview</h2>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-slate-400 hover:text-slate-300"
        >
          {showDetails ? "Hide" : "Show"} Details
        </button>
      </div>

      {/* Language Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveLanguage("en")}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeLanguage === "en"
              ? "bg-blue-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          English
        </button>
        <button
          onClick={() => setActiveLanguage("ar")}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeLanguage === "ar"
              ? "bg-blue-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          العربية
        </button>
      </div>

      {/* Message Display */}
      <div className="bg-slate-900 rounded-lg p-6 border border-slate-600 min-h-[200px]">
        <div
          className="text-lg leading-relaxed"
          dir={activeLanguage === "ar" ? "rtl" : "ltr"}
        >
          {currentText || <span className="text-slate-500">No content</span>}
        </div>
      </div>

      {/* Side by Side View */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-600">
          <div className="text-xs text-slate-400 mb-2">English</div>
          <div className="text-sm" dir="ltr">
            {message.content.en || "N/A"}
          </div>
        </div>
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-600">
          <div className="text-xs text-slate-400 mb-2">العربية</div>
          <div className="text-sm" dir="rtl">
            {message.content.ar || "N/A"}
          </div>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-600 space-y-3">
          <div className="text-sm">
            <div className="text-slate-400 mb-1">Type:</div>
            <div className="text-white">{message.type}</div>
          </div>
          {message.content.transliteration && (
            <div className="text-sm">
              <div className="text-slate-400 mb-1">Transliteration:</div>
              <div className="text-white">
                {message.content.transliteration}
              </div>
            </div>
          )}
          {message.content.backTranslation && (
            <div className="text-sm">
              <div className="text-slate-400 mb-1">Back Translation:</div>
              <div className="text-white">
                {message.content.backTranslation}
              </div>
            </div>
          )}
          {message.metadata && (
            <div className="text-sm">
              <div className="text-slate-400 mb-1">Metadata:</div>
              <pre className="text-white text-xs bg-slate-800 p-2 rounded overflow-auto">
                {JSON.stringify(message.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Copy Buttons */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            navigator.clipboard.writeText(currentMessage.content.en);
          }}
          className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-2 px-4 rounded-lg transition-all font-medium"
        >
          📋 Copy English
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            navigator.clipboard.writeText(currentMessage.content.ar);
          }}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 px-4 rounded-lg transition-all font-medium"
        >
          📋 Copy Arabic
        </motion.button>
      </div>

      {/* Variations Toggle */}
      <button
        onClick={() => setShowVariations(!showVariations)}
        className="w-full mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
      >
        {showVariations ? "▼" : "▶"} Generate Variations
      </button>

      {/* Variations Panel */}
      <AnimatePresence>
        {showVariations && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <MessageVariations
              baseMessage={currentMessage}
              onSelectVariation={(variation) => {
                setCurrentMessage(variation);
                onVariationSelect?.(variation);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Builder */}
      <div className="mt-4">
        <VisualMessageBuilder message={currentMessage} />
      </div>

      {/* Export Options */}
      <div className="mt-4">
        <ExportOptions message={currentMessage} />
      </div>
    </div>
  );
};

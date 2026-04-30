"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import type { BrandMessage } from "@/types/brand-messaging";

interface MessageVariationsProps {
  baseMessage: BrandMessage;
  onSelectVariation: (message: BrandMessage) => void;
}

export const MessageVariations: React.FC<MessageVariationsProps> = ({
  baseMessage,
  onSelectVariation,
}) => {
  const [variations, setVariations] = useState<BrandMessage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const generateVariations = async () => {
    setGenerating(true);
    try {
      // Generate 3 variations
      const variationPromises = Array.from({ length: 3 }, async (_, i) => {
        const response = await fetch("/api/brand-messaging/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: baseMessage.type,
            context: {
              ...baseMessage.context,
              metadata: {
                ...baseMessage.context.metadata,
                variation: i + 1,
                generateVariation: true,
              },
            },
            useCache: false,
            qualityCheck: true,
          }),
        });
        return response.json();
      });

      const results = await Promise.all(variationPromises);
      const validVariations = results
        .filter((r) => r.success && r.data)
        .map((r) => r.data);

      setVariations(validVariations);
    } catch (error) {
      console.error("Failed to generate variations:", error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Message Variations
          </h3>
          <p className="text-sm text-slate-400">
            Generate alternative versions
          </p>
        </div>
        <button
          onClick={generateVariations}
          disabled={generating}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all disabled:opacity-50 text-sm font-medium"
        >
          {generating ? "Generating..." : "✨ Generate Variations"}
        </button>
      </div>

      {variations.length > 0 && (
        <div className="space-y-3">
          {variations.map((variation, idx) => (
            <motion.div
              key={variation.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => {
                setSelectedIndex(idx);
                onSelectVariation(variation);
              }}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedIndex === idx
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-600 bg-slate-900/50 hover:border-slate-500"
              }`}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-400 mb-1">English</div>
                  <div className="text-sm text-white">
                    {variation.content.en}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Arabic</div>
                  <div className="text-sm text-white" dir="rtl">
                    {variation.content.ar}
                  </div>
                </div>
              </div>
              {variation.metadata?.qualityScore && (
                <div className="mt-2 text-xs text-slate-400">
                  Quality: {variation.metadata.qualityScore}%
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {variations.length === 0 && !generating && (
        <div className="text-center py-8 text-slate-400">
          <div className="text-4xl mb-2">🎨</div>
          <div className="text-sm">
            Click "Generate Variations" to create alternative versions
          </div>
        </div>
      )}
    </div>
  );
};

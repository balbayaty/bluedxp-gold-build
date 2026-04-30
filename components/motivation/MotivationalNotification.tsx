/**
 * Motivational Notification Component
 *
 * Beautiful notifications with quotes, analytics, and value-add messages
 */

"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, TaskAnalytics } from "@/lib/services/motivation";
import {
  X,
  TrendingUp,
  Clock,
  Target,
  Leaf,
  Shield,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MotivationalNotificationProps {
  quote: Quote;
  analytics?: TaskAnalytics;
  onClose: () => void;
  autoClose?: number; // milliseconds
}

export function MotivationalNotification({
  quote,
  analytics,
  onClose,
  autoClose = 8000,
}: MotivationalNotificationProps) {
  // Auto-close after delay
  useEffect(() => {
    if (autoClose > 0) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const categoryColors = {
    data: "bg-blue-500",
    productivity: "bg-green-500",
    sustainability: "bg-emerald-500",
    resilience: "bg-purple-500",
    innovation: "bg-orange-500",
    quality: "bg-pink-500",
  };

  const categoryIcons = {
    data: "📊",
    productivity: "⚡",
    sustainability: "🌱",
    resilience: "🛡️",
    innovation: "💡",
    quality: "✨",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-96 max-w-[calc(100vw-2rem)]"
      >
        <Card className="shadow-2xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {categoryIcons[quote.category]}
                </span>
                <Badge className={categoryColors[quote.category]}>
                  {quote.category}
                </Badge>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quote */}
            <div className="mb-4">
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100 italic">
                "{quote.text}"
              </p>
              {quote.author && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-right">
                  — {quote.author}
                </p>
              )}
            </div>

            {/* Analytics */}
            {analytics && (
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-2">
                  {analytics.timeSaved > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Time Saved
                        </p>
                        <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                          {Math.round(analytics.timeSaved / 60000)} min
                        </p>
                      </div>
                    </div>
                  )}

                  {analytics.accuracy > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Accuracy
                        </p>
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                          {analytics.accuracy.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sustainability Impact */}
                {analytics.sustainabilityImpact && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Leaf className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        Sustainability Impact
                      </p>
                    </div>
                    {analytics.sustainabilityImpact.carbonSaved && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        🌱{" "}
                        {analytics.sustainabilityImpact.carbonSaved.toFixed(2)}{" "}
                        kg CO₂ saved
                      </p>
                    )}
                    {analytics.sustainabilityImpact.efficiencyGain && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        ⚡{" "}
                        {analytics.sustainabilityImpact.efficiencyGain.toFixed(
                          0,
                        )}
                        % more efficient
                      </p>
                    )}
                  </div>
                )}

                {/* Resilience Impact */}
                {analytics.resilienceImpact && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                        Resilience Impact
                      </p>
                    </div>
                    {analytics.resilienceImpact.riskReduced && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        🛡️ {analytics.resilienceImpact.riskReduced.toFixed(0)}%
                        risk reduction
                      </p>
                    )}
                  </div>
                )}

                {/* Positive Consequences */}
                {analytics.positiveConsequences &&
                  analytics.positiveConsequences.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        ✨ Positive Impact:
                      </p>
                      {analytics.positiveConsequences.map((consequence, i) => (
                        <p
                          key={i}
                          className="text-xs text-gray-600 dark:text-gray-400 pl-4"
                        >
                          • {consequence}
                        </p>
                      ))}
                    </div>
                  )}

                {/* Improvement Opportunities */}
                {analytics.negativeConsequences &&
                  analytics.negativeConsequences.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                        💡 Improvement Opportunities:
                      </p>
                      {analytics.negativeConsequences.map((consequence, i) => (
                        <p
                          key={i}
                          className="text-xs text-amber-600 dark:text-amber-400 pl-4"
                        >
                          • {consequence}
                        </p>
                      ))}
                    </div>
                  )}
              </div>
            )}

            {/* Sparkle Effect */}
            <div className="absolute top-2 right-2 opacity-20">
              <Sparkles className="h-6 w-6 text-blue-500 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

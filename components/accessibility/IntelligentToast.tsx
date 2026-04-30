"use client";

// ============================================================================
// INTELLIGENT TOAST NOTIFICATIONS
// ML-Powered, Contextual, Beautiful Notifications
// ============================================================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccessibility } from "@/contexts/AccessibilityContext";

export function IntelligentToastContainer() {
  const { insights, dismissInsight, actOnInsight, preferences } =
    useAccessibility();

  // Only show if insights are enabled
  if (!preferences?.notifications?.intelligentInsights) {
    return null;
  }

  // Filter to active insights only
  const activeInsights = (insights || [])
    .filter((i: any) => !i.dismissed)
    .slice(0, 3);

  if (activeInsights.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] space-y-3 max-w-md">
      <AnimatePresence>
        {activeInsights.map((insight: any, index: number) => (
          <IntelligentToast
            key={insight.id}
            insight={insight}
            index={index}
            onDismiss={() => dismissInsight?.(insight.id)}
            onAction={(actionId: string) =>
              actOnInsight?.(insight.id, actionId)
            }
            style={preferences?.notifications?.popupStyle || "standard"}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface IntelligentToastProps {
  insight: any;
  index: number;
  onDismiss: () => void;
  onAction: (actionId: string) => void;
  style: "subtle" | "standard" | "prominent";
}

function IntelligentToast({
  insight,
  index,
  onDismiss,
  onAction,
  style,
}: IntelligentToastProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Auto-dismiss after delay (unless hovered)
  useEffect(() => {
    if (isHovered) return;

    const delay = insight.priority === "urgent" ? 10000 : 5000;
    const timer = setTimeout(onDismiss, delay);

    return () => clearTimeout(timer);
  }, [isHovered, insight.priority, onDismiss]);

  const priorityColors = {
    low: "from-gray-500/20 to-gray-600/20 border-gray-500/30",
    medium: "from-cyan-500/20 to-blue-600/20 border-cyan-500/30",
    high: "from-orange-500/20 to-red-600/20 border-orange-500/30",
    urgent: "from-red-500/20 to-rose-600/20 border-red-500/50",
  };

  const iconMap = {
    performance: "ri-rocket-line",
    accessibility: "ri-accessible-line",
    efficiency: "ri-flashlight-line",
    wellbeing: "ri-heart-pulse-line",
    learning: "ri-lightbulb-line",
    optimization: "ri-settings-3-line",
    compliance: "ri-shield-check-line",
    social: "ri-team-line",
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 300,
        delay: index * 0.1,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative bg-gradient-to-br ${priorityColors[insight.priority]} backdrop-blur-xl border rounded-xl p-4 shadow-2xl ${
        style === "prominent"
          ? "scale-105"
          : style === "subtle"
            ? "opacity-90"
            : ""
      }`}
    >
      {/* Priority Indicator */}
      {insight.priority === "urgent" && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <i className={`${iconMap[insight.type]} text-white text-lg`}></i>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm mb-1">
            {insight.title}
          </h4>
          <p className="text-xs text-gray-300">{insight.message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          <i className="ri-close-line text-lg"></i>
        </button>
      </div>

      {/* ML Confidence Bar */}
      {insight.mlConfidence !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>ML Confidence</span>
            <span>{Math.round(insight.mlConfidence * 100)}%</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${insight.mlConfidence * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      {insight.actionable && insight.actions && (
        <div className="flex items-center gap-2">
          {insight.actions.map((action: any) => (
            <button
              key={action.id}
              onClick={() => onAction(action.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                action.type === "apply"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Metadata */}
      {insight.metadata?.userBenefit && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-green-400">
            <i className="ri-arrow-up-line"></i>
            <span>{insight.metadata.userBenefit}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

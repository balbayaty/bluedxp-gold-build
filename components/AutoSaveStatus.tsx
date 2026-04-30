/**
 * Auto-Save Status Indicator
 *
 * Visual indicator showing the current auto-save status
 * Used with useAutoDraftSave hook
 */

import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface AutoSaveStatusProps {
  status: "idle" | "saving" | "saved" | "error";
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  className?: string;
  showWhenIdle?: boolean;
}

export default function AutoSaveStatus({
  status,
  lastSaved,
  hasUnsavedChanges,
  className = "",
  showWhenIdle = false,
}: AutoSaveStatusProps) {
  // Don't show if idle and no unsaved changes (unless explicitly requested)
  if (status === "idle" && !hasUnsavedChanges && !showWhenIdle) {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case "saving":
        return {
          icon: "ri-loader-4-line animate-spin",
          text: "Saving...",
          color: "text-blue-400",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/30",
        };
      case "saved":
        return {
          icon: "ri-check-line",
          text: lastSaved ? `Saved ${format(lastSaved, "HH:mm:ss")}` : "Saved",
          color: "text-green-400",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/30",
        };
      case "error":
        return {
          icon: "ri-error-warning-line",
          text: "Save failed",
          color: "text-red-400",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/30",
        };
      default:
        return {
          icon: "ri-save-line",
          text: hasUnsavedChanges ? "Unsaved changes" : "All changes saved",
          color: "text-gray-400",
          bgColor: "bg-gray-500/10",
          borderColor: "border-gray-500/30",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}
      >
        <i className={`${config.icon} ${config.color} text-sm`}></i>
        <span className={`text-xs ${config.color} font-medium`}>
          {config.text}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}

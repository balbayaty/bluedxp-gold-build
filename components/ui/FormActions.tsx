/**
 * Form Actions Component
 * Standardized form action buttons with keyboard shortcuts
 */

"use client";

import { useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface FormActionsProps {
  onSave: () => void | Promise<void>;
  onCancel?: () => void;
  saving?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  saveIcon?: string;
  showKeyboardHint?: boolean;
  disabled?: boolean;
  variant?: "default" | "sticky" | "modal";
  extraActions?: React.ReactNode;
  className?: string;
}

export default function FormActions({
  onSave,
  onCancel,
  saving = false,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  saveIcon = "ri-check-line",
  showKeyboardHint = true,
  disabled = false,
  variant = "default",
  extraActions,
  className = "",
}: FormActionsProps) {
  // Handle Ctrl+S keyboard shortcut
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (!saving && !disabled) {
          onSave();
        }
      }
      if (e.key === "Escape" && onCancel) {
        e.preventDefault();
        onCancel();
      }
    },
    [onSave, onCancel, saving, disabled],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const wrapperClasses = {
    default: "",
    sticky:
      "sticky bottom-0 bg-[#1f2937]/95 backdrop-blur-lg border-t border-white/10 -mx-6 -mb-6 px-6 py-4 mt-6",
    modal: "pt-6 mt-6 border-t border-white/10",
  };

  return (
    <div className={`${wrapperClasses[variant]} ${className}`}>
      <div className="flex items-center justify-between gap-4">
        {/* Left side - extra actions */}
        <div className="flex items-center gap-2">{extraActions}</div>

        {/* Right side - main actions */}
        <div className="flex items-center gap-3">
          {showKeyboardHint && (
            <span className="text-xs text-[#6b7280] hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px]">
                Ctrl
              </kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px]">
                S
              </kbd>
              <span className="ml-1">to save</span>
            </span>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-lg text-sm font-medium transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {cancelLabel}
            </button>
          )}

          <button
            type="button"
            onClick={onSave}
            disabled={saving || disabled}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <i className={saveIcon}></i>
                {saveLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Auto-save status indicator
export function SaveStatus({
  status,
  lastSaved,
  className = "",
}: {
  status: "idle" | "saving" | "saved" | "error";
  lastSaved?: Date | null;
  className?: string;
}) {
  const statusConfig = {
    idle: { icon: "", text: "", color: "" },
    saving: {
      icon: "ri-loader-4-line animate-spin",
      text: "Saving...",
      color: "text-cyan-400",
    },
    saved: {
      icon: "ri-check-line",
      text: lastSaved ? `Saved ${formatTimeAgo(lastSaved)}` : "Saved",
      color: "text-green-400",
    },
    error: {
      icon: "ri-error-warning-line",
      text: "Save failed",
      color: "text-red-400",
    },
  };

  const config = statusConfig[status];

  if (status === "idle") return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center gap-1.5 text-xs ${config.color} ${className}`}
    >
      <i className={config.icon}></i>
      <span>{config.text}</span>
    </motion.div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}

// Unsaved changes warning
export function UnsavedChangesWarning({
  hasChanges,
  onSave,
  onDiscard,
  saving = false,
}: {
  hasChanges: boolean;
  onSave: () => void;
  onDiscard: () => void;
  saving?: boolean;
}) {
  if (!hasChanges) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#1f2937] border border-yellow-500/30 rounded-lg shadow-xl p-4 flex items-center gap-4"
    >
      <div className="flex items-center gap-3">
        <i className="ri-error-warning-line text-yellow-400 text-xl"></i>
        <span className="text-white text-sm">You have unsaved changes</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onDiscard}
          disabled={saving}
          className="px-3 py-1.5 text-[#9ca3af] hover:text-white text-sm transition-colors"
        >
          Discard
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
        >
          {saving ? (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <i className="ri-save-line"></i>
          )}
          Save
        </button>
      </div>
    </motion.div>
  );
}

/**
 * System Admin Action Buttons
 * Beautiful, intuitive action buttons for system control
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/utils/apiFetch";

interface ActionButtonsProps {
  moduleId?: string;
  onActionComplete?: () => void;
}

export default function ActionButtons({
  moduleId,
  onActionComplete,
}: ActionButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeAction = async (action: string, params?: any) => {
    setLoading(action);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiFetch("/api/system-admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, params: { ...params, moduleId } }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || "Action completed successfully");
        setTimeout(() => setSuccess(null), 3000);
        onActionComplete?.();
      } else {
        setError(data.error || "Action failed");
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute action");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(null);
    }
  };

  const actions = [
    {
      id: "restart_module",
      label: "Restart Module",
      icon: "ri-restart-line",
      color: "cyan",
      requiresModule: true,
    },
    {
      id: "clear_cache",
      label: "Clear Cache",
      icon: "ri-delete-bin-line",
      color: "yellow",
    },
    {
      id: "trigger_backup",
      label: "Trigger Backup",
      icon: "ri-download-cloud-line",
      color: "green",
    },
    {
      id: "enable_module",
      label: "Enable Module",
      icon: "ri-toggle-line",
      color: "green",
      requiresModule: true,
    },
    {
      id: "disable_module",
      label: "Disable Module",
      icon: "ri-toggle-off-line",
      color: "red",
      requiresModule: true,
    },
    {
      id: "restart_job_queue",
      label: "Restart Job Queue",
      icon: "ri-refresh-line",
      color: "purple",
    },
    {
      id: "clear_event_bus",
      label: "Clear Event Bus",
      icon: "ri-delete-bin-7-line",
      color: "orange",
    },
  ];

  const filteredActions = moduleId
    ? actions
    : actions.filter((a) => !a.requiresModule);

  return (
    <div className="space-y-4">
      {/* Status Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm"
          >
            <i className="ri-check-line mr-2"></i>
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm"
          >
            <i className="ri-error-warning-line mr-2"></i>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredActions.map((action) => {
          const isLoading = loading === action.id;
          const colorClasses = {
            cyan: "bg-cyan-500/20 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30",
            yellow:
              "bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30",
            green:
              "bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30",
            red: "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30",
            purple:
              "bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30",
            orange:
              "bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30",
          };

          return (
            <motion.button
              key={action.id}
              onClick={() => executeAction(action.id, { moduleId })}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border transition-all ${colorClasses[action.color as keyof typeof colorClasses]} ${
                isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <i className={`${action.icon} text-2xl`}></i>
                )}
                <span className="text-xs font-medium text-center">
                  {action.label}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

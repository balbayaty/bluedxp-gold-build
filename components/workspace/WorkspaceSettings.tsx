/**
 * Workspace Settings Panel
 *
 * Layout preferences, widget preferences, integration settings
 */

"use client";

import { motion } from "framer-motion";
import type { WorkspaceConfig } from "@/types/workspace";

interface WorkspaceSettingsProps {
  config: WorkspaceConfig;
  onClose: () => void;
  onConfigUpdate: (config: WorkspaceConfig) => void;
}

export function WorkspaceSettings({
  config,
  onClose,
  onConfigUpdate,
}: WorkspaceSettingsProps) {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="fixed right-0 top-0 h-full w-96 bg-[#1f2937] border-l border-white/10 z-50 overflow-y-auto"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Workspace Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <i className="ri-close-line text-xl text-white"></i>
          </button>
        </div>

        {/* Settings Content */}
        <div className="space-y-6">
          {/* Layout Preferences */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              Layout Preferences
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-[#9ca3af]">
                <input type="checkbox" className="rounded" />
                Auto-save layout changes
              </label>
            </div>
          </div>

          {/* Integrations */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              Integrations
            </h3>
            <div className="space-y-3">
              {/* Google Workspace */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    Google Workspace
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      config.integrations.googleWorkspace
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {config.integrations.googleWorkspace
                      ? "Connected"
                      : "Not Connected"}
                  </span>
                </div>
                {!config.integrations.googleWorkspace && (
                  <button className="text-xs text-cyan-400 hover:text-cyan-300">
                    Connect
                  </button>
                )}
              </div>

              {/* Email */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">Email</span>
                  <span className="text-xs text-[#9ca3af]">
                    {config.integrations.email?.length || 0} accounts
                  </span>
                </div>
                <button className="text-xs text-cyan-400 hover:text-cyan-300">
                  Add Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

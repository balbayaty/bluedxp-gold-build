/**
 * Integration Settings
 * Configure integration rules and preferences
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

export default function IntegrationSettingsPage() {
  const [settings, setSettings] = useState({
    autoExecute: true,
    requireConfirmation: false,
    notificationEnabled: true,
    logAllActions: true,
  });

  return (
    <PageTemplate
      title="⚙️ Integration Settings"
      description="Configure integration rules, automation preferences, and notification settings"
      icon="ri-settings-3-line"
    >
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Automation Settings
          </h3>
          <div className="space-y-4">
            {[
              {
                key: "autoExecute",
                label: "Auto-Execute Actions",
                desc: "Automatically execute actions without manual confirmation",
              },
              {
                key: "requireConfirmation",
                label: "Require Confirmation",
                desc: "Require user confirmation before executing critical actions",
              },
              {
                key: "notificationEnabled",
                label: "Enable Notifications",
                desc: "Send notifications when actions are triggered",
              },
              {
                key: "logAllActions",
                label: "Log All Actions",
                desc: "Log all integration actions for audit purposes",
              },
            ].map((setting) => (
              <div
                key={setting.key}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div>
                  <p className="text-white font-medium">{setting.label}</p>
                  <p className="text-white/60 text-sm">{setting.desc}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      [setting.key]:
                        !settings[setting.key as keyof typeof settings],
                    })
                  }
                  className={`w-14 h-7 rounded-full relative transition-colors ${
                    settings[setting.key as keyof typeof settings]
                      ? "bg-blue-500"
                      : "bg-gray-600"
                  }`}
                >
                  <motion.div
                    animate={{
                      x: settings[setting.key as keyof typeof settings]
                        ? 28
                        : 0,
                    }}
                    className="w-6 h-6 bg-white rounded-full absolute top-0.5"
                  />
                </motion.button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Module Integration
          </h3>
          <div className="space-y-3">
            {["WMS", "ISO-IMS", "QHSE", "TMS", "Customer", "Liability"].map(
              (module) => (
                <div
                  key={module}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <span className="text-white font-medium">{module}</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                    Enabled
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}

"use client";

import {
  useNotificationHelpers,
  MOCK_NOTIFICATIONS,
} from "@/components/PremiumNotificationEnhanced";
import { motion } from "framer-motion";

export default function TestNotificationsPage() {
  const notifications = useNotificationHelpers();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#111827] to-[#0f172a] p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Notification System Test
          </h1>
          <p className="text-white/60">
            Click any button to test notifications
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              notifications.success(
                MOCK_NOTIFICATIONS.workflowSaved.title,
                MOCK_NOTIFICATIONS.workflowSaved.message,
                MOCK_NOTIFICATIONS.workflowSaved,
              )
            }
            className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-white px-6 py-4 rounded-xl font-medium transition-colors"
          >
            <i className="ri-checkbox-circle-line text-2xl mb-2 block"></i>
            Success (Mock)
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              notifications.error(
                MOCK_NOTIFICATIONS.workflowError.title,
                MOCK_NOTIFICATIONS.workflowError.message,
                MOCK_NOTIFICATIONS.workflowError,
              )
            }
            className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-white px-6 py-4 rounded-xl font-medium transition-colors"
          >
            <i className="ri-error-warning-line text-2xl mb-2 block"></i>
            Error (Mock)
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              notifications.warning(
                MOCK_NOTIFICATIONS.lowStorage.title,
                MOCK_NOTIFICATIONS.lowStorage.message,
                MOCK_NOTIFICATIONS.lowStorage,
              )
            }
            className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-white px-6 py-4 rounded-xl font-medium transition-colors"
          >
            <i className="ri-alert-line text-2xl mb-2 block"></i>
            Warning (Mock)
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const id = notifications.loading("Processing...", "Please wait");
              setTimeout(() => {
                notifications.removeNotification(id);
                notifications.success(
                  "Complete!",
                  "Processing finished successfully.",
                );
              }, 3000);
            }}
            className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-white px-6 py-4 rounded-xl font-medium transition-colors"
          >
            <i className="ri-loader-4-line text-2xl mb-2 block"></i>
            Loading → Success
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-white font-semibold mb-4">
            Mock Data Available:
          </h3>
          <div className="space-y-2 text-sm text-white/60">
            {Object.keys(MOCK_NOTIFICATIONS).map((key) => (
              <div key={key} className="flex items-center gap-2">
                <i className="ri-checkbox-circle-line text-green-400"></i>
                <code className="text-cyan-400">MOCK_NOTIFICATIONS.{key}</code>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

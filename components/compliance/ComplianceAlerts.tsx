"use client";

import { motion } from "framer-motion";
import { ComplianceAlert } from "@/types/compliance";

interface ComplianceAlertsProps {
  alerts?: ComplianceAlert[];
  dashboard?: any;
}

export default function ComplianceAlerts({
  alerts,
  dashboard,
}: ComplianceAlertsProps) {
  const alertsData = alerts || dashboard?.criticalAlerts || [];
  const criticalAlerts = alertsData.filter(
    (a: ComplianceAlert) => a.type === "CRITICAL" && !a.acknowledged,
  );

  if (criticalAlerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-alarm-warning-line text-cyan-400"></i>
          Critical Alerts
        </h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="ri-shield-check-line text-3xl text-green-400"></i>
          </div>
          <p className="text-[#9ca3af]">No critical alerts</p>
          <p className="text-xs text-[#6b7280] mt-1">
            All systems operating normally
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
    >
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <i className="ri-alarm-warning-line text-red-400"></i>
        Critical Alerts
        <span className="ml-auto bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-xs font-medium animate-pulse">
          {criticalAlerts.length} Active
        </span>
      </h2>
      <div className="space-y-3">
        {criticalAlerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * index }}
            className="p-4 bg-red-500/10 rounded-lg border border-red-500/30 border-l-4 border-l-red-500"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-error-warning-line text-red-400"></i>
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium border border-red-500/30">
                    {alert.priority}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  {alert.title}
                </h3>
                <p className="text-xs text-[#9ca3af] mb-2 line-clamp-2">
                  {alert.description}
                </p>
                <p className="text-xs text-[#6b7280] flex items-center gap-1">
                  <i className="ri-time-line"></i>
                  {new Date(alert.createdAt).toLocaleString()}
                </p>
              </div>
              <button className="ml-2 text-[#6b7280] hover:text-white transition-colors p-1 hover:bg-white/10 rounded">
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-1.5 bg-red-500/30 text-red-400 text-xs rounded-lg hover:bg-red-500/40 transition-colors font-medium border border-red-500/30">
                <i className="ri-eye-line mr-1"></i>
                View Details
              </button>
              <button className="px-3 py-1.5 bg-white/5 text-[#9ca3af] text-xs rounded-lg hover:bg-white/10 transition-colors font-medium border border-white/10">
                <i className="ri-check-line mr-1"></i>
                Acknowledge
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

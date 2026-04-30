/**
 * Anomalies & Alerts Card
 *
 * Displays detected anomalies and alerts
 * - Anomaly detection
 * - Alert management
 * - Status tracking
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  Maximize2,
  Minimize2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { MaaSAnomaly } from "@/lib/services/maas/intelligenceService";

interface AnomaliesCardProps {
  anomalies: MaaSAnomaly[];
  expanded: boolean;
  onToggle: () => void;
}

export default function AnomaliesCard({
  anomalies,
  expanded,
  onToggle,
}: AnomaliesCardProps) {
  const severityColors = {
    LOW: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    MEDIUM: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    HIGH: "bg-red-500/20 text-red-400 border-red-500/30",
    CRITICAL: "bg-red-600/20 text-red-500 border-red-600/30",
  };

  const statusColors = {
    NEW: "bg-blue-500/20 text-blue-400",
    INVESTIGATING: "bg-yellow-500/20 text-yellow-400",
    RESOLVED: "bg-green-500/20 text-green-400",
    FALSE_POSITIVE: "bg-gray-500/20 text-gray-400",
  };

  const criticalAnomalies = anomalies.filter(
    (a) => a.severity === "CRITICAL" || a.severity === "HIGH",
  );
  const recentAnomalies = anomalies.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg border border-red-500/30">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Anomalies & Alerts
              </h3>
              <p className="text-sm text-gray-400">
                {anomalies.length} detected
                {criticalAnomalies.length > 0 && (
                  <span className="text-red-400 ml-1">
                    ({criticalAnomalies.length} critical)
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            {expanded ? (
              <Minimize2 className="w-5 h-5 text-gray-400" />
            ) : (
              <Maximize2 className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Critical Alerts */}
        {criticalAnomalies.length > 0 && (
          <div className="mb-4 space-y-2">
            {criticalAnomalies.map((anomaly) => (
              <motion.div
                key={anomaly.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-semibold text-red-400">
                        {anomaly.type}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${severityColors[anomaly.severity]}`}
                      >
                        {anomaly.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-1">
                      {anomaly.explanation || anomaly.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>Expected: {anomaly.expectedValue.toFixed(2)}</span>
                      <span>Actual: {anomaly.actualValue.toFixed(2)}</span>
                      <span>Deviation: {anomaly.deviation.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Recent Anomalies */}
        {expanded && (
          <AnimatePresence>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2"
            >
              <h4 className="text-sm font-semibold text-gray-300 mb-2">
                Recent Anomalies
              </h4>
              {recentAnomalies.length > 0 ? (
                recentAnomalies.map((anomaly) => (
                  <div
                    key={anomaly.id}
                    className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">
                            {anomaly.type}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${severityColors[anomaly.severity]}`}
                          >
                            {anomaly.severity}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${statusColors[anomaly.status]}`}
                          >
                            {anomaly.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-1">
                          {anomaly.metric}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(anomaly.detectedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-400" />
                  <p>No anomalies detected</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

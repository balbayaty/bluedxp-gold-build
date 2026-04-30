/**
 * SLA Tracker Component
 * Monitor and display service level agreement performance
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import type { ServiceLevelAgreement } from "@/types/marketplace-contracts";

interface SLATrackerProps {
  contractId: string;
  onUpdate?: (slaId: string, performance: number) => void;
}

export default function SLATracker({ contractId, onUpdate }: SLATrackerProps) {
  const [slas, setSlas] = useState<ServiceLevelAgreement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContract();
  }, [contractId]);

  const loadContract = async () => {
    try {
      const response = await fetch(`/api/marketplace/contracts/${contractId}`);
      const result = await response.json();
      if (result.success && result.data.serviceLevelAgreements) {
        setSlas(result.data.serviceLevelAgreements);
      }
    } catch (error) {
      console.error("Failed to load contract:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (sla: ServiceLevelAgreement) => {
    if (!sla.currentPerformance) return "bg-gray-100 text-gray-700";
    if (sla.status === "MET" || sla.status === "EXCEEDED")
      return "bg-green-100 text-green-700";
    return "bg-red-100 text-red-700";
  };

  const getStatusIcon = (sla: ServiceLevelAgreement) => {
    if (!sla.currentPerformance) return <AlertCircle className="w-4 h-4" />;
    if (sla.status === "MET" || sla.status === "EXCEEDED")
      return <CheckCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const getPerformancePercentage = (sla: ServiceLevelAgreement) => {
    if (!sla.currentPerformance || !sla.target) return 0;
    return Math.min((sla.currentPerformance / sla.target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (slas.length === 0) {
    return (
      <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">
          No SLAs defined for this contract
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {slas.map((sla) => (
        <motion.div
          key={sla.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
                {sla.metric}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Target: {sla.target} {sla.unit} ({sla.measurementPeriod})
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${getStatusColor(sla)}`}
            >
              {getStatusIcon(sla)}
              {sla.status || "PENDING"}
            </span>
          </div>

          {sla.currentPerformance !== undefined && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Current Performance
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {sla.currentPerformance} {sla.unit}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getPerformancePercentage(sla)}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-3 rounded-full ${
                    sla.status === "MET" || sla.status === "EXCEEDED"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                {sla.currentPerformance >= sla.target ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span
                  className={
                    sla.currentPerformance >= sla.target
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {sla.currentPerformance >= sla.target
                    ? "Meeting target"
                    : "Below target"}
                </span>
              </div>
            </div>
          )}

          {sla.currentPerformance === undefined && (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No performance data available yet
              </p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Vision Metrics Widget
 * Displays vision analysis metrics for dashboards
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface VisionMetrics {
  totalAnalyses: number;
  analysesToday: number;
  anomalyRate: number;
  qualityScore: number;
  complianceRate: number;
  processingTime: number;
  successRate: number;
}

interface VisionMetricsWidgetProps {
  timeframe?: "today" | "week" | "month";
  module?: "wms" | "qhse" | "iso-ims" | "tms" | "all";
  compact?: boolean;
}

export default function VisionMetricsWidget({
  timeframe = "today",
  module = "all",
  compact = false,
}: VisionMetricsWidgetProps) {
  const [metrics, setMetrics] = useState<VisionMetrics>({
    totalAnalyses: 0,
    analysesToday: 0,
    anomalyRate: 0,
    qualityScore: 0,
    complianceRate: 0,
    processingTime: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [timeframe, module]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(
        `/api/ai/vision/metrics?timeframe=${timeframe}&module=${module}`,
      );
      const data = await response.json();
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error("Failed to fetch vision metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-4 border border-blue-100"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <i className="ri-eye-line text-2xl text-blue-600"></i>
            <h3 className="font-semibold text-gray-800">Vision Analytics</h3>
          </div>
          <span className="text-xs text-gray-500">{timeframe}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-600">Analyses Today</p>
            <p className="text-2xl font-bold text-blue-600">
              {metrics.analysesToday}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Anomaly Rate</p>
            <p className="text-2xl font-bold text-orange-600">
              {metrics.anomalyRate}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Quality Score</p>
            <p className="text-2xl font-bold text-green-600">
              {metrics.qualityScore}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Compliance</p>
            <p className="text-2xl font-bold text-purple-600">
              {metrics.complianceRate}%
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 border border-gray-200"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <i className="ri-eye-line text-2xl text-white"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              AI Vision Metrics
            </h3>
            <p className="text-sm text-gray-500">
              Real-time vision analysis statistics
            </p>
          </div>
        </div>
        <select
          value={timeframe}
          onChange={(e) =>
            (window.location.href = `?timeframe=${e.target.value}`)
          }
          className="text-sm border rounded px-3 py-1"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <i className="ri-file-list-3-line text-blue-600"></i>
            <span className="text-xs text-blue-600 font-medium">Total</span>
          </div>
          <p className="text-3xl font-bold text-blue-700">
            {metrics.totalAnalyses}
          </p>
          <p className="text-xs text-blue-600 mt-1">Analyses</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <i className="ri-alert-line text-orange-600"></i>
            <span className="text-xs text-orange-600 font-medium">
              Anomalies
            </span>
          </div>
          <p className="text-3xl font-bold text-orange-700">
            {metrics.anomalyRate}%
          </p>
          <p className="text-xs text-orange-600 mt-1">Detection Rate</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <i className="ri-checkbox-circle-line text-green-600"></i>
            <span className="text-xs text-green-600 font-medium">Quality</span>
          </div>
          <p className="text-3xl font-bold text-green-700">
            {metrics.qualityScore}
          </p>
          <p className="text-xs text-green-600 mt-1">Average Score</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <i className="ri-shield-check-line text-purple-600"></i>
            <span className="text-xs text-purple-600 font-medium">
              Compliance
            </span>
          </div>
          <p className="text-3xl font-bold text-purple-700">
            {metrics.complianceRate}%
          </p>
          <p className="text-xs text-purple-600 mt-1">Compliance Rate</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Processing Time</p>
          <p className="text-2xl font-bold text-gray-800">
            {metrics.processingTime}ms
          </p>
          <p className="text-xs text-gray-500 mt-1">Average</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Success Rate</p>
          <p className="text-2xl font-bold text-gray-800">
            {metrics.successRate}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Successful Analyses</p>
        </div>
      </div>
    </motion.div>
  );
}

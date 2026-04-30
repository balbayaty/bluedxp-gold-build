"use client";

/**
 * Detailed QR Analytics Dashboard
 * Deep-dive analytics with drill-down capabilities
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function DetailedQRAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetailedMetrics();
  }, []);

  const loadDetailedMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/qr/analytics/enterprise?level=detailed",
      );
      const data = await response.json();

      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error("Error loading detailed metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line animate-spin text-4xl mb-4"></i>
          <div>Loading detailed analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <i className="ri-file-chart-line text-purple-400"></i>
          Detailed QR Analytics
        </h1>

        {/* QR Code Performance Table */}
        {metrics?.qrCodePerformance && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">QR Code Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">QR ID</th>
                    <th className="px-4 py-3 text-left">Module</th>
                    <th className="px-4 py-3 text-left">Scans</th>
                    <th className="px-4 py-3 text-left">Unique</th>
                    <th className="px-4 py-3 text-left">Conversion</th>
                    <th className="px-4 py-3 text-left">Trend</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {metrics.qrCodePerformance.map((qr: any) => (
                    <tr key={qr.qrId} className="hover:bg-gray-750">
                      <td className="px-4 py-3 text-sm font-mono">
                        {qr.qrId.slice(0, 20)}...
                      </td>
                      <td className="px-4 py-3 text-sm">{qr.module}</td>
                      <td className="px-4 py-3 text-sm">{qr.totalScans}</td>
                      <td className="px-4 py-3 text-sm">{qr.uniqueScans}</td>
                      <td className="px-4 py-3 text-sm">
                        {qr.conversionRate.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            qr.trend === "up"
                              ? "bg-green-900 text-green-200"
                              : qr.trend === "down"
                                ? "bg-red-900 text-red-200"
                                : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          {qr.trend.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => setSelectedQR(qr.qrId)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Anomalies */}
        {metrics?.anomalies && metrics.anomalies.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <i className="ri-alert-line text-red-400"></i>
              Detected Anomalies
            </h2>
            <div className="space-y-3">
              {metrics.anomalies.map((anomaly: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    anomaly.severity === "critical"
                      ? "bg-red-900/30 border-red-500/30"
                      : anomaly.severity === "high"
                        ? "bg-orange-900/30 border-orange-500/30"
                        : anomaly.severity === "medium"
                          ? "bg-yellow-900/30 border-yellow-500/30"
                          : "bg-blue-900/30 border-blue-500/30"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold">
                        {anomaly.type.replace(/_/g, " ").toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-400">
                        {anomaly.description}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        anomaly.severity === "critical"
                          ? "bg-red-600 text-white"
                          : anomaly.severity === "high"
                            ? "bg-orange-600 text-white"
                            : anomaly.severity === "medium"
                              ? "bg-yellow-600 text-white"
                              : "bg-blue-600 text-white"
                      }`}
                    >
                      {anomaly.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300 mt-2">
                    <strong>Recommendation:</strong> {anomaly.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

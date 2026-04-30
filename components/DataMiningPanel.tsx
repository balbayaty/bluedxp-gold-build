// Data Mining Panel Component
// Displays feature engineering results and analytics insights

"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ASNData } from "@/types/asn";
import {
  extractTimeFeatures,
  aggregateFeatures,
  generateMLFeatures,
} from "@/utils/featureEngineering";
import { getProcessedInboundData } from "@/data/processedInboundData";

export default function DataMiningPanel() {
  const [selectedASN, setSelectedASN] = useState<ASNData | null>(null);
  const [viewMode, setViewMode] = useState<"features" | "aggregated" | "ml">(
    "features",
  );

  const processedData = getProcessedInboundData();
  const allASNs = processedData.all;

  // Extract features for selected ASN
  const asnFeatures = useMemo(() => {
    if (!selectedASN) return null;
    return extractTimeFeatures(selectedASN);
  }, [selectedASN]);

  // Generate ML features for selected ASN
  const mlFeatures = useMemo(() => {
    if (!selectedASN) return null;
    return generateMLFeatures(selectedASN);
  }, [selectedASN]);

  // Aggregate features across all ASNs
  const aggregatedFeatures = useMemo(() => {
    return aggregateFeatures(allASNs);
  }, [allASNs]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Data Mining & Feature Engineering
        </h2>
        <p className="text-[#9ca3af] text-sm">
          Extract features from timestamps for analytics and machine learning
        </p>
      </div>

      {/* View Mode Tabs */}
      <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-1 flex gap-2">
        <button
          onClick={() => setViewMode("features")}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            viewMode === "features"
              ? "bg-blue-600 text-white"
              : "text-[#9ca3af] hover:text-white hover:bg-[#374151]"
          }`}
        >
          <i className="ri-file-list-3-line mr-2"></i>
          Individual Features
        </button>
        <button
          onClick={() => setViewMode("aggregated")}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            viewMode === "aggregated"
              ? "bg-blue-600 text-white"
              : "text-[#9ca3af] hover:text-white hover:bg-[#374151]"
          }`}
        >
          <i className="ri-bar-chart-line mr-2"></i>
          Aggregated Analytics
        </button>
        <button
          onClick={() => setViewMode("ml")}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            viewMode === "ml"
              ? "bg-blue-600 text-white"
              : "text-[#9ca3af] hover:text-white hover:bg-[#374151]"
          }`}
        >
          <i className="ri-brain-line mr-2"></i>
          ML Features
        </button>
      </div>

      {/* Individual Features View */}
      {viewMode === "features" && (
        <div className="space-y-4">
          <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-4">
            <label className="block text-[#9ca3af] text-sm font-medium mb-2">
              Select ASN Document
            </label>
            <select
              value={selectedASN?.id || ""}
              onChange={(e) => {
                const asn = allASNs.find((a) => a.id === e.target.value);
                setSelectedASN(asn || null);
              }}
              className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select an ASN document...</option>
              {allASNs.map((asn) => (
                <option key={asn.id} value={asn.id}>
                  {asn.documentNumber} - {asn.customerName || "N/A"}
                </option>
              ))}
            </select>
          </div>

          {asnFeatures && selectedASN && (
            <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-6 space-y-6">
              <h3 className="text-lg font-semibold text-white">
                Time-Based Features
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <span className="text-[#9ca3af] text-xs">Hour of Day</span>
                  <p className="text-white text-sm font-medium">
                    {asnFeatures.hourOfDay}
                  </p>
                </div>
                <div>
                  <span className="text-[#9ca3af] text-xs">Day of Week</span>
                  <p className="text-white text-sm font-medium">
                    {
                      ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                        asnFeatures.dayOfWeek
                      ]
                    }
                  </p>
                </div>
                <div>
                  <span className="text-[#9ca3af] text-xs">Day of Month</span>
                  <p className="text-white text-sm font-medium">
                    {asnFeatures.dayOfMonth}
                  </p>
                </div>
                <div>
                  <span className="text-[#9ca3af] text-xs">Month</span>
                  <p className="text-white text-sm font-medium">
                    {asnFeatures.month}
                  </p>
                </div>
                <div>
                  <span className="text-[#9ca3af] text-xs">Quarter</span>
                  <p className="text-white text-sm font-medium">
                    Q{asnFeatures.quarter}
                  </p>
                </div>
                <div>
                  <span className="text-[#9ca3af] text-xs">Is Weekend</span>
                  <p className="text-white text-sm font-medium">
                    {asnFeatures.isWeekend ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <span className="text-[#9ca3af] text-xs">
                    Is Business Hours
                  </span>
                  <p className="text-white text-sm font-medium">
                    {asnFeatures.isBusinessHours ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <span className="text-[#9ca3af] text-xs">Is Peak Hours</span>
                  <p className="text-white text-sm font-medium">
                    {asnFeatures.isPeakHours ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <span className="text-[#9ca3af] text-xs">Duration 1</span>
                  <p className="text-white text-sm font-medium">
                    {formatDuration(asnFeatures.duration1)}
                  </p>
                </div>
                <div>
                  <span className="text-[#9ca3af] text-xs">Duration 2</span>
                  <p className="text-white text-sm font-medium">
                    {formatDuration(asnFeatures.duration2)}
                  </p>
                </div>
                <div>
                  <span className="text-[#9ca3af] text-xs">Total Duration</span>
                  <p className="text-white text-sm font-medium">
                    {formatDuration(asnFeatures.totalDuration)}
                  </p>
                </div>
                <div>
                  <span className="text-[#9ca3af] text-xs">
                    Processing Efficiency
                  </span>
                  <p className="text-white text-sm font-medium">
                    {asnFeatures.processingEfficiency !== null
                      ? `${asnFeatures.processingEfficiency.toFixed(1)}%`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-[#9ca3af] text-xs">
                    Throughput Rate
                  </span>
                  <p className="text-white text-sm font-medium">
                    {asnFeatures.throughputRate !== null
                      ? `${asnFeatures.throughputRate.toFixed(2)} items/hr`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-[#9ca3af] text-xs">
                    SLA Compliance Score
                  </span>
                  <p className="text-white text-sm font-medium">
                    {asnFeatures.slaComplianceScore !== null
                      ? `${asnFeatures.slaComplianceScore.toFixed(1)}%`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-[#9ca3af] text-xs">
                    SLA Breach Risk
                  </span>
                  <p className="text-white text-sm font-medium">
                    {asnFeatures.slaBreachRisk || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Aggregated Analytics View */}
      {viewMode === "aggregated" && (
        <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-semibold text-white">
            Aggregated Analytics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
              <span className="text-[#9ca3af] text-xs">Average Duration 1</span>
              <p className="text-white text-lg font-bold">
                {formatDuration(aggregatedFeatures.averageDuration1)}
              </p>
            </div>
            <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
              <span className="text-[#9ca3af] text-xs">Average Duration 2</span>
              <p className="text-white text-lg font-bold">
                {formatDuration(aggregatedFeatures.averageDuration2)}
              </p>
            </div>
            <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
              <span className="text-[#9ca3af] text-xs">
                Average Total Duration
              </span>
              <p className="text-white text-lg font-bold">
                {formatDuration(aggregatedFeatures.averageTotalDuration)}
              </p>
            </div>
            <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
              <span className="text-[#9ca3af] text-xs">Average Throughput</span>
              <p className="text-white text-lg font-bold">
                {aggregatedFeatures.averageThroughput.toFixed(2)} items/hr
              </p>
            </div>
            <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
              <span className="text-[#9ca3af] text-xs">Compliance Rate</span>
              <p className="text-white text-lg font-bold">
                {aggregatedFeatures.complianceRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
              <span className="text-[#9ca3af] text-xs">On-Time Rate</span>
              <p className="text-white text-lg font-bold">
                {aggregatedFeatures.onTimeRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
              <span className="text-[#9ca3af] text-xs">Peak Hour Volume</span>
              <p className="text-white text-lg font-bold">
                {aggregatedFeatures.peakHourVolume}
              </p>
            </div>
            <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
              <span className="text-[#9ca3af] text-xs">Weekend Volume</span>
              <p className="text-white text-lg font-bold">
                {aggregatedFeatures.weekendVolume}
              </p>
            </div>
          </div>

          {/* Personnel Efficiency */}
          <div className="mt-6">
            <h4 className="text-base font-semibold text-white mb-3">
              Personnel Efficiency
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(aggregatedFeatures.personnelEfficiency).map(
                ([personnel, efficiency]) => (
                  <div
                    key={personnel}
                    className="bg-[#111827] border border-[#374151] rounded-lg p-3"
                  >
                    <span className="text-[#9ca3af] text-xs">{personnel}</span>
                    <p className="text-white text-sm font-medium">
                      {efficiency.toFixed(1)}%
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {/* ML Features View */}
      {viewMode === "ml" && (
        <div className="space-y-4">
          <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-4">
            <label className="block text-[#9ca3af] text-sm font-medium mb-2">
              Select ASN Document
            </label>
            <select
              value={selectedASN?.id || ""}
              onChange={(e) => {
                const asn = allASNs.find((a) => a.id === e.target.value);
                setSelectedASN(asn || null);
              }}
              className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select an ASN document...</option>
              {allASNs.map((asn) => (
                <option key={asn.id} value={asn.id}>
                  {asn.documentNumber} - {asn.customerName || "N/A"}
                </option>
              ))}
            </select>
          </div>

          {mlFeatures && selectedASN && (
            <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                ML Features (JSON Format)
              </h3>
              <pre className="bg-[#111827] border border-[#374151] rounded-lg p-4 text-xs text-white overflow-x-auto">
                {JSON.stringify(mlFeatures, null, 2)}
              </pre>
              <div className="mt-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(mlFeatures, null, 2),
                    );
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <i className="ri-file-copy-line mr-2"></i>
                  Copy to Clipboard
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

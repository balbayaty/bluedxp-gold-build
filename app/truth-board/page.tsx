/**
 * Truth Board Brief Page
 * Executive dashboard with top signals, adversarial insights, and recommendations
 * McKinsey/Deloitte/EY level quality
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RiBarChartLine,
  RiShieldCheckLine,
  RiAlertLine,
  RiFileTextLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiEyeLine,
  RiDownloadLine,
  RiTimeLine,
  RiMoneyDollarCircleLine,
  RiFileWarningLine,
  RiCheckboxCircleLine,
} from "react-icons/ri";
import {
  BoardBrief,
  BoardSignal,
  AdversarialInsight,
  BoardRecommendation,
} from "@/types/truth-engine";

export default function TruthBoardBriefPage() {
  const [brief, setBrief] = useState<BoardBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState<BoardSignal | null>(
    null,
  );
  const [selectedInsight, setSelectedInsight] =
    useState<AdversarialInsight | null>(null);
  const [period, setPeriod] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadBoardBrief();
  }, [period]);

  const loadBoardBrief = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/truth-engine/board-brief?tenantId=default&periodStart=${period.start}&periodEnd=${period.end}`,
      );
      const data = await response.json();
      if (data.success) {
        setBrief(data.brief);
      }
    } catch (error) {
      console.error("Error loading board brief:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500/20 border-red-500 text-red-400";
      case "HIGH":
        return "bg-orange-500/20 border-orange-500 text-orange-400";
      case "MEDIUM":
        return "bg-yellow-500/20 border-yellow-500 text-yellow-400";
      default:
        return "bg-blue-500/20 border-blue-500 text-blue-400";
    }
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case "margin_mirage":
        return <RiMoneyDollarCircleLine className="text-yellow-500" />;
      case "detention_drift":
        return <RiTimeLine className="text-orange-500" />;
      case "compliance_debt":
        return <RiFileWarningLine className="text-red-500" />;
      case "term_creep":
        return <RiArrowUpLine className="text-purple-500" />;
      default:
        return <RiAlertLine className="text-blue-500" />;
    }
  };

  const getPersonaColor = (persona: string) => {
    switch (persona) {
      case "regulator":
        return "bg-blue-500/20 border-blue-500 text-blue-400";
      case "cfo":
        return "bg-green-500/20 border-green-500 text-green-400";
      case "competitor":
        return "bg-purple-500/20 border-purple-500 text-purple-400";
      case "litigator":
        return "bg-red-500/20 border-red-500 text-red-400";
      default:
        return "bg-gray-500/20 border-gray-500 text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-white">No board brief data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Truth Board Brief
              </h1>
              <p className="text-gray-400">
                Executive Intelligence Dashboard • Evidence-Based Insights
              </p>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={period.start}
                onChange={(e) =>
                  setPeriod({ ...period, start: e.target.value })
                }
                className="bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={period.end}
                onChange={(e) => setPeriod({ ...period, end: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
              />
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-lg p-4 border border-blue-500/50"
            >
              <div className="flex items-center justify-between mb-2">
                <RiFileTextLine className="text-blue-400 text-2xl" />
                <span className="text-blue-400 text-sm">Evidence</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {brief.totalEvidenceItems}
              </div>
              <div className="text-gray-400 text-sm mt-1">Total Items</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm rounded-lg p-4 border border-yellow-500/50"
            >
              <div className="flex items-center justify-between mb-2">
                <RiAlertLine className="text-yellow-400 text-2xl" />
                <span className="text-yellow-400 text-sm">Gaps</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {brief.evidenceGaps}
              </div>
              <div className="text-gray-400 text-sm mt-1">Evidence Gaps</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm rounded-lg p-4 border border-orange-500/50"
            >
              <div className="flex items-center justify-between mb-2">
                <RiShieldCheckLine className="text-orange-400 text-2xl" />
                <span className="text-orange-400 text-sm">Confidence</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {brief.lowConfidenceEvents}
              </div>
              <div className="text-gray-400 text-sm mt-1">Low Confidence</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-lg p-4 border border-purple-500/50"
            >
              <div className="flex items-center justify-between mb-2">
                <RiBarChartLine className="text-purple-400 text-2xl" />
                <span className="text-purple-400 text-sm">Signals</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {brief.signals.length}
              </div>
              <div className="text-gray-400 text-sm mt-1">Active Signals</div>
            </motion.div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Signals */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Top Signals</h2>
            {brief.signals.map((signal, index) => (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border-2 ${getSeverityColor(signal.severity)} cursor-pointer hover:scale-[1.02] transition-all`}
                onClick={() => setSelectedSignal(signal)}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getSignalIcon(signal.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold text-lg">
                        {signal.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(signal.severity)}`}
                      >
                        {signal.severity}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-4">{signal.description}</p>
                    <div className="flex items-center gap-6 text-sm">
                      {signal.impact.financial && (
                        <div className="flex items-center gap-2">
                          <RiMoneyDollarCircleLine className="text-yellow-500" />
                          <span className="text-gray-400">
                            ${signal.impact.financial.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <RiFileTextLine className="text-blue-500" />
                        <span className="text-gray-400">
                          {signal.evidenceIds.length} Evidence
                        </span>
                      </div>
                      {signal.trend && (
                        <div className="flex items-center gap-2">
                          {signal.trend === "worsening" ? (
                            <RiArrowDownLine className="text-red-500" />
                          ) : (
                            <RiArrowUpLine className="text-green-500" />
                          )}
                          <span className="text-gray-400 capitalize">
                            {signal.trend}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Adversarial Insights & Recommendations */}
          <div className="space-y-6">
            {/* Adversarial Insights */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Adversarial Insights
              </h2>
              <div className="space-y-3">
                {brief.adversarialInsights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border ${getPersonaColor(insight.persona)} cursor-pointer hover:scale-[1.02] transition-all`}
                    onClick={() => setSelectedInsight(insight)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <RiShieldCheckLine />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold uppercase text-gray-400">
                            {insight.persona}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${getSeverityColor(insight.severity)}`}
                          >
                            {insight.severity}
                          </span>
                        </div>
                        <p className="text-white text-sm">{insight.insight}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                          <RiFileTextLine />
                          <span>{insight.evidenceRefs.length} Evidence</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Recommendations
              </h2>
              <div className="space-y-3">
                {brief.recommendations.map((rec, index) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: (brief.adversarialInsights.length + index) * 0.1,
                    }}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex items-start gap-3">
                      <RiCheckboxCircleLine className="text-green-500 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-white font-semibold text-sm">
                            {rec.title}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded text-xs ${getSeverityColor(rec.priority)}`}
                          >
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mb-2">
                          {rec.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Impact: {rec.impact}</span>
                          <span>Effort: {rec.effort}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Evidence Modal */}
        {selectedSignal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8"
            onClick={() => setSelectedSignal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">
                  {selectedSignal.title}
                </h3>
                <button
                  onClick={() => setSelectedSignal(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-300 mb-6">{selectedSignal.description}</p>
              <div className="space-y-2">
                <h4 className="text-white font-semibold mb-2">
                  Evidence ({selectedSignal.evidenceIds.length})
                </h4>
                {selectedSignal.evidenceIds.map((id) => (
                  <div key={id} className="bg-gray-700/50 rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">
                        Evidence ID: {id}
                      </span>
                      <RiEyeLine className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

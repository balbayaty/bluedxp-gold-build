/**
 * BIM AI Analysis Tab Component
 *
 * Full AI analysis UI with clash detection, code compliance, sustainability, cost estimation
 * Real-time analysis results with visualizations
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import type { BIMAIAnalysis } from "@/types/bim-marketplace";
import { useNotifications } from "@/lib/utils/notifications";
import Modal from "@/components/Modal";
import { WebSocketService } from "@/lib/services/realtime/websocketService";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

interface AnalysisTabProps {
  modelId?: string;
  onAnalysisComplete?: (analysis: BIMAIAnalysis) => void;
}

export default function AnalysisTab({
  modelId,
  onAnalysisComplete,
}: AnalysisTabProps) {
  const [analyses, setAnalyses] = useState<BIMAIAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] =
    useState<BIMAIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningAnalysis, setRunningAnalysis] = useState<string | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<string>("");
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<
    Record<string, number>
  >({});
  const notifications = useNotifications();
  const wsRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    if (modelId) {
      loadAnalyses();
    }
  }, [modelId]);

  // WebSocket connection for real-time analysis progress
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ws = new WebSocketService();
    wsRef.current = ws;

    ws.connect()
      .then(() => {
        setIsRealtimeConnected(true);

        // Subscribe to analysis progress updates
        ws.on("notification", (event) => {
          if (event.data.type === "bim-analysis") {
            const { analysisId, progress, status, result } = event.data;

            if (progress !== undefined) {
              setAnalysisProgress((prev) => ({
                ...prev,
                [analysisId]: progress,
              }));
            }

            if (status === "completed" && result) {
              setAnalyses((prev) =>
                prev.map((a) =>
                  a.id === analysisId
                    ? { ...a, status: "completed", results: result, ...a }
                    : a,
                ),
              );
              setAnalysisProgress((prev) => {
                const newProgress = { ...prev };
                delete newProgress[analysisId];
                return newProgress;
              });
              notifications.success(
                "Analysis Complete",
                `${result.type || "Analysis"} completed successfully`,
              );
            } else if (status === "failed") {
              setAnalyses((prev) =>
                prev.map((a) =>
                  a.id === analysisId ? { ...a, status: "failed" } : a,
                ),
              );
              setAnalysisProgress((prev) => {
                const newProgress = { ...prev };
                delete newProgress[analysisId];
                return newProgress;
              });
              notifications.error(
                "Analysis Failed",
                "Analysis encountered an error",
              );
            }
          }
        });
      })
      .catch((error) => {
        console.warn("WebSocket connection failed:", error);
        setIsRealtimeConnected(false);
      });

    return () => {
      ws.disconnect();
      setIsRealtimeConnected(false);
    };
  }, [notifications]);

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      // In real app, fetch from API
      // For now, use mock data
      const mockAnalyses: BIMAIAnalysis[] = [];
      setAnalyses(mockAnalyses);
    } catch (error) {
      console.error("Error loading analyses:", error);
      notifications.error("Error", "Failed to load analyses");
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async (analysisType: string, options: any = {}) => {
    if (!modelId) {
      notifications.error("Model Required", "Please select a BIM model first");
      return;
    }

    setRunningAnalysis(analysisType);
    setShowRunModal(false);

    try {
      const response = await fetch("/api/bim/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId,
          analysisType,
          options,
        }),
      });

      const result = await response.json();

      if (result.success) {
        notifications.success(
          "Analysis Complete",
          `${analysisType} analysis completed successfully`,
        );
        setAnalyses((prev) => [result.data, ...prev]);
        setSelectedAnalysis(result.data);
        setShowAnalysisModal(true);
        onAnalysisComplete?.(result.data);
      } else {
        notifications.error(
          "Analysis Failed",
          result.error || "Could not complete analysis",
        );
      }
    } catch (error) {
      notifications.error("Error", "Failed to run analysis");
    } finally {
      setRunningAnalysis(null);
    }
  };

  const analysisTypes = [
    {
      id: "clash-detection",
      label: "Clash Detection",
      icon: "ri-collision-line",
      description: "Detect conflicts between different building systems",
      color: "red",
    },
    {
      id: "code-compliance",
      label: "Code Compliance",
      icon: "ri-file-check-line",
      description: "Verify compliance with building codes and standards",
      color: "blue",
    },
    {
      id: "sustainability",
      label: "Sustainability Analysis",
      icon: "ri-leaf-line",
      description: "Analyze environmental impact and energy efficiency",
      color: "green",
    },
    {
      id: "cost-estimation",
      label: "Cost Estimation",
      icon: "ri-money-dollar-circle-line",
      description: "Estimate construction costs based on model data",
      color: "yellow",
    },
    {
      id: "safety-analysis",
      label: "Safety Analysis",
      icon: "ri-shield-check-line",
      description: "Identify potential safety hazards and risks",
      color: "orange",
    },
    {
      id: "optimization",
      label: "Design Optimization",
      icon: "ri-lightbulb-line",
      description: "AI-powered design recommendations and optimizations",
      color: "purple",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "processing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        <p className="text-gray-400 text-sm">Loading analyses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">AI Analysis</h2>
          <div className="flex items-center gap-2">
            <p className="text-gray-400 text-sm">
              AI-powered analysis and insights for your BIM models
            </p>
            {isRealtimeConnected && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs flex items-center gap-1">
                <i className="ri-wifi-line"></i>
                Live
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowRunModal(true)}
          disabled={!modelId}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <i className="ri-play-line"></i>
          Run Analysis
        </button>
      </div>

      {/* Analysis Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {analysisTypes.map((type) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className={`bg-white/5 border border-white/10 rounded-xl p-6 hover:border-${type.color}-500/30 transition-all cursor-pointer ${
              runningAnalysis === type.id ? "opacity-50" : ""
            }`}
            onClick={() => {
              setSelectedAnalysisType(type.id);
              setShowRunModal(true);
            }}
          >
            <div
              className={`w-12 h-12 rounded-lg bg-${type.color}-500/20 flex items-center justify-center mb-4`}
            >
              <i className={`${type.icon} text-${type.color}-400 text-2xl`}></i>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">
              {type.label}
            </h3>
            <p className="text-gray-400 text-sm mb-4">{type.description}</p>
            {(runningAnalysis === type.id ||
              analysisProgress[type.id] !== undefined) && (
              <div className="flex items-center gap-2 text-sm text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span>
                  {analysisProgress[type.id] !== undefined
                    ? `Running... ${analysisProgress[type.id]}%`
                    : "Running..."}
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recent Analyses */}
      {analyses.length > 0 && (
        <div>
          <h3 className="text-white font-semibold text-lg mb-4">
            Recent Analyses
          </h3>
          <div className="space-y-3">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-cyan-500/30 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedAnalysis(analysis);
                  setShowAnalysisModal(true);
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-white font-medium capitalize">
                      {analysis.type.replace("-", " ")}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      {format(
                        new Date(analysis.createdAt),
                        "MMM dd, yyyy HH:mm",
                      )}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(analysis.status)}`}
                  >
                    {analysis.status}
                  </span>
                </div>
                {analysis.summary && (
                  <p className="text-gray-300 text-sm line-clamp-2">
                    {analysis.summary}
                  </p>
                )}
                {analysis.confidence && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>Confidence</span>
                      <span>{(analysis.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-cyan-500 h-2 rounded-full transition-all"
                        style={{ width: `${analysis.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Run Analysis Modal */}
      {showRunModal && (
        <Modal
          isOpen={showRunModal}
          onClose={() => setShowRunModal(false)}
          title={`Run ${analysisTypes.find((t) => t.id === selectedAnalysisType)?.label || "Analysis"}`}
          size="lg"
        >
          <RunAnalysisForm
            analysisType={selectedAnalysisType}
            onSubmit={(options) => {
              handleRunAnalysis(selectedAnalysisType, options);
            }}
            onCancel={() => setShowRunModal(false)}
          />
        </Modal>
      )}

      {/* Analysis Results Modal */}
      {showAnalysisModal && selectedAnalysis && (
        <Modal
          isOpen={showAnalysisModal}
          onClose={() => setShowAnalysisModal(false)}
          title={`${selectedAnalysis.type.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())} Results`}
          size="xl"
        >
          <AnalysisResultsView analysis={selectedAnalysis} />
        </Modal>
      )}
    </div>
  );
}

// Run Analysis Form Component
function RunAnalysisForm({ analysisType, onSubmit, onCancel }: any) {
  const [options, setOptions] = useState<any>({});

  const getFormFields = () => {
    switch (analysisType) {
      case "clash-detection":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tolerance (meters)
              </label>
              <input
                type="number"
                step="0.01"
                value={options.tolerance || 0.1}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    tolerance: parseFloat(e.target.value),
                  }))
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Systems to Check
              </label>
              <div className="space-y-2">
                {["architectural", "structural", "mep", "fire-safety"].map(
                  (system) => (
                    <label
                      key={system}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={options.systems?.includes(system) || false}
                        onChange={(e) => {
                          const systems = options.systems || [];
                          if (e.target.checked) {
                            setOptions((prev) => ({
                              ...prev,
                              systems: [...systems, system],
                            }));
                          } else {
                            setOptions((prev) => ({
                              ...prev,
                              systems: systems.filter(
                                (s: string) => s !== system,
                              ),
                            }));
                          }
                        }}
                        className="rounded text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="text-sm text-gray-300 capitalize">
                        {system.replace("-", " ")}
                      </span>
                    </label>
                  ),
                )}
              </div>
            </div>
          </>
        );
      case "code-compliance":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Building Code Standard
            </label>
            <select
              value={options.standard || "IBC"}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, standard: e.target.value }))
              }
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="IBC">International Building Code (IBC)</option>
              <option value="NFPA">NFPA Standards</option>
              <option value="ASHRAE">ASHRAE Standards</option>
              <option value="LEED">LEED Certification</option>
            </select>
          </div>
        );
      case "sustainability":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Analysis Focus
            </label>
            <div className="space-y-2">
              {[
                "energy-efficiency",
                "carbon-footprint",
                "material-sustainability",
                "water-usage",
              ].map((focus) => (
                <label
                  key={focus}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={options.focusAreas?.includes(focus) || false}
                    onChange={(e) => {
                      const areas = options.focusAreas || [];
                      if (e.target.checked) {
                        setOptions((prev) => ({
                          ...prev,
                          focusAreas: [...areas, focus],
                        }));
                      } else {
                        setOptions((prev) => ({
                          ...prev,
                          focusAreas: areas.filter((a: string) => a !== focus),
                        }));
                      }
                    }}
                    className="rounded text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-gray-300 capitalize">
                    {focus.replace("-", " ")}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {getFormFields()}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <button
          onClick={() => onSubmit(options)}
          className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors"
        >
          Run Analysis
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Analysis Results View Component
function AnalysisResultsView({ analysis }: { analysis: BIMAIAnalysis }) {
  const renderResults = () => {
    switch (analysis.type) {
      case "clash-detection":
        return (
          <div className="space-y-4">
            {analysis.results?.clashes && (
              <>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-collision-line text-red-400"></i>
                    <h4 className="text-white font-medium">Clashes Detected</h4>
                  </div>
                  <p className="text-2xl font-bold text-red-400">
                    {analysis.results.clashes.length}
                  </p>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {analysis.results.clashes.map((clash: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-white font-medium">
                          Clash #{idx + 1}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            clash.severity === "critical"
                              ? "bg-red-500/20 text-red-400"
                              : clash.severity === "high"
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {clash.severity}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        {clash.element1} vs {clash.element2}
                      </p>
                      {clash.distance && (
                        <p className="text-gray-400 text-xs mt-1">
                          Distance: {clash.distance.toFixed(3)}m
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      case "sustainability":
        return (
          <div className="space-y-4">
            {analysis.results?.metrics && (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(analysis.results.metrics).map(
                  ([key, value]: [string, any]) => (
                    <div
                      key={key}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <label className="text-sm text-gray-400 capitalize mb-1 block">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </label>
                      <p className="text-2xl font-bold text-cyan-400">
                        {value}
                      </p>
                    </div>
                  ),
                )}
              </div>
            )}
            {analysis.results?.chartData && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-medium mb-4">
                  Sustainability Metrics
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analysis.results.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                      }}
                    />
                    <Bar dataKey="value" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      case "cost-estimation":
        return (
          <div className="space-y-4">
            {analysis.results?.totalCost && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
                <label className="text-sm text-gray-400 mb-2 block">
                  Estimated Total Cost
                </label>
                <p className="text-4xl font-bold text-green-400">
                  ${analysis.results.totalCost.toLocaleString()}
                </p>
              </div>
            )}
            {analysis.results?.breakdown && (
              <div className="space-y-2">
                <h4 className="text-white font-medium mb-3">Cost Breakdown</h4>
                {Object.entries(analysis.results.breakdown).map(
                  ([category, amount]: [string, any]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                    >
                      <span className="text-gray-300 capitalize">
                        {category.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span className="text-white font-medium">
                        ${amount.toLocaleString()}
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            {analysis.summary && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-medium mb-2">Summary</h4>
                <p className="text-gray-300 text-sm">{analysis.summary}</p>
              </div>
            )}
            {analysis.recommendations &&
              analysis.recommendations.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-3">
                    Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {analysis.recommendations.map(
                      (rec: string, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 p-3 bg-white/5 rounded-lg"
                        >
                          <i className="ri-lightbulb-line text-yellow-400 mt-0.5"></i>
                          <span className="text-gray-300 text-sm">{rec}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-400">Status</label>
          <p className="text-white capitalize">{analysis.status}</p>
        </div>
        <div>
          <label className="text-sm text-gray-400">Created</label>
          <p className="text-white">
            {format(new Date(analysis.createdAt), "MMM dd, yyyy HH:mm")}
          </p>
        </div>
        {analysis.confidence && (
          <div>
            <label className="text-sm text-gray-400">Confidence</label>
            <p className="text-white">
              {(analysis.confidence * 100).toFixed(0)}%
            </p>
          </div>
        )}
        {analysis.processingTime && (
          <div>
            <label className="text-sm text-gray-400">Processing Time</label>
            <p className="text-white">{analysis.processingTime}ms</p>
          </div>
        )}
      </div>

      {/* Results */}
      <div>
        <h4 className="text-white font-medium mb-4">Results</h4>
        {renderResults()}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <button className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors">
          <i className="ri-download-line mr-2"></i>
          Export Report
        </button>
        <button className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors">
          <i className="ri-share-line mr-2"></i>
          Share
        </button>
      </div>
    </div>
  );
}

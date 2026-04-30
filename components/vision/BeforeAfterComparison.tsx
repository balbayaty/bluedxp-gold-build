/**
 * Before/After Comparison Component
 * Compare AI Vision analysis results side by side
 * Shows improvement or deterioration in compliance
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnalysisResult {
  id: string;
  timestamp: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  complianceScore?: number;
  isCompliant?: boolean;
  summary?: string;
  analysis: {
    description?: string;
    safetyIssues?: Array<{ issue: string; severity: string }>;
    qualityIssues?: Array<{ issue: string; severity: string }>;
    complianceIssues?: Array<{ standard: string; violation: string }>;
  };
  hazards?: Array<{ type: string; severity: string; description: string }>;
}

interface BeforeAfterComparisonProps {
  beforeAnalysis?: AnalysisResult;
  afterAnalysis?: AnalysisResult;
  onSelectBefore?: () => void;
  onSelectAfter?: () => void;
  analyses: AnalysisResult[];
}

export default function BeforeAfterComparison({
  beforeAnalysis,
  afterAnalysis,
  onSelectBefore,
  onSelectAfter,
  analyses,
}: BeforeAfterComparisonProps) {
  const [showBeforeSelector, setShowBeforeSelector] = useState(false);
  const [showAfterSelector, setShowAfterSelector] = useState(false);
  const [selectedBefore, setSelectedBefore] = useState<AnalysisResult | null>(
    beforeAnalysis || null,
  );
  const [selectedAfter, setSelectedAfter] = useState<AnalysisResult | null>(
    afterAnalysis || null,
  );
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState<
    "slider" | "side-by-side" | "overlay"
  >("side-by-side");
  const containerRef = useRef<HTMLDivElement>(null);

  const beforeScore = selectedBefore?.complianceScore || 0;
  const afterScore = selectedAfter?.complianceScore || 0;
  const improvement = afterScore - beforeScore;
  const improvementPercent =
    beforeScore > 0 ? Math.round((improvement / beforeScore) * 100) : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-600";
    if (score >= 60) return "from-yellow-500 to-amber-600";
    return "from-red-500 to-rose-600";
  };

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
            <i className="ri-git-merge-line text-white text-2xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Before / After Comparison
            </h3>
            <p className="text-sm text-gray-400">
              Track compliance improvements over time
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex gap-2">
          {(["side-by-side", "slider", "overlay"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === mode
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
            >
              <i
                className={`ri-${mode === "side-by-side" ? "layout-column" : mode === "slider" ? "drag-move-2" : "stack"}-line mr-1`}
              ></i>
              {mode
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")}
            </button>
          ))}
        </div>
      </div>

      {/* Improvement Summary */}
      {selectedBefore && selectedAfter && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-xl border ${
            improvement > 0
              ? "bg-green-900/30 border-green-500/30"
              : improvement < 0
                ? "bg-red-900/30 border-red-500/30"
                : "bg-gray-700/50 border-gray-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getScoreBg(afterScore)} flex items-center justify-center`}
              >
                <span className="text-2xl font-bold text-white">
                  {afterScore}%
                </span>
              </div>
              <div>
                <div className="text-lg font-semibold text-white">
                  {improvement > 0
                    ? "🎉 Improvement!"
                    : improvement < 0
                      ? "⚠️ Regression"
                      : "➡️ No Change"}
                </div>
                <div className="text-sm text-gray-400">
                  Compliance score{" "}
                  {improvement > 0
                    ? "increased"
                    : improvement < 0
                      ? "decreased"
                      : "unchanged"}{" "}
                  by{" "}
                  <span
                    className={
                      improvement >= 0 ? "text-green-400" : "text-red-400"
                    }
                  >
                    {Math.abs(improvement)} points (
                    {improvementPercent > 0 ? "+" : ""}
                    {improvementPercent}%)
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Before → After</div>
              <div className="text-xl font-bold">
                <span className={getScoreColor(beforeScore)}>
                  {beforeScore}%
                </span>
                <span className="mx-2 text-gray-500">→</span>
                <span className={getScoreColor(afterScore)}>{afterScore}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Comparison View */}
      <div className="grid grid-cols-2 gap-6">
        {/* Before Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              Before
            </h4>
            <button
              onClick={() => setShowBeforeSelector(true)}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition-colors"
            >
              <i className="ri-image-add-line mr-1"></i>
              {selectedBefore ? "Change" : "Select"}
            </button>
          </div>

          {selectedBefore ? (
            <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
              {selectedBefore.imageUrl && (
                <img
                  src={selectedBefore.imageUrl}
                  alt="Before"
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-2xl font-bold ${getScoreColor(beforeScore)}`}
                  >
                    {beforeScore}%
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(selectedBefore.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {selectedBefore.summary ||
                    selectedBefore.analysis.description}
                </p>
                <div className="mt-3 flex gap-2">
                  <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs">
                    {selectedBefore.analysis.safetyIssues?.length || 0} Safety
                    Issues
                  </span>
                  <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded text-xs">
                    {selectedBefore.hazards?.length || 0} Hazards
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setShowBeforeSelector(true)}
              className="h-64 bg-gray-900 rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-gray-600 transition-colors"
            >
              <i className="ri-image-add-line text-4xl text-gray-600 mb-2"></i>
              <span className="text-gray-500">Select "Before" analysis</span>
            </div>
          )}
        </div>

        {/* After Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              After
            </h4>
            <button
              onClick={() => setShowAfterSelector(true)}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition-colors"
            >
              <i className="ri-image-add-line mr-1"></i>
              {selectedAfter ? "Change" : "Select"}
            </button>
          </div>

          {selectedAfter ? (
            <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
              {selectedAfter.imageUrl && (
                <img
                  src={selectedAfter.imageUrl}
                  alt="After"
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-2xl font-bold ${getScoreColor(afterScore)}`}
                  >
                    {afterScore}%
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(selectedAfter.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {selectedAfter.summary || selectedAfter.analysis.description}
                </p>
                <div className="mt-3 flex gap-2">
                  <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs">
                    {selectedAfter.analysis.safetyIssues?.length || 0} Safety
                    Issues
                  </span>
                  <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs">
                    {selectedAfter.hazards?.length || 0} Hazards
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setShowAfterSelector(true)}
              className="h-64 bg-gray-900 rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-gray-600 transition-colors"
            >
              <i className="ri-image-add-line text-4xl text-gray-600 mb-2"></i>
              <span className="text-gray-500">Select "After" analysis</span>
            </div>
          )}
        </div>
      </div>

      {/* Issues Comparison */}
      {selectedBefore && selectedAfter && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
            <h5 className="text-sm font-medium text-gray-400 mb-2">
              Safety Issues
            </h5>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">
                {selectedBefore.analysis.safetyIssues?.length || 0} →{" "}
                {selectedAfter.analysis.safetyIssues?.length || 0}
              </span>
              {(selectedAfter.analysis.safetyIssues?.length || 0) <
              (selectedBefore.analysis.safetyIssues?.length || 0) ? (
                <span className="text-green-400 text-sm">↓ Improved</span>
              ) : (selectedAfter.analysis.safetyIssues?.length || 0) >
                (selectedBefore.analysis.safetyIssues?.length || 0) ? (
                <span className="text-red-400 text-sm">↑ Worsened</span>
              ) : (
                <span className="text-gray-400 text-sm">→ Same</span>
              )}
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
            <h5 className="text-sm font-medium text-gray-400 mb-2">
              Quality Issues
            </h5>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">
                {selectedBefore.analysis.qualityIssues?.length || 0} →{" "}
                {selectedAfter.analysis.qualityIssues?.length || 0}
              </span>
              {(selectedAfter.analysis.qualityIssues?.length || 0) <
              (selectedBefore.analysis.qualityIssues?.length || 0) ? (
                <span className="text-green-400 text-sm">↓ Improved</span>
              ) : (selectedAfter.analysis.qualityIssues?.length || 0) >
                (selectedBefore.analysis.qualityIssues?.length || 0) ? (
                <span className="text-red-400 text-sm">↑ Worsened</span>
              ) : (
                <span className="text-gray-400 text-sm">→ Same</span>
              )}
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
            <h5 className="text-sm font-medium text-gray-400 mb-2">
              Compliance Issues
            </h5>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">
                {selectedBefore.analysis.complianceIssues?.length || 0} →{" "}
                {selectedAfter.analysis.complianceIssues?.length || 0}
              </span>
              {(selectedAfter.analysis.complianceIssues?.length || 0) <
              (selectedBefore.analysis.complianceIssues?.length || 0) ? (
                <span className="text-green-400 text-sm">↓ Improved</span>
              ) : (selectedAfter.analysis.complianceIssues?.length || 0) >
                (selectedBefore.analysis.complianceIssues?.length || 0) ? (
                <span className="text-red-400 text-sm">↑ Worsened</span>
              ) : (
                <span className="text-gray-400 text-sm">→ Same</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analysis Selector Modal */}
      <AnimatePresence>
        {(showBeforeSelector || showAfterSelector) && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowBeforeSelector(false);
              setShowAfterSelector(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  Select {showBeforeSelector ? "Before" : "After"} Analysis
                </h3>
                <button
                  onClick={() => {
                    setShowBeforeSelector(false);
                    setShowAfterSelector(false);
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <i className="ri-close-line text-gray-400 text-xl"></i>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4">
                {analyses.map((analysis) => (
                  <button
                    key={analysis.id}
                    onClick={() => {
                      if (showBeforeSelector) {
                        setSelectedBefore(analysis);
                        setShowBeforeSelector(false);
                      } else {
                        setSelectedAfter(analysis);
                        setShowAfterSelector(false);
                      }
                    }}
                    className="bg-gray-900 rounded-xl border border-gray-700 p-4 text-left hover:border-cyan-500 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xl font-bold ${getScoreColor(analysis.complianceScore || 0)}`}
                      >
                        {analysis.complianceScore || 0}%
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(analysis.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {analysis.summary ||
                        analysis.analysis.description ||
                        "No description"}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

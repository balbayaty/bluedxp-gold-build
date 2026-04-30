/**
 * Enhanced Damage Report Integration
 * Non-breaking: Works alongside existing DamageReportVisionIntegration
 * Adds self-learning, liability, and cross-module integration
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import DamagePhotoViewer3D from "./DamagePhotoViewer3D";

interface DamageReportEnhancedIntegrationProps {
  damageRecordId: string;
  photos: Array<{
    id: string;
    photoUrl: string;
    thumbnailUrl?: string;
    caption?: string;
  }>;
  onAnalysisComplete?: (result: any) => void;
  onLiabilityAssessed?: (assessment: any) => void;
  onIntegrationComplete?: (result: any) => void;
}

export default function DamageReportEnhancedIntegration({
  damageRecordId,
  photos,
  onAnalysisComplete,
  onLiabilityAssessed,
  onIntegrationComplete,
}: DamageReportEnhancedIntegrationProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [liabilityAssessment, setLiabilityAssessment] = useState<any>(null);
  const [integrationResult, setIntegrationResult] = useState<any>(null);
  const [show3DViewer, setShow3DViewer] = useState(false);

  const handleAnalyze = async () => {
    if (photos.length === 0) {
      alert("Please upload damage photos first");
      return;
    }

    setAnalyzing(true);

    try {
      const formData = new FormData();
      // Use first photo for analysis (can be enhanced to analyze all)
      const photoBlob = await fetch(photos[0].photoUrl).then((r) => r.blob());
      formData.append("image", photoBlob, "damage-photo.jpg");
      formData.append("module", "wms");
      formData.append("entityType", "damage");
      formData.append("entityId", damageRecordId);
      formData.append(
        "metadata",
        JSON.stringify({
          area: "loading_dock", // Should come from damage record
          equipment: ["forklift"], // Should come from damage record
          totalValue: 5000, // Should come from damage record
          damageType: "CRUSHED", // Should come from damage record
          severity: "MAJOR", // Should come from damage record
        }),
      );

      const response = await fetch("/api/ai/vision/v2/analyze", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setAnalysisResult(result.visionAnalysis);
        setLiabilityAssessment(result.liability);
        setIntegrationResult(result.integration);

        onAnalysisComplete?.(result.visionAnalysis);
        onLiabilityAssessed?.(result.liability);
        onIntegrationComplete?.(result.integration);
      } else {
        alert("Analysis failed: " + (result.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              🚀 Enhanced AI Vision Analysis
            </h3>
            <p className="text-white/70 text-sm">
              Self-learning vision analysis with liability assessment and
              cross-module integration
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAnalyze}
            disabled={analyzing || photos.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            {analyzing ? (
              <>
                <i className="ri-loader-4-line animate-spin"></i>
                Analyzing...
              </>
            ) : (
              <>
                <i className="ri-magic-line"></i>
                Analyze with AI
              </>
            )}
          </motion.button>
        </div>

        {photos.length === 0 && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 text-yellow-400 text-sm">
            <i className="ri-alert-line mr-2"></i>
            Please upload damage photos to enable AI analysis
          </div>
        )}
      </motion.div>

      {/* Analysis Results */}
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Pattern Matches */}
          {analysisResult.patternMatches?.length > 0 && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-brain-line text-cyan-400"></i>
                Learned Patterns Matched
              </h4>
              <div className="space-y-3">
                {analysisResult.patternMatches
                  .slice(0, 3)
                  .map((match: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">
                          {match.pattern.name}
                        </span>
                        <span className="text-cyan-400 font-semibold">
                          {Math.round(match.matchScore)}% match
                        </span>
                      </div>
                      <p className="text-white/70 text-sm mb-2">
                        {match.pattern.description}
                      </p>
                      <p className="text-cyan-400 text-sm">
                        {match.suggestedAction}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Prevention Suggestions */}
          {analysisResult.preventionSuggestions?.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-lightbulb-line text-green-400"></i>
                Prevention Suggestions
              </h4>
              <ul className="space-y-2">
                {analysisResult.preventionSuggestions.map(
                  (suggestion: string, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-white/80"
                    >
                      <i className="ri-checkbox-circle-line text-green-400 mt-0.5"></i>
                      <span>{suggestion}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          {/* Learning Metadata */}
          {analysisResult.learningMetadata && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-graduation-cap-line text-purple-400"></i>
                Learning Progress
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-white/60 text-sm">Patterns Matched</p>
                  <p className="text-2xl font-bold text-white">
                    {analysisResult.learningMetadata.patternsMatched}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Confidence Boost</p>
                  <p className="text-2xl font-bold text-green-400">
                    +{analysisResult.learningMetadata.confidenceBoost}%
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">New Pattern</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {analysisResult.learningMetadata.newPatternDetected
                      ? "Yes"
                      : "No"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Liability Assessment */}
      {liabilityAssessment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6"
        >
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-scales-3-line text-orange-400"></i>
            Liability Assessment
          </h4>
          <div className="space-y-4">
            <div>
              <p className="text-white/60 text-sm mb-1">Primary Fault</p>
              <p className="text-xl font-bold text-white capitalize">
                {liabilityAssessment.primaryFault.replace("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-2">Fault Distribution</p>
              <div className="space-y-2">
                {Object.entries(liabilityAssessment.faultPercentage)
                  .filter(([_, percentage]) => percentage > 0)
                  .map(([party, percentage]) => (
                    <div key={party} className="flex items-center gap-3">
                      <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                        ></motion.div>
                      </div>
                      <span className="text-white text-sm min-w-[100px] capitalize">
                        {party.replace("_", " ")}: {percentage}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
            {liabilityAssessment.financialImpact && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-white/60 text-sm">Claimable Amount</p>
                  <p className="text-xl font-bold text-green-400">
                    {liabilityAssessment.financialImpact.currency}{" "}
                    {liabilityAssessment.financialImpact.claimableAmount.toFixed(
                      2,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Net Claim</p>
                  <p className="text-xl font-bold text-white">
                    {liabilityAssessment.financialImpact.currency}{" "}
                    {liabilityAssessment.financialImpact.netClaim.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Integration Results */}
      {integrationResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6"
        >
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-node-tree text-blue-400"></i>
            Cross-Module Integration
          </h4>
          <div className="space-y-3">
            <div>
              <p className="text-white/60 text-sm mb-2">Actions Executed</p>
              <div className="space-y-2">
                {integrationResult.executedActions
                  .filter((a: any) => a.status === "success")
                  .map((action: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-white/80"
                    >
                      <i className="ri-checkbox-circle-line text-green-400"></i>
                      <span className="capitalize">
                        {action.action.type.replace("_", " ")}
                      </span>
                      <span className="text-white/40">→</span>
                      <span className="text-blue-400">
                        {action.action.module}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
            {integrationResult.recommendations?.length > 0 && (
              <div className="pt-3 border-t border-white/10">
                <p className="text-white/60 text-sm mb-2">Recommendations</p>
                <ul className="space-y-1">
                  {integrationResult.recommendations.map(
                    (rec: string, idx: number) => (
                      <li
                        key={idx}
                        className="text-white/70 text-sm flex items-start gap-2"
                      >
                        <i className="ri-arrow-right-s-line text-blue-400 mt-0.5"></i>
                        <span>{rec}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* 3D Viewer Button */}
      {photos.length > 0 && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShow3DViewer(!show3DViewer)}
          className="w-full p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl text-white hover:from-cyan-500/30 hover:to-blue-500/30 transition-all flex items-center justify-center gap-2"
        >
          <i className="ri-3d-line text-2xl"></i>
          <span className="font-medium">
            {show3DViewer ? "Hide" : "Show"} 3D Photo Viewer
          </span>
        </motion.button>
      )}

      {/* 3D Viewer */}
      {show3DViewer && photos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="h-[600px] rounded-xl overflow-hidden"
        >
          <DamagePhotoViewer3D
            photos={photos.map((p) => ({
              id: p.id,
              damageRecordId,
              photoUrl: p.photoUrl,
              thumbnailUrl: p.thumbnailUrl,
              caption: p.caption,
              takenAt: new Date().toISOString(),
            }))}
            damageAnalysis={analysisResult?.analysis?.analysis}
            showAnnotations={true}
            showHeatmap={true}
          />
        </motion.div>
      )}
    </div>
  );
}

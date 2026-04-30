/**
 * Arabic NLP Analysis Card Component
 *
 * Visual display of Arabic NLP analysis results
 * Can be used anywhere in the app
 *
 * @module components/arabic-nlp
 */

"use client";

import { useArabicNLP } from "@/hooks/useArabicNLP";
import { motion } from "framer-motion";
import { useState } from "react";
import type { ArabicNLPAnalysis } from "@/lib/services/nlp/arabic-nlp/types";

interface ArabicNLPAnalysisCardProps {
  text?: string;
  analysisId?: string;
  showDetails?: boolean;
  className?: string;
  analysis?: ArabicNLPAnalysis | null; // Optional: pass analysis from parent
  loading?: boolean; // Optional: pass loading state from parent
  error?: Error | null; // Optional: pass error from parent
}

export function ArabicNLPAnalysisCard({
  text,
  analysisId,
  showDetails = false,
  className = "",
  analysis: externalAnalysis,
  loading: externalLoading,
  error: externalError,
}: ArabicNLPAnalysisCardProps) {
  // Use internal hook only if no external analysis/loading/error provided
  const internalHook = useArabicNLP();
  const hookAnalysis =
    externalAnalysis !== undefined ? null : internalHook.analysis;
  const hookLoading =
    externalLoading !== undefined ? false : internalHook.loading;
  const hookError = externalError !== undefined ? null : internalHook.error;
  const { analyze } = internalHook;

  // Use external values if provided, otherwise use hook values
  const analysis =
    externalAnalysis !== undefined ? externalAnalysis : hookAnalysis;
  const loading = externalLoading !== undefined ? externalLoading : hookLoading;
  const error = externalError !== undefined ? externalError : hookError;

  const [inputText, setInputText] = useState(text || "");

  const handleAnalyze = async () => {
    if (inputText) {
      await analyze(inputText);
    }
  };

  if (loading) {
    return (
      <div className={`arabic-nlp-loading ${className}`}>
        <div className="animate-pulse">Analyzing Arabic text...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`arabic-nlp-error ${className}`}>
        <span className="text-red-500">Error: {error.message}</span>
      </div>
    );
  }

  return (
    <div className={`arabic-nlp-analysis-card ${className}`}>
      {!analysis && (
        <div className="mb-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter Arabic text to analyze..."
            className="w-full p-3 border rounded-lg"
            rows={4}
          />
          <button
            onClick={handleAnalyze}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Analyze
          </button>
        </div>
      )}

      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Language & Dialect */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-semibold mb-2">Language & Dialect</div>
            <div className="text-sm">
              <span className="font-medium">Language:</span> {analysis.language}
            </div>
            <div className="text-sm">
              <span className="font-medium">Dialect:</span> {analysis.dialect}
            </div>
            <div className="text-sm">
              <span className="font-medium">Confidence:</span>{" "}
              {(analysis.languageConfidence * 100).toFixed(0)}%
            </div>
          </div>

          {/* Sentiment */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-semibold mb-2">Sentiment</div>
            <div
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                analysis.sentiment.sentiment === "positive"
                  ? "bg-green-100 text-green-800"
                  : analysis.sentiment.sentiment === "negative"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {analysis.sentiment.sentiment}
            </div>
            <div className="text-sm mt-2">
              <span className="font-medium">Confidence:</span>{" "}
              {(analysis.sentiment.confidence * 100).toFixed(0)}%
            </div>
            <div className="text-sm mt-1">
              <span className="font-medium">Commitment Level:</span>{" "}
              {analysis.sentiment.commitmentLevel}
            </div>
          </div>

          {/* Intent */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-semibold mb-2">Intent</div>
            <div className="text-sm font-medium">{analysis.intent.intent}</div>
            <div className="text-sm mt-1">
              <span className="font-medium">Confidence:</span>{" "}
              {(analysis.intent.confidence * 100).toFixed(0)}%
            </div>
            {analysis.intent.evidence.length > 0 && (
              <div className="text-xs mt-2 text-gray-600">
                Evidence: {analysis.intent.evidence.join(", ")}
              </div>
            )}
          </div>

          {/* Inshallah Analysis */}
          {analysis.inshallahAnalysis.detected && (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-sm font-semibold mb-2">
                Inshallah Analysis
              </div>
              <div className="text-sm">
                <span className="font-medium">Detected:</span> Yes (
                {analysis.inshallahAnalysis.count} times)
              </div>
              <div className="text-sm">
                <span className="font-medium">Context:</span>{" "}
                {analysis.inshallahAnalysis.context}
              </div>
              <div className="text-sm">
                <span className="font-medium">Commitment Score:</span>{" "}
                {(analysis.inshallahAnalysis.commitmentScore * 100).toFixed(0)}%
              </div>
            </div>
          )}

          {/* Cultural Context */}
          {showDetails && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-semibold mb-2">Cultural Context</div>
              <div className="text-sm">
                <span className="font-medium">Formality:</span>{" "}
                {analysis.culturalContext.formality}
              </div>
              <div className="text-sm">
                <span className="font-medium">Business Pattern:</span>{" "}
                {analysis.culturalContext.businessPattern.type}
              </div>
              <div className="text-sm">
                <span className="font-medium">Relationship Depth:</span>{" "}
                {analysis.culturalContext.relationshipDepth}
              </div>
              {analysis.culturalContext.honorifics.length > 0 && (
                <div className="text-xs mt-2">
                  Honorifics:{" "}
                  {analysis.culturalContext.honorifics
                    .map((h) => h.text)
                    .join(", ")}
                </div>
              )}
            </div>
          )}

          {/* Overall Confidence */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm font-semibold mb-2">Overall Analysis</div>
            <div className="text-sm">
              <span className="font-medium">Confidence:</span>{" "}
              {(analysis.overallConfidence * 100).toFixed(0)}%
            </div>
            <div className="text-sm">
              <span className="font-medium">Quality Score:</span>{" "}
              {(analysis.qualityScore * 100).toFixed(0)}%
            </div>
            <div className="text-sm">
              <span className="font-medium">Processing Time:</span>{" "}
              {analysis.processingTime}ms
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default ArabicNLPAnalysisCard;

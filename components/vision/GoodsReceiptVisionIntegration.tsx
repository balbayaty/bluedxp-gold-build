/**
 * Goods Receipt Vision Integration Component
 * Integrates vision analysis into goods receipt
 */

"use client";

import { useState } from "react";
import VisionAnalysisButton from "./VisionAnalysisButton";
import VisionAutoFill from "./VisionAutoFill";

interface GoodsReceiptVisionIntegrationProps {
  onVerificationComplete: (verification: {
    verified: boolean;
    itemCount?: number;
    damageDetected?: boolean;
    issues?: string[];
  }) => void;
  formFields?: Array<{
    id: string;
    name: string;
    type: string;
    label: string;
  }>;
  onFieldFill?: (fieldId: string, value: any, confidence: number) => void;
}

export default function GoodsReceiptVisionIntegration({
  onVerificationComplete,
  formFields = [],
  onFieldFill,
}: GoodsReceiptVisionIntegrationProps) {
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalysisComplete = (result: any) => {
    setAnalysis(result);

    // Extract verification information
    const itemCount = result.vision?.analysis?.detectedObjects?.length || 0;
    const damageDetected =
      result.integration?.wms?.inventoryImpact?.damageDetected || false;
    const issues: string[] = [];

    if (result.vision?.analysis?.qualityIssues?.length > 0) {
      issues.push(
        ...result.vision.analysis.qualityIssues.map((q: any) => q.issue),
      );
    }
    if (result.vision?.analysis?.safetyIssues?.length > 0) {
      issues.push(
        ...result.vision.analysis.safetyIssues.map((s: any) => s.issue),
      );
    }

    onVerificationComplete({
      verified: !damageDetected && issues.length === 0,
      itemCount,
      damageDetected,
      issues,
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <i className="ri-checkbox-circle-line text-2xl text-green-600"></i>
            <div>
              <h4 className="font-semibold text-green-900">
                AI Receipt Verification
              </h4>
              <p className="text-sm text-green-700">
                Verify goods receipt with AI vision
              </p>
            </div>
          </div>
          <VisionAnalysisButton
            onAnalysisComplete={handleAnalysisComplete}
            module="wms"
            context="Goods receipt verification - count items, verify condition, detect damage"
            buttonText="Verify Receipt"
            buttonIcon="ri-search-2-line"
            config={{
              enableAnomalyDetection: true,
              enableSceneUnderstanding: true,
            }}
          />
        </div>

        {analysis && (
          <div className="mt-4 space-y-3">
            {/* Verification Status */}
            <div
              className={`rounded p-3 ${
                analysis.integration?.wms?.inventoryImpact?.damageDetected
                  ? "bg-red-50 border border-red-200"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <i
                  className={`${
                    analysis.integration?.wms?.inventoryImpact?.damageDetected
                      ? "ri-close-circle-line text-red-600"
                      : "ri-checkbox-circle-line text-green-600"
                  }`}
                ></i>
                <span
                  className={`font-semibold ${
                    analysis.integration?.wms?.inventoryImpact?.damageDetected
                      ? "text-red-900"
                      : "text-green-900"
                  }`}
                >
                  {analysis.integration?.wms?.inventoryImpact?.damageDetected
                    ? "Verification Failed - Damage Detected"
                    : "Verification Passed"}
                </span>
              </div>
            </div>

            {/* Item Count */}
            {analysis.vision?.analysis?.detectedObjects?.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="font-semibold text-blue-900 mb-1">
                  Items Detected:
                </p>
                <p className="text-2xl font-bold text-blue-700">
                  {analysis.vision.analysis.detectedObjects.length}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Confidence:{" "}
                  {Math.round(
                    analysis.vision.analysis.detectedObjects.reduce(
                      (sum: number, obj: any) => sum + obj.confidence,
                      0,
                    ) / analysis.vision.analysis.detectedObjects.length,
                  )}
                  %
                </p>
              </div>
            )}

            {/* Quality Issues */}
            {analysis.vision?.analysis?.qualityIssues?.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="font-semibold text-yellow-900 mb-2">
                  Quality Issues:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                  {analysis.vision.analysis.qualityIssues.map(
                    (issue: any, idx: number) => (
                      <li key={idx}>{issue.issue}</li>
                    ),
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auto-Fill Form Fields */}
      {analysis && formFields.length > 0 && onFieldFill && (
        <VisionAutoFill
          analysisResult={analysis}
          formFields={formFields}
          onFieldFill={onFieldFill}
          autoFillThreshold={75}
          showSuggestions={true}
        />
      )}
    </div>
  );
}

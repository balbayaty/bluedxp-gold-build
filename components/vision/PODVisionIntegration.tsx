/**
 * POD (Proof of Delivery) Vision Integration Component
 * Integrates vision analysis into proof of delivery
 */

"use client";

import { useState } from "react";
import VisionAnalysisButton from "./VisionAnalysisButton";
import VisionAutoFill from "./VisionAutoFill";

interface PODVisionIntegrationProps {
  onPODComplete: (pod: {
    verified: boolean;
    packageCondition?: string;
    damageDetected?: boolean;
    signatureDetected?: boolean;
  }) => void;
  formFields?: Array<{
    id: string;
    name: string;
    type: string;
    label: string;
  }>;
  onFieldFill?: (fieldId: string, value: any, confidence: number) => void;
}

export default function PODVisionIntegration({
  onPODComplete,
  formFields = [],
  onFieldFill,
}: PODVisionIntegrationProps) {
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalysisComplete = async (result: any) => {
    setAnalysis(result);

    // Use logistics vision for POD-specific analysis
    const packageCondition =
      result.integration?.wms?.inventoryImpact?.packageCondition;
    const damageDetected =
      result.integration?.wms?.inventoryImpact?.damageDetected || false;

    // Check for signature (would use OCR/text detection)
    const signatureDetected =
      result.vision?.extractedText?.text?.toLowerCase().includes("signature") ||
      result.vision?.extractedText?.text?.toLowerCase().includes("signed") ||
      false;

    onPODComplete({
      verified: !damageDetected && packageCondition !== "critical",
      packageCondition,
      damageDetected,
      signatureDetected,
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <i className="ri-file-check-line text-2xl text-purple-600"></i>
            <div>
              <h4 className="font-semibold text-purple-900">
                AI POD Verification
              </h4>
              <p className="text-sm text-purple-700">
                Verify delivery with photo-based POD
              </p>
            </div>
          </div>
          <VisionAnalysisButton
            onAnalysisComplete={handleAnalysisComplete}
            module="tms"
            context="Proof of delivery - verify package condition, detect damage, verify signature"
            buttonText="Verify POD"
            buttonIcon="ri-file-check-line"
            config={{
              enableAnomalyDetection: true,
              enableSceneUnderstanding: true,
            }}
          />
        </div>

        {analysis && (
          <div className="mt-4 space-y-3">
            {/* POD Status */}
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
                    ? "POD Failed - Damage Detected"
                    : "POD Verified"}
                </span>
              </div>
            </div>

            {/* Package Condition */}
            {analysis.integration?.wms?.inventoryImpact?.packageCondition && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="font-semibold text-blue-900 mb-1">
                  Package Condition:
                </p>
                <p className="text-lg font-bold text-blue-700 capitalize">
                  {analysis.integration.wms.inventoryImpact.packageCondition}
                </p>
              </div>
            )}

            {/* Signature Detection */}
            {analysis.vision?.extractedText && (
              <div className="bg-purple-50 border border-purple-200 rounded p-3">
                <p className="font-semibold text-purple-900 mb-1">
                  Signature Status:
                </p>
                <p
                  className={`font-medium ${
                    analysis.vision.extractedText.text
                      ?.toLowerCase()
                      .includes("signature")
                      ? "text-green-700"
                      : "text-yellow-700"
                  }`}
                >
                  {analysis.vision.extractedText.text
                    ?.toLowerCase()
                    .includes("signature")
                    ? "✓ Signature Detected"
                    : "⚠ Signature Not Clearly Detected"}
                </p>
              </div>
            )}

            {/* Damage Details */}
            {analysis.integration?.wms?.inventoryImpact?.damageDetected && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="font-semibold text-red-900 mb-2">
                  Damage Details:
                </p>
                {analysis.vision?.analysis?.qualityIssues
                  ?.filter((q: any) => q.type.toLowerCase().includes("damage"))
                  .map((issue: any, idx: number) => (
                    <p key={idx} className="text-sm text-red-800">
                      {issue.issue}
                    </p>
                  ))}
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

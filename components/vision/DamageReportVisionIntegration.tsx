/**
 * Damage Report Vision Integration Component
 * Integrates vision analysis into damage reports
 */

"use client";

import { useState } from "react";
import VisionAnalysisButton from "./VisionAnalysisButton";
import VisionAutoFill from "./VisionAutoFill";

interface DamageReportVisionIntegrationProps {
  onDamageDetected: (damage: {
    type: string;
    severity: "MINOR" | "MODERATE" | "MAJOR" | "CRITICAL";
    description: string;
    location?: string;
    recommendation?: string;
  }) => void;
  formFields?: Array<{
    id: string;
    name: string;
    type: string;
    label: string;
  }>;
  onFieldFill?: (fieldId: string, value: any, confidence: number) => void;
}

export default function DamageReportVisionIntegration({
  onDamageDetected,
  formFields = [],
  onFieldFill,
}: DamageReportVisionIntegrationProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalysisComplete = async (result: any) => {
    setAnalysis(result);

    // Extract damage information
    if (
      result.integration?.wms?.inventoryImpact?.damageDetected ||
      result.vision?.analysis?.qualityIssues?.some((q: any) =>
        q.type.toLowerCase().includes("damage"),
      )
    ) {
      // Use logistics vision service for detailed damage analysis
      const damageIssue = result.vision?.analysis?.qualityIssues?.find(
        (q: any) =>
          q.type.toLowerCase().includes("damage") ||
          q.type.toLowerCase().includes("crush") ||
          q.type.toLowerCase().includes("tear") ||
          q.type.toLowerCase().includes("puncture"),
      );

      if (damageIssue) {
        const damageType = damageIssue.type.toUpperCase().replace(" ", "_");
        const severity =
          damageIssue.severity === "critical"
            ? "CRITICAL"
            : damageIssue.severity === "major"
              ? "MAJOR"
              : damageIssue.severity === "minor"
                ? "MINOR"
                : "MODERATE";

        onDamageDetected({
          type: damageType,
          severity: severity as any,
          description: damageIssue.issue,
          location: damageIssue.location
            ? `${damageIssue.location.x}, ${damageIssue.location.y}`
            : undefined,
          recommendation: result.vision?.analysis?.recommendations?.[0],
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <i className="ri-eye-line text-2xl text-blue-600"></i>
            <div>
              <h4 className="font-semibold text-blue-900">
                AI Vision Analysis
              </h4>
              <p className="text-sm text-blue-700">
                Automatically detect and analyze damage
              </p>
            </div>
          </div>
          <VisionAnalysisButton
            onAnalysisComplete={handleAnalysisComplete}
            module="wms"
            context="Damage report - analyze package condition and damage"
            buttonText="Analyze Damage"
            buttonIcon="ri-search-eye-line"
            config={{
              enableAnomalyDetection: true,
              enableSceneUnderstanding: true,
            }}
          />
        </div>

        {analyzing && (
          <div className="flex items-center gap-2 text-blue-700">
            <i className="ri-loader-4-line animate-spin"></i>
            <span className="text-sm">Analyzing damage...</span>
          </div>
        )}

        {analysis && (
          <div className="mt-4 space-y-3">
            {/* Damage Summary */}
            {analysis.integration?.wms?.inventoryImpact?.damageDetected && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-alert-line text-red-600"></i>
                  <span className="font-semibold text-red-900">
                    Damage Detected
                  </span>
                </div>
                <p className="text-sm text-red-700">
                  AI Vision has detected damage in the image. Review the details
                  below.
                </p>
              </div>
            )}

            {/* Quality Issues */}
            {analysis.vision?.analysis?.qualityIssues?.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="font-semibold text-yellow-900 mb-2">
                  Quality Issues Detected:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                  {analysis.vision.analysis.qualityIssues
                    .slice(0, 5)
                    .map((issue: any, idx: number) => (
                      <li key={idx}>
                        {issue.issue} ({issue.severity})
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {/* Anomalies */}
            {analysis.anomalyDetection?.anomalies?.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <p className="font-semibold text-orange-900 mb-2">
                  Anomalies Detected:
                </p>
                <ul className="list-disc list-inside text-sm text-orange-800 space-y-1">
                  {analysis.anomalyDetection.anomalies
                    .slice(0, 3)
                    .map((anomaly: any, idx: number) => (
                      <li key={idx}>
                        {anomaly.description} ({anomaly.severity})
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {analysis.vision?.analysis?.recommendations?.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="font-semibold text-blue-900 mb-2">
                  AI Recommendations:
                </p>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                  {analysis.vision.analysis.recommendations
                    .slice(0, 3)
                    .map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
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

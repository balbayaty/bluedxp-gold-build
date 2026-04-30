/**
 * Incident Report Vision Integration Component
 * Integrates vision analysis into incident reports
 */

"use client";

import { useState } from "react";
import VisionAnalysisButton from "./VisionAnalysisButton";
import VisionAutoFill from "./VisionAutoFill";

interface IncidentReportVisionIntegrationProps {
  onIncidentDetected: (incident: {
    type: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    description: string;
    safetyIssues?: string[];
  }) => void;
  formFields?: Array<{
    id: string;
    name: string;
    type: string;
    label: string;
  }>;
  onFieldFill?: (fieldId: string, value: any, confidence: number) => void;
}

export default function IncidentReportVisionIntegration({
  onIncidentDetected,
  formFields = [],
  onFieldFill,
}: IncidentReportVisionIntegrationProps) {
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalysisComplete = (result: any) => {
    setAnalysis(result);

    // Extract incident information
    const safetyIssues = result.vision?.analysis?.safetyIssues || [];
    const criticalSafety = safetyIssues.filter(
      (s: any) => s.severity === "critical",
    );
    const anomalies = result.anomalyDetection?.anomalies || [];
    const criticalAnomalies = anomalies.filter(
      (a: any) => a.severity === "critical",
    );

    if (criticalSafety.length > 0 || criticalAnomalies.length > 0) {
      const severity =
        criticalSafety.length > 0 || criticalAnomalies.length > 0
          ? "CRITICAL"
          : safetyIssues.length > 0
            ? "HIGH"
            : anomalies.length > 0
              ? "MEDIUM"
              : "LOW";

      const description =
        criticalSafety.length > 0
          ? criticalSafety[0].issue
          : criticalAnomalies.length > 0
            ? criticalAnomalies[0].description
            : safetyIssues[0]?.issue || "Safety issue detected";

      onIncidentDetected({
        type: criticalSafety.length > 0 ? "SAFETY" : "INCIDENT",
        severity: severity as any,
        description,
        safetyIssues: safetyIssues.map((s: any) => s.issue),
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <i className="ri-shield-cross-line text-2xl text-red-600"></i>
            <div>
              <h4 className="font-semibold text-red-900">AI Safety Analysis</h4>
              <p className="text-sm text-red-700">
                Detect safety violations and incidents
              </p>
            </div>
          </div>
          <VisionAnalysisButton
            onAnalysisComplete={handleAnalysisComplete}
            module="qhse"
            context="Incident report - analyze safety violations and hazards"
            buttonText="Analyze Safety"
            buttonIcon="ri-shield-search-line"
            config={{
              enableAnomalyDetection: true,
              enableSceneUnderstanding: true,
            }}
          />
        </div>

        {analysis && (
          <div className="mt-4 space-y-3">
            {/* Safety Issues */}
            {analysis.vision?.analysis?.safetyIssues?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-alert-line text-red-600"></i>
                  <span className="font-semibold text-red-900">
                    Safety Issues Detected (
                    {analysis.vision.analysis.safetyIssues.length})
                  </span>
                </div>
                <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                  {analysis.vision.analysis.safetyIssues.map(
                    (issue: any, idx: number) => (
                      <li key={idx}>
                        <span className="font-medium">
                          {issue.severity.toUpperCase()}:
                        </span>{" "}
                        {issue.issue}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

            {/* Critical Anomalies */}
            {analysis.anomalyDetection?.anomalies?.filter(
              (a: any) => a.severity === "critical",
            ).length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-error-warning-line text-orange-600"></i>
                  <span className="font-semibold text-orange-900">
                    Critical Anomalies
                  </span>
                </div>
                <p className="text-sm text-orange-800">
                  {
                    analysis.anomalyDetection.anomalies.filter(
                      (a: any) => a.severity === "critical",
                    ).length
                  }{" "}
                  critical anomaly(ies) detected
                </p>
              </div>
            )}

            {/* Compliance Issues */}
            {analysis.vision?.analysis?.complianceIssues?.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="font-semibold text-yellow-900 mb-2">
                  Compliance Issues:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                  {analysis.vision.analysis.complianceIssues.map(
                    (issue: any, idx: number) => (
                      <li key={idx}>
                        {issue.violation} ({issue.standard})
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {analysis.vision?.analysis?.recommendations?.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="font-semibold text-blue-900 mb-2">
                  Recommended Actions:
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

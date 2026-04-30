/**
 * Vision Auto-Fill Component
 * Automatically fills form fields based on vision analysis
 */

"use client";

import { useEffect, useState } from "react";

interface VisionAutoFillProps {
  analysisResult: any;
  formFields: Array<{
    id: string;
    name: string;
    type: string;
    label: string;
  }>;
  onFieldFill: (fieldId: string, value: any, confidence: number) => void;
  autoFillThreshold?: number;
  showSuggestions?: boolean;
}

export default function VisionAutoFill({
  analysisResult,
  formFields,
  onFieldFill,
  autoFillThreshold = 75,
  showSuggestions = true,
}: VisionAutoFillProps) {
  const [suggestions, setSuggestions] = useState<
    Array<{
      fieldId: string;
      value: any;
      confidence: number;
      source: string;
    }>
  >([]);

  useEffect(() => {
    if (!analysisResult) return;

    const newSuggestions: typeof suggestions = [];

    // Extract suggestions from analysis
    const vision = analysisResult.vision;
    const anomalies = analysisResult.anomalyDetection;
    const integration = analysisResult.integration;

    // Map analysis to form fields
    formFields.forEach((field) => {
      let value: any = null;
      let confidence = 0;
      let source = "";

      // Damage type detection
      if (
        field.name.toLowerCase().includes("damage") ||
        field.name.toLowerCase().includes("type")
      ) {
        if (vision?.analysis?.qualityIssues?.length > 0) {
          const issue = vision.analysis.qualityIssues[0];
          value = issue.type.toUpperCase();
          confidence = issue.confidence;
          source = "Vision Analysis";
        } else if (integration?.wms?.inventoryImpact?.damageDetected) {
          value = "DAMAGED";
          confidence = 80;
          source = "WMS Integration";
        }
      }

      // Severity detection
      if (field.name.toLowerCase().includes("severity")) {
        if (anomalies?.summary?.riskScore) {
          const riskScore = anomalies.summary.riskScore;
          if (riskScore >= 80) value = "CRITICAL";
          else if (riskScore >= 60) value = "MAJOR";
          else if (riskScore >= 40) value = "MODERATE";
          else value = "MINOR";
          confidence = Math.min(95, riskScore);
          source = "Anomaly Detection";
        } else if (vision?.analysis?.safetyIssues?.length > 0) {
          const severity = vision.analysis.safetyIssues[0].severity;
          value =
            severity === "critical"
              ? "CRITICAL"
              : severity === "major"
                ? "MAJOR"
                : severity === "medium"
                  ? "MODERATE"
                  : "MINOR";
          confidence = 75;
          source = "Safety Analysis";
        }
      }

      // Description detection
      if (
        field.name.toLowerCase().includes("description") ||
        field.name.toLowerCase().includes("details")
      ) {
        const descriptions: string[] = [];
        if (vision?.analysis?.description)
          descriptions.push(vision.analysis.description);
        if (vision?.analysis?.safetyIssues?.length > 0) {
          descriptions.push(
            ...vision.analysis.safetyIssues.map((s: any) => s.issue),
          );
        }
        if (vision?.analysis?.qualityIssues?.length > 0) {
          descriptions.push(
            ...vision.analysis.qualityIssues.map((q: any) => q.issue),
          );
        }
        if (anomalies?.anomalies?.length > 0) {
          descriptions.push(
            ...anomalies.anomalies.map((a: any) => a.description),
          );
        }
        if (descriptions.length > 0) {
          value = descriptions.join(". ");
          confidence = 70;
          source = "Vision Analysis";
        }
      }

      // Root cause detection
      if (
        field.name.toLowerCase().includes("root") ||
        field.name.toLowerCase().includes("cause")
      ) {
        if (vision?.analysis?.rootCauseAnalysis) {
          value = vision.analysis.rootCauseAnalysis.primaryCause;
          confidence = vision.analysis.rootCauseAnalysis.confidence || 70;
          source = "Root Cause Analysis";
        }
      }

      // Priority detection
      if (field.name.toLowerCase().includes("priority")) {
        if (anomalies?.summary?.riskScore) {
          const riskScore = anomalies.summary.riskScore;
          if (riskScore >= 80) value = "HIGH";
          else if (riskScore >= 60) value = "MEDIUM";
          else value = "LOW";
          confidence = Math.min(90, riskScore);
          source = "Risk Assessment";
        }
      }

      // Status detection
      if (field.name.toLowerCase().includes("status")) {
        if (integration?.wms?.inventoryImpact?.damageDetected) {
          value = "PENDING";
          confidence = 80;
          source = "WMS Integration";
        }
      }

      if (value !== null && confidence >= 50) {
        newSuggestions.push({
          fieldId: field.id,
          value,
          confidence,
          source,
        });

        // Auto-fill if confidence is high enough
        if (confidence >= autoFillThreshold) {
          onFieldFill(field.id, value, confidence);
        }
      }
    });

    setSuggestions(newSuggestions);
  }, [analysisResult, formFields, autoFillThreshold, onFieldFill]);

  if (!showSuggestions || suggestions.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <i className="ri-magic-line text-blue-600"></i>
        <h4 className="font-semibold text-blue-900">AI Vision Suggestions</h4>
      </div>
      <div className="space-y-2">
        {suggestions
          .filter((s) => s.confidence < autoFillThreshold)
          .map((suggestion) => {
            const field = formFields.find((f) => f.id === suggestion.fieldId);
            return (
              <div
                key={suggestion.fieldId}
                className="flex items-center justify-between p-2 bg-white rounded"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {field?.label || field?.name}
                  </p>
                  <p className="text-xs text-gray-600">{suggestion.value}</p>
                  <p className="text-xs text-gray-500">
                    Confidence: {suggestion.confidence}% • {suggestion.source}
                  </p>
                </div>
                <button
                  onClick={() =>
                    onFieldFill(
                      suggestion.fieldId,
                      suggestion.value,
                      suggestion.confidence,
                    )
                  }
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}

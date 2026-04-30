/**
 * Smart Detection Form Component
 * Auto-detects and populates form fields intelligently
 * Originally from chemcollab/chemcheck - NCR and related features
 * Much more comprehensive than source apps
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  DetectionContext,
  SmartDetectionResult,
  DetectedField,
} from "@/lib/services/forms/smartDetectionService";
import { smartDetectionService } from "@/lib/services/forms/smartDetectionService";
import IntelligentFormField from "./IntelligentFormField";

interface FormField {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "select" | "textarea" | "email" | "url";
  label: string;
  value: any;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
}

interface SmartDetectionFormProps {
  formId: string;
  fields: FormField[];
  context: DetectionContext;
  onSubmit: (data: Record<string, any>) => void;
  onCancel?: () => void;
  title?: string;
  isDark?: boolean;
}

export default function SmartDetectionForm({
  formId,
  fields: initialFields,
  context,
  onSubmit,
  onCancel,
  title = "Smart Detection Form",
  isDark = false,
}: SmartDetectionFormProps) {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [detectionResult, setDetectionResult] =
    useState<SmartDetectionResult | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [showDetections, setShowDetections] = useState(true);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    // Auto-detect on mount
    performDetection();
  }, []);

  const performDetection = async () => {
    setDetecting(true);
    try {
      const result = await smartDetectionService.detectFormFields(
        fields.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          label: f.label,
        })),
        context,
      );

      setDetectionResult(result);

      // Auto-fill high confidence fields
      const highConfidenceDetections = result.detectedFields.filter(
        (d) => d.confidence >= 70,
      );
      const updatedFields = fields.map((field) => {
        const detection = highConfidenceDetections.find(
          (d) => d.fieldId === field.id,
        );
        if (detection) {
          setAutoFilledFields((prev) => new Set(prev).add(field.id));
          return { ...field, value: detection.detectedValue };
        }
        return field;
      });

      setFields(updatedFields);
    } catch (error) {
      console.error("Error performing detection:", error);
    } finally {
      setDetecting(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFields(fields.map((f) => (f.id === fieldId ? { ...f, value } : f)));
  };

  const handleApplyDetection = (fieldId: string) => {
    const detection = detectionResult?.detectedFields.find(
      (d) => d.fieldId === fieldId,
    );
    if (detection) {
      handleFieldChange(fieldId, detection.detectedValue);
      setAutoFilledFields((prev) => new Set(prev).add(fieldId));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData: Record<string, any> = {};
    fields.forEach((field) => {
      formData[field.name] = field.value;
    });
    onSubmit(formData);
  };

  const baseClasses = isDark
    ? "bg-gray-900 text-white border-gray-700"
    : "bg-white text-gray-900 border-gray-200";

  return (
    <div className={`rounded-lg shadow-lg border ${baseClasses}`}>
      {/* Header */}
      <div
        className={`px-6 py-4 border-b ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}
      >
        <div className="flex justify-between items-center">
          <div>
            <h2
              className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {title}
            </h2>
            {detectionResult && (
              <p
                className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {detectionResult.autoFilledCount} fields auto-filled •{" "}
                {Math.round(detectionResult.confidence)}% confidence
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={performDetection}
              disabled={detecting}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isDark
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              } disabled:opacity-50`}
            >
              {detecting ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Detecting...
                </>
              ) : (
                <>
                  <i className="ri-radar-line mr-2"></i>
                  Re-detect
                </>
              )}
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isDark
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detection Results Banner */}
      {detectionResult && showDetections && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`px-6 py-4 border-b ${
              isDark
                ? "bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-700"
                : "bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3
                  className={`font-semibold mb-2 flex items-center gap-2 ${
                    isDark ? "text-purple-300" : "text-purple-800"
                  }`}
                >
                  <i className="ri-magic-line"></i>
                  Smart Detection Results
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                      Detected
                    </p>
                    <p
                      className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {detectionResult.detectedFields.length}
                    </p>
                  </div>
                  <div>
                    <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                      Auto-filled
                    </p>
                    <p className={`font-bold text-lg text-green-600`}>
                      {detectionResult.autoFilledCount}
                    </p>
                  </div>
                  <div>
                    <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                      Suggestions
                    </p>
                    <p
                      className={`font-bold text-lg ${isDark ? "text-blue-400" : "text-blue-600"}`}
                    >
                      {detectionResult.suggestions.length}
                    </p>
                  </div>
                  <div>
                    <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                      Confidence
                    </p>
                    <p
                      className={`font-bold text-lg ${isDark ? "text-purple-400" : "text-purple-600"}`}
                    >
                      {Math.round(detectionResult.confidence)}%
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDetections(false)}
                className={`ml-4 p-2 rounded ${
                  isDark
                    ? "hover:bg-gray-700 text-gray-400"
                    : "hover:bg-gray-200 text-gray-600"
                }`}
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {fields.map((field) => {
          const detection = detectionResult?.detectedFields.find(
            (d) => d.fieldId === field.id,
          );
          const suggestion = detectionResult?.suggestions.find(
            (s) => s.fieldId === field.id,
          );
          const warning = detectionResult?.warnings.find(
            (w) => w.fieldId === field.id,
          );
          const isAutoFilled = autoFilledFields.has(field.id);

          return (
            <div key={field.id} className="relative">
              {/* Auto-filled indicator */}
              {isAutoFilled && (
                <div
                  className={`absolute -top-2 right-0 px-2 py-1 rounded text-xs font-medium ${
                    isDark
                      ? "bg-green-900/30 text-green-400 border border-green-700"
                      : "bg-green-100 text-green-800 border border-green-300"
                  }`}
                >
                  <i className="ri-check-line mr-1"></i>
                  Auto-filled
                </div>
              )}

              <IntelligentFormField
                field={field}
                formId={formId}
                suggestion={
                  detection
                    ? {
                        fieldId: field.id,
                        suggestedValue: detection.detectedValue,
                        confidence: detection.confidence,
                        reasoning: detection.method,
                        source: detection.source,
                      }
                    : undefined
                }
                recommendation={
                  suggestion
                    ? {
                        type:
                          detection && detection.confidence >= 70
                            ? "AUTO_FILL"
                            : "FIELD_SUGGESTION",
                        fieldId: field.id,
                        message: suggestion.suggestion,
                        priority:
                          detection && detection.confidence >= 70
                            ? "HIGH"
                            : "MEDIUM",
                        confidence: suggestion.confidence,
                        action:
                          detection && detection.confidence >= 70
                            ? {
                                type: "FILL_FIELD",
                                data: detection.detectedValue,
                              }
                            : undefined,
                      }
                    : undefined
                }
                onValueChange={handleFieldChange}
                onAutoFill={handleApplyDetection}
                isDark={isDark}
              />

              {/* Detection details */}
              {detection && !isAutoFilled && (
                <div
                  className={`mt-2 p-3 rounded-lg border ${
                    isDark
                      ? "bg-blue-900/20 border-blue-700 text-blue-300"
                      : "bg-blue-50 border-blue-200 text-blue-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">
                        Detected: {String(detection.detectedValue)}
                      </p>
                      <p className="text-xs opacity-75">
                        {detection.method} • {detection.confidence}% confidence
                      </p>
                    </div>
                    <button
                      onClick={() => handleApplyDetection(field.id)}
                      className={`ml-4 px-3 py-1 rounded text-xs font-medium ${
                        isDark
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}

              {/* Warning */}
              {warning && (
                <div
                  className={`mt-2 p-2 rounded text-xs ${
                    isDark
                      ? `bg-${warning.severity === "HIGH" ? "red" : warning.severity === "MEDIUM" ? "yellow" : "gray"}-900/20 border-${warning.severity === "HIGH" ? "red" : warning.severity === "MEDIUM" ? "yellow" : "gray"}-700 text-${warning.severity === "HIGH" ? "red" : warning.severity === "MEDIUM" ? "yellow" : "gray"}-300`
                      : `bg-${warning.severity === "HIGH" ? "red" : warning.severity === "MEDIUM" ? "yellow" : "gray"}-50 border-${warning.severity === "HIGH" ? "red" : warning.severity === "MEDIUM" ? "yellow" : "gray"}-200 text-${warning.severity === "HIGH" ? "red" : warning.severity === "MEDIUM" ? "yellow" : "gray"}-800`
                  }`}
                >
                  <i className="ri-alert-line mr-1"></i>
                  {warning.warning}
                </div>
              )}
            </div>
          );
        })}

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`px-6 py-3 rounded-lg font-medium ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className={`px-6 py-3 rounded-lg font-medium ${
              isDark
                ? "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            }`}
          >
            <i className="ri-check-line mr-2"></i>
            Submit Form
          </button>
        </div>
      </form>
    </div>
  );
}

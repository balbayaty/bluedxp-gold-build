/**
 * Healthcare Vision Page
 * Equipment verification, sterilization compliance, and patient safety
 */

"use client";

import { useState } from "react";
import PageTemplate from "@/components/PageTemplate";

export default function HealthcareVisionPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<
    "equipment_verification" | "sterilization_check" | "patient_safety"
  >("equipment_verification");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    } else {
      setError("Please select a valid image file");
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile) {
      setError("Please select an image file first");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("image", imageFile);
      formData.set("mode", "general");
      formData.set(
        "context",
        `Healthcare vision analysis (${mode}). Verify equipment, sterilization compliance, and patient safety indicators.`,
      );
      formData.set("provider", "auto");
      formData.set("enableRootCause", "true");

      const res = await fetch("/api/ai/vision", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Analysis failed");
      }
      setAnalysis(data.result);
    } catch (err: any) {
      setError(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <PageTemplate
      icon="🏥"
      title="Healthcare Vision"
      description="Equipment verification, sterilization compliance, and patient safety monitoring"
    >
      <div className="space-y-6">
        {/* Mode Selection */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Analysis Mode</h3>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="equipment_verification">
              Equipment Verification
            </option>
            <option value="sterilization_check">Sterilization Check</option>
            <option value="patient_safety">Patient Safety</option>
          </select>
        </div>

        {/* File Upload */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Upload Image</h3>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {previewUrl && (
            <div className="mt-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full h-auto rounded"
              />
            </div>
          )}
        </div>

        {/* Analyze Button */}
        <div className="flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={!imageFile || analyzing}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {analyzing ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <h3 className="text-lg font-semibold">Analysis Results</h3>

            {/* Overall Compliance */}
            {analysis.overallCompliance && (
              <div>
                <h4 className="font-semibold mb-2">Overall Compliance</h4>
                <p className="text-sm">
                  <span className="font-medium">Status:</span>{" "}
                  {analysis.overallCompliance.compliant
                    ? "✅ Compliant"
                    : "❌ Non-Compliant"}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Score:</span>{" "}
                  {analysis.overallCompliance.score}/100
                </p>
                <p className="text-sm">
                  <span className="font-medium">Critical Issues:</span>{" "}
                  {analysis.overallCompliance.criticalIssues}
                </p>
              </div>
            )}

            {/* Equipment Verification */}
            {analysis.equipmentVerification && (
              <div>
                <h4 className="font-semibold mb-2">Equipment Verification</h4>
                <p className="text-sm">
                  <span className="font-medium">Status:</span>{" "}
                  {analysis.equipmentVerification.verified
                    ? "✅ Verified"
                    : "❌ Failed"}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Condition:</span>{" "}
                  {analysis.equipmentVerification.condition}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Sterilization:</span>{" "}
                  {analysis.equipmentVerification.sterilizationStatus}
                </p>
              </div>
            )}

            {/* Sterilization Compliance */}
            {analysis.sterilizationCompliance && (
              <div>
                <h4 className="font-semibold mb-2">Sterilization Compliance</h4>
                <p className="text-sm">
                  <span className="font-medium">Status:</span>{" "}
                  {analysis.sterilizationCompliance.compliant
                    ? "✅ Compliant"
                    : "❌ Non-Compliant"}
                </p>
              </div>
            )}

            {/* Patient Safety */}
            {analysis.patientSafety && (
              <div>
                <h4 className="font-semibold mb-2">Patient Safety</h4>
                <p className="text-sm">
                  <span className="font-medium">Risk Level:</span>{" "}
                  {analysis.patientSafety.riskLevel}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Compliance Score:</span>{" "}
                  {analysis.patientSafety.complianceScore}/100
                </p>
              </div>
            )}

            {/* Urgent Actions */}
            {analysis.urgentActions && analysis.urgentActions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-red-600">
                  ⚠️ Urgent Actions
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.urgentActions.map((action: string, idx: number) => (
                    <li key={idx} className="text-sm text-red-600">
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

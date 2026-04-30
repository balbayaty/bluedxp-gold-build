/**
 * Manufacturing Vision Page
 * Defect detection, quality control, and equipment inspection
 */

"use client";

import { useState } from "react";
import PageTemplate from "@/components/PageTemplate";

export default function ManufacturingVisionPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<
    "defect_detection" | "quality_control" | "equipment_inspection"
  >("defect_detection");

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
        `Manufacturing vision analysis (${mode}). Detect defects, verify process compliance, and assess equipment condition.`,
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
      icon="🏭"
      title="Manufacturing Vision"
      description="Defect detection, quality control, and equipment inspection for manufacturing"
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
            <option value="defect_detection">Defect Detection</option>
            <option value="quality_control">Quality Control</option>
            <option value="equipment_inspection">Equipment Inspection</option>
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

            {/* Quality Control */}
            {analysis.qualityControl && (
              <div>
                <h4 className="font-semibold mb-2">Quality Control</h4>
                <p className="text-sm">
                  <span className="font-medium">Status:</span>{" "}
                  {analysis.qualityControl.passed ? "✅ Passed" : "❌ Failed"}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Score:</span>{" "}
                  {analysis.qualityControl.score}/100
                </p>
                <p className="text-sm">
                  <span className="font-medium">Grade:</span>{" "}
                  {analysis.qualityControl.qualityGrade}
                </p>
              </div>
            )}

            {/* Defects */}
            {analysis.defects && analysis.defects.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">
                  Defects Detected ({analysis.defects.length})
                </h4>
                {analysis.defects.map((defect: any, idx: number) => (
                  <div key={idx} className="border rounded p-4 mb-2">
                    <p className="font-medium">
                      {defect.type} - {defect.severity}
                    </p>
                    <p className="text-sm">{defect.description}</p>
                    <p className="text-sm text-blue-600">
                      {defect.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Equipment Condition */}
            {analysis.equipmentCondition && (
              <div>
                <h4 className="font-semibold mb-2">Equipment Condition</h4>
                <p className="text-sm">
                  <span className="font-medium">Condition:</span>{" "}
                  {analysis.equipmentCondition.condition}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Wear Level:</span>{" "}
                  {analysis.equipmentCondition.wearLevel}%
                </p>
                {analysis.equipmentCondition.maintenanceRequired && (
                  <p className="text-sm text-red-600">
                    ⚠️ Maintenance Required
                  </p>
                )}
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations &&
              analysis.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.recommendations.map(
                      (rec: string, idx: number) => (
                        <li key={idx} className="text-sm">
                          {rec}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

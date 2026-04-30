/**
 * Logistics Vision Page
 * Package damage assessment, loading verification, and inventory counting
 */

"use client";

import { useState } from "react";
import PageTemplate from "@/components/PageTemplate";

export default function LogisticsVisionPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<
    "damage_assessment" | "loading_verification" | "inventory_counting"
  >("damage_assessment");

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
        `Logistics vision analysis (${mode}). Assess package condition, loading verification, and inventory counting.`,
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
      icon="🚚"
      title="Logistics Vision"
      description="Package damage assessment, loading verification, and inventory counting"
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
            <option value="damage_assessment">Damage Assessment</option>
            <option value="loading_verification">Loading Verification</option>
            <option value="inventory_counting">Inventory Counting</option>
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

            {/* Package Condition */}
            {analysis.packageCondition && (
              <div>
                <h4 className="font-semibold mb-2">Package Condition</h4>
                <p className="text-sm">
                  <span className="font-medium">Status:</span>{" "}
                  {analysis.packageCondition}
                </p>
              </div>
            )}

            {/* Package Damage */}
            {analysis.packageDamage && analysis.packageDamage.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">
                  Package Damage ({analysis.packageDamage.length})
                </h4>
                {analysis.packageDamage.map((damage: any, idx: number) => (
                  <div key={idx} className="border rounded p-4 mb-2">
                    <p className="font-medium">
                      {damage.type} - {damage.severity}
                    </p>
                    <p className="text-sm">{damage.description}</p>
                    <p className="text-sm text-blue-600">
                      {damage.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Loading Verification */}
            {analysis.loadingVerification && (
              <div>
                <h4 className="font-semibold mb-2">Loading Verification</h4>
                <p className="text-sm">
                  <span className="font-medium">Status:</span>{" "}
                  {analysis.loadingVerification.verified
                    ? "✅ Verified"
                    : "❌ Failed"}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Compliance Score:</span>{" "}
                  {analysis.loadingVerification.complianceScore}/100
                </p>
              </div>
            )}

            {/* Inventory Count */}
            {analysis.inventoryCount && (
              <div>
                <h4 className="font-semibold mb-2">Inventory Count</h4>
                <p className="text-sm">
                  <span className="font-medium">Items Detected:</span>{" "}
                  {analysis.inventoryCount.itemsDetected}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Confidence:</span>{" "}
                  {analysis.inventoryCount.confidence}%
                </p>
              </div>
            )}

            {/* Shipment Compliance */}
            {analysis.shipmentCompliance && (
              <div>
                <h4 className="font-semibold mb-2">Shipment Compliance</h4>
                <p className="text-sm">
                  <span className="font-medium">Status:</span>{" "}
                  {analysis.shipmentCompliance.compliant
                    ? "✅ Compliant"
                    : "❌ Non-Compliant"}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Score:</span>{" "}
                  {analysis.shipmentCompliance.score}/100
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

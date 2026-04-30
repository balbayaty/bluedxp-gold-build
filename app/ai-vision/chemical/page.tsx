/**
 * Chemical Vision Page
 * Chemical label reading with OCR, GHS symbols, and NFPA diamonds
 */

"use client";

import { useState } from "react";
import PageTemplate from "@/components/PageTemplate";

export default function ChemicalVisionPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
      formData.set("extractLabels", "true");
      formData.set("checkCompatibility", "true");
      formData.set("analyzePPE", "true");
      formData.set("analyzeStorage", "true");

      const res = await fetch("/api/ai/vision/chemical", {
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
      icon="🧪"
      title="Chemical Vision"
      description="Chemical label reading with real OCR, GHS symbol detection, NFPA diamond reading, and compliance checking"
    >
      <div className="space-y-6">
        {/* File Upload */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Upload Chemical Label Image
          </h3>
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
            {analyzing ? "Analyzing..." : "Analyze Chemical Label"}
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

            {/* Chemical Labels */}
            {analysis.labels && analysis.labels.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Detected Chemical Labels</h4>
                {analysis.labels.map((label: any, idx: number) => (
                  <div key={idx} className="border rounded p-4 mb-4">
                    <p className="font-medium">
                      {label.chemicalName || "Unknown Chemical"}
                    </p>
                    {label.casNumber && (
                      <p className="text-sm">CAS: {label.casNumber}</p>
                    )}
                    {label.manufacturer && (
                      <p className="text-sm">
                        Manufacturer: {label.manufacturer}
                      </p>
                    )}
                    {label.ghsSymbols && label.ghsSymbols.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">GHS Symbols:</p>
                        <div className="flex gap-2 mt-1">
                          {label.ghsSymbols.map((symbol: any, sIdx: number) => (
                            <span
                              key={sIdx}
                              className="px-2 py-1 bg-yellow-100 rounded text-xs"
                            >
                              {symbol.type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {label.nfpaDiamond && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">NFPA Diamond:</p>
                        <p className="text-sm">
                          Health: {label.nfpaDiamond.health} | Flammability:{" "}
                          {label.nfpaDiamond.flammability} | Reactivity:{" "}
                          {label.nfpaDiamond.reactivity}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Storage Analysis */}
            {analysis.storageAnalysis && (
              <div>
                <h4 className="font-semibold mb-2">Storage Analysis</h4>
                <p className="text-sm">
                  {analysis.storageAnalysis.recommendations?.join(", ")}
                </p>
              </div>
            )}

            {/* PPE Requirements */}
            {analysis.ppeRequirements &&
              analysis.ppeRequirements.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">PPE Requirements</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.ppeRequirements.map((ppe: any, idx: number) => (
                      <li key={idx} className="text-sm">
                        {ppe.type}: {ppe.requirement}
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

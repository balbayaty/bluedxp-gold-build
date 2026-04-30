/**
 * Scene Understanding Page
 * Spatial relationships, context-aware analysis, and activity recognition
 */

"use client";

import { useState } from "react";
import PageTemplate from "@/components/PageTemplate";

export default function SceneUnderstandingPage() {
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
      formData.set("mode", "general");
      formData.set(
        "context",
        "Scene understanding: identify key objects, spatial relationships, safety hazards, and operational context.",
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
      icon="🌐"
      title="Scene Understanding"
      description="Spatial relationships, context-aware analysis, and activity recognition"
    >
      <div className="space-y-6">
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
            {analyzing ? "Analyzing..." : "Understand Scene"}
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
            <h3 className="text-lg font-semibold">Scene Analysis</h3>

            {/* Scene Context */}
            {analysis.sceneContext && (
              <div>
                <h4 className="font-semibold mb-2">Scene Context</h4>
                <p className="text-sm">
                  <span className="font-medium">Type:</span>{" "}
                  {analysis.sceneContext.sceneType}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Environment:</span>{" "}
                  {analysis.sceneContext.environment}
                </p>
                {analysis.sceneContext.activity && (
                  <p className="text-sm">
                    <span className="font-medium">Activity:</span>{" "}
                    {analysis.sceneContext.activity}
                  </p>
                )}
                {analysis.sceneContext.location && (
                  <p className="text-sm">
                    <span className="font-medium">Location:</span>{" "}
                    {analysis.sceneContext.location}
                  </p>
                )}
              </div>
            )}

            {/* Spatial Relationships */}
            {analysis.spatialRelationships &&
              analysis.spatialRelationships.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Spatial Relationships</h4>
                  {analysis.spatialRelationships
                    .slice(0, 10)
                    .map((rel: any, idx: number) => (
                      <p key={idx} className="text-sm">
                        {rel.object1} is {rel.relationship} {rel.object2}
                      </p>
                    ))}
                </div>
              )}

            {/* Activities */}
            {analysis.activities && analysis.activities.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Detected Activities</h4>
                {analysis.activities.map((activity: any, idx: number) => (
                  <div key={idx} className="border rounded p-3 mb-2">
                    <p className="font-medium">{activity.type}</p>
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      Confidence: {activity.confidence}%
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Context Analysis */}
            {analysis.contextAnalysis && (
              <div>
                <h4 className="font-semibold mb-2">Context Analysis</h4>
                <p className="text-sm">
                  <span className="font-medium">Primary Focus:</span>{" "}
                  {analysis.contextAnalysis.primaryFocus}
                </p>
                {analysis.contextAnalysis.keyElements &&
                  analysis.contextAnalysis.keyElements.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Key Elements:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {analysis.contextAnalysis.keyElements.map(
                          (element: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 rounded text-xs"
                            >
                              {element}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

/**
 * Video Analysis Page
 * Frame-by-frame video analysis with object tracking and anomaly detection
 */

"use client";

import { useState } from "react";
import PageTemplate from "@/components/PageTemplate";
type VideoAnalysisMode =
  | "general"
  | "safety"
  | "quality"
  | "ppe"
  | "storage"
  | "behavior";

export default function VideoAnalysisPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState({
    mode: "general" as VideoAnalysisMode,
    frameInterval: 30,
    enableObjectTracking: true,
    enableMotionDetection: true,
    enableAlerts: true,
    alertThreshold: 70,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    } else {
      setError("Please select a valid video file");
    }
  };

  const handleAnalyze = async () => {
    if (!videoFile) {
      setError("Please select a video file first");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("video", videoFile);
      formData.set("mode", config.mode);
      formData.set("frameInterval", String(config.frameInterval));
      formData.set("enableObjectTracking", String(config.enableObjectTracking));
      formData.set(
        "enableMotionDetection",
        String(config.enableMotionDetection),
      );
      formData.set("enableAlerts", String(config.enableAlerts));
      formData.set("alertThreshold", String(config.alertThreshold));

      const res = await fetch("/api/ai/vision/video", {
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
      icon="🎥"
      title="Video Analysis"
      description="Frame-by-frame video analysis with object tracking, motion detection, and anomaly detection"
    >
      <div className="space-y-6">
        {/* File Upload */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Upload Video</h3>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {previewUrl && (
            <div className="mt-4">
              <video
                src={previewUrl}
                controls
                className="max-w-full h-auto rounded"
              />
            </div>
          )}
        </div>

        {/* Configuration */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Analysis Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Analysis Mode
              </label>
              <select
                value={config.mode}
                onChange={(e) =>
                  setConfig({ ...config, mode: e.target.value as any })
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="general">General</option>
                <option value="safety">Safety</option>
                <option value="quality">Quality</option>
                <option value="compliance">Compliance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Frame Interval
              </label>
              <input
                type="number"
                value={config.frameInterval}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    frameInterval: parseInt(e.target.value),
                  })
                }
                className="w-full border rounded px-3 py-2"
                min="1"
                max="60"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={config.enableObjectTracking}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    enableObjectTracking: e.target.checked,
                  })
                }
                className="mr-2"
              />
              <label>Enable Object Tracking</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={config.enableMotionDetection}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    enableMotionDetection: e.target.checked,
                  })
                }
                className="mr-2"
              />
              <label>Enable Motion Detection</label>
            </div>
          </div>
        </div>

        {/* Analyze Button */}
        <div className="flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={!videoFile || analyzing}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {analyzing ? "Analyzing..." : "Analyze Video"}
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
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
            <div className="space-y-4">
              <div>
                <p className="font-medium">
                  Total Frames Analyzed: {analysis.frameAnalyses.length}
                </p>
                <p className="font-medium">Duration: {analysis.duration}ms</p>
                <p className="font-medium">
                  Issues Detected: {analysis.issues.length}
                </p>
              </div>
              {analysis.issues.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Issues:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.issues.map((issue: any, idx: number) => (
                      <li key={idx}>{issue.description || issue.type}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

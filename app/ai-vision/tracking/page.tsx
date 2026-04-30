/**
 * Object Tracking Page
 * Multi-object tracking and trajectory analysis
 */

"use client";

import { useState } from "react";
import PageTemplate from "@/components/PageTemplate";

export default function ObjectTrackingPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [tracking, setTracking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (
      file &&
      (file.type.startsWith("video/") || file.type.startsWith("image/"))
    ) {
      setVideoFile(file);
      if (file.type.startsWith("video/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(URL.createObjectURL(file));
      }
      setError(null);
    } else {
      setError("Please select a valid video or image file");
    }
  };

  const handleTrack = async () => {
    if (!videoFile) {
      setError("Please select a file first");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      // Use unified vision service with object tracking enabled
      const formData = new FormData();
      formData.append("file", videoFile);
      formData.append("context", "Object tracking analysis");
      formData.append("enableObjectTracking", "true");

      const response = await fetch("/api/ai/vision/unified", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.analysis.objectTracking) {
        setTracking(result.analysis.objectTracking);
      } else {
        setError("Tracking analysis failed");
      }
    } catch (err: any) {
      setError(err.message || "Tracking failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <PageTemplate
      icon="🎯"
      title="Object Tracking"
      description="Multi-object tracking and trajectory analysis"
    >
      <div className="space-y-6">
        {/* File Upload */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Upload Video or Image Sequence
          </h3>
          <input
            type="file"
            accept="video/*,image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {previewUrl && (
            <div className="mt-4">
              {videoFile?.type.startsWith("video/") ? (
                <video
                  src={previewUrl}
                  controls
                  className="max-w-full h-auto rounded"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full h-auto rounded"
                />
              )}
            </div>
          )}
        </div>

        {/* Analyze Button */}
        <div className="flex justify-end">
          <button
            onClick={handleTrack}
            disabled={!videoFile || analyzing}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {analyzing ? "Tracking..." : "Start Tracking"}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Results */}
        {tracking && (
          <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <h3 className="text-lg font-semibold">Tracking Results</h3>

            {/* Tracked Objects */}
            {tracking.trackedObjects && tracking.trackedObjects.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">
                  Tracked Objects ({tracking.trackedObjects.length})
                </h4>
                {tracking.trackedObjects.map((obj: any, idx: number) => (
                  <div key={idx} className="border rounded p-4 mb-2">
                    <p className="font-medium">Object ID: {obj.id}</p>
                    <p className="text-sm">Type: {obj.type || "Unknown"}</p>
                    <p className="text-sm">
                      Frames Tracked: {obj.trajectory?.length || 0}
                    </p>
                    {obj.velocity && (
                      <p className="text-sm">
                        Velocity: {obj.velocity.toFixed(2)} px/frame
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {tracking.summary && (
              <div>
                <h4 className="font-semibold mb-2">Summary</h4>
                <p className="text-sm">
                  <span className="font-medium">Total Objects:</span>{" "}
                  {tracking.summary.totalObjects || 0}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Active Tracks:</span>{" "}
                  {tracking.summary.activeTracks || 0}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Average Track Length:</span>{" "}
                  {tracking.summary.averageTrackLength?.toFixed(2) || 0}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

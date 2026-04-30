/**
 * Anomaly Detection Page
 * Anomaly detection and alert system
 */

"use client";

import { useState } from "react";
import PageTemplate from "@/components/PageTemplate";

export default function AnomalyDetectionPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [anomalies, setAnomalies] = useState<any>(null);
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

  const handleDetect = async () => {
    if (!imageFile) {
      setError("Please select an image file first");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      // Use unified vision service with anomaly detection enabled
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("context", "Anomaly detection analysis");
      formData.append("enableAnomalyDetection", "true");

      const response = await fetch("/api/ai/vision/unified", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.analysis.anomalyDetection) {
        setAnomalies(result.analysis.anomalyDetection);
      } else {
        setError("Anomaly detection failed");
      }
    } catch (err: any) {
      setError(err.message || "Detection failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <PageTemplate
      title="Anomaly Detection"
      description="Anomaly detection and alert system with continuous learning"
      icon="ri-alert-line"
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
            onClick={handleDetect}
            disabled={!imageFile || analyzing}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {analyzing ? "Detecting..." : "Detect Anomalies"}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Results */}
        {anomalies && (
          <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <h3 className="text-lg font-semibold">Anomaly Detection Results</h3>

            {/* Summary */}
            {anomalies.summary && (
              <div>
                <h4 className="font-semibold mb-2">Summary</h4>
                <p className="text-sm">
                  <span className="font-medium">Anomalies Detected:</span>{" "}
                  {anomalies.summary.totalAnomalies || 0}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Risk Score:</span>{" "}
                  {anomalies.summary.riskScore || 0}/100
                </p>
                <p className="text-sm">
                  <span className="font-medium">Severity Distribution:</span>
                </p>
                <div className="ml-4 text-sm">
                  <p>
                    Critical:{" "}
                    {anomalies.summary.severityDistribution?.critical || 0}
                  </p>
                  <p>
                    High: {anomalies.summary.severityDistribution?.high || 0}
                  </p>
                  <p>
                    Medium:{" "}
                    {anomalies.summary.severityDistribution?.medium || 0}
                  </p>
                  <p>Low: {anomalies.summary.severityDistribution?.low || 0}</p>
                </div>
              </div>
            )}

            {/* Anomalies List */}
            {anomalies.anomalies && anomalies.anomalies.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">
                  Detected Anomalies ({anomalies.anomalies.length})
                </h4>
                {anomalies.anomalies.map((anomaly: any, idx: number) => (
                  <div
                    key={idx}
                    className={`border rounded p-4 mb-2 ${
                      anomaly.severity === "critical"
                        ? "border-red-500 bg-red-50"
                        : anomaly.severity === "high"
                          ? "border-orange-500 bg-orange-50"
                          : "border-yellow-500 bg-yellow-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {anomaly.type} - {anomaly.severity}
                        </p>
                        <p className="text-sm mt-1">{anomaly.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Confidence: {anomaly.confidence}%
                        </p>
                      </div>
                    </div>
                    {anomaly.recommendations &&
                      anomaly.recommendations.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">
                            Recommendations:
                          </p>
                          <ul className="list-disc list-inside text-sm">
                            {anomaly.recommendations.map(
                              (rec: string, rIdx: number) => (
                                <li key={rIdx}>{rec}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}

            {/* No Anomalies */}
            {(!anomalies.anomalies || anomalies.anomalies.length === 0) && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                ✅ No anomalies detected. Everything looks normal.
              </div>
            )}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

/**
 * Batch Vision Analysis Page
 * Bulk image/video analysis with progress tracking
 */

"use client";

import { useState, useRef } from "react";
import PageTemplate from "@/components/PageTemplate";
import { motion, AnimatePresence } from "framer-motion";

export default function BatchVisionAnalysisPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Map<number, string>>(new Map());
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<Map<number, any>>(new Map());
  const [progress, setProgress] = useState<Map<number, number>>(new Map());
  const [errors, setErrors] = useState<Map<number, string>>(new Map());
  const [config, setConfig] = useState({
    module: "general" as "wms" | "qhse" | "iso-ims" | "tms" | "general",
    enableObjectTracking: true,
    enableAnomalyDetection: true,
    enableSceneUnderstanding: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);

    // Create previews
    selectedFiles.forEach((file, index) => {
      const fileIndex = files.length + index;
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviews((prev) => new Map(prev).set(fileIndex, url));
      }
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const newMap = new Map(prev);
      const url = newMap.get(index);
      if (url) URL.revokeObjectURL(url);
      newMap.delete(index);
      return newMap;
    });
    setResults((prev) => {
      const newMap = new Map(prev);
      newMap.delete(index);
      return newMap;
    });
    setProgress((prev) => {
      const newMap = new Map(prev);
      newMap.delete(index);
      return newMap;
    });
    setErrors((prev) => {
      const newMap = new Map(prev);
      newMap.delete(index);
      return newMap;
    });
  };

  const analyzeFile = async (file: File, index: number) => {
    try {
      setProgress((prev) => new Map(prev).set(index, 10));

      const formData = new FormData();
      formData.append("media", file);
      formData.append("context", `Batch analysis: ${file.name}`);
      formData.append("module", config.module);
      formData.append(
        "enableObjectTracking",
        String(config.enableObjectTracking),
      );
      formData.append(
        "enableAnomalyDetection",
        String(config.enableAnomalyDetection),
      );
      formData.append(
        "enableSceneUnderstanding",
        String(config.enableSceneUnderstanding),
      );

      setProgress((prev) => new Map(prev).set(index, 30));

      const response = await fetch("/api/ai/vision/unified", {
        method: "POST",
        body: formData,
      });

      setProgress((prev) => new Map(prev).set(index, 70));

      const data = await response.json();
      if (data.success) {
        setResults((prev) => new Map(prev).set(index, data.result));
        setProgress((prev) => new Map(prev).set(index, 100));
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (error: any) {
      setErrors((prev) =>
        new Map(prev).set(index, error.message || "Analysis failed"),
      );
      setProgress((prev) => new Map(prev).set(index, 0));
    }
  };

  const handleAnalyzeAll = async () => {
    if (files.length === 0) return;

    setAnalyzing(true);
    setResults(new Map());
    setErrors(new Map());
    setProgress(new Map());

    // Analyze files sequentially with progress updates
    for (let i = 0; i < files.length; i++) {
      await analyzeFile(files[i], i);
      // Small delay to prevent overwhelming the API
      if (i < files.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    setAnalyzing(false);
  };

  const handleExport = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      totalFiles: files.length,
      results: Array.from(results.entries()).map(([index, result]) => ({
        fileName: files[index].name,
        result,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vision-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const completedCount = Array.from(results.keys()).length;
  const errorCount = Array.from(errors.keys()).length;
  const totalProgress =
    files.length > 0 ? ((completedCount + errorCount) / files.length) * 100 : 0;

  return (
    <PageTemplate
      icon="📦"
      title="Batch Vision Analysis"
      description="Bulk image and video analysis with progress tracking and export"
    >
      <div className="space-y-6">
        {/* Configuration */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Analysis Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Module</label>
              <select
                value={config.module}
                onChange={(e) =>
                  setConfig({ ...config, module: e.target.value as any })
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="general">General</option>
                <option value="wms">WMS</option>
                <option value="qhse">QHSE</option>
                <option value="iso-ims">ISO-IMS</option>
                <option value="tms">TMS</option>
              </select>
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
                checked={config.enableAnomalyDetection}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    enableAnomalyDetection: e.target.checked,
                  })
                }
                className="mr-2"
              />
              <label>Enable Anomaly Detection</label>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Files ({files.length})</h3>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Files
              </button>
              {files.length > 0 && (
                <button
                  onClick={() => {
                    setFiles([]);
                    setPreviews(new Map());
                    setResults(new Map());
                    setProgress(new Map());
                    setErrors(new Map());
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {analyzing && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-gray-600">
                  {Math.round(totalProgress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {completedCount} completed, {errorCount} errors,{" "}
                {files.length - completedCount - errorCount} pending
              </p>
            </div>
          )}

          {/* File List */}
          {files.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <i className="ri-upload-cloud-2-line text-6xl text-gray-400 mb-4"></i>
              <p className="text-gray-600 mb-2">No files selected</p>
              <p className="text-sm text-gray-500">
                Click "Add Files" to select images or videos
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {files.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative border rounded-lg overflow-hidden group"
                >
                  {previews.has(index) ? (
                    <img
                      src={previews.get(index)}
                      alt={file.name}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                      <i className="ri-file-line text-4xl text-gray-400"></i>
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  {progress.has(index) && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1">
                      <div className="w-full bg-gray-600 rounded-full h-1">
                        <div
                          className="bg-blue-500 h-1 rounded-full transition-all"
                          style={{ width: `${progress.get(index) || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {results.has(index) && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                      <i className="ri-check-line text-xs"></i>
                    </div>
                  )}
                  {errors.has(index) && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
                      <i className="ri-error-warning-line text-xs"></i>
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <i className="ri-close-line text-xs"></i>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          {results.size > 0 && (
            <button
              onClick={handleExport}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <i className="ri-download-line mr-2"></i>
              Export Results ({results.size})
            </button>
          )}
          <button
            onClick={handleAnalyzeAll}
            disabled={files.length === 0 || analyzing}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Analyzing...
              </>
            ) : (
              <>
                <i className="ri-eye-line mr-2"></i>
                Analyze All ({files.length})
              </>
            )}
          </button>
        </div>

        {/* Results Summary */}
        {results.size > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Analysis Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Analyzed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {results.size}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {files.length > 0
                    ? Math.round((results.size / files.length) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Anomalies Found</p>
                <p className="text-2xl font-bold text-orange-600">
                  {Array.from(results.values()).reduce(
                    (sum, r) =>
                      sum + (r.anomalyDetection?.summary?.totalAnomalies || 0),
                    0,
                  )}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Avg Quality Score</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Array.from(results.values()).length > 0
                    ? Math.round(
                        Array.from(results.values()).reduce(
                          (sum, r) =>
                            sum + (r.vision?.analysis?.qualityScore || 0),
                          0,
                        ) / Array.from(results.values()).length,
                      )
                    : 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

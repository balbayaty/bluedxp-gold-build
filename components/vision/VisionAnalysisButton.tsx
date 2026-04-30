/**
 * Vision Analysis Button Component
 * Reusable component for adding vision analysis to any form/page
 */

"use client";

import { useState } from "react";

interface VisionAnalysisButtonProps {
  onAnalysisComplete: (result: any) => void;
  module?: "wms" | "qhse" | "iso-ims" | "tms" | "general";
  context?: string;
  buttonText?: string;
  buttonIcon?: string;
  className?: string;
  disabled?: boolean;
  config?: Partial<{
    enableObjectTracking?: boolean;
    enableAnomalyDetection?: boolean;
    enableVideoAnalysis?: boolean;
    enableRAG?: boolean;
    enableLearning?: boolean;
    moduleContext?: string;
  }> &
    Record<string, any>;
}

export default function VisionAnalysisButton({
  onAnalysisComplete,
  module = "general",
  context,
  buttonText = "Analyze with AI Vision",
  buttonIcon = "ri-eye-line",
  className = "",
  disabled = false,
  config,
}: VisionAnalysisButtonProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("media", file);
      if (context) formData.set("context", context);
      formData.set("module", module);
      if (config?.moduleContext)
        formData.set("moduleContext", String(config.moduleContext));

      // Feature flags (default to "true" to preserve current behavior)
      formData.set(
        "enableObjectTracking",
        String(config?.enableObjectTracking ?? true),
      );
      formData.set(
        "enableAnomalyDetection",
        String(config?.enableAnomalyDetection ?? true),
      );
      formData.set(
        "enableVideoAnalysis",
        String(config?.enableVideoAnalysis ?? file.type.startsWith("video/")),
      );
      formData.set("enableRAG", String(config?.enableRAG ?? true));
      formData.set("enableLearning", String(config?.enableLearning ?? true));

      const res = await fetch("/api/ai/vision/unified", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Vision analysis failed");
      }

      onAnalysisComplete(data.result);
    } catch (err: any) {
      setError(err.message || "Analysis failed");
      console.error("Vision analysis error:", err);
    } finally {
      setAnalyzing(false);
      // Reset input
      e.target.value = "";
    }
  };

  return (
    <div className="relative">
      <label
        className={`
          inline-flex items-center gap-2 px-4 py-2 
          bg-gradient-to-r from-blue-600 to-blue-700 
          text-white rounded-lg 
          hover:from-blue-700 hover:to-blue-800 
          transition-all duration-200 
          cursor-pointer
          shadow-lg hover:shadow-xl
          ${analyzing ? "opacity-50 cursor-not-allowed" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${className}
        `}
      >
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          disabled={analyzing || disabled}
          className="hidden"
        />
        {analyzing ? (
          <>
            <i className="ri-loader-4-line animate-spin"></i>
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <i className={buttonIcon}></i>
            <span>{buttonText}</span>
          </>
        )}
      </label>
      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm z-50 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}

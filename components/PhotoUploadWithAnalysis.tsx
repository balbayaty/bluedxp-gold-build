/**
 * Reusable Photo Upload Component with Auto-Analysis
 * Can be used across all WMS modules (Inbound, Outbound, Damage, etc.)
 */

"use client";

import { useState, useRef } from "react";
import {
  usePhotoUpload,
  type PhotoUploadContext,
} from "@/lib/hooks/usePhotoUpload";
import { motion, AnimatePresence } from "framer-motion";

interface PhotoUploadWithAnalysisProps {
  entityId: string;
  entityType: PhotoUploadContext["entityType"];
  tenantId: string;
  userId?: string;
  photoType?: string;
  label?: string;
  icon?: string;
  area?: string;
  equipment?: string[];
  carrier?: string;
  supplier?: string;
  onUploadComplete?: (result: any) => void;
  onError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
}

export default function PhotoUploadWithAnalysis({
  entityId,
  entityType,
  tenantId,
  userId,
  photoType = "general",
  label,
  icon = "ri-camera-line",
  area,
  equipment,
  carrier,
  supplier,
  onUploadComplete,
  onError,
  className = "",
  disabled = false,
}: PhotoUploadWithAnalysisProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const {
    uploadPhotoWithAutoAnalysis,
    uploading,
    analyzing,
    creatingEvidence,
    assessingLiability,
  } = usePhotoUpload();

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onError?.(new Error("Please select an image file"));
      return;
    }

    try {
      const result = await uploadPhotoWithAutoAnalysis(file, {
        entityId,
        entityType,
        tenantId,
        userId,
        area,
        equipment,
        carrier,
        supplier,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.fileUrl) {
        setUploadedPhotoUrl(result.fileUrl);
      }

      if (result.visionAnalysis) {
        setAnalysisResult(result.visionAnalysis);
      }

      onUploadComplete?.(result);
    } catch (error) {
      console.error("Photo upload failed:", error);
      onError?.(error instanceof Error ? error : new Error("Upload failed"));
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isProcessing =
    uploading || analyzing || creatingEvidence || assessingLiability;

  return (
    <div className={className}>
      <label
        className={`
          flex flex-col items-center justify-center p-4 
          border-2 border-dashed rounded-lg 
          transition-all duration-200 cursor-pointer
          ${
            disabled || isProcessing
              ? "border-gray-600 bg-gray-800/20 cursor-not-allowed opacity-50"
              : "border-gray-600 hover:border-blue-500/50 hover:bg-blue-500/5"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled || isProcessing}
        />

        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <div className="text-xs text-gray-400 text-center">
                {uploading && "Uploading..."}
                {analyzing && "Analyzing with AI..."}
                {creatingEvidence && "Creating evidence..."}
                {assessingLiability && "Assessing liability..."}
              </div>
            </motion.div>
          ) : uploadedPhotoUrl ? (
            <motion.div
              key="uploaded"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 w-full"
            >
              <div className="relative w-full h-32 rounded-lg overflow-hidden">
                <img
                  src={uploadedPhotoUrl}
                  alt={label || "Uploaded photo"}
                  className="w-full h-full object-cover"
                />
                {analysisResult && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-green-500/90 backdrop-blur-sm text-white rounded text-xs flex items-center gap-1">
                    <i className="ri-eye-line"></i>
                    AI Analyzed
                  </div>
                )}
              </div>
              <div className="text-xs text-green-400 flex items-center gap-1">
                <i className="ri-checkbox-circle-line"></i>
                {analysisResult ? "Evidence created" : "Uploaded"}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <i className={`${icon} text-2xl text-gray-400`}></i>
              <span className="text-xs text-gray-400 text-center">
                {label || "Upload Photo"}
              </span>
              <span className="text-xs text-gray-500 text-center">
                Auto-analyzed with AI Vision
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </label>

      {/* Analysis Results Display */}
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <i className="ri-information-line text-blue-400"></i>
            <span className="text-xs font-medium text-blue-400">
              AI Analysis Complete
            </span>
          </div>
          {analysisResult.analysis?.description && (
            <p className="text-xs text-gray-300 mb-2">
              {analysisResult.analysis.description.substring(0, 100)}...
            </p>
          )}
          {analysisResult.analysis?.qualityIssues?.length > 0 && (
            <div className="text-xs text-yellow-400">
              <i className="ri-alert-line mr-1"></i>
              {analysisResult.analysis.qualityIssues.length} quality issue(s)
              detected
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

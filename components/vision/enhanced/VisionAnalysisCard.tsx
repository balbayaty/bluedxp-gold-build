/**
 * Vision Analysis Card Component
 * Beautiful card display for vision analysis results
 * From UI/UX mocks - ensures all visualized features are implemented
 */

"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface VisionAnalysisCardProps {
  analysis: {
    id: string;
    analysisId: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    analysis: any;
    complianceScore?: number;
    isCompliant?: boolean;
    totalIssues?: number;
    criticalIssues?: number;
    createdAt: string;
    module?: string;
  };
  onViewDetails?: (analysisId: string) => void;
  onDelete?: (analysisId: string) => void;
  compact?: boolean;
}

export default function VisionAnalysisCard({
  analysis,
  onViewDetails,
  onDelete,
  compact = false,
}: VisionAnalysisCardProps) {
  const [imageError, setImageError] = useState(false);

  const safetyIssues = analysis.analysis?.safetyIssues || [];
  const qualityIssues = analysis.analysis?.qualityIssues || [];
  const complianceIssues = analysis.analysis?.complianceIssues || [];

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getComplianceColor = (score?: number) => {
    if (!score) return "bg-gray-500";
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
    >
      {/* Image Preview */}
      {analysis.thumbnailUrl && !imageError && (
        <div className="relative h-48 bg-gray-100">
          <img
            src={analysis.thumbnailUrl}
            alt="Analysis preview"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          {analysis.complianceScore !== undefined && (
            <div className="absolute top-2 right-2">
              <div
                className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getComplianceColor(
                  analysis.complianceScore,
                )}`}
              >
                {analysis.complianceScore}%
              </div>
            </div>
          )}
          {analysis.isCompliant === false && (
            <div className="absolute top-2 left-2">
              <div className="px-3 py-1 bg-red-500 rounded-full text-white text-sm font-semibold">
                Non-Compliant
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {analysis.module ? analysis.module.toUpperCase() : "Vision"}{" "}
              Analysis
            </h3>
            <p className="text-sm text-gray-500">
              {new Date(analysis.createdAt).toLocaleDateString()} •{" "}
              {new Date(analysis.createdAt).toLocaleTimeString()}
            </p>
          </div>
          {analysis.module && (
            <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
              {analysis.module}
            </div>
          )}
        </div>

        {/* Issues Summary */}
        {!compact && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {safetyIssues.length}
              </div>
              <div className="text-xs text-red-700">Safety</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {qualityIssues.length}
              </div>
              <div className="text-xs text-orange-700">Quality</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {complianceIssues.length}
              </div>
              <div className="text-xs text-yellow-700">Compliance</div>
            </div>
          </div>
        )}

        {/* Critical Issues Badge */}
        {analysis.criticalIssues && analysis.criticalIssues > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <i className="ri-alert-line text-red-600"></i>
              <span className="text-sm font-semibold text-red-900">
                {analysis.criticalIssues} Critical Issue
                {analysis.criticalIssues > 1 ? "s" : ""} Detected
              </span>
            </div>
          </div>
        )}

        {/* Description Preview */}
        {!compact && analysis.analysis?.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {analysis.analysis.description.substring(0, 150)}
            {analysis.analysis.description.length > 150 ? "..." : ""}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(analysis.analysisId)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <i className="ri-eye-line mr-2"></i>
              View Details
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(analysis.analysisId)}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <i className="ri-delete-bin-line"></i>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

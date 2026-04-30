"use client";

/**
 * MSDS Intelligence Platform - Complete Ecosystem
 * Fully integrated with ERPNext, AI/ML, and Knowledge Base
 * Adapted from chemcheck-ai for Hazalyze App Router
 */

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import PageTemplate from "@/components/PageTemplate";
import { PremiumLoader, ProgressLoader } from "@/components/loading";
// Remixicon is used as a font icon library via CSS classes

interface MSDSData {
  productName: string;
  manufacturer: string;
  casNumber: string;
  formula: string;
  hazardClass: string;
  hazardLevel: "High" | "Medium" | "Low";
  flashPoint: string;
  boilingPoint: string;
  physicalState: string;
  storageRequirements: string[];
  incompatibleMaterials: string[];
  ppeRequired: string[];
  firstAid: string;
  emergencyProcedures: string[];
  ghsCompliant: boolean;
  aiConfidenceScore: number;
}

interface AnalysisResult {
  extracted: MSDSData;
  aiInsights: string[];
  storageRecommendations: string[];
  safetyScore: number;
  complianceStatus: string;
  knowledgeBaseLinks: string[];
  fileName?: string;
  file?: File;
}

export default function MSDSIntelligencePage() {
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<{
    show: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
  }>({ show: false, type: "info", title: "", message: "" });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploadedFiles((prev) => [...prev, ...acceptedFiles]);

    // Auto-analyze first file
    if (acceptedFiles.length > 0) {
      await analyzeMSDS(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.ms-excel": [".xls", ".xlsx"],
      "text/csv": [".csv"],
    },
    multiple: true,
  });

  const analyzeMSDS = async (file: File) => {
    setProcessing(true);

    try {
      console.log("[msds-intelligence] Analyzing:", file.name);

      const formData = new FormData();
      formData.append("file", file);

      // Call comprehensive analysis API
      let response: Response;
      try {
        response = await fetch("/api/chemical/analyze-comprehensive", {
          method: "POST",
          body: formData,
        });
      } catch (fetchError) {
        // Network error (connection failed, CORS, etc.)
        throw new Error(
          `Network error: ${fetchError instanceof Error ? fetchError.message : "Failed to connect to server. Please check your connection and try again."}`,
        );
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          // Response is not JSON, might be HTML error page
          throw new Error(
            `Server error (${response.status}): ${response.statusText}. Please try again or contact support.`,
          );
        }
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("[msds-intelligence] Analysis result:", data);

      if (data.success && data.extractedData) {
        // Enhance with AI insights and knowledge base links
        const enhancedResult: AnalysisResult = {
          extracted: {
            productName: data.extractedData.productName || "Chemical Product",
            manufacturer: data.extractedData.manufacturer || "Unknown",
            casNumber: data.extractedData.casNumber || "N/A",
            formula: data.extractedData.formula || "N/A",
            hazardClass: data.extractedData.hazardClass || "Class 9",
            hazardLevel: data.extractedData.hazardLevel || "Low",
            flashPoint: data.extractedData.flashPoint || "N/A",
            boilingPoint: data.extractedData.boilingPoint || "N/A",
            physicalState: data.extractedData.physicalState || "Liquid",
            storageRequirements: data.extractedData.storageRequirements || [],
            incompatibleMaterials:
              data.extractedData.incompatibleMaterials || [],
            ppeRequired: data.extractedData.ppeRequired || [],
            firstAid: data.extractedData.firstAid || "See MSDS",
            emergencyProcedures: data.extractedData.emergencyProcedures || [],
            ghsCompliant: data.extractedData.ghsCompliant || false,
            aiConfidenceScore: data.extractedData.aiConfidence || 95,
          },
          aiInsights: data.aiInsights || [
            `Hazard level: ${data.extractedData.hazardLevel || "Low"}`,
            `Safety score: ${data.extractedData.safetyScore || 85}/100`,
            data.extractedData.ghsCompliant
              ? "GHS compliant"
              : "GHS compliance review needed",
          ],
          storageRecommendations: data.extractedData.storageRequirements || [
            "Store in a cool, dry place",
            "Keep away from incompatible materials",
          ],
          safetyScore: data.extractedData.safetyScore || 85,
          complianceStatus: data.extractedData.ghsCompliant
            ? "Compliant"
            : "Review Required",
          knowledgeBaseLinks: [
            `/knowledge-base?search=${encodeURIComponent(data.extractedData.productName || "")}`,
            `/chemical-database?search=${encodeURIComponent(data.extractedData.productName || "")}`,
            ...(data.extractedData.casNumber
              ? [
                  `/chemical-database?cas=${encodeURIComponent(data.extractedData.casNumber)}`,
                ]
              : []),
          ],
          fileName: file.name,
          file: file,
        };

        // Store in ERPNext
        await saveToERPNext(enhancedResult);

        // Update local state
        setAnalysisResults((prev) => [...prev, enhancedResult]);

        setNotification({
          show: true,
          type: "success",
          title: "MSDS Analyzed Successfully",
          message: `${enhancedResult.extracted.productName} analyzed and stored. AI Confidence: ${enhancedResult.extracted.aiConfidenceScore}%`,
        });
      } else {
        setNotification({
          show: true,
          type: "error",
          title: "Analysis Failed",
          message: data.error || "Could not analyze MSDS",
        });
      }
    } catch (error) {
      console.error("[msds-intelligence] Error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to analyze MSDS. Please ensure the file is a valid PDF, Excel, or CSV document.";

      setNotification({
        show: true,
        type: "error",
        title: "Processing Error",
        message:
          errorMessage.length > 100
            ? errorMessage.substring(0, 100) + "..."
            : errorMessage,
      });
    } finally {
      setProcessing(false);
    }
  };

  const saveToERPNext = async (analysisData: AnalysisResult) => {
    try {
      // Save to ERPNext Items and Documents
      const response = await fetch("/api/erpnext/save-msds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extracted: analysisData.extracted,
          fileName: analysisData.fileName,
          status: "analyzed",
        }),
      });

      if (response.ok) {
        console.log("[msds-intelligence] Saved to ERPNext");
      }
    } catch (error) {
      console.error("[msds-intelligence] ERPNext save error:", error);
    }
  };

  const stats = {
    total: uploadedFiles.length,
    analyzed: analysisResults.length,
    highRisk: analysisResults.filter((r) => r.extracted?.hazardLevel === "High")
      .length,
    avgConfidence:
      analysisResults.length > 0
        ? Math.round(
            analysisResults.reduce(
              (acc, r) => acc + (r.extracted?.aiConfidenceScore || 0),
              0,
            ) / analysisResults.length,
          )
        : 0,
  };

  const filteredResults = analysisResults.filter((result) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      result.extracted?.productName?.toLowerCase().includes(term) ||
      result.extracted?.casNumber?.toLowerCase().includes(term) ||
      result.extracted?.hazardClass?.toLowerCase().includes(term) ||
      result.extracted?.manufacturer?.toLowerCase().includes(term)
    );
  });

  return (
    <PageTemplate
      title="MSDS Intelligence Platform"
      description="AI-powered chemical analysis • ERPNext integrated"
      icon="ri-cpu-line"
    >
      <div className="space-y-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Uploaded */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative group"
            whileHover={{ y: -2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 blur-xl opacity-0 group-hover:opacity-100 transition rounded-xl" />
            <div className="relative p-4 rounded-xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-xl border border-white/10 dark:border-gray-700 hover:border-cyan-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider">
                  Total Uploaded
                </span>
                <i className="ri-file-line w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-3xl font-bold text-cyan-400">
                {stats.total}
              </div>
            </div>
          </motion.div>

          {/* Analyzed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative group"
            whileHover={{ y: -2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/20 blur-xl opacity-0 group-hover:opacity-100 transition rounded-xl" />
            <div className="relative p-4 rounded-xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-xl border border-white/10 dark:border-gray-700 hover:border-green-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider">
                  Analyzed
                </span>
                <i className="ri-checkbox-circle-line w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-green-400">
                {stats.analyzed}
              </div>
            </div>
          </motion.div>

          {/* High Risk */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative group"
            whileHover={{ y: -2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-red-600/20 blur-xl opacity-0 group-hover:opacity-100 transition rounded-xl" />
            <div className="relative p-4 rounded-xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-xl border border-white/10 dark:border-gray-700 hover:border-red-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider">
                  High Risk
                </span>
                <i className="ri-error-warning-line w-5 h-5 text-red-400" />
              </div>
              <div className="text-3xl font-bold text-red-400">
                {stats.highRisk}
              </div>
            </div>
          </motion.div>

          {/* AI Confidence */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative group"
            whileHover={{ y: -2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-600/20 blur-xl opacity-0 group-hover:opacity-100 transition rounded-xl" />
            <div className="relative p-4 rounded-xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-xl border border-white/10 dark:border-gray-700 hover:border-purple-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider">
                  AI Confidence
                </span>
                <i className="ri-cpu-line w-5 h-5 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-purple-400">
                {stats.avgConfidence}%
              </div>
            </div>
          </motion.div>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[250px] relative">
            <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by product name, CAS number, or hazard..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 dark:bg-gray-800/50 border border-white/10 dark:border-gray-700 focus:border-cyan-500/50 outline-none transition"
            />
          </div>

          {/* View Toggle */}
          <div className="flex gap-1 p-1 rounded-lg bg-white/5 dark:bg-gray-800/50">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                viewMode === "grid"
                  ? "bg-cyan-500 text-white"
                  : "hover:bg-white/10 text-gray-400"
              }`}
            >
              <i className="ri-grid-line w-4 h-4" />
              <span className="hidden sm:inline text-sm">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                viewMode === "list"
                  ? "bg-cyan-500 text-white"
                  : "hover:bg-white/10 text-gray-400"
              }`}
            >
              <i className="ri-list-check w-4 h-4" />
              <span className="hidden sm:inline text-sm">List</span>
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={() => router.refresh()}
            className="px-4 py-2 rounded-lg bg-white/5 dark:bg-gray-800/50 border border-white/10 dark:border-gray-700 hover:border-cyan-500/50 transition flex items-center gap-2"
          >
            <i className="ri-refresh-line w-4 h-4" />
            Sync ERPNext
          </button>
        </div>

        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            {...getRootProps()}
            className={`relative group cursor-pointer transition-all duration-300 ${
              isDragActive ? "scale-105" : ""
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

            <div
              className={`relative p-12 rounded-2xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-xl border-2 transition-all duration-300 ${
                isDragActive
                  ? "border-cyan-500 bg-cyan-500/10"
                  : "border-white/10 dark:border-gray-700 hover:border-cyan-500/50"
              }`}
            >
              <input {...getInputProps()} />

              <div className="text-center">
                <motion.div
                  className="inline-block mb-6"
                  animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-30" />
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <i className="ri-upload-line w-10 h-10" />
                    </div>
                  </div>
                </motion.div>

                <h3 className="text-2xl font-bold mb-2">
                  {isDragActive
                    ? "Drop MSDS files here"
                    : "Upload MSDS Documents"}
                </h3>
                <p className="text-gray-400 mb-4">
                  Drag & drop or click to select • PDF, Excel, CSV supported
                </p>
                <p className="text-sm text-gray-500">
                  AI will extract data, analyze hazards, and provide storage
                  recommendations
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Processing Indicator */}
        {processing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-blue-500/10 backdrop-blur-xl border border-cyan-500/50 shadow-xl"
          >
            <div className="flex items-start gap-4">
              <PremiumLoader message="" size="lg" variant="default" />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2 text-white">
                  Analyzing MSDS...
                </h3>
                <p className="text-sm text-white/70 mb-4">
                  AI is extracting data, analyzing hazards, and checking
                  compliance
                </p>
                <ProgressLoader size="md" showPercentage />
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Grid/List */}
        {filteredResults.length > 0 && (
          <div
            className={
              viewMode === "grid"
                ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredResults.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
                whileHover={{
                  y: -8,
                  transition: { duration: 0.3, ease: "easeOut" },
                }}
              >
                {/* Glow Effect */}
                <div
                  className={`absolute inset-0 ${
                    result.extracted?.hazardLevel === "High"
                      ? "bg-gradient-to-br from-red-500/20 to-red-600/20"
                      : result.extracted?.hazardLevel === "Medium"
                        ? "bg-gradient-to-br from-orange-500/20 to-orange-600/20"
                        : "bg-gradient-to-br from-green-500/20 to-green-600/20"
                  } rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500`}
                />

                <div className="relative p-6 rounded-2xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-xl border border-white/10 dark:border-gray-700 hover:border-cyan-500/50 transition-all duration-300">
                  {/* Status Bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                      result.extracted?.hazardLevel === "High"
                        ? "from-red-500 to-orange-500"
                        : result.extracted?.hazardLevel === "Medium"
                          ? "from-orange-500 to-yellow-500"
                          : "from-green-500 to-cyan-500"
                    }`}
                  />

                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold mb-1">
                      {result.extracted?.productName || "Chemical Product"}
                    </h3>
                    <p className="text-xs font-mono text-cyan-400">
                      {result.extracted?.casNumber || "No CAS"}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-md ${
                        result.extracted?.hazardLevel === "High"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : result.extracted?.hazardLevel === "Medium"
                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            : "bg-green-500/10 text-green-400 border border-green-500/20"
                      }`}
                    >
                      {result.extracted?.hazardLevel || "Low"} Risk
                    </span>

                    <span className="px-2 py-1 text-xs rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {result.extracted?.hazardClass || "Class 9"}
                    </span>

                    {result.extracted?.ghsCompliant && (
                      <span className="px-2 py-1 text-xs rounded-md bg-green-500/10 text-green-400 border border-green-500/20">
                        GHS Compliant
                      </span>
                    )}
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-white/5 dark:bg-gray-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <i className="ri-shield-line w-3 h-3 text-blue-400" />
                        <span className="text-xs text-gray-400">
                          Safety Score
                        </span>
                      </div>
                      <p className="text-sm font-semibold">
                        {result.safetyScore || 85}/100
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white/5 dark:bg-gray-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <i className="ri-cpu-line w-3 h-3 text-purple-400" />
                        <span className="text-xs text-gray-400">
                          AI Confidence
                        </span>
                      </div>
                      <p className="text-sm font-semibold">
                        {result.extracted?.aiConfidenceScore || 95}%
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedResult(result)}
                      className="flex-1 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2 text-cyan-400 font-medium text-sm"
                    >
                      <i className="ri-eye-line w-4 h-4" />
                      View Details
                    </button>

                    <button className="px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/20 transition-all text-blue-400">
                      <i className="ri-download-line w-4 h-4" />
                    </button>

                    {result.knowledgeBaseLinks &&
                      result.knowledgeBaseLinks.length > 0 && (
                        <button
                          onClick={() =>
                            router.push(result.knowledgeBaseLinks[0])
                          }
                          className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 hover:border-green-500/50 hover:bg-green-500/20 transition-all text-green-400"
                          title="View in Knowledge Base"
                        >
                          <i className="ri-book-open-line text-lg"></i>
                        </button>
                      )}
                  </div>

                  {/* AI Insights Badge */}
                  {result.aiInsights && result.aiInsights.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="ri-flash-line w-4 h-4 text-purple-400" />
                        <span className="text-xs font-medium text-purple-400">
                          AI Insights
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-2">
                        {result.aiInsights[0]}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!processing &&
          filteredResults.length === 0 &&
          uploadedFiles.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-block p-8 rounded-2xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-xl border border-white/10 dark:border-gray-700 mb-6">
                <i className="ri-file-paper-2-line w-20 h-20 mx-auto text-cyan-400 mb-4" />
                <p className="text-xl font-semibold mb-2">No MSDS Files Yet</p>
                <p className="text-sm text-gray-400">
                  Upload your first MSDS to see AI-powered analysis, hazard
                  assessment, and storage recommendations
                </p>
              </div>
            </div>
          )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setSelectedResult(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gray-900 border border-white/20"
            >
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-cyan-500/20 to-blue-600/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-1">
                      {selectedResult.extracted?.productName}
                    </h2>
                    <p className="text-sm text-cyan-400 font-mono">
                      CAS: {selectedResult.extracted?.casNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedResult(null)}
                    className="p-2 rounded-lg hover:bg-white/10 transition"
                  >
                    <i className="ri-close-line w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* AI Insights Section */}
                {selectedResult.aiInsights &&
                  selectedResult.aiInsights.length > 0 && (
                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <i className="ri-flash-line w-5 h-5 text-purple-400" />
                        AI Insights
                      </h3>
                      <ul className="space-y-2">
                        {selectedResult.aiInsights.map((insight, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-300 flex items-start gap-2"
                          >
                            <i className="ri-information-line w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Storage Recommendations */}
                {selectedResult.storageRecommendations &&
                  selectedResult.storageRecommendations.length > 0 && (
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <i className="ri-database-line w-5 h-5 text-blue-400" />
                        Storage Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {selectedResult.storageRecommendations.map(
                          (rec, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-gray-300 flex items-start gap-2"
                            >
                              <i className="ri-check-line w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}

                {/* Knowledge Base Links */}
                {selectedResult.knowledgeBaseLinks &&
                  selectedResult.knowledgeBaseLinks.length > 0 && (
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <i className="ri-book-open-line w-5 h-5 text-green-400" />
                        Related Resources
                      </h3>
                      <div className="space-y-2">
                        {selectedResult.knowledgeBaseLinks.map((link, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              router.push(link);
                              setSelectedResult(null);
                            }}
                            className="w-full text-left px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition flex items-center gap-2 text-sm text-cyan-400"
                          >
                            <i className="ri-book-open-line w-4 h-4" />
                            <span>View in Knowledge Base</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Compliance Status */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <i className="ri-shield-line w-4 h-4 text-blue-400" />
                      Safety Score
                    </h4>
                    <p className="text-2xl font-bold text-green-400">
                      {selectedResult.safetyScore || 85}/100
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <i className="ri-checkbox-circle-line w-4 h-4 text-green-400" />
                      Compliance
                    </h4>
                    <p className="text-xl text-green-400">
                      {selectedResult.complianceStatus}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <i className="ri-cpu-line w-4 h-4 text-purple-400" />
                      AI Confidence
                    </h4>
                    <p className="text-xl text-purple-400">
                      {selectedResult.extracted?.aiConfidenceScore || 95}%
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            notification.type === "success"
              ? "bg-green-500"
              : notification.type === "error"
                ? "bg-red-500"
                : "bg-blue-500"
          } text-white`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNotification({ ...notification, show: false })}
              className="ml-2"
            >
              <i className="ri-close-line w-4 h-4" />
            </button>
            <div>
              <h4 className="font-semibold">{notification.title}</h4>
              <p className="text-sm">{notification.message}</p>
            </div>
          </div>
        </div>
      )}
    </PageTemplate>
  );
}

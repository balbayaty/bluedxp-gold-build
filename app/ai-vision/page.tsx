/**
 * Comprehensive AI Vision Module
 * Real-time image analysis, root cause detection, and compliance monitoring
 * Enhanced with multiple analysis modes from chemcheck-ai
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

type AnalysisMode = "general" | "chemical" | "ppe" | "storage";
type AnalysisType = "image" | "video" | "stream";

type VisionAnalysisResult = any;

type ComplianceIssue = {
  standard: string;
  violation: string;
  confidence: number;
  recommendation: string;
};

interface EnhancedAnalysisResult extends VisionAnalysisResult {
  isCompliant?: boolean;
  complianceScore?: number;
  hazards?: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    description: string;
    recommendations?: string;
  }>;
  compatibility?: {
    isPotentialIssue: boolean;
    description: string;
    recommendations?: string;
  };
  detectedItems?: Array<{
    type: string;
    name?: string;
    confidence: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  summary?: string;
  analysis?: {
    complianceIssues?: ComplianceIssue[];
    [key: string]: any;
  };
}

export default function AIVisionPage() {
  const router = useRouter();
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [analyses, setAnalyses] = useState<EnhancedAnalysisResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] =
    useState<EnhancedAnalysisResult | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [liveFeed, setLiveFeed] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [showZoomedImage, setShowZoomedImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("general");
  const [config, setConfig] = useState({
    provider: "auto" as "openai" | "anthropic" | "auto",
    enableRootCause: true,
    enableThumbnail: true,
  });
  const [creatingNCR, setCreatingNCR] = useState(false);
  const [ncrCreated, setNcrCreated] = useState<string | null>(null);
  const [continuousMonitoring, setContinuousMonitoring] = useState(false);
  const [monitoringInterval, setMonitoringInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "warning" | "info";
    message: string;
  } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [analysisType, setAnalysisType] = useState<AnalysisType>("image");
  const [videos, setVideos] = useState<File[]>([]);
  const [videoPreviewUrls, setVideoPreviewUrls] = useState<string[]>([]);
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
  const [videoAnalyses, setVideoAnalyses] = useState<any[]>([]);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number>(0);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Best-effort availability check (non-blocking)
    fetch("/api/ai/vision")
      .then((r) => r.json())
      .then((data) => {
        if (!data?.available) {
          logger.warn(
            "AI Vision service not available - configure API keys",
            undefined,
            {
              module: "ai-vision",
              service: "initialization",
            },
          );
        }
      })
      .catch(() => {
        // ignore
      });
  }, []);

  useEffect(() => {
    // Handle camera stream
    if (liveFeed && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((error) => {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error("Camera access error", err, {
            module: "ai-vision",
            service: "camera",
          });
          errorTrackingService.captureException(err, {
            module: "ai-vision",
            service: "camera",
          });
          setLiveFeed(false);
        });
    } else if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [liveFeed]);

  // Clean up URLs on component unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Handle ESC key for modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showZoomedImage) {
          setShowZoomedImage(false);
        }
        if (selectedAnalysis) {
          setSelectedAnalysis(null);
        }
        if (showUploadModal) {
          setShowUploadModal(false);
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showZoomedImage, selectedAnalysis, showUploadModal]);

  // Continuous monitoring effect
  useEffect(() => {
    if (continuousMonitoring && liveFeed && videoRef.current) {
      const analyzeFrame = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0);
          canvas.toBlob(
            async (blob) => {
              if (blob) {
                const file = new File([blob], `monitor-${Date.now()}.jpg`, {
                  type: "image/jpeg",
                });
                await handleFileUpload(file);
              }
            },
            "image/jpeg",
            0.8,
          );
        }
      };
      const interval = setInterval(analyzeFrame, 30000);
      setMonitoringInterval(interval);
      return () => clearInterval(interval);
    } else if (monitoringInterval) {
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
    }
  }, [continuousMonitoring, liveFeed]);

  // Notification auto-hide
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showUploadModal || selectedAnalysis || showZoomedImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showUploadModal, selectedAnalysis, showZoomedImage]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));

      setImages([...images, ...newFiles]);
      setPreviewUrls([...previewUrls, ...newPreviewUrls]);
      setError(null);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Trigger camera input click
  const triggerCameraInput = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  // Remove an image
  const removeImage = (index: number) => {
    const updatedImages = [...images];
    const updatedPreviewUrls = [...previewUrls];

    URL.revokeObjectURL(previewUrls[index]);

    updatedImages.splice(index, 1);
    updatedPreviewUrls.splice(index, 1);

    setImages(updatedImages);
    setPreviewUrls(updatedPreviewUrls);

    if (index === selectedImageIndex) {
      setSelectedImageIndex(Math.max(0, index - 1));
    } else if (index < selectedImageIndex) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }

    setError(null);
  };

  // Clear all images
  const clearAllImages = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setImages([]);
    setPreviewUrls([]);
    setSelectedImageIndex(0);
    setError(null);
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      // Use chemical vision service for chemical mode
      if (analysisMode === "chemical") {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("extractLabels", "true");
        formData.append("checkCompatibility", "true");
        formData.append("analyzePPE", "true");
        formData.append("analyzeStorage", "true");

        const response = await fetch("/api/ai/vision/chemical", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.result) {
            // Convert chemical vision result to enhanced analysis result
            const chemResult = data.result;
            const enhancedResult: EnhancedAnalysisResult = {
              id: chemResult.id,
              timestamp: chemResult.timestamp,
              analysis: {
                description: `Chemical analysis: ${chemResult.labels.length} label(s) detected. Compliance score: ${chemResult.complianceScore}/100.`,
                detectedObjects: chemResult.labels.map((label: any) => ({
                  object: label.chemicalName,
                  confidence: label.readConfidence / 100,
                })),
                safetyIssues: chemResult.complianceIssues.map((issue: any) => ({
                  issue: issue.description,
                  severity:
                    issue.severity === "critical"
                      ? "critical"
                      : issue.severity === "high"
                        ? "high"
                        : "medium",
                  confidence: 0.9,
                })),
                qualityIssues: [],
                complianceIssues: chemResult.complianceIssues.map(
                  (issue: any) => ({
                    standard: issue.standard || "Chemical Safety",
                    violation: issue.description,
                    confidence: 0.9,
                    recommendation:
                      issue.recommendation ||
                      "Review and address compliance issue",
                  }),
                ),
              },
              isCompliant: chemResult.complianceScore >= 70,
              complianceScore: chemResult.complianceScore,
              hazards: chemResult.compatibilityIssues.map((issue: any) => ({
                type: "Chemical Compatibility",
                severity:
                  issue.riskLevel === "incompatible" ||
                  issue.riskLevel === "danger"
                    ? "high"
                    : "medium",
                description: issue.warningMessage || issue.message,
                recommendations:
                  issue.recommendations?.join(", ") ||
                  "Separate incompatible chemicals",
              })),
              compatibility:
                chemResult.compatibilityIssues.length > 0
                  ? {
                      isPotentialIssue: true,
                      description: chemResult.compatibilityIssues
                        .map((i: any) => i.warningMessage || i.message)
                        .join("; "),
                      recommendations: chemResult.compatibilityIssues
                        .flatMap((i: any) => i.recommendations || [])
                        .join("; "),
                    }
                  : undefined,
              detectedItems: chemResult.labels.map((label: any) => ({
                type: "chemical",
                name: label.chemicalName,
                confidence: label.readConfidence / 100,
              })),
              summary: `Chemical Vision Analysis: ${chemResult.labels.length} chemical label(s) detected. ${chemResult.compatibilityIssues.length} compatibility issue(s). ${chemResult.ppeAnalysis.missing.length} missing PPE item(s).`,
              metadata: chemResult.metadata,
            };
            setAnalyses([enhancedResult, ...analyses]);
            setSelectedAnalysis(enhancedResult);
            setShowUploadModal(false);
            setNotification({
              type: "success",
              message: "Chemical analysis completed!",
            });
            return;
          }
        }
      }

      // Standard vision analysis for other modes
      const formData = new FormData();
      formData.append("image", file);
      formData.append("mode", analysisMode);
      formData.append("context", getContextForMode(analysisMode));
      formData.append("provider", config.provider);
      formData.append("enableRootCause", config.enableRootCause.toString());

      const response = await fetch("/api/ai/vision", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.result) {
          // Use comprehensive result directly if available, otherwise enhance
          const result = data.result;
          const enhancedResult: EnhancedAnalysisResult = {
            ...result,
            // Ensure all fields are present
            isCompliant:
              result.isCompliant !== undefined
                ? result.isCompliant
                : (result.complianceScore || 0) >= 70,
            complianceScore: result.complianceScore || 0,
            hazards: result.hazards || [],
            compatibility: result.compatibility,
            detectedItems: result.detectedItems || [],
            summary:
              result.summary ||
              result.analysis?.description ||
              "Analysis completed",
            // Preserve vision result structure
            analysis: result.visionResult?.analysis ||
              result.analysis || {
                description:
                  result.summary ||
                  result.analysis?.description ||
                  "Analysis completed",
                detectedObjects:
                  result.detectedItems?.map((item: any) => ({
                    object: item.name || item.type,
                    confidence: item.confidence || 0.5,
                    boundingBox: item.boundingBox,
                  })) || [],
                safetyIssues:
                  result.hazards?.map((h: any) => ({
                    issue: h.description || h.type,
                    severity:
                      h.severity === "high"
                        ? "high"
                        : h.severity === "medium"
                          ? "medium"
                          : "low",
                    confidence: 0.8,
                  })) || [],
                qualityIssues: [],
                complianceIssues: [],
              },
            metadata: result.visionResult?.metadata ||
              result.metadata || {
                provider: "Unknown",
                model: "Unknown",
                processingTime: 0,
              },
            id: result.analysisId || result.id || `vision-${Date.now()}`,
            timestamp: result.timestamp || new Date().toISOString(),
            imageUrl: result.fileUrl || result.imageUrl,
            thumbnailUrl: result.thumbnailUrl,
          };
          setAnalyses([enhancedResult, ...analyses]);
          setSelectedAnalysis(enhancedResult);
          setShowUploadModal(false);
        } else {
          setError("Analysis failed: " + (data.error || "Unknown error"));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(
          "Failed to analyze image: " + (errorData.error || "Unknown error"),
        );
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Upload error", err, {
        module: "ai-vision",
        service: "upload",
      });
      errorTrackingService.captureException(err, {
        module: "ai-vision",
        service: "upload",
      });
      setError("Error analyzing image");
    } finally {
      setUploading(false);
    }
  };

  // Analyze the selected image
  const analyzeImage = async () => {
    if (images.length === 0 || !previewUrls[selectedImageIndex]) {
      setError("Please upload an image to analyze");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      await handleFileUpload(images[selectedImageIndex]);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("Error analyzing image", error, {
        module: "ai-vision",
        service: "analysis",
      });
      errorTrackingService.captureException(error, {
        module: "ai-vision",
        service: "analysis",
      });
      setError("Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle video file selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));

      setVideos([...videos, ...newFiles]);
      setVideoPreviewUrls([...videoPreviewUrls, ...newPreviewUrls]);
      setError(null);
    }
  };

  // Analyze video
  const analyzeVideo = async (videoFile?: File) => {
    const video = videoFile || videos[selectedVideoIndex];
    if (!video) {
      setError("Please upload a video to analyze");
      return;
    }

    setIsAnalyzingVideo(true);
    setError(null);
    setVideoProgress(0);

    try {
      const formData = new FormData();
      formData.append("video", video);
      formData.append("mode", analysisMode);
      formData.append("frameInterval", "30");
      formData.append("enableAlerts", "true");
      formData.append("alertThreshold", "70");
      formData.append("enableObjectTracking", "true");
      formData.append("enableMotionDetection", "true");

      // Simulate progress
      const progressInterval = setInterval(() => {
        setVideoProgress((prev) => Math.min(prev + 5, 90));
      }, 500);

      const response = await fetch("/api/ai/vision/video", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setVideoProgress(100);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.result) {
          setVideoAnalyses([data.result, ...videoAnalyses]);
          setNotification({
            type: "success",
            message: "Video analysis completed!",
          });
        } else {
          setError("Video analysis failed: " + (data.error || "Unknown error"));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(
          "Failed to analyze video: " + (errorData.error || "Unknown error"),
        );
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Video analysis error", err, {
        module: "ai-vision",
        service: "video-analysis",
      });
      errorTrackingService.captureException(err, {
        module: "ai-vision",
        service: "video-analysis",
      });
      setError("Error analyzing video");
    } finally {
      setIsAnalyzingVideo(false);
      setVideoProgress(0);
    }
  };

  // Get context for analysis mode
  const getContextForMode = (mode: AnalysisMode): string => {
    switch (mode) {
      case "chemical":
        return "Chemical storage compatibility and safety analysis. Check for incompatible chemicals, proper labeling, and storage compliance.";
      case "ppe":
        return "PPE compliance check. Verify appropriate personal protective equipment is being worn for the task and chemicals being handled.";
      case "storage":
        return "Storage area safety and compliance. Check for proper chemical segregation, housekeeping, emergency equipment, and compliance with storage guidelines.";
      default:
        return "General warehouse operations quality and safety check. Identify any safety hazards, quality issues, or compliance concerns.";
    }
  };

  // Enhance analysis result with mode-specific data
  const enhanceAnalysisResult = (
    result: VisionAnalysisResult,
    mode: AnalysisMode,
  ): EnhancedAnalysisResult => {
    const enhanced: EnhancedAnalysisResult = { ...result };

    // Calculate compliance score from issues
    const totalIssues =
      (result.analysis.safetyIssues?.length || 0) +
      (result.analysis.qualityIssues?.length || 0) +
      (result.analysis.complianceIssues?.length || 0);
    enhanced.complianceScore = Math.max(0, 100 - totalIssues * 10);
    enhanced.isCompliant = enhanced.complianceScore >= 70;

    // Convert detected objects to detected items format
    if (result.analysis.detectedObjects) {
      enhanced.detectedItems = result.analysis.detectedObjects.map(
        (obj: { object: string; confidence: number }) => ({
          type: obj.object.toLowerCase().includes("chemical")
            ? "chemical"
            : obj.object.toLowerCase().includes("ppe") ||
                obj.object.toLowerCase().includes("glove") ||
                obj.object.toLowerCase().includes("goggle")
              ? "ppe"
              : obj.object.toLowerCase().includes("cabinet") ||
                  obj.object.toLowerCase().includes("storage")
                ? "equipment"
                : "other",
          name: obj.object,
          confidence: obj.confidence,
        }),
      );
    }

    // Convert safety issues to hazards format
    if (result.analysis.safetyIssues) {
      enhanced.hazards = result.analysis.safetyIssues.map(
        (issue: { issue: string; severity: string }) => ({
          type: issue.issue,
          severity:
            issue.severity === "critical"
              ? "high"
              : (issue.severity as "low" | "medium" | "high"),
          description: issue.issue,
          recommendations: `Address ${issue.issue.toLowerCase()} issue`,
        }),
      );
    }

    // Generate summary
    enhanced.summary =
      result.analysis.description ||
      `Analysis completed in ${mode} mode. ${totalIssues} issue(s) detected.`;

    return enhanced;
  };

  const captureFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(
        async (blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, {
              type: "image/jpeg",
            });
            await handleFileUpload(file);
          }
        },
        "image/jpeg",
        0.9,
      );
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-900/30 text-red-400 border-red-500/30";
      case "high":
        return "bg-orange-900/30 text-orange-400 border-orange-500/30";
      case "major":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-500/30";
      case "medium":
        return "bg-blue-900/30 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-900/30 text-gray-400 border-gray-500/30";
    }
  };

  const stats = {
    total: analyses.length,
    safetyIssues: analyses.reduce(
      (sum, a) => sum + (a.analysis?.safetyIssues?.length ?? 0),
      0,
    ),
    qualityIssues: analyses.reduce(
      (sum, a) => sum + (a.analysis?.qualityIssues?.length ?? 0),
      0,
    ),
    complianceIssues: analyses.reduce(
      (sum, a) => sum + (a.analysis?.complianceIssues?.length ?? 0),
      0,
    ),
  };

  return (
    <PageTemplate
      title="AI Vision Analysis"
      description="Computer vision for safety, quality, and compliance • Real-time image analysis with automatic root cause detection"
      icon="ri-eye-line"
      systemInfo={{
        sap: "AI Vision System",
        oracle: "Computer Vision",
        manhattan: "Image Analysis",
      }}
      stats={[
        {
          label: "Total Analyses",
          value: stats.total,
          icon: "ri-image-line",
          trend: "up",
        },
        {
          label: "Safety Issues",
          value: stats.safetyIssues,
          icon: "ri-shield-cross-line",
          trend: stats.safetyIssues > 0 ? "up" : "neutral",
        },
        {
          label: "Quality Issues",
          value: stats.qualityIssues,
          icon: "ri-alert-line",
          trend: stats.qualityIssues > 0 ? "up" : "neutral",
        },
        {
          label: "Compliance Issues",
          value: stats.complianceIssues,
          icon: "ri-file-warning-line",
          trend: stats.complianceIssues > 0 ? "up" : "neutral",
        },
      ]}
      actions={
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <i className="ri-upload-cloud-line"></i>
            Upload Image
          </button>
          <button
            onClick={triggerCameraInput}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="ri-camera-line"></i>
            Take Photo
          </button>
          <button
            onClick={() => setLiveFeed(!liveFeed)}
            className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              liveFeed
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            <i
              className={liveFeed ? "ri-stop-circle-line" : "ri-video-line"}
            ></i>
            {liveFeed ? "Stop Camera" : "Live Feed"}
          </button>
          {liveFeed && (
            <button
              onClick={() => setContinuousMonitoring(!continuousMonitoring)}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                continuousMonitoring
                  ? "bg-amber-600 hover:bg-amber-700 text-white animate-pulse"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              <i
                className={
                  continuousMonitoring
                    ? "ri-pause-circle-line"
                    : "ri-timer-line"
                }
              ></i>
              {continuousMonitoring ? "Stop Monitoring" : "Auto Monitor"}
            </button>
          )}
          {analyses.length > 0 && (
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <i className="ri-download-line"></i>
              Export Report
            </button>
          )}
          {images.length > 0 && (
            <button
              onClick={analyzeImage}
              disabled={isAnalyzing}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                isAnalyzing
                  ? "bg-gray-600 cursor-not-allowed text-white"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              }`}
            >
              <i
                className={`ri-search-line ${isAnalyzing ? "animate-spin" : ""}`}
              ></i>
              {isAnalyzing ? "Analyzing..." : "Analyze Image"}
            </button>
          )}
          {images.length > 0 && (
            <button
              onClick={clearAllImages}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <i className="ri-delete-bin-line"></i>
              Clear All
            </button>
          )}
        </div>
      }
    >
      {/* Analysis Type Tabs */}
      <div className="mb-6 bg-gray-800 border border-gray-700 rounded-xl p-2">
        <div className="flex gap-2">
          {(["image", "video", "stream"] as AnalysisType[]).map((type) => (
            <button
              key={type}
              onClick={() => setAnalysisType(type)}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                analysisType === type
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
            >
              <i
                className={`ri-${type === "image" ? "image-line" : type === "video" ? "video-line" : "live-line"} mr-2`}
              ></i>
              {type === "image"
                ? "Image Analysis"
                : type === "video"
                  ? "Video Analysis"
                  : "Live Stream"}
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Mode Selection */}
      <div className="mb-8 bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Analysis Mode</h3>
        <div className="flex flex-wrap gap-3">
          {(["general", "chemical", "ppe", "storage"] as AnalysisMode[]).map(
            (mode) => (
              <button
                key={mode}
                onClick={() => setAnalysisMode(mode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  analysisMode === mode
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                    : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                }`}
              >
                <i
                  className={`ri-${mode === "general" ? "shield-check-line" : mode === "chemical" ? "flask-line" : mode === "ppe" ? "user-shield-line" : "archive-line"} mr-2`}
                ></i>
                {mode === "general"
                  ? "General Safety"
                  : mode === "chemical"
                    ? "Chemical Compatibility"
                    : mode === "ppe"
                      ? "PPE Compliance"
                      : "Storage Safety"}
              </button>
            ),
          )}
        </div>
        <p className="text-sm text-gray-400 mt-3">
          {analysisMode === "general" &&
            "General safety and compliance check for warehouse operations"}
          {analysisMode === "chemical" &&
            "Chemical storage compatibility and safety analysis"}
          {analysisMode === "ppe" &&
            "PPE compliance verification for personnel"}
          {analysisMode === "storage" &&
            "Storage area safety and compliance verification"}
        </p>
      </div>

      {/* Video Gallery */}
      {analysisType === "video" && videos.length > 0 && (
        <div className="mb-8 bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Uploaded Videos ({videos.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videoPreviewUrls.map((url, index) => (
              <div
                key={index}
                className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                  index === selectedVideoIndex
                    ? "border-cyan-500 shadow-lg shadow-cyan-500/20"
                    : "border-gray-700 hover:border-gray-600"
                }`}
                onClick={() => setSelectedVideoIndex(index)}
              >
                <video
                  src={url}
                  className="w-full h-48 object-cover"
                  controls={false}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    URL.revokeObjectURL(videoPreviewUrls[index]);
                    const updatedVideos = [...videos];
                    const updatedUrls = [...videoPreviewUrls];
                    updatedVideos.splice(index, 1);
                    updatedUrls.splice(index, 1);
                    setVideos(updatedVideos);
                    setVideoPreviewUrls(updatedUrls);
                  }}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white rounded-full p-1.5 transition-colors"
                  title="Remove"
                >
                  <i className="ri-close-line text-sm"></i>
                </button>
                <div className="absolute bottom-0 left-0 right-0 py-2 px-3 bg-black/70 text-white text-xs">
                  Video {index + 1} • {videos[index].name}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => analyzeVideo()}
              disabled={isAnalyzingVideo}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                isAnalyzingVideo
                  ? "bg-gray-600 cursor-not-allowed text-white"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              }`}
            >
              <i
                className={`ri-search-line ${isAnalyzingVideo ? "animate-spin" : ""}`}
              ></i>
              {isAnalyzingVideo
                ? `Analyzing... ${videoProgress}%`
                : "Analyze Video"}
            </button>
            {videoProgress > 0 && videoProgress < 100 && (
              <div className="flex-1 bg-gray-700 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Analysis Results */}
      {analysisType === "video" && videoAnalyses.length > 0 && (
        <div className="mb-8 bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Video Analysis Results ({videoAnalyses.length})
          </h3>
          <div className="space-y-4">
            {videoAnalyses.map((analysis, index) => (
              <div
                key={analysis.id}
                className="p-4 bg-gray-700 rounded-lg border border-gray-600 cursor-pointer hover:border-cyan-500 transition-colors"
                onClick={() => {
                  // Show video analysis details
                  setNotification({
                    type: "info",
                    message: `Video analysis: ${analysis.summary.overallComplianceScore}/100 compliance score`,
                  });
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <i className="ri-video-line text-cyan-400"></i>
                    <span className="text-white font-medium">
                      {analysis.sourceName}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      analysis.summary.overallComplianceScore >= 90
                        ? "bg-green-900/30 text-green-400"
                        : analysis.summary.overallComplianceScore >= 70
                          ? "bg-yellow-900/30 text-yellow-400"
                          : "bg-red-900/30 text-red-400"
                    }`}
                  >
                    {analysis.summary.overallComplianceScore}/100
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Frames Analyzed</div>
                    <div className="text-white">
                      {analysis.analyzedFrames}/{analysis.totalFrames}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Issues Detected</div>
                    <div className="text-white">
                      {analysis.summary.totalIssuesDetected}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Duration</div>
                    <div className="text-white">
                      {(analysis.duration / 1000).toFixed(1)}s
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Gallery */}
      {analysisType === "image" && images.length > 0 && (
        <div className="mb-8 bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Uploaded Images ({images.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {previewUrls.map((url, index) => (
              <div
                key={index}
                className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                  index === selectedImageIndex
                    ? "border-cyan-500 shadow-lg shadow-cyan-500/20"
                    : "border-gray-700 hover:border-gray-600"
                }`}
                onClick={() => setSelectedImageIndex(index)}
              >
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 text-white rounded-full p-1.5 transition-colors"
                  title="Remove"
                >
                  <i className="ri-close-line text-sm"></i>
                </button>
                <div className="absolute bottom-0 left-0 right-0 py-1 px-2 bg-black/70 text-white text-xs truncate">
                  Image {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-8 p-4 rounded-lg bg-red-900/30 border border-red-500/30 text-red-400 flex items-center gap-2">
          <i className="ri-alert-line text-xl"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Live Camera Feed */}
      {liveFeed && (
        <div className="mb-8 bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <i className="ri-camera-line text-green-400"></i>
              Live Camera Feed
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm text-gray-400">Live</span>
            </div>
          </div>
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-w-2xl mx-auto rounded-lg bg-black"
              style={{ maxHeight: "500px" }}
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="mt-4 flex justify-center">
              <button
                onClick={captureFromCamera}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-semibold flex items-center gap-2"
              >
                <i className="ri-camera-fill"></i>
                Capture & Analyze
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Panel */}
      <div className="mb-8 bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Analysis Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-200">
              AI Provider
            </label>
            <select
              value={config.provider}
              onChange={(e) =>
                setConfig({ ...config, provider: e.target.value as any })
              }
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border-gray-600 border focus:outline-none focus:border-blue-500"
            >
              <option value="auto">Auto (Best Available)</option>
              <option value="openai">OpenAI GPT-4 Vision</option>
              <option value="anthropic">Anthropic Claude Vision</option>
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableRootCause}
                onChange={(e) =>
                  setConfig({ ...config, enableRootCause: e.target.checked })
                }
                className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-200">
                Enable Root Cause Analysis
              </span>
            </label>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableThumbnail}
                onChange={(e) =>
                  setConfig({ ...config, enableThumbnail: e.target.checked })
                }
                className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-200">Generate Thumbnails</span>
            </label>
          </div>
        </div>
      </div>

      {/* Analyses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analyses.map((analysis, index) => (
          <motion.div
            key={analysis.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedAnalysis(analysis)}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6 cursor-pointer hover:border-blue-500 transition-all"
          >
            {analysis.thumbnailUrl && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img
                  src={analysis.thumbnailUrl}
                  alt="Analysis thumbnail"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {new Date(analysis.timestamp).toLocaleString()}
                </span>
                <span
                  className={`text-xs ${
                    analysis.metadata.provider === "Warning" ||
                    (analysis.metadata.provider === "Error" &&
                      (!analysis.error ||
                        (analysis.complianceScore !== undefined &&
                          analysis.complianceScore >= 70)))
                      ? "text-green-400"
                      : analysis.metadata.provider === "Error"
                        ? "text-red-400"
                        : analysis.metadata.provider === "OpenAI" ||
                            analysis.metadata.provider === "Anthropic"
                          ? "text-cyan-400"
                          : "text-gray-400"
                  }`}
                >
                  {analysis.metadata.provider === "Warning" ||
                  (analysis.metadata.provider === "Error" &&
                    (!analysis.error ||
                      (analysis.complianceScore !== undefined &&
                        analysis.complianceScore >= 70)))
                    ? "Success"
                    : analysis.metadata.provider === "Error"
                      ? "Error"
                      : analysis.metadata.provider}{" "}
                  • {analysis.metadata.processingTime}ms
                </span>
              </div>
              <p className="text-sm text-gray-300 line-clamp-2">
                {analysis.summary &&
                !(analysis.analysis?.description ?? "")
                  .toLowerCase()
                  .includes("analysis failed")
                  ? analysis.summary
                  : (analysis.analysis?.description ?? "")
                        .toLowerCase()
                        .includes("analysis failed") &&
                      (analysis.complianceScore ?? 0) >= 70
                    ? analysis.summary || "Analysis completed successfully"
                    : analysis.analysis?.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {(analysis.analysis?.safetyIssues?.length ?? 0) > 0 && (
                  <span className="px-2 py-1 rounded text-xs bg-yellow-900/30 text-yellow-400">
                    {analysis.analysis?.safetyIssues?.length ?? 0} Safety
                  </span>
                )}
                {(analysis.analysis?.qualityIssues?.length ?? 0) > 0 && (
                  <span className="px-2 py-1 rounded text-xs bg-red-900/30 text-red-400">
                    {analysis.analysis?.qualityIssues?.length ?? 0} Quality
                  </span>
                )}
                {(analysis.analysis?.complianceIssues?.length ?? 0) > 0 && (
                  <span className="px-2 py-1 rounded text-xs bg-purple-900/30 text-purple-400">
                    {analysis.analysis?.complianceIssues?.length ?? 0}{" "}
                    Compliance
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {analyses.length === 0 && (
        <div className="text-center py-12">
          <i className="ri-image-line text-6xl text-gray-500 mb-4"></i>
          <p className="text-gray-400 mb-4">No analyses yet</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-medium"
          >
            Upload First Image
          </button>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-2xl w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">
                  Upload Image for Analysis
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
              <div className="border-2 border-dashed rounded-xl p-8 text-center border-gray-700 bg-gray-900">
                <i className="ri-image-add-line text-6xl text-gray-600 mb-3"></i>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoChange}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => {
                    if (analysisType === "video") {
                      videoInputRef.current?.click();
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                  disabled={uploading || isAnalyzingVideo}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  <i className="ri-upload-cloud-line"></i>
                  {uploading || isAnalyzingVideo
                    ? "Processing..."
                    : analysisType === "video"
                      ? "Select Video(s)"
                      : "Select Image(s)"}
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={uploading}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  <i className="ri-camera-line"></i>
                  Take Photo
                </button>
                <p className="mt-4 text-sm text-gray-400">
                  {analysisType === "video"
                    ? "Supports MP4, WebM, MOV, AVI (Max 500MB)"
                    : "Supports JPG, PNG, WebP (Max 20MB)"}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Analysis Detail Modal */}
      <AnimatePresence>
        {selectedAnalysis && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedAnalysis(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-5xl w-full shadow-2xl my-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">
                  Analysis Details
                </h3>
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              {(selectedAnalysis.imageUrl ||
                (images.length > 0 && previewUrls[selectedImageIndex])) && (
                <div className="mb-6 rounded-lg overflow-hidden relative">
                  <img
                    src={
                      selectedAnalysis.imageUrl ||
                      previewUrls[selectedImageIndex]
                    }
                    alt="Analyzed image"
                    className="w-full max-h-96 object-contain bg-gray-900 cursor-pointer"
                    onClick={() => setShowZoomedImage(true)}
                  />
                  <button
                    onClick={() => setShowZoomedImage(true)}
                    className="absolute bottom-2 right-2 p-2 bg-gray-800/80 hover:bg-gray-700/90 text-white rounded-lg transition-colors"
                    title="Zoom"
                  >
                    <i className="ri-zoom-in-line"></i>
                  </button>
                </div>
              )}

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Description
                  </h4>
                  <p className="text-gray-300">
                    {selectedAnalysis.summary &&
                    !(selectedAnalysis.analysis?.description ?? "")
                      .toLowerCase()
                      .includes("analysis failed")
                      ? selectedAnalysis.summary
                      : (selectedAnalysis.analysis?.description ?? "")
                            .toLowerCase()
                            .includes("analysis failed") &&
                          (selectedAnalysis.complianceScore ?? 0) >= 70
                        ? selectedAnalysis.summary ||
                          "Analysis completed successfully. No issues detected."
                        : selectedAnalysis.analysis?.description ||
                          selectedAnalysis.summary ||
                          "Analysis completed"}
                  </p>
                </div>

                {/* Compliance Status */}
                {selectedAnalysis.complianceScore !== undefined && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {selectedAnalysis.isCompliant ? (
                          <i className="ri-checkbox-circle-line text-green-400 text-2xl"></i>
                        ) : (
                          <i className="ri-close-circle-line text-red-400 text-2xl"></i>
                        )}
                        <span className="text-lg font-semibold text-white">
                          {selectedAnalysis.isCompliant
                            ? "Compliant"
                            : "Non-Compliant"}
                        </span>
                      </div>
                      <div
                        className={`px-4 py-2 rounded-full font-medium ${
                          selectedAnalysis.complianceScore >= 90
                            ? "bg-green-900/30 text-green-400"
                            : selectedAnalysis.complianceScore >= 70
                              ? "bg-yellow-900/30 text-yellow-400"
                              : "bg-red-900/30 text-red-400"
                        }`}
                      >
                        Score: {selectedAnalysis.complianceScore}/100
                      </div>
                    </div>
                    {selectedAnalysis.summary && (
                      <div
                        className={`p-4 rounded-lg ${
                          selectedAnalysis.isCompliant
                            ? "bg-green-900/20 text-green-200 border border-green-500/30"
                            : "bg-red-900/20 text-red-200 border border-red-500/30"
                        }`}
                      >
                        <p>{selectedAnalysis.summary}</p>
                      </div>
                    )}

                    {/* Auto-Create NCR Button (for non-compliant analyses) */}
                    {!selectedAnalysis.isCompliant && (
                      <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-red-200 font-medium mb-1">
                              Non-Compliance Detected
                            </p>
                            <p className="text-sm text-red-300">
                              Create NCR automatically from this analysis
                            </p>
                          </div>
                          {ncrCreated ? (
                            <div className="flex items-center gap-2 text-green-400">
                              <i className="ri-checkbox-circle-line text-xl"></i>
                              <span className="text-sm">NCR Created</span>
                              <button
                                onClick={() =>
                                  router.push(
                                    `/ncr-management?ncr=${ncrCreated}`,
                                  )
                                }
                                className="ml-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                              >
                                View NCR
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={async () => {
                                setCreatingNCR(true);
                                try {
                                  const response = await fetch(
                                    "/api/vision-analysis/auto-ncr",
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        analysisResult: {
                                          analysisId: selectedAnalysis.id,
                                          isCompliant:
                                            selectedAnalysis.isCompliant,
                                          complianceScore:
                                            selectedAnalysis.complianceScore,
                                          hazards:
                                            selectedAnalysis.hazards || [],
                                          summary:
                                            selectedAnalysis.summary ||
                                            selectedAnalysis.analysis
                                              ?.description ||
                                            "",
                                          fileUrl: selectedAnalysis.imageUrl,
                                          thumbnailUrl:
                                            selectedAnalysis.thumbnailUrl,
                                          mode: analysisMode,
                                          timestamp: selectedAnalysis.timestamp,
                                        },
                                      }),
                                    },
                                  );
                                  const data = await response.json();
                                  if (data.success) {
                                    const ncrId = data.ncrId || data.ncr?.name;
                                    setNcrCreated(ncrId);

                                    // Auto-suggest CAPA from the created NCR
                                    try {
                                      const capaResponse = await fetch(
                                        "/api/vision-analysis/auto-capa",
                                        {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            ncrData: {
                                              ncrId: ncrId,
                                              subject: `Vision Analysis Non-Conformance - ${analysisMode}`,
                                              description:
                                                selectedAnalysis.summary ||
                                                selectedAnalysis.analysis
                                                  .description,
                                              rootCause:
                                                selectedAnalysis.analysis
                                                  .rootCauseAnalysis
                                                  ?.rootCauses?.[0]?.cause ||
                                                "To be determined",
                                              visionAnalysisId:
                                                selectedAnalysis.id,
                                              visionAnalysisUrl:
                                                selectedAnalysis.imageUrl,
                                              complianceScore:
                                                selectedAnalysis.complianceScore,
                                            },
                                          }),
                                        },
                                      );
                                      const capaData =
                                        await capaResponse.json();
                                      if (capaData.success) {
                                        alert(
                                          `✅ NCR ${ncrId} created!\n✅ CAPA ${capaData.capaId} auto-suggested!\n\nClick "View NCR" to see details.`,
                                        );
                                      } else {
                                        alert(
                                          `✅ NCR ${ncrId} created!\n⚠️ CAPA suggestion pending manual creation.`,
                                        );
                                      }
                                    } catch (capaError) {
                                      const err =
                                        capaError instanceof Error
                                          ? capaError
                                          : new Error(String(capaError));
                                      logger.error(
                                        "Auto-CAPA suggestion error",
                                        err,
                                        {
                                          module: "ai-vision",
                                          service: "capa-suggestion",
                                        },
                                      );
                                      errorTrackingService.captureException(
                                        err,
                                        {
                                          module: "ai-vision",
                                          service: "capa-suggestion",
                                        },
                                      );
                                      alert(
                                        `✅ NCR ${ncrId} created successfully!\n⚠️ CAPA auto-suggestion failed - please create manually.`,
                                      );
                                    }
                                  } else {
                                    alert(
                                      `❌ Failed to create NCR: ${data.error || "Unknown error"}`,
                                    );
                                  }
                                } catch (error) {
                                  const err =
                                    error instanceof Error
                                      ? error
                                      : new Error(String(error));
                                  logger.error("Error creating NCR", err, {
                                    module: "ai-vision",
                                    service: "ncr-creation",
                                  });
                                  errorTrackingService.captureException(err, {
                                    module: "ai-vision",
                                    service: "ncr-creation",
                                  });
                                  alert(
                                    "❌ Error creating NCR. Please try again.",
                                  );
                                } finally {
                                  setCreatingNCR(false);
                                }
                              }}
                              disabled={creatingNCR}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                                creatingNCR
                                  ? "bg-gray-600 cursor-not-allowed text-white"
                                  : "bg-red-600 hover:bg-red-700 text-white"
                              }`}
                            >
                              <i
                                className={`ri-file-warning-line ${creatingNCR ? "animate-spin" : ""}`}
                              ></i>
                              {creatingNCR ? "Creating NCR..." : "Create NCR"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Detected Items */}
                {((selectedAnalysis.detectedItems &&
                  selectedAnalysis.detectedItems.length > 0) ||
                  (selectedAnalysis.analysis.detectedObjects &&
                    selectedAnalysis.analysis.detectedObjects.length > 0)) && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">
                      Detected Items
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {(
                        selectedAnalysis.detectedItems ||
                        selectedAnalysis.analysis.detectedObjects?.map(
                          (obj: { object: string; confidence: number }) => ({
                            type: "other",
                            name: obj.object,
                            confidence: obj.confidence,
                          }),
                        ) ||
                        []
                      ).map(
                        (
                          item: {
                            type?: string;
                            name?: string;
                            confidence?: number;
                          },
                          idx: number,
                        ) => (
                          <div
                            key={idx}
                            className="p-3 bg-gray-700 rounded-lg border border-gray-600"
                          >
                            <div className="text-sm text-white font-medium">
                              {item.name || item.type}
                            </div>
                            <div className="text-xs text-gray-400 capitalize">
                              {item.type}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {item.confidence}% confidence
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Hazards */}
                {selectedAnalysis.hazards &&
                  selectedAnalysis.hazards.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                        <i className="ri-alert-line text-yellow-400"></i>
                        Identified Hazards
                      </h4>
                      <div className="space-y-2">
                        {selectedAnalysis.hazards.map((hazard, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border ${
                              hazard.severity === "high"
                                ? "bg-red-900/30 text-red-300 border-red-500/30"
                                : hazard.severity === "medium"
                                  ? "bg-yellow-900/30 text-yellow-300 border-yellow-500/30"
                                  : "bg-blue-900/30 text-blue-300 border-blue-500/30"
                            }`}
                          >
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">{hazard.type}</span>
                              <span className="text-xs capitalize">
                                {hazard.severity}
                              </span>
                            </div>
                            <p className="text-sm mb-1">{hazard.description}</p>
                            {hazard.recommendations && (
                              <p className="text-xs mt-2">
                                <span className="font-medium">
                                  Recommendation:
                                </span>{" "}
                                {hazard.recommendations}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Compatibility */}
                {selectedAnalysis.compatibility && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <i
                        className={
                          selectedAnalysis.compatibility.isPotentialIssue
                            ? "ri-alert-line text-yellow-400"
                            : "ri-checkbox-circle-line text-green-400"
                        }
                      ></i>
                      Chemical Compatibility
                    </h4>
                    <div
                      className={`p-4 rounded-lg border ${
                        selectedAnalysis.compatibility.isPotentialIssue
                          ? "bg-yellow-900/30 text-yellow-200 border-yellow-500/30"
                          : "bg-green-900/30 text-green-200 border-green-500/30"
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <span className="font-medium">
                          {selectedAnalysis.compatibility.isPotentialIssue
                            ? "Compatibility Issue Detected"
                            : "Compatible Storage"}
                        </span>
                      </div>
                      <p className="text-sm">
                        {selectedAnalysis.compatibility.description}
                      </p>
                      {selectedAnalysis.compatibility.recommendations && (
                        <p className="text-xs mt-2">
                          <span className="font-medium">Recommendation:</span>{" "}
                          {selectedAnalysis.compatibility.recommendations}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Safety Issues */}
                {selectedAnalysis.analysis.safetyIssues?.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <i className="ri-shield-cross-line text-yellow-400"></i>
                      Safety Issues
                    </h4>
                    <div className="space-y-2">
                      {selectedAnalysis.analysis.safetyIssues.map(
                        (
                          issue: {
                            issue: string;
                            severity: string;
                            confidence: number;
                            location?: string;
                          },
                          idx: number,
                        ) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{issue.issue}</span>
                              <span className="text-xs">
                                {issue.confidence}% confidence
                              </span>
                            </div>
                            <div className="text-xs mt-1">
                              Severity: {issue.severity.toUpperCase()}
                            </div>
                            {issue.location && (
                              <div className="text-xs mt-1">
                                Location: {issue.location}
                              </div>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Quality Issues */}
                {selectedAnalysis.analysis.qualityIssues?.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <i className="ri-alert-line text-red-400"></i>
                      Quality Issues
                    </h4>
                    <div className="space-y-2">
                      {selectedAnalysis.analysis.qualityIssues.map(
                        (
                          issue: {
                            issue: string;
                            severity: string;
                            confidence: number;
                            type?: string;
                          },
                          idx: number,
                        ) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{issue.issue}</span>
                              <span className="text-xs">
                                {issue.confidence}% confidence
                              </span>
                            </div>
                            <div className="text-xs mt-1">
                              Type: {issue.type} • Severity:{" "}
                              {issue.severity.toUpperCase()}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Compliance Issues */}
                {selectedAnalysis.analysis.complianceIssues?.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <i className="ri-file-warning-line text-purple-400"></i>
                      Compliance Issues
                    </h4>
                    <div className="space-y-2">
                      {selectedAnalysis.analysis?.complianceIssues?.map(
                        (issue: ComplianceIssue, idx: number) => (
                          <div
                            key={idx}
                            className="p-4 rounded-lg border border-purple-500/30 bg-purple-900/20"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-purple-300">
                                {issue.standard}
                              </span>
                              <span className="text-xs text-gray-400">
                                {issue.confidence}% confidence
                              </span>
                            </div>
                            <div className="text-sm text-purple-200 mt-1">
                              {issue.violation}
                            </div>
                            <div className="text-xs text-purple-300 mt-2">
                              Recommendation: {issue.recommendation}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Root Cause Analysis */}
                {selectedAnalysis.analysis.rootCauseAnalysis && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <i className="ri-brain-line text-cyan-400"></i>
                      Root Cause Analysis
                    </h4>
                    <div className="space-y-3">
                      {selectedAnalysis.analysis.rootCauseAnalysis.rootCauses.map(
                        (
                          cause: {
                            cause: string;
                            confidence: number;
                            explanation: string;
                          },
                          idx: number,
                        ) => (
                          <div
                            key={idx}
                            className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-900/20"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-cyan-300">
                                {cause.cause}
                              </span>
                              <span className="text-xs text-gray-400">
                                {cause.confidence}% confidence
                              </span>
                            </div>
                            <div className="text-sm text-cyan-200">
                              {cause.explanation}
                            </div>
                          </div>
                        ),
                      )}
                      {selectedAnalysis.analysis.rootCauseAnalysis
                        .recommendations.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-semibold text-white mb-2">
                            Recommendations
                          </h5>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                            {selectedAnalysis.analysis.rootCauseAnalysis.recommendations.map(
                              (rec: string, idx: number) => (
                                <li key={idx}>{rec}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-t border-gray-700">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Provider</div>
                      <div
                        className={`${
                          selectedAnalysis.metadata.provider === "Warning" ||
                          (selectedAnalysis.metadata.provider === "Error" &&
                            (!selectedAnalysis.error ||
                              (selectedAnalysis.complianceScore !== undefined &&
                                selectedAnalysis.complianceScore >= 70)))
                            ? "text-green-400"
                            : selectedAnalysis.metadata.provider === "Error"
                              ? "text-red-400"
                              : selectedAnalysis.metadata.provider ===
                                    "OpenAI" ||
                                  selectedAnalysis.metadata.provider ===
                                    "Anthropic"
                                ? "text-cyan-400"
                                : "text-white"
                        }`}
                      >
                        {selectedAnalysis.metadata.provider === "Warning" ||
                        (selectedAnalysis.metadata.provider === "Error" &&
                          (!selectedAnalysis.error ||
                            (selectedAnalysis.complianceScore !== undefined &&
                              selectedAnalysis.complianceScore >= 70)))
                          ? "Success"
                          : selectedAnalysis.metadata.provider === "Error"
                            ? "Error"
                            : selectedAnalysis.metadata.provider}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Model</div>
                      <div className="text-white">
                        {selectedAnalysis.metadata.model}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Processing Time</div>
                      <div className="text-white">
                        {selectedAnalysis.metadata.processingTime}ms
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Timestamp</div>
                      <div className="text-white">
                        {new Date(selectedAnalysis.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Zoomed Image Modal */}
      <AnimatePresence>
        {showZoomedImage &&
          images.length > 0 &&
          previewUrls[selectedImageIndex] && (
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowZoomedImage(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-6xl max-h-[90vh]"
              >
                <img
                  src={previewUrls[selectedImageIndex]}
                  alt="Zoomed image"
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />
                <button
                  onClick={() => setShowZoomedImage(false)}
                  className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </motion.div>
            </div>
          )}
      </AnimatePresence>

      {/* Export Report Modal */}
      <AnimatePresence>
        {showExportModal && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  Export Analysis Report
                </h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <i className="ri-close-line text-gray-400 text-xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    // Export as PDF
                    const reportData = {
                      title: "AI Vision Analysis Report",
                      date: new Date().toISOString(),
                      analyses: analyses,
                      stats: stats,
                    };
                    const blob = new Blob(
                      [JSON.stringify(reportData, null, 2)],
                      { type: "application/json" },
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `ai-vision-report-${new Date().toISOString().split("T")[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    setShowExportModal(false);
                    setNotification({
                      type: "success",
                      message: "Report exported successfully!",
                    });
                  }}
                  className="w-full p-4 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center gap-4 transition-colors"
                >
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <i className="ri-file-text-line text-white text-xl"></i>
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium">Export as JSON</div>
                    <div className="text-gray-400 text-sm">
                      Full analysis data with all details
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    // Export summary as CSV
                    const headers = [
                      "ID",
                      "Timestamp",
                      "Mode",
                      "Compliance Score",
                      "Safety Issues",
                      "Quality Issues",
                      "Compliance Issues",
                    ];
                    const rows = analyses.map((a) => [
                      a.id,
                      new Date(a.timestamp).toLocaleString(),
                      analysisMode,
                      a.complianceScore || "N/A",
                      a.analysis.safetyIssues?.length || 0,
                      a.analysis.qualityIssues?.length || 0,
                      a.analysis.complianceIssues?.length || 0,
                    ]);
                    const csv = [
                      headers.join(","),
                      ...rows.map((r) => r.join(",")),
                    ].join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `ai-vision-summary-${new Date().toISOString().split("T")[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    setShowExportModal(false);
                    setNotification({
                      type: "success",
                      message: "Summary exported successfully!",
                    });
                  }}
                  className="w-full p-4 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center gap-4 transition-colors"
                >
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <i className="ri-file-excel-line text-white text-xl"></i>
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium">Export as CSV</div>
                    <div className="text-gray-400 text-sm">
                      Summary spreadsheet for Excel
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className={`fixed bottom-6 left-1/2 transform px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 ${
              notification.type === "success"
                ? "bg-green-600"
                : notification.type === "error"
                  ? "bg-red-600"
                  : notification.type === "warning"
                    ? "bg-amber-600"
                    : "bg-blue-600"
            }`}
          >
            <i
              className={`text-xl ${
                notification.type === "success"
                  ? "ri-checkbox-circle-line"
                  : notification.type === "error"
                    ? "ri-error-warning-line"
                    : notification.type === "warning"
                      ? "ri-alert-line"
                      : "ri-information-line"
              }`}
            ></i>
            <span className="text-white font-medium">
              {notification.message}
            </span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <i className="ri-close-line text-white"></i>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTemplate>
  );
}

/**
 * Video Analysis API Route
 * AI-powered video analysis with frame extraction and real-time monitoring
 * Supports safety, quality, and compliance analysis from video streams
 */

import { NextRequest, NextResponse } from "next/server";
import videoAnalysisService, {
  VideoAnalysisConfig,
  VideoAnalysisMode,
} from "@/lib/services/ai/videoAnalysisService";
import { apiAuthMiddleware } from "@/middleware/apiAuth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const formData = await request.formData();
    const videoFile = formData.get("video") as File;
    const mode = (formData.get("mode") as VideoAnalysisMode) || "general";
    const frameInterval =
      parseInt(formData.get("frameInterval") as string) || 30;
    const enableAlerts = formData.get("enableAlerts") === "true";
    const alertThreshold =
      parseInt(formData.get("alertThreshold") as string) || 70;
    const enableObjectTracking =
      formData.get("enableObjectTracking") === "true";
    const enableMotionDetection =
      formData.get("enableMotionDetection") === "true";

    if (!videoFile) {
      return NextResponse.json(
        { success: false, error: "No video file provided" },
        { status: 400 },
      );
    }

    if (!videoFile.type.startsWith("video/")) {
      return NextResponse.json(
        { success: false, error: "File must be a video" },
        { status: 400 },
      );
    }

    const config: Partial<VideoAnalysisConfig> = {
      mode,
      frameInterval,
      fps: 30, // Default FPS, can be extracted from video metadata
      enableObjectTracking,
      enableMotionDetection,
      enableAlerts,
      alertThreshold,
    };

    // Convert File to Blob for analysis
    const videoBlob = await videoFile.arrayBuffer();
    const blob = new Blob([videoBlob], { type: videoFile.type });

    // Analyze video
    const result = await videoAnalysisService.analyzeVideo(blob, config);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Video analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to analyze video",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await apiAuthMiddleware(request);
  if (!auth.authorized) return auth.response!;

  return NextResponse.json({
    success: true,
    available: true,
    message: "Video analysis service is available",
    supportedFormats: ["mp4", "webm", "mov", "avi"],
    maxSize: "500MB",
  });
}

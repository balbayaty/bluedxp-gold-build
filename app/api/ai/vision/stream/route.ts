/**
 * Real-Time Video Streaming Vision API
 * Start, stop, and manage real-time video stream analysis
 */

import { NextRequest, NextResponse } from "next/server";
import streamingVisionService, {
  StreamConfig,
} from "@/lib/services/ai/streamingVisionService";
import { VideoSource } from "@/lib/services/ai/videoAnalysisService";
import { VideoAnalysisMode } from "@/lib/services/ai/videoAnalysisService";
import { apiAuthMiddleware } from "@/middleware/apiAuth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    const {
      source,
      analysisMode = "general",
      frameInterval = 30,
      enableObjectTracking = true,
      enableAnomalyDetection = true,
      enableAlerts = true,
      alertThreshold = 70,
      useEnhancedVision = true,
    } = body;

    if (!source || !source.url || !source.type) {
      return NextResponse.json(
        { success: false, error: "Invalid stream source. Required: url, type" },
        { status: 400 },
      );
    }

    const videoSource: VideoSource = {
      id: source.id || `source-${Date.now()}`,
      name: source.name || "Video Stream",
      type: source.type,
      url: source.url,
      location: source.location,
      description: source.description,
      isActive: true,
    };

    const config: StreamConfig = {
      source: videoSource,
      analysisMode: analysisMode as VideoAnalysisMode,
      frameInterval,
      enableObjectTracking,
      enableAnomalyDetection,
      enableAlerts,
      alertThreshold,
      useEnhancedVision,
    };

    const streamId = await streamingVisionService.startStreamAnalysis(config);

    return NextResponse.json({
      success: true,
      streamId,
      message: "Stream analysis started",
    });
  } catch (error: any) {
    console.error("Stream start error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to start stream analysis",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get("streamId");
    const action = searchParams.get("action");

    if (action === "list") {
      // List all active streams
      const streams = streamingVisionService.getActiveStreams();
      return NextResponse.json({
        success: true,
        streams,
      });
    }

    if (streamId) {
      if (action === "status") {
        // Get stream status
        const status = streamingVisionService.getStreamStatus(streamId);
        if (!status) {
          return NextResponse.json(
            { success: false, error: "Stream not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({
          success: true,
          status,
        });
      }

      if (action === "analysis") {
        // Get current analysis
        const analysis = streamingVisionService.getStreamAnalysis(streamId);
        if (!analysis) {
          return NextResponse.json(
            { success: false, error: "Stream not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({
          success: true,
          analysis,
        });
      }

      if (action === "pause") {
        const paused = streamingVisionService.pauseStream(streamId);
        return NextResponse.json({
          success: paused,
          message: paused ? "Stream paused" : "Failed to pause stream",
        });
      }

      if (action === "resume") {
        const resumed = streamingVisionService.resumeStream(streamId);
        return NextResponse.json({
          success: resumed,
          message: resumed ? "Stream resumed" : "Failed to resume stream",
        });
      }

      if (action === "stop") {
        const result = streamingVisionService.stopStream(streamId);
        return NextResponse.json({
          success: true,
          result,
          message: "Stream stopped",
        });
      }
    }

    return NextResponse.json({
      success: true,
      service: "Streaming Vision Service",
      endpoints: {
        "POST /api/ai/vision/stream": "Start stream analysis",
        "GET /api/ai/vision/stream?action=list": "List active streams",
        "GET /api/ai/vision/stream?streamId=X&action=status":
          "Get stream status",
        "GET /api/ai/vision/stream?streamId=X&action=analysis":
          "Get current analysis",
        "GET /api/ai/vision/stream?streamId=X&action=pause": "Pause stream",
        "GET /api/ai/vision/stream?streamId=X&action=resume": "Resume stream",
        "GET /api/ai/vision/stream?streamId=X&action=stop": "Stop stream",
      },
    });
  } catch (error: any) {
    console.error("Stream API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Stream API error",
      },
      { status: 500 },
    );
  }
}

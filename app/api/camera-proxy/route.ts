/**
 * Camera Proxy API Route
 * Handles RTSP stream URLs and frame capture for IP cameras
 * Now integrated with Dahua Camera Service
 */

import { NextRequest, NextResponse } from "next/server";
import { dahuaCameraService } from "@/lib/services/cameras";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const deviceId =
      searchParams.get("deviceId") || searchParams.get("cameraId");
    const channel = searchParams.get("channel");
    const action = searchParams.get("action"); // 'stream' or 'capture'

    if (!deviceId) {
      return NextResponse.json(
        { error: "Missing required parameter: deviceId or cameraId" },
        { status: 400 },
      );
    }

    // Try to get camera from service first
    const camera = dahuaCameraService.getCamera(deviceId);

    let rtspUrl: string;
    if (camera) {
      // Use registered camera
      rtspUrl = dahuaCameraService.getRTSPStream(
        deviceId,
        parseInt(channel || "1"),
      );
    } else {
      // Fallback to legacy method (for backward compatibility)
      // SECURITY: Require environment variables - no hardcoded fallbacks
      const username =
        process.env.NEXT_PUBLIC_DMSS_USERNAME || process.env.DMSS_USERNAME;
      const password = process.env.DMSS_PASSWORD;

      if (!username || !password) {
        return NextResponse.json(
          {
            error:
              "Camera credentials not configured. Set DMSS_USERNAME and DMSS_PASSWORD environment variables.",
          },
          { status: 500 },
        );
      }
      rtspUrl = `rtsp://${username}:${password}@${deviceId}:554/cam/realmonitor?channel=${channel || "1"}&subtype=0`;
    }

    if (action === "capture") {
      // For frame capture, we'd need a backend service to capture frames from RTSP
      // This is a placeholder - in production, you'd use ffmpeg or similar
      return NextResponse.json({
        success: true,
        message: "Frame capture requires backend RTSP processing service",
        note: "RTSP streams require server-side processing for frame capture",
        deviceId,
        channel: channel || "1",
      });
    }

    // Return stream information
    const username =
      process.env.NEXT_PUBLIC_DMSS_USERNAME ||
      process.env.DMSS_USERNAME ||
      "admin";
    const password =
      process.env.NEXT_PUBLIC_DMSS_PASSWORD || process.env.DMSS_PASSWORD || "";

    return NextResponse.json({
      success: true,
      message:
        "RTSP URL generated successfully. Note: Direct RTSP viewing in browsers requires special handling.",
      connectionDetails: {
        username,
        deviceId,
        channel: channel || "1",
        url: rtspUrl.replace(password, "******"), // Hide password in response
        streamType: "RTSP",
        note: "For browser compatibility, consider converting RTSP to HLS or WebRTC using a media server",
      },
      // For HLS conversion, you'd use a service like:
      // - MediaMTX (formerly rtsp-simple-server)
      // - Wowza Streaming Engine
      // - AWS MediaLive
      hlsConversionNote:
        "To enable browser playback, convert RTSP to HLS using a media server",
    });
  } catch (error) {
    console.error("Camera proxy error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, channel, action, streamUrl } = body;

    if (action === "test-connection") {
      // Test RTSP connection (would require backend service)
      return NextResponse.json({
        success: true,
        message: "Connection test requires backend RTSP service",
        deviceId,
        channel,
      });
    }

    return NextResponse.json({
      success: false,
      error: "Invalid action",
    });
  } catch (error) {
    console.error("Camera proxy POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Camera Stream API Route
 * GET: Get stream URLs (RTSP, HLS, snapshot)
 */

import { NextRequest, NextResponse } from "next/server";
import { dahuaCameraService } from "@/lib/services/cameras";

export async function GET(
  request: NextRequest,
  { params }: { params: { cameraId: string } },
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const channel = parseInt(searchParams.get("channel") || "1");
    const streamType = (searchParams.get("streamType") || "main") as
      | "main"
      | "sub";
    const format = searchParams.get("format") || "rtsp"; // rtsp, hls, snapshot

    const camera = dahuaCameraService.getCamera(params.cameraId);

    if (!camera) {
      return NextResponse.json(
        { success: false, error: "Camera not found" },
        { status: 404 },
      );
    }

    let streamUrl: string;
    let streamInfo: any = {};

    switch (format) {
      case "rtsp":
        streamUrl = dahuaCameraService.getRTSPStream(
          params.cameraId,
          channel,
          streamType,
        );
        streamInfo = {
          type: "rtsp",
          url: streamUrl,
          note: "RTSP streams require a media server for browser playback. Use HLS format for direct browser viewing.",
        };
        break;

      case "hls":
        streamUrl = await dahuaCameraService.getHLSStream(
          params.cameraId,
          channel,
        );
        streamInfo = {
          type: "hls",
          url: streamUrl,
          note: "HLS stream requires media server conversion from RTSP",
        };
        break;

      case "snapshot":
        streamUrl = dahuaCameraService.getSnapshotUrl(params.cameraId, channel);
        streamInfo = {
          type: "snapshot",
          url: streamUrl,
          note: "Static snapshot image",
        };
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid format. Use: rtsp, hls, or snapshot",
          },
          { status: 400 },
        );
    }

    return NextResponse.json({
      success: true,
      cameraId: params.cameraId,
      channel,
      streamType,
      format,
      ...streamInfo,
    });
  } catch (error: any) {
    console.error("Error getting stream:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get stream" },
      { status: 500 },
    );
  }
}

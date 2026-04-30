/**
 * Error Tracking API
 * GET /api/observability/errors - Get error events
 */

import { NextRequest, NextResponse } from "next/server";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get("level") as any;
    const startTime = searchParams.get("startTime") || undefined;
    const endTime = searchParams.get("endTime") || undefined;
    const moduleId = searchParams.get("module") || undefined;

    const errors = errorTrackingService.getErrorEvents({
      level,
      startTime,
      endTime,
      module: moduleId,
    });

    return NextResponse.json({
      success: true,
      data: errors,
    });
  } catch (error: any) {
    console.error("Error fetching error events:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch error events",
      },
      { status: 500 },
    );
  }
}

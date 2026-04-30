/**
 * Traces API
 * GET /api/observability/traces - Get traces
 */

import { NextRequest, NextResponse } from "next/server";
import { tracingService } from "@/lib/services/observability/tracing";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serviceName = searchParams.get("serviceName") || undefined;
    const tenantId = searchParams.get("tenantId") || undefined;
    const startTime = searchParams.get("startTime")
      ? Number(searchParams.get("startTime"))
      : undefined;
    const endTime = searchParams.get("endTime")
      ? Number(searchParams.get("endTime"))
      : undefined;

    const traces = tracingService.getTraces({
      serviceName,
      tenantId,
      startTime,
      endTime,
    });

    return NextResponse.json({
      success: true,
      data: traces,
    });
  } catch (error: any) {
    console.error("Error fetching traces:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch traces",
      },
      { status: 500 },
    );
  }
}

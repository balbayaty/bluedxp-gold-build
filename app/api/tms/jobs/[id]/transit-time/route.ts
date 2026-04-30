/**
 * TMS Transit Time API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { transitTimeService } from "@/lib/services/tms/transitTimeService";
import { tmsCoreService } from "@/lib/services/tms/tmsCoreService";

/**
 * GET /api/tms/jobs/:id/transit-time - Get transit time records for job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 },
      );
    }

    const transitTimes = await transitTimeService.getTransitTimeRecords(
      params.id,
      tenantId,
    );

    return NextResponse.json(transitTimes);
  } catch (error) {
    console.error("Error fetching transit time records:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

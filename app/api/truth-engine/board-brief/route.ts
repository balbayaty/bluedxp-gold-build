/**
 * Truth Engine Board Brief API
 */

import { NextRequest, NextResponse } from "next/server";
import { truthEngineService } from "@/lib/services/truth-engine";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");
    const periodStart = searchParams.get("periodStart");
    const periodEnd = searchParams.get("periodEnd");

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "tenantId is required" },
        { status: 400 },
      );
    }

    const period =
      periodStart && periodEnd
        ? {
            start: new Date(periodStart),
            end: new Date(periodEnd),
          }
        : undefined;

    const brief = await truthEngineService.generateBoardBrief(tenantId, period);

    return NextResponse.json({
      success: true,
      brief,
    });
  } catch (error: any) {
    console.error("Error generating board brief:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate board brief",
      },
      { status: 500 },
    );
  }
}

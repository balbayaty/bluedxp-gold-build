/**
 * Decision Statistics API
 * Get aggregated statistics about decisions
 */

import { NextRequest, NextResponse } from "next/server";
import { decisionService } from "@/lib/services/decision-core";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || undefined;

    const statistics = await decisionService.getStatistics(tenantId);

    return NextResponse.json(statistics);
  } catch (error: any) {
    console.error("Decision statistics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get statistics" },
      { status: 500 },
    );
  }
}

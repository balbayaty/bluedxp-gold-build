/**
 * Process Mining API
 * Discovers process model
 */

import { NextResponse } from "next/server";
import { unifiedIntelligenceService } from "@/lib/services/intelligence-analytics";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, processType, moduleIds, timeRange } = body;

    if (!tenantId || !processType) {
      return NextResponse.json(
        { error: "tenantId and processType are required" },
        { status: 400 },
      );
    }

    const result = await unifiedIntelligenceService.discoverProcess({
      tenantId,
      processType,
      moduleIds,
      timeRange,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error discovering process:", error);
    return NextResponse.json(
      { error: "Failed to discover process" },
      { status: 500 },
    );
  }
}

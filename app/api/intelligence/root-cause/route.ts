/**
 * Get All Root Cause Analyses
 */

import { NextRequest, NextResponse } from "next/server";
import { rootCauseAnalysisEngine } from "@/lib/services/intelligence-analytics";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "tenant-1";

    if (!tenantId || tenantId.trim().length === 0) {
      return NextResponse.json(
        { error: "tenantId is required", rcas: [], count: 0 },
        { status: 400 },
      );
    }

    // Ensure engine is initialized
    try {
      await rootCauseAnalysisEngine.initialize(tenantId);
    } catch (initError) {
      // If already initialized, that's fine
      console.log(
        "Engine initialization check:",
        initError instanceof Error ? initError.message : "unknown",
      );
    }

    const rcas = rootCauseAnalysisEngine.getAnalyses(tenantId);

    return NextResponse.json({
      rcas: Array.isArray(rcas) ? rcas : [],
      count: Array.isArray(rcas) ? rcas.length : 0,
    });
  } catch (error) {
    console.error("Error getting root cause analyses:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get root cause analyses",
        rcas: [],
        count: 0,
      },
      { status: 500 },
    );
  }
}

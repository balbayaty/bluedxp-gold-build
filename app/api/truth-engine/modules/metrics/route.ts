/**
 * Truth Engine Module Metrics API
 * Provides module-specific metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { truthEngineService } from "@/lib/services/truth-engine";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get("timeRange") || "30d";

    // Get module-specific metrics (would query database)
    const modules = [
      "wms",
      "tms",
      "qhse",
      "iso-ims",
      "msds",
      "finance",
      "hr",
      "facility",
    ];

    const metrics = await Promise.all(
      modules.map(async (module) => {
        // Would query actual database for module metrics
        return {
          module,
          truthScore: Math.random() * 30 + 70, // 70-100
          events: Math.floor(Math.random() * 1000) + 100,
          evidence: Math.floor(Math.random() * 800) + 80,
          gaps: Math.floor(Math.random() * 20),
          compliance: Math.random() * 10 + 90, // 90-100
        };
      }),
    );

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    console.error("Error fetching module metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch module metrics",
      },
      { status: 500 },
    );
  }
}

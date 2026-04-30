/**
 * Intelligence & Analytics Stats API
 * Returns statistics for the unified intelligence dashboard
 */

import { NextResponse } from "next/server";
import {
  unifiedIntelligenceService,
  rootCauseAnalysisEngine,
  dataMiningEngine,
  processMiningEngine,
} from "@/lib/services/intelligence-analytics";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "tenant-1";

    // Get statistics from all engines
    const [rcas, miningResults, processAnalyses] = await Promise.all([
      rootCauseAnalysisEngine.getAnalyses(tenantId),
      dataMiningEngine
        .mine({ tenantId, algorithms: ["pattern", "anomaly"] })
        .catch(() => []),
      processMiningEngine
        .discoverProcess({
          tenantId,
          processType: "order_fulfillment",
        })
        .then((result) => [result])
        .catch(() => []),
    ]);

    // Calculate insights count
    const insights =
      rcas.length + miningResults.length + processAnalyses.length;

    return NextResponse.json({
      totalRCAs: rcas.length,
      totalMiningResults: miningResults.length,
      totalProcessAnalyses: processAnalyses.length,
      totalInsights: insights,
      recentRCAs: rcas.slice(0, 5),
      recentMiningResults: miningResults.slice(0, 5),
      recentProcessAnalyses: processAnalyses.slice(0, 5),
    });
  } catch (error) {
    console.error("Error getting intelligence stats:", error);
    return NextResponse.json(
      {
        error: "Failed to get intelligence stats",
        totalRCAs: 0,
        totalMiningResults: 0,
        totalProcessAnalyses: 0,
        totalInsights: 0,
      },
      { status: 500 },
    );
  }
}

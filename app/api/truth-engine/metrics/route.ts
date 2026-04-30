/**
 * Truth Engine Metrics API
 * Provides comprehensive metrics for dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { truthEngineMetrics } from "@/lib/services/truth-engine/monitoring/metrics";
import { truthEngineService } from "@/lib/services/truth-engine";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get("timeRange") || "30d";
    const moduleId = searchParams.get("module") || "all";

    // Get base metrics
    const baseMetrics = truthEngineMetrics.getMetrics();

    // Calculate additional metrics
    const overallTruthScore = baseMetrics.averageConfidenceScore * 100;
    const evidenceCoverage =
      baseMetrics.evidenceRecorded > 0
        ? (baseMetrics.eventsRecorded / baseMetrics.evidenceRecorded) * 100
        : 0;

    // Get module-specific metrics (would query database)
    const moduleMetrics = await getModuleMetrics(timeRange, moduleId);

    // Calculate compliance score (would be more sophisticated)
    const complianceScore = overallTruthScore * 0.9; // Simplified

    // Calculate adversarial risk
    const adversarialRisk =
      baseMetrics.lowConfidenceEvents > baseMetrics.eventsRecorded * 0.2
        ? "HIGH"
        : baseMetrics.lowConfidenceEvents > baseMetrics.eventsRecorded * 0.1
          ? "MEDIUM"
          : "LOW";

    const metrics = {
      overallTruthScore,
      evidenceCoverage: Math.min(evidenceCoverage, 100),
      averageConfidence: baseMetrics.averageConfidenceScore * 100,
      totalEvents: baseMetrics.eventsRecorded,
      totalEvidence: baseMetrics.evidenceRecorded,
      activeGaps: 0, // Would calculate from database
      resolvedGaps: 0, // Would calculate from database
      complianceScore,
      adversarialRisk,
      moduleMetrics,
    };

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch metrics" },
      { status: 500 },
    );
  }
}

async function getModuleMetrics(timeRange: string, moduleId: string) {
  // Placeholder - would query database for module-specific metrics
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

  return modules.map((m) => ({
    module: m,
    truthScore: Math.random() * 30 + 70, // 70-100
    events: Math.floor(Math.random() * 1000) + 100,
    evidence: Math.floor(Math.random() * 800) + 80,
    gaps: Math.floor(Math.random() * 20),
    compliance: Math.random() * 10 + 90, // 90-100
  }));
}

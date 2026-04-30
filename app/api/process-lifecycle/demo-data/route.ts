/**
 * Process Lifecycle Demo Data API
 * Initialize and manage demo data for testing
 */

import { NextRequest, NextResponse } from "next/server";
import { initializeDemoData } from "@/lib/services/process-lifecycle/data/initializeDemoData";
import { lifecycleService } from "@/lib/services/process-lifecycle";
import { workflowService } from "@/lib/services/process-lifecycle";
import { processMiningService } from "@/lib/services/process-lifecycle";

/**
 * GET /api/process-lifecycle/demo-data
 * Get current demo data status
 */
export async function GET(request: NextRequest) {
  try {
    // Get current stats
    const configs = lifecycleService.getAllConfigs();
    const workflows = await workflowService.getWorkflows("default");

    // Get sample lifecycle data
    const sampleAsn = await lifecycleService.getLifecycle(
      "ASN-2025-001",
      "ASN",
    );
    const sampleTask = await lifecycleService.getLifecycle(
      "TASK-2025-001",
      "TASK",
    );

    // Get process mining data
    const miningMetrics =
      await processMiningService.getPerformanceMetrics("ASN");

    return NextResponse.json({
      success: true,
      data: {
        initialized: configs.size > 0,
        stats: {
          lifecycleConfigs: configs.size,
          workflows: workflows.length,
          processMiningCases: miningMetrics.totalCases,
          processMiningDeviations: miningMetrics.totalDeviations,
        },
        samples: {
          asn: sampleAsn
            ? {
                id: sampleAsn.entityId,
                currentStage: sampleAsn.currentStageId,
                progress: sampleAsn.progress,
                status: sampleAsn.status,
                stagesCompleted: sampleAsn.stages.filter(
                  (s) => s.status === "COMPLETED",
                ).length,
              }
            : null,
          task: sampleTask
            ? {
                id: sampleTask.entityId,
                currentStage: sampleTask.currentStageId,
                progress: sampleTask.progress,
                status: sampleTask.status,
                stagesCompleted: sampleTask.stages.filter(
                  (s) => s.status === "COMPLETED",
                ).length,
              }
            : null,
        },
        availableEntityTypes: Array.from(configs.keys()),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting demo data status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/process-lifecycle/demo-data
 * Initialize demo data
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Starting demo data initialization via API...");

    const result = await initializeDemoData();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        stats: result.stats,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          stats: result.stats,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error initializing demo data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

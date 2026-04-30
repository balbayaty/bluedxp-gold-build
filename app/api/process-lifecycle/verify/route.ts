/**
 * Process Lifecycle Verification API
 * Comprehensive verification that all services are working
 */

import { NextRequest, NextResponse } from "next/server";
import { lifecycleService } from "@/lib/services/process-lifecycle";
import { workflowService } from "@/lib/services/process-lifecycle";
import { processMiningService } from "@/lib/services/process-lifecycle";
import { processAnalyticsService } from "@/lib/services/process-lifecycle";
import { processOrchestrator } from "@/lib/services/process-lifecycle";
import { initializeLifecycleSystem } from "@/lib/services/process-lifecycle/lifecycle/configurations/initialize";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "error";
  message: string;
  details?: any;
}

/**
 * GET /api/process-lifecycle/verify
 * Verify all services are working
 */
export async function GET(request: NextRequest) {
  const services: ServiceStatus[] = [];
  let overallStatus: "operational" | "degraded" | "error" = "operational";

  // 1. Verify Lifecycle Service
  try {
    // Initialize if needed
    initializeLifecycleSystem();

    const configs = lifecycleService.getAllConfigs();
    const configCount = configs.size;

    // Test lifecycle operations
    const testId = `test-${Date.now()}`;
    await lifecycleService.initializeLifecycle(testId, "ASN", { test: true });
    const lifecycle = await lifecycleService.getLifecycle(testId, "ASN");

    if (lifecycle && configCount > 0) {
      services.push({
        name: "Lifecycle Service",
        status: "operational",
        message: `${configCount} configs registered, lifecycle operations working`,
        details: {
          configCount,
          registeredTypes: Array.from(configs.keys()),
          canCreate: true,
          canRead: true,
        },
      });
    } else {
      services.push({
        name: "Lifecycle Service",
        status: "degraded",
        message: "Service running but no configs or lifecycle creation failed",
      });
      overallStatus = "degraded";
    }
  } catch (error) {
    services.push({
      name: "Lifecycle Service",
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    overallStatus = "error";
  }

  // 2. Verify Workflow Service
  try {
    const workflows = await workflowService.getWorkflows("test");
    const stats = await workflowService.getStatistics();

    // Test workflow creation
    const testWorkflow = await workflowService.createWorkflow({
      name: "Test Workflow",
      description: "Verification test",
      steps: [
        {
          id: "step-1",
          name: "Test Step",
          type: "action",
          config: { action: "test" },
          position: { x: 0, y: 0 },
          connections: [],
        },
      ],
      triggers: [{ event: "test", conditions: {} }],
      status: "draft",
    });

    if (testWorkflow) {
      services.push({
        name: "Workflow Service",
        status: "operational",
        message: `${stats.totalWorkflows} workflows, operations working`,
        details: {
          totalWorkflows: stats.totalWorkflows,
          canCreate: true,
          canRead: true,
        },
      });
    } else {
      services.push({
        name: "Workflow Service",
        status: "degraded",
        message: "Service running but workflow creation failed",
      });
      overallStatus = "degraded";
    }
  } catch (error) {
    services.push({
      name: "Workflow Service",
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    overallStatus = "error";
  }

  // 3. Verify Process Mining Service
  try {
    const testCaseId = `mining-test-${Date.now()}`;

    // Capture test event
    await processMiningService.captureEvent({
      caseId: testCaseId,
      caseType: "TEST",
      event: {
        id: `evt-${Date.now()}`,
        activity: "TEST_ACTIVITY",
        timestamp: new Date().toISOString(),
        resource: "test-user",
        data: { test: true },
      },
    });

    // Get case
    const testCase = await processMiningService.getCase(testCaseId, "TEST");
    const metrics = await processMiningService.getPerformanceMetrics("TEST");

    if (testCase) {
      services.push({
        name: "Process Mining Service",
        status: "operational",
        message: `Event capture working, ${metrics.totalCases} cases tracked`,
        details: {
          totalCases: metrics.totalCases,
          canCapture: true,
          canAnalyze: true,
        },
      });
    } else {
      services.push({
        name: "Process Mining Service",
        status: "degraded",
        message: "Service running but event capture may have issues",
      });
      overallStatus = "degraded";
    }
  } catch (error) {
    services.push({
      name: "Process Mining Service",
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    overallStatus = "error";
  }

  // 4. Verify Analytics Service
  try {
    const analytics = await processAnalyticsService.getProcessAnalytics("ASN");
    const dashboardData = await processAnalyticsService.getDashboardData();

    if (analytics && dashboardData) {
      services.push({
        name: "Analytics Service",
        status: "operational",
        message: `Analytics generating, ${dashboardData.analytics.insights} insights available`,
        details: {
          canGenerateAnalytics: true,
          canGenerateDashboard: true,
          insightsCount: dashboardData.analytics.insights,
        },
      });
    } else {
      services.push({
        name: "Analytics Service",
        status: "degraded",
        message: "Service running but analytics may be incomplete",
      });
      overallStatus = "degraded";
    }
  } catch (error) {
    services.push({
      name: "Analytics Service",
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    overallStatus = "error";
  }

  // 5. Verify Process Orchestrator
  try {
    const testContext = {
      entityId: `orch-test-${Date.now()}`,
      entityType: "ASN",
      userId: "test-user",
    };

    // Initialize lifecycle first
    await lifecycleService.initializeLifecycle(testContext.entityId, "ASN", {
      test: true,
    });

    // Test orchestration
    const result = await processOrchestrator.orchestrateProcess(
      testContext,
      "lifecycle_update",
      { test: true },
    );

    if (result) {
      services.push({
        name: "Process Orchestrator",
        status: "operational",
        message: "Orchestration working, coordinates all services",
        details: {
          canOrchestrate: true,
          lastResult: {
            lifecycleUpdated: result.lifecycleUpdated,
            processMiningCaptured: result.processMiningCaptured,
          },
        },
      });
    } else {
      services.push({
        name: "Process Orchestrator",
        status: "degraded",
        message: "Service running but orchestration may have issues",
      });
      overallStatus = "degraded";
    }
  } catch (error) {
    services.push({
      name: "Process Orchestrator",
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    overallStatus = "error";
  }

  // Generate summary
  const operationalCount = services.filter(
    (s) => s.status === "operational",
  ).length;
  const totalServices = services.length;

  return NextResponse.json({
    success: overallStatus !== "error",
    status: overallStatus,
    summary: `${operationalCount}/${totalServices} services operational`,
    services,
    timestamp: new Date().toISOString(),
    recommendations:
      overallStatus !== "operational"
        ? [
            "Check server logs for detailed error information",
            "Ensure all dependencies are properly imported",
            "Try restarting the development server",
          ]
        : [
            "All services are operational",
            "Initialize demo data to populate the system: POST /api/process-lifecycle/demo-data",
          ],
  });
}

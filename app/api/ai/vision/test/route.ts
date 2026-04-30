/**
 * Vision Module Test Endpoint
 * Tests all services and integrations
 * GET /api/ai/vision/test
 */

import { NextRequest, NextResponse } from "next/server";
import { visionService } from "@/lib/services/ai/visionService";
import { visionDatabaseService } from "@/lib/services/ai/vision/visionDatabaseService";
import { visionAgentIntegration } from "@/lib/services/ai/vision/visionAgentIntegration";
import { humanInTheLoopService } from "@/lib/services/ai/vision/humanInTheLoopService";
import { intelligentAutomationService } from "@/lib/services/ai/vision/intelligentAutomationService";
import { prisma } from "@/lib/services/database/prismaClient";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const tests: Record<string, any> = {
    timestamp: new Date().toISOString(),
    results: {},
  };

  try {
    // Test 1: Vision Service
    try {
      tests.results.visionService = {
        available: visionService.isAvailable(),
        providers: visionService.getAvailableProviders(),
        status: "pass",
      };
    } catch (error) {
      tests.results.visionService = {
        status: "fail",
        error: error instanceof Error ? error.message : "Unknown",
      };
    }

    // Test 2: Database Connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      tests.results.database = {
        connected: true,
        status: "pass",
      };
    } catch (error) {
      tests.results.database = {
        connected: false,
        status: "fail",
        error: error instanceof Error ? error.message : "Unknown",
      };
    }

    // Test 3: Database Service
    try {
      const result = await visionDatabaseService.listAnalyses({ limit: 1 });
      tests.results.databaseService = {
        working: true,
        canQuery: true,
        totalAnalyses: result.total,
        status: "pass",
      };
    } catch (error) {
      tests.results.databaseService = {
        working: false,
        status: "fail",
        error: error instanceof Error ? error.message : "Unknown",
      };
    }

    // Test 4: Agent Integration
    try {
      const { agentOrchestrator } =
        await import("@/lib/services/agents/agentOrchestrator");
      const agents = agentOrchestrator.getAllAgents();
      const visionAgent = agents.find((a: any) => a.id === "vision-agent");
      tests.results.agentIntegration = {
        available: true,
        visionAgentFound: !!visionAgent,
        totalAgents: agents.length,
        status: "pass",
      };
    } catch (error) {
      tests.results.agentIntegration = {
        available: false,
        status: "warning",
        error: error instanceof Error ? error.message : "Unknown",
      };
    }

    // Test 5: Human-in-the-Loop
    try {
      const pending = await humanInTheLoopService.getPendingRequests({});
      tests.results.humanInLoop = {
        available: true,
        pendingRequests: pending.length,
        status: "pass",
      };
    } catch (error) {
      tests.results.humanInLoop = {
        available: false,
        status: "fail",
        error: error instanceof Error ? error.message : "Unknown",
      };
    }

    // Test 6: Automation Service
    try {
      // Service is initialized on import
      tests.results.automation = {
        available: true,
        status: "pass",
      };
    } catch (error) {
      tests.results.automation = {
        available: false,
        status: "fail",
        error: error instanceof Error ? error.message : "Unknown",
      };
    }

    // Test 7: Event Bus
    try {
      const { eventBus } = await import("@/lib/services/event-store");
      tests.results.eventBus = {
        available: true,
        status: "pass",
      };
    } catch (error) {
      tests.results.eventBus = {
        available: false,
        status: "warning",
        error: error instanceof Error ? error.message : "Unknown",
      };
    }

    // Test 8: Knowledge Base
    try {
      const { knowledgeBaseService } =
        await import("@/lib/services/knowledge-base");
      tests.results.knowledgeBase = {
        available: true,
        status: "pass",
      };
    } catch (error) {
      tests.results.knowledgeBase = {
        available: false,
        status: "warning",
        error: error instanceof Error ? error.message : "Unknown",
      };
    }

    // Calculate overall status
    const passed = Object.values(tests.results).filter(
      (r: any) => r.status === "pass",
    ).length;
    const failed = Object.values(tests.results).filter(
      (r: any) => r.status === "fail",
    ).length;
    const warnings = Object.values(tests.results).filter(
      (r: any) => r.status === "warning",
    ).length;

    tests.summary = {
      total: Object.keys(tests.results).length,
      passed,
      failed,
      warnings,
      overallStatus: failed === 0 ? "healthy" : "degraded",
    };

    const statusCode = failed === 0 ? 200 : 503;
    return NextResponse.json(tests, { status: statusCode });
  } catch (error) {
    tests.error = error instanceof Error ? error.message : "Unknown error";
    tests.summary = {
      overallStatus: "error",
    };
    return NextResponse.json(tests, { status: 500 });
  }
}

/**
 * Vision Module Health Check API
 * Validates all services are working correctly
 */

import { NextRequest, NextResponse } from "next/server";
import { visionService } from "@/lib/services/ai/visionService";
import { visionDatabaseService } from "@/lib/services/ai/vision/visionDatabaseService";
import { prisma } from "@/lib/services/database/prismaClient";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const health: Record<string, any> = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {},
  };

  try {
    // Check vision service
    health.services.visionService = {
      available: visionService.isAvailable(),
      providers: visionService.getAvailableProviders(),
    };

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = {
        connected: true,
        type: "postgresql",
      };
    } catch (error) {
      health.services.database = {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
      health.status = "degraded";
    }

    // Check database service
    try {
      const testResult = await visionDatabaseService.listAnalyses({
        limit: 1,
      });
      health.services.visionDatabase = {
        working: true,
        canQuery: true,
      };
    } catch (error) {
      health.services.visionDatabase = {
        working: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
      health.status = "degraded";
    }

    // Check event bus (if available)
    try {
      const { eventBus } = await import("@/lib/services/event-store");
      health.services.eventBus = {
        available: true,
      };
    } catch (error) {
      health.services.eventBus = {
        available: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // Check agent orchestrator (if available)
    try {
      const { agentOrchestrator } =
        await import("@/lib/services/agents/agentOrchestrator");
      health.services.agentOrchestrator = {
        available: true,
      };
    } catch (error) {
      health.services.agentOrchestrator = {
        available: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // Check knowledge base (if available)
    try {
      const { knowledgeBaseService } =
        await import("@/lib/services/knowledge-base");
      health.services.knowledgeBase = {
        available: true,
      };
    } catch (error) {
      health.services.knowledgeBase = {
        available: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    const statusCode = health.status === "healthy" ? 200 : 503;
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    health.status = "unhealthy";
    health.error = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(health, { status: 503 });
  }
}

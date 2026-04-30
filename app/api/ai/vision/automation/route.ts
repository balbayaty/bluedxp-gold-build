/**
 * Intelligent Automation API Route
 * Automated decision-making and workflow triggers
 */

import { NextRequest, NextResponse } from "next/server";
import { intelligentAutomationService } from "@/lib/services/ai/vision/intelligentAutomationService";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { logger } from "@/lib/services/observability/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    const { analysisId, action } = body;

    const tenantId = request.headers.get("x-tenant-id") || undefined;

    if (!analysisId) {
      return NextResponse.json(
        { success: false, error: "Analysis ID is required" },
        { status: 400 },
      );
    }

    if (action === "process") {
      // Process analysis and make automated decisions
      const decision = await intelligentAutomationService.processAnalysis(
        analysisId,
        tenantId,
      );

      logger.info("Automation decision made", undefined, {
        module: "ai-vision",
        service: "automation-api",
        decisionId: decision.id,
        analysisId,
        decision: decision.decision,
        confidence: decision.confidence,
      });

      return NextResponse.json({
        success: true,
        decision,
      });
    } else if (action === "add_rule") {
      // Add automation rule
      const rule = await intelligentAutomationService.addRule(body.rule);

      return NextResponse.json({
        success: true,
        rule,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 },
      );
    }
  } catch (error) {
    logger.error(
      "Automation API error",
      error instanceof Error ? error : new Error(String(error)),
      {
        module: "ai-vision",
        service: "automation-api",
      },
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

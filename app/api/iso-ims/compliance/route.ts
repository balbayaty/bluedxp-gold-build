/**
 * Compliance Engine API
 *
 * Provides comprehensive compliance data including:
 * - Real-time compliance scores
 * - Compliance health
 * - Requirements assessment
 * - Full compliance dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { complianceEngine } from "@/lib/services/iso-ims";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId;
    const customerId = searchParams.get("customerId") || undefined;
    const warehouseId = searchParams.get("warehouseId") || undefined;
    const type = searchParams.get("type") || "dashboard"; // dashboard, score, health, requirements

    switch (type) {
      case "score": {
        const score = await complianceEngine.calculateComplianceScore(
          tenantId,
          customerId,
          warehouseId,
        );
        return NextResponse.json(score);
      }

      case "health": {
        const health = await complianceEngine.getComplianceHealth(
          tenantId,
          customerId,
          warehouseId,
        );
        return NextResponse.json(health);
      }

      case "requirements": {
        const standard = searchParams.get("standard") || "ISO-9001-2015";
        const requirements = await complianceEngine.assessRequirements(
          tenantId,
          standard,
          customerId,
          warehouseId,
        );
        return NextResponse.json(requirements);
      }

      case "dashboard":
      default: {
        const dashboard = await complianceEngine.getComplianceDashboard(
          tenantId,
          customerId,
          warehouseId,
        );
        return NextResponse.json(dashboard);
      }
    }
  } catch (error) {
    console.error("Error in compliance API:", error);
    return NextResponse.json(
      { error: "Failed to fetch compliance data" },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { action, customerId, warehouseId } = body;
    const tenantId = context.tenantId;

    switch (action) {
      case "monitor": {
        await complianceEngine.monitorCompliance(
          tenantId,
          customerId,
          warehouseId,
        );
        return NextResponse.json({
          success: true,
          message: "Compliance monitoring triggered",
        });
      }

      case "recommendations": {
        const recommendations = await complianceEngine.getRecommendations(
          tenantId,
          customerId,
          warehouseId,
        );
        return NextResponse.json(recommendations);
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in compliance API POST:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.compliance",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.compliance",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

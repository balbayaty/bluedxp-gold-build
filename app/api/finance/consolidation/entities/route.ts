/**
 * Consolidation Entities API
 * GET/POST /api/finance/consolidation/entities
 */

import { NextRequest, NextResponse } from "next/server";
import { consolidationService } from "@/lib/services/finance/consolidationService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId = context.tenantId;

    const entities = await consolidationService.getEntities(tenantId);

    return NextResponse.json({
      success: true,
      data: entities,
    });
  } catch (error: any) {
    console.error("Error getting entities:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get entities",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId;
    const { entityData } = body;

    if (!entityData) {
      return NextResponse.json(
        {
          success: false,
          error: "Entity data is required",
        },
        { status: 400 },
      );
    }

    const entity = await consolidationService.createEntity(
      tenantId,
      entityData,
    );

    return NextResponse.json({
      success: true,
      data: entity,
    });
  } catch (error: any) {
    console.error("Error creating entity:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create entity",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "finance",
  featureId: "finance.consolidation.entities",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.consolidation.entities",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

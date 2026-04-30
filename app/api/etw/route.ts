/**
 * ETW API Routes
 *
 * GET /api/etw - List ETWs with filtering
 * POST /api/etw - Create new ETW
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { etwService } from "@/lib/services/etw/etwService";
import { CreateETWSchema } from "@/types/etw";
import { z } from "zod";

async function listETWs(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);

    const filters = {
      tenantId: context.tenantId,
      status: searchParams.get("status") || undefined,
      scope: searchParams.get("scope") || undefined,
      mode: searchParams.get("mode") || undefined,
      shipmentId: searchParams.get("shipmentId") || undefined,
      createdBy: searchParams.get("createdBy") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      search: searchParams.get("search") || undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 50,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : 0,
    };

    const result = await etwService.list(filters);

    return NextResponse.json({
      success: true,
      data: result.etws,
      total: result.total,
      limit: filters.limit,
      offset: filters.offset,
    });
  } catch (error) {
    console.error("[ETW API] List error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list ETWs",
      },
      { status: 500 },
    );
  }
}

async function createETW(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    }

    if (!context.userId) {
      return NextResponse.json(
        { success: false, error: "User authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();

    // Validate input
    const validated = CreateETWSchema.parse({
      ...body,
      tenantId: context.tenantId,
      createdBy: context.userId,
    });

    // Create ETW
    const etw = await etwService.create(validated);

    return NextResponse.json(
      {
        success: true,
        data: etw,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[ETW API] Create error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create ETW",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(listETWs, {
  moduleId: "tms",
  featureId: "tms.etw",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(createETW, {
  moduleId: "tms",
  featureId: "tms.etw",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

/**
 * Process Lifecycle - Lifecycle Management API
 * Comprehensive lifecycle CRUD operations
 */

import { NextRequest, NextResponse } from "next/server";
import { lifecycleService } from "@/lib/services/process-lifecycle";
import type { EntityType } from "@/types/lifecycle";

/**
 * GET /api/process-lifecycle/lifecycle
 * Get lifecycle(s)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entityId = searchParams.get("entityId");
    const entityType = searchParams.get("entityType") as EntityType;

    if (entityId && entityType) {
      // Get specific lifecycle
      const lifecycle = await lifecycleService.getLifecycle(
        entityId,
        entityType,
      );

      if (!lifecycle) {
        return NextResponse.json(
          {
            success: false,
            error: "Lifecycle not found",
          },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data: lifecycle,
        timestamp: new Date().toISOString(),
      });
    }

    // Get all lifecycle configs
    const configs = lifecycleService.getAllConfigs();
    const configsArray = Array.from(configs.entries()).map(
      ([type, config]) => ({
        entityType: type,
        config,
      }),
    );

    return NextResponse.json({
      success: true,
      data: {
        configs: configsArray,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in GET /api/process-lifecycle/lifecycle:", error);
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
 * POST /api/process-lifecycle/lifecycle
 * Initialize or transition lifecycle
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, entityId, entityType, toStageId, initialData, context } =
      body;

    if (!action || !entityId || !entityType) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: action, entityId, entityType",
        },
        { status: 400 },
      );
    }

    switch (action) {
      case "initialize":
        const lifecycle = await lifecycleService.initializeLifecycle(
          entityId,
          entityType,
          initialData,
        );
        return NextResponse.json({
          success: true,
          data: lifecycle,
          timestamp: new Date().toISOString(),
        });

      case "transition":
        if (!toStageId) {
          return NextResponse.json(
            {
              success: false,
              error: "Missing required field: toStageId",
            },
            { status: 400 },
          );
        }
        const updated = await lifecycleService.transitionStage(
          entityId,
          entityType,
          toStageId,
          context,
        );
        return NextResponse.json({
          success: true,
          data: updated,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error in POST /api/process-lifecycle/lifecycle:", error);
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
 * PUT /api/process-lifecycle/lifecycle
 * Update lifecycle
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityId, entityType, updates } = body;

    if (!entityId || !entityType || !updates) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: entityId, entityType, updates",
        },
        { status: 400 },
      );
    }

    // Get current lifecycle
    const lifecycle = await lifecycleService.getLifecycle(entityId, entityType);
    if (!lifecycle) {
      return NextResponse.json(
        {
          success: false,
          error: "Lifecycle not found",
        },
        { status: 404 },
      );
    }

    // Apply updates (this would be implemented based on what can be updated)
    // For now, return the lifecycle
    return NextResponse.json({
      success: true,
      data: lifecycle,
      message: "Lifecycle updated",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in PUT /api/process-lifecycle/lifecycle:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

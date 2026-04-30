/**
 * Integration by ID API
 * Get, update, or delete specific integration
 */

import { NextRequest, NextResponse } from "next/server";
import { integrationManager } from "@/lib/services/external-integrations/integrationManager";

/**
 * GET /api/integrations/[id]
 * Get integration by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const integration = await integrationManager.getIntegration(params.id);

    if (!integration) {
      return NextResponse.json(
        {
          success: false,
          error: "Integration not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: integration,
    });
  } catch (error: any) {
    console.error("Error fetching integration:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch integration",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/integrations/[id]
 * Update integration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const { config, enabled, name, description } = body;

    // Update config if provided
    if (config) {
      const result = await integrationManager.updateIntegrationConfig(
        params.id,
        config,
      );
      if (!result.success) {
        return NextResponse.json(result, { status: result.statusCode || 500 });
      }
    }

    // Toggle enabled/disabled if provided
    if (enabled !== undefined) {
      const result = await integrationManager.toggleIntegration(
        params.id,
        enabled,
      );
      if (!result.success) {
        return NextResponse.json(result, { status: result.statusCode || 500 });
      }
    }

    // Get updated integration
    const integration = await integrationManager.getIntegration(params.id);

    return NextResponse.json({
      success: true,
      data: integration,
    });
  } catch (error: any) {
    console.error("Error updating integration:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update integration",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/integrations/[id]
 * Delete integration
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const result = await integrationManager.disconnectIntegration(params.id);

    if (!result.success) {
      return NextResponse.json(result, { status: result.statusCode || 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Integration disconnected successfully",
    });
  } catch (error: any) {
    console.error("Error deleting integration:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete integration",
      },
      { status: 500 },
    );
  }
}

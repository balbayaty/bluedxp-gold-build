/**
 * Warehouse Network API - Single Network
 * GET - Get network by ID
 * PATCH - Update network
 * DELETE - Delete network
 */

import { NextRequest, NextResponse } from "next/server";
import { warehouseNetworkService } from "@/lib/services/warehouse-network";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const network = await warehouseNetworkService.getNetwork(params.id);

    if (!network) {
      return NextResponse.json(
        { success: false, error: "Network not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: network,
    });
  } catch (error: any) {
    console.error("Failed to get network:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get network" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const updated = await warehouseNetworkService.updateNetwork(
      params.id,
      body,
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Network not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("Failed to update network:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update network" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const deleted = await warehouseNetworkService.deleteNetwork(params.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Network not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
    });
  } catch (error: any) {
    console.error("Failed to delete network:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete network" },
      { status: 500 },
    );
  }
}

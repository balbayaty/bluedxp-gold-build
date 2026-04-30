/**
 * Warehouse Network Transfers API
 * GET - Get network transfers
 * POST - Create transfer
 */

import { NextRequest, NextResponse } from "next/server";
import { warehouseNetworkService } from "@/lib/services/warehouse-network";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const networkId = searchParams.get("networkId") || "network-1"; // Mock

    const transfers =
      await warehouseNetworkService.getNetworkTransfers(networkId);

    return NextResponse.json({
      success: true,
      data: transfers,
      count: transfers.length,
    });
  } catch (error: any) {
    console.error("Failed to get transfers:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get transfers" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const transfer =
      await warehouseNetworkService.createInventoryTransfer(body);

    return NextResponse.json({
      success: true,
      data: transfer,
    });
  } catch (error: any) {
    console.error("Failed to create transfer:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create transfer" },
      { status: 500 },
    );
  }
}

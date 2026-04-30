/**
 * Warehouse Network API
 * GET - Get all networks
 * POST - Create network
 */

import { NextRequest, NextResponse } from "next/server";
import { warehouseNetworkService } from "@/lib/services/warehouse-network";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get("providerId");

    const networks = providerId
      ? await warehouseNetworkService.getProviderNetworks(providerId)
      : await warehouseNetworkService.getAllNetworks();

    return NextResponse.json({
      success: true,
      data: networks,
      count: networks.length,
    });
  } catch (error: any) {
    console.error("Failed to get networks:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get networks" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, providerName, network } = body;

    if (!providerId || !providerName || !network) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const newNetwork = await warehouseNetworkService.createNetwork(
      providerId,
      providerName,
      network,
    );

    return NextResponse.json({
      success: true,
      data: newNetwork,
    });
  } catch (error: any) {
    console.error("Failed to create network:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create network" },
      { status: 500 },
    );
  }
}

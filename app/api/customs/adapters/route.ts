/**
 * Adapters API
 * GET: List all registered adapters
 */

import { NextRequest, NextResponse } from "next/server";
import { adapterRegistry } from "@/lib/services/customs/adapterRegistry";

export async function GET(request: NextRequest) {
  try {
    const adapters = adapterRegistry.getAllAdapters();

    const adapterStatuses = adapters.map((adapter) => ({
      id: adapter.id,
      name: adapter.name,
      country: adapter.country,
      status: "disconnected" as const, // Would check actual connection status
      environment: "sandbox" as const, // Would get from adapter config
    }));

    return NextResponse.json({
      success: true,
      adapters: adapterStatuses,
      total: adapterStatuses.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

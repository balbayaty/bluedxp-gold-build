/**
 * Test Adapter Connection API
 */

import { NextRequest, NextResponse } from "next/server";
import { adapterRegistry } from "@/lib/services/customs/adapterRegistry";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    // Get adapter from registry
    const adapters = adapterRegistry.getAllAdapters();
    const adapter = adapters.find((a) => a.id === id);

    if (!adapter) {
      return NextResponse.json(
        { success: false, error: "Adapter not found" },
        { status: 404 },
      );
    }

    // Test connection
    const result = await adapter.testConnection();

    return NextResponse.json({
      success: result.success,
      message: result.message,
      details: result.details,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

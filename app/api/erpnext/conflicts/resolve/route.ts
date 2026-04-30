/**
 * ERPNext Conflict Resolution API Endpoint
 *
 * POST /api/erpnext/conflicts/resolve - Resolve sync conflict
 *
 * @module api/erpnext
 */

import { NextRequest, NextResponse } from "next/server";
import { erpNextRealtimeSync } from "@/lib/adapters/erpnext/realtime-sync";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conflictId, strategy, resolvedValue } = body;

    if (!conflictId || !strategy) {
      return NextResponse.json(
        { error: "conflictId and strategy are required" },
        { status: 400 },
      );
    }

    await erpNextRealtimeSync.resolveConflict(
      conflictId,
      strategy,
      resolvedValue,
    );

    return NextResponse.json({
      success: true,
      message: "Conflict resolved successfully",
    });
  } catch (error) {
    console.error("Error resolving conflict:", error);
    return NextResponse.json(
      {
        error: "Failed to resolve conflict",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

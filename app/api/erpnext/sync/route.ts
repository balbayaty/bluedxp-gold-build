/**
 * ERPNext Sync API Endpoint
 *
 * POST /api/erpnext/sync - Sync entity to/from ERPNext
 *
 * @module api/erpnext
 */

import { NextRequest, NextResponse } from "next/server";
import { erpNextRealtimeSync } from "@/lib/adapters/erpnext/realtime-sync";
import { apiAuthMiddleware } from "@/middleware/apiAuth";

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    const body = await request.json();
    const { direction, entityType, entityId, data } = body;
    const tenantId = auth.context.tenantId;

    if (!direction || !entityType) {
      return NextResponse.json(
        { error: "direction and entityType are required" },
        { status: 400 },
      );
    }

    if (direction === "TO_ERPNEXT") {
      if (!entityId || !data) {
        return NextResponse.json(
          { error: "entityId and data are required for TO_ERPNEXT sync" },
          { status: 400 },
        );
      }

      const result = await erpNextRealtimeSync.syncToERPNext(
        entityType,
        entityId,
        data,
        tenantId,
      );

      return NextResponse.json({
        success: result.synced,
        data: result,
        message: result.synced
          ? "Synced to ERPNext successfully"
          : "Sync conflict detected",
      });
    } else if (direction === "FROM_ERPNEXT") {
      const { doctype, erpNextId } = body;
      if (!doctype || !erpNextId) {
        return NextResponse.json(
          { error: "doctype and erpNextId are required for FROM_ERPNEXT sync" },
          { status: 400 },
        );
      }

      const result = await erpNextRealtimeSync.syncFromERPNext(
        doctype,
        erpNextId,
        tenantId,
      );

      return NextResponse.json({
        success: result.synced,
        data: result,
        message: result.synced
          ? "Synced from ERPNext successfully"
          : "Sync conflict detected",
      });
    } else {
      return NextResponse.json(
        { error: "direction must be TO_ERPNEXT or FROM_ERPNEXT" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error syncing with ERPNext:", error);
    return NextResponse.json(
      {
        error: "Failed to sync with ERPNext",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Copilot Real-Time Data API
 * Endpoints for accessing real-time platform data
 * 4IR Aligned • IoT Connectivity • Real-Time Intelligence
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { copilotRealtimeData, type RealtimeDataType } from "@/lib/services/copilot/integrations/realtimeDataService";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "snapshot";
    const dataType = searchParams.get("type") as RealtimeDataType | null;
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    switch (action) {
      case "snapshot": {
        const snapshot = await copilotRealtimeData.getPlatformSnapshot(context.tenantId);
        return NextResponse.json({
          success: true,
          snapshot,
        });
      }

      case "recent": {
        if (!dataType) {
          return NextResponse.json(
            { error: "type parameter is required for recent data" },
            { status: 400 }
          );
        }
        const recentData = copilotRealtimeData.getRecentData(
          context.tenantId,
          dataType,
          Math.min(limit, 100)
        );
        return NextResponse.json({
          success: true,
          type: dataType,
          data: recentData,
          count: recentData.length,
        });
      }

      case "alerts": {
        const alerts = copilotRealtimeData.getRecentAlerts(
          context.tenantId,
          Math.min(limit, 50)
        );
        return NextResponse.json({
          success: true,
          alerts,
          count: alerts.length,
        });
      }

      case "subscribe": {
        // In production, this would upgrade to WebSocket
        // For now, return subscription info
        return NextResponse.json({
          success: true,
          message: "WebSocket subscription info",
          websocketUrl: "/api/copilot/realtime/ws",
          availableTypes: [
            "inventory_level",
            "shipment_status",
            "order_update",
            "alert",
            "iot_sensor",
            "kpi_update",
            "incident",
            "notification",
          ],
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("[Realtime API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch real-time data", details: error?.message },
      { status: 500 }
    );
  }
}

// POST to start simulation (for testing)
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));

    if (body.action === "simulate") {
      // Start simulation for testing
      copilotRealtimeData.simulateData(context.tenantId);
      return NextResponse.json({
        success: true,
        message: "Simulation started (will run for 5 minutes)",
      });
    }

    if (body.action === "initialize") {
      await copilotRealtimeData.initialize();
      return NextResponse.json({
        success: true,
        message: "Real-time data service initialized",
      });
    }

    return NextResponse.json(
      { error: "Unknown action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[Realtime API] Error:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error?.message },
      { status: 500 }
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "ai",
  featureId: "ai.copilot",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "ai",
  featureId: "ai.copilot",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

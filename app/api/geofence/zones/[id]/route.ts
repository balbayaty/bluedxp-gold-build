/**
 * Geofence Zone API Endpoint (by id)
 *
 * GET    /api/geofence/zones/:id
 * PUT    /api/geofence/zones/:id
 * DELETE /api/geofence/zones/:id  (soft delete: disable)
 */

import { NextRequest, NextResponse } from "next/server";
import { withGeofenceAPI } from "@/lib/services/geofence/apiMiddleware";
import { Action } from "@/types/user";
import { geofenceZoneService } from "@/lib/services/geofence";

export const GET = withGeofenceAPI(
  async (request: NextRequest, ctx: { params: { id: string } }) => {
    try {
      const { searchParams } = new URL(request.url);
      const tenantId = searchParams.get("tenantId") || "default";
      const zoneId = ctx.params.id;

      const zone = await geofenceZoneService.getZone(zoneId, tenantId);
      if (!zone) {
        return NextResponse.json({ error: "Zone not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: zone });
    } catch (error) {
      console.error("Error getting geofence zone:", error);
      return NextResponse.json(
        {
          error: "Failed to get geofence zone",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  },
  {
    action: "read" as Action,
    featureId: "geofence",
  },
);

export const PUT = withGeofenceAPI(
  async (request: NextRequest, ctx: { params: { id: string } }) => {
    try {
      const { searchParams } = new URL(request.url);
      const tenantId = searchParams.get("tenantId") || "default";
      const zoneId = ctx.params.id;
      const body = await request.json();

      const updated = await geofenceZoneService.updateZone(
        zoneId,
        tenantId,
        body,
      );
      return NextResponse.json({
        success: true,
        data: updated,
        message: "Zone updated",
      });
    } catch (error) {
      console.error("Error updating geofence zone:", error);
      return NextResponse.json(
        {
          error: "Failed to update geofence zone",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  },
  {
    action: "update" as Action,
    featureId: "geofence",
  },
);

export const DELETE = withGeofenceAPI(
  async (request: NextRequest, ctx: { params: { id: string } }) => {
    try {
      const { searchParams } = new URL(request.url);
      const tenantId = searchParams.get("tenantId") || "default";
      const zoneId = ctx.params.id;

      const updated = await geofenceZoneService.disableZone(zoneId, tenantId);
      return NextResponse.json({
        success: true,
        data: updated,
        message: "Zone disabled",
      });
    } catch (error) {
      console.error("Error disabling geofence zone:", error);
      return NextResponse.json(
        {
          error: "Failed to disable geofence zone",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  },
  {
    action: "delete" as Action,
    featureId: "geofence",
  },
);

/**
 * Geofence Zones API Endpoint
 *
 * POST /api/geofence/zones - Create zone
 * GET /api/geofence/zones - List zones
 *
 * @module api/geofence
 */

import { NextRequest, NextResponse } from "next/server";
import { geofenceZoneService } from "@/lib/services/geofence";
import { withGeofenceAPI } from "@/lib/services/geofence/apiMiddleware";
import { Action } from "@/types/user";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export const POST = withGeofenceAPI(
  async (request: NextRequest) => {
    try {
      const body = await request.json();

      if (!isNonEmptyString(body?.tenantId)) {
        return NextResponse.json(
          { error: "tenantId is required" },
          { status: 400 },
        );
      }
      if (!isNonEmptyString(body?.name)) {
        return NextResponse.json(
          { error: "name is required" },
          { status: 400 },
        );
      }
      if (!isNonEmptyString(body?.type)) {
        return NextResponse.json(
          { error: "type is required" },
          { status: 400 },
        );
      }
      if (!body?.geometry || !isNonEmptyString(body.geometry.type)) {
        return NextResponse.json(
          { error: "geometry.type is required" },
          { status: 400 },
        );
      }

      // Minimal geometry validation
      if (body.geometry.type === "CIRCLE") {
        const coords = body.geometry.coordinates;
        const center = coords?.center;
        const radius = coords?.radius;
        if (
          !center ||
          !isFiniteNumber(center.lat) ||
          !isFiniteNumber(center.lng)
        ) {
          return NextResponse.json(
            { error: "CIRCLE center.lat and center.lng are required numbers" },
            { status: 400 },
          );
        }
        if (!isFiniteNumber(radius) || radius <= 0) {
          return NextResponse.json(
            { error: "CIRCLE radius must be a number > 0 (meters)" },
            { status: 400 },
          );
        }
      } else if (body.geometry.type === "POLYGON") {
        const coords = body.geometry.coordinates;
        if (!Array.isArray(coords) || coords.length < 3) {
          return NextResponse.json(
            { error: "POLYGON coordinates must be an array of 3+ points" },
            { status: 400 },
          );
        }
      } else {
        return NextResponse.json(
          { error: "geometry.type must be POLYGON or CIRCLE" },
          { status: 400 },
        );
      }

      const zone = await geofenceZoneService.createZone({
        ...body,
        enabled: typeof body.enabled === "boolean" ? body.enabled : true,
        metadata: body.metadata || {},
        tenantId: body.tenantId,
        name: body.name,
        type: body.type,
      });

      return NextResponse.json({
        success: true,
        data: zone,
        message: "Geofence zone created successfully",
      });
    } catch (error) {
      console.error("Error creating geofence zone:", error);
      return NextResponse.json(
        {
          error: "Failed to create geofence zone",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  },
  {
    action: "create" as Action,
    featureId: "geofence",
  },
);

export const GET = withGeofenceAPI(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const tenantId =
        request.headers.get("x-tenant-id") || searchParams.get("tenantId");
      if (!tenantId || tenantId.trim().length === 0) {
        return NextResponse.json(
          {
            error:
              "tenantId is required (x-tenant-id header or tenantId query param)",
          },
          { status: 400 },
        );
      }

      const zones = await geofenceZoneService.listZones(tenantId);
      return NextResponse.json({
        success: true,
        data: {
          zones,
          totalCount: zones.length,
        },
      });
    } catch (error) {
      console.error("Error getting geofence zones:", error);
      return NextResponse.json(
        {
          error: "Failed to get geofence zones",
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

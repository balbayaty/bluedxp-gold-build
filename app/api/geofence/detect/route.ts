/**
 * Geofence Detection API Endpoint
 *
 * POST /api/geofence/detect - Detect zone entry/exit
 *
 * @module api/geofence
 */

import { NextRequest, NextResponse } from "next/server";
import { geofenceZoneService } from "@/lib/services/geofence";
import {
  sendGeofenceWhatsAppNotification,
  handleGeofenceQuantumTrigger,
} from "@/lib/services/geofence/whatsapp-integration";
import { withGeofenceAPI } from "@/lib/services/geofence/apiMiddleware";
import { Action } from "@/types/user";

export const POST = withGeofenceAPI(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { location, shipmentId, vehicleId, tenantId, driverName } = body;
      const resolvedTenantId = tenantId || request.headers.get("x-tenant-id");

      if (!location || !shipmentId || !vehicleId) {
        return NextResponse.json(
          { error: "location, shipmentId, and vehicleId are required" },
          { status: 400 },
        );
      }

      if (!resolvedTenantId || String(resolvedTenantId).trim().length === 0) {
        return NextResponse.json(
          {
            error: "tenantId is required (body.tenantId or x-tenant-id header)",
          },
          { status: 400 },
        );
      }

      // Detect zone event
      const event = await geofenceZoneService.detectZoneEvent(
        location,
        shipmentId,
        vehicleId,
        String(resolvedTenantId),
      );

      if (event) {
        const zone = await geofenceZoneService.getZone(
          event.zoneId,
          String(resolvedTenantId),
        );

        if (zone) {
          // Send WhatsApp notification
          if (driverName) {
            await sendGeofenceWhatsAppNotification(
              event,
              zone,
              driverName,
              String(resolvedTenantId),
            );
          }

          // Handle quantum trigger
          await handleGeofenceQuantumTrigger(
            event,
            zone,
            shipmentId,
            String(resolvedTenantId),
          );
        }
      }

      return NextResponse.json({
        success: true,
        data: event,
        message: event ? "Zone event detected" : "No zone event",
      });
    } catch (error) {
      console.error("Error detecting geofence event:", error);
      return NextResponse.json(
        {
          error: "Failed to detect geofence event",
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

/**
 * WhatsApp Location API
 *
 * POST /api/geofence/whatsapp/location
 * Process WhatsApp location message
 */

import { NextRequest, NextResponse } from "next/server";
import { whatsappLocationHandler } from "@/lib/services/geofence/whatsapp/locationHandler";
import { withGeofenceAPI } from "@/lib/services/geofence/apiMiddleware";
import { Action } from "@/types/user";
import type { WhatsAppLocationMessage } from "@/lib/services/geofence/whatsapp/locationHandler";

export const POST = withGeofenceAPI(
  async (request: NextRequest, context: { tenantId?: string }) => {
    try {
      const body = await request.json();
      const {
        messageId,
        from,
        timestamp,
        location,
        context: messageContext,
      } = body;
      const tenantId = context?.tenantId;

      // Validate input
      if (
        !messageId ||
        !from ||
        !location ||
        !location.latitude ||
        !location.longitude
      ) {
        return NextResponse.json(
          {
            error:
              "Missing required fields: messageId, from, location (latitude, longitude)",
          },
          { status: 400 },
        );
      }
      if (!tenantId) {
        return NextResponse.json(
          { error: "Tenant context required" },
          { status: 400 },
        );
      }

      const message: WhatsAppLocationMessage = {
        messageId,
        from,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: location.address,
        },
        context: messageContext,
      };

      const result = await whatsappLocationHandler.processLocationMessage(
        message,
        tenantId,
      );

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error processing WhatsApp location:", error);
      return NextResponse.json(
        {
          error: "Failed to process WhatsApp location",
          details: error instanceof Error ? error.message : "Unknown error",
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

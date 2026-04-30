/**
 * Geofence Analytics API
 *
 * Returns comprehensive analytics for geofence system
 */

import { NextRequest, NextResponse } from "next/server";
import { geofenceZoneService } from "@/lib/services/geofence";
import { geofenceAnalyticsService } from "@/lib/services/geofence/analytics/geofenceAnalyticsService";
import { geofenceDatabaseService } from "@/lib/services/geofence/database/geofenceDatabaseService";
import { withGeofenceAPI } from "@/lib/services/geofence/apiMiddleware";
import { Action } from "@/types/user";

export const GET = withGeofenceAPI(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const tenantId = searchParams.get("tenantId") || "default";
      const startParam = searchParams.get("start");
      const endParam = searchParams.get("end");

      const period = {
        start: startParam
          ? new Date(startParam)
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endParam ? new Date(endParam) : new Date(),
      };

      // Get zones
      const zones = await geofenceZoneService.listZones(tenantId);

      // Get events from database
      const events = await geofenceDatabaseService.listEvents(tenantId, {
        startDate: period.start,
        endDate: period.end,
        limit: 10000, // Get all events for analytics
      });

      // Generate analytics
      const analytics = await geofenceAnalyticsService.generateAnalytics(
        tenantId,
        zones,
        events,
        period,
      );

      return NextResponse.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("Error generating geofence analytics:", error);
      return NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to generate analytics",
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

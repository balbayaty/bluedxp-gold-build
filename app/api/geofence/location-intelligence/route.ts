/**
 * Location Intelligence API
 *
 * POST /api/geofence/location-intelligence
 * Process location input and generate intelligent zone draft
 */

import { NextRequest, NextResponse } from "next/server";
import { locationIntelligenceService } from "@/lib/services/geofence/ai/locationIntelligenceService";
import { withGeofenceAPI } from "@/lib/services/geofence/apiMiddleware";
import { Action } from "@/types/user";
import type { LocationInput } from "@/lib/services/geofence/ai/locationIntelligenceService";

export const POST = withGeofenceAPI(
  async (request: NextRequest, context: { tenantId?: string }) => {
    try {
      const body = await request.json();
      const { type, source, data, metadata } = body;
      const tenantId = context?.tenantId;

      // Validate input
      if (!type || !data) {
        return NextResponse.json(
          { error: "Missing required fields: type, data" },
          { status: 400 },
        );
      }
      if (!tenantId) {
        return NextResponse.json(
          { error: "Tenant context required" },
          { status: 400 },
        );
      }

      const locationInput: LocationInput = {
        type,
        source: source || "api",
        data,
        metadata,
      };

      const result = await locationIntelligenceService.processLocation(
        locationInput,
        tenantId,
      );

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error processing location intelligence:", error);
      return NextResponse.json(
        {
          error: "Failed to process location intelligence",
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

/**
 * Learn from correction
 * PUT /api/geofence/location-intelligence
 */
export const PUT = withGeofenceAPI(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { learningId, correctedLocation, correctedZone } = body;

      if (!learningId || !correctedLocation) {
        return NextResponse.json(
          { error: "Missing required fields: learningId, correctedLocation" },
          { status: 400 },
        );
      }

      await locationIntelligenceService.learnFromCorrection(
        learningId,
        correctedLocation,
        correctedZone || {},
      );

      return NextResponse.json({
        success: true,
        message: "Correction learned successfully",
      });
    } catch (error) {
      console.error("Error learning from correction:", error);
      return NextResponse.json(
        {
          error: "Failed to learn from correction",
          details: error instanceof Error ? error.message : "Unknown error",
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

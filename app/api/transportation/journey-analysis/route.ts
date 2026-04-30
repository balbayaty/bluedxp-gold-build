/**
 * Journey Analysis API Route
 *
 * Dynamic journey analysis based on loading points, destinations, and touchpoints
 * Multi-modal support (Europe to Middle East)
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { journeyAnalysisService } from "@/lib/services/transportation";
import { comprehensiveShipmentService } from "@/lib/services/transportation";
import {
  generateDemoJourneyAnalysis,
  isDemoModeEnabled,
} from "@/lib/services/demo/demoDataService";

async function handler(
  req: NextRequest,
  context: { tenantId?: string; userId?: string },
) {
  try {
    const body = await req.json();
    const { action, shipmentId, journeyId, touchpointId, ...params } = body;
    const tenantId = context?.tenantId;

    switch (action) {
      case "analyze": {
        if (!tenantId || String(tenantId).trim().length === 0) {
          return NextResponse.json(
            { error: "tenantId is required (multi-tenant day 1)" },
            { status: 400 },
          );
        }

        // Return demo data if enabled (for quick demos)
        // Special handling for Saudi-Kuwait route (beautiful detailed route)
        if (isDemoModeEnabled()) {
          const demoAnalysis = generateDemoJourneyAnalysis(shipmentId);
          return NextResponse.json({ analysis: demoAnalysis });
        }

        // Get shipment (in production, fetch from database)
        // For now, create a basic shipment structure
        const shipment = {
          id: shipmentId,
          origin: params.origin || {
            address: { city: "Origin", country: "Country", countryCode: "XX" },
          },
          destination: params.destination || {
            address: {
              city: "Destination",
              country: "Country",
              countryCode: "YY",
            },
          },
          mode: params.mode || "MULTIMODAL",
          route: params.route,
          intermediateStops: params.intermediateStops,
          pickupDate: params.pickupDate,
          estimatedDelivery: params.estimatedDelivery,
          tenantId: String(tenantId),
        } as any;

        // Analyze journey
        const analysis = await journeyAnalysisService.analyzeJourney({
          shipment,
          includeRootCauseAnalysis: params.includeRootCauseAnalysis !== false,
          includeOptimization: params.includeOptimization !== false,
          includePredictions: params.includePredictions !== false,
          context: {
            tenantId: String(tenantId),
            userId: context?.userId,
            correlationId: shipmentId,
          },
        });

        return NextResponse.json({ analysis });
      }

      case "list": {
        // ✅ Multi-tenant: tenantId is required
        if (!tenantId || String(tenantId).trim().length === 0) {
          return NextResponse.json(
            { error: "tenantId is required (multi-tenant day 1)" },
            { status: 400 },
          );
        }

        // Extract filters from params
        const { mode, status, limit } = params;

        // Await the async service call with tenantId for isolation
        const journeys = await journeyAnalysisService.listJourneys({
          mode,
          status,
          limit: typeof limit === "number" ? limit : 20,
          shipmentId: shipmentId, // optional filter
          tenantId: String(tenantId), // ✅ Multi-tenant isolation
        });

        // If no journeys found in DB and we are in demo mode, return some demos?
        // OR just return empty list. Let's return empty list for now to rely on real data.
        // However, for the "mind blowing" demo effect if DB is empty, user might see nothing.
        // Let's stick to real data as requested ("no compromise").

        return NextResponse.json({ journeys });
      }

      case "get": {
        // Await the async service call
        const analysis = await journeyAnalysisService.getJourneyAnalysis(
          journeyId || params.journeyId,
        );
        if (!analysis) {
          return NextResponse.json(
            { error: "Journey analysis not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({ analysis });
      }

      case "get-by-shipment": {
        // Await the async service call
        const analysis =
          await journeyAnalysisService.getJourneyByShipmentId(shipmentId);
        if (!analysis) {
          // Return demo data if enabled
          if (isDemoModeEnabled()) {
            const demoAnalysis = generateDemoJourneyAnalysis(shipmentId);
            return NextResponse.json({ analysis: demoAnalysis });
          }
          return NextResponse.json(
            { error: "Journey analysis not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({ analysis });
      }

      case "update-touchpoint": {
        if (!tenantId || String(tenantId).trim().length === 0) {
          return NextResponse.json(
            { error: "tenantId is required (multi-tenant day 1)" },
            { status: 400 },
          );
        }
        const { status, actualArrival, actualDeparture } = params;
        await journeyAnalysisService.updateTouchpointStatus(
          journeyId,
          touchpointId,
          status,
          actualArrival ? new Date(actualArrival) : undefined,
          actualDeparture ? new Date(actualDeparture) : undefined,
          {
            tenantId: String(tenantId),
            userId: context?.userId,
            correlationId: journeyId,
          },
        );

        // Await the async service call
        const analysis =
          await journeyAnalysisService.getJourneyAnalysis(journeyId);
        return NextResponse.json({ analysis });
      }

      case "touchpoint-in": {
        if (!tenantId || String(tenantId).trim().length === 0) {
          return NextResponse.json(
            { error: "tenantId is required (multi-tenant day 1)" },
            { status: 400 },
          );
        }
        if (!touchpointId) {
          return NextResponse.json(
            { error: "touchpointId is required" },
            { status: 400 },
          );
        }
        const { timestamp } = params;
        await journeyAnalysisService.recordTouchpointIn(
          journeyId,
          touchpointId,
          timestamp ? new Date(timestamp) : undefined,
          {
            tenantId: String(tenantId),
            userId: context?.userId,
            correlationId: journeyId,
          },
        );

        const analysis =
          await journeyAnalysisService.getJourneyAnalysis(journeyId);
        return NextResponse.json({
          success: true,
          message: "Touchpoint IN recorded",
          analysis,
        });
      }

      case "touchpoint-out": {
        if (!tenantId || String(tenantId).trim().length === 0) {
          return NextResponse.json(
            { error: "tenantId is required (multi-tenant day 1)" },
            { status: 400 },
          );
        }
        if (!touchpointId) {
          return NextResponse.json(
            { error: "touchpointId is required" },
            { status: 400 },
          );
        }
        const { timestamp } = params;
        await journeyAnalysisService.recordTouchpointOut(
          journeyId,
          touchpointId,
          timestamp ? new Date(timestamp) : undefined,
          {
            tenantId: String(tenantId),
            userId: context?.userId,
            correlationId: journeyId,
          },
        );

        const analysis =
          await journeyAnalysisService.getJourneyAnalysis(journeyId);
        return NextResponse.json({
          success: true,
          message: "Touchpoint OUT recorded",
          analysis,
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Journey analysis API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(handler, { action: "execute" });
export const GET = withTransportationAPI(handler, { action: "execute" });

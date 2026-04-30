/**
 * Predictive Analytics API
 *
 * Demand forecasting, disruption prediction, carrier performance prediction
 */

import { NextRequest, NextResponse } from "next/server";
import { transportationPredictiveAnalyticsService } from "@/lib/services/transportation";
import type { TransportMode } from "@/types/tms";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";

async function handler(request: NextRequest, context: { tenantId?: string }) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body = await request.json();
    const { action } = body;

    if (action === "forecast") {
      const { mode, region, from, to } = body;
      if (!mode || !region || !from || !to) {
        return NextResponse.json(
          { error: "Missing required fields: mode, region, from, to" },
          { status: 400 },
        );
      }

      const forecast =
        await transportationPredictiveAnalyticsService.forecastDemand(
          mode as TransportMode,
          region,
          {
            from: new Date(from),
            to: new Date(to),
          },
          { tenantId } as any,
        );

      return NextResponse.json(forecast);
    }

    if (action === "disruptions") {
      const { shipmentId } = body;
      if (!shipmentId) {
        return NextResponse.json(
          { error: "Missing shipmentId" },
          { status: 400 },
        );
      }

      const shipment = await transportationDatabaseAdapterInstance.getShipment(
        tenantId,
        String(shipmentId),
      );
      if (!shipment)
        return NextResponse.json(
          { error: "Shipment not found" },
          { status: 404 },
        );

      const predictions =
        await transportationPredictiveAnalyticsService.predictDisruptions(
          shipment as any,
          { tenantId } as any,
        );

      return NextResponse.json(predictions);
    }

    if (action === "carrier-performance") {
      const { carrierId } = body;
      if (!carrierId) {
        return NextResponse.json(
          { error: "Missing carrierId" },
          { status: 400 },
        );
      }

      const prediction =
        await transportationPredictiveAnalyticsService.predictCarrierPerformance(
          carrierId,
        );
      return NextResponse.json(prediction);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in predictive analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to get prediction",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(handler, {
  featureId: "predictive",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

/**
 * Carrier Network Management API
 *
 * Carrier segmentation, rating, capacity, network coverage
 */

import { NextRequest, NextResponse } from "next/server";
import { carrierNetworkService } from "@/lib/services/transportation";
import type { CarrierSegment } from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";

async function postHandler(
  request: NextRequest,
  context: { tenantId?: string },
) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const action = request.nextUrl.searchParams.get("action");

    if (action === "segment") {
      const body: Omit<CarrierSegment, "id" | "carriers"> =
        await request.json();
      const segmentId = await carrierNetworkService.createSegment(body);
      return NextResponse.json({ segmentId }, { status: 201 });
    }

    if (action === "rate") {
      const body: { carrierId: string } = await request.json();
      if (!body.carrierId) {
        return NextResponse.json(
          { error: "Missing carrierId" },
          { status: 400 },
        );
      }
      const rating = await carrierNetworkService.rateCarrier(body.carrierId);
      return NextResponse.json(rating);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in carrier network operation:", error);
    return NextResponse.json(
      {
        error: "Operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function getHandler(
  request: NextRequest,
  context: { tenantId?: string },
) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");
    const region = searchParams.get("region");
    const carrierId = searchParams.get("carrierId");
    const mode = searchParams.get("mode");

    if (action === "coverage" && region) {
      const coverage =
        await carrierNetworkService.analyzeNetworkCoverage(region);
      return NextResponse.json(coverage);
    }

    if (action === "capacity" && carrierId && mode) {
      const capacity = await carrierNetworkService.getCarrierCapacity(
        carrierId,
        mode,
      );
      return NextResponse.json(capacity);
    }

    if (action === "prioritize") {
      const criteria: any = {};
      if (searchParams.get("mode")) criteria.mode = searchParams.get("mode");
      if (searchParams.get("region"))
        criteria.region = searchParams.get("region");
      if (searchParams.get("minRating"))
        criteria.minRating = Number(searchParams.get("minRating"));

      const carriers = await carrierNetworkService.prioritizeCarriers(criteria);
      return NextResponse.json(carriers);
    }

    return NextResponse.json(
      { error: "Invalid action or missing parameters" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error getting carrier network data:", error);
    return NextResponse.json(
      {
        error: "Failed to get data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(postHandler, {
  featureId: "carriers",
  action: "manage",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withTransportationAPI(getHandler, {
  featureId: "carriers",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});

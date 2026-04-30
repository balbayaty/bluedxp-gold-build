/**
 * Advanced Load Building API
 *
 * Multi-temperature zones, wagon balancing, 3D optimization
 */

import { NextRequest, NextResponse } from "next/server";
import {
  advancedLoadBuildingService,
  handleTransportationError,
} from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import type {
  LoadBuildingRequest,
  WagonBalancingRequest,
} from "@/lib/services/transportation";

export const POST = withTransportationAPI(
  async (request: NextRequest, ctx: { tenantId?: string; userId?: string }) => {
    try {
      const tenantId = ctx.tenantId;
      const userId = ctx.userId || "api-user";
      if (!tenantId)
        return NextResponse.json(
          { error: "Tenant context required" },
          { status: 400 },
        );

      const body = await request.json();
      const { action } = body;

      if (action === "build-load") {
        const loadRequest: LoadBuildingRequest = body.request;

        if (
          !loadRequest.items ||
          !loadRequest.vehicle ||
          !loadRequest.createdBy
        ) {
          return NextResponse.json(
            { error: "Missing required fields: items, vehicle, createdBy" },
            { status: 400 },
          );
        }

        const result =
          await advancedLoadBuildingService.buildLoadPlan(loadRequest);
        // Persist load plan for durability + analytics (tenant-scoped)
        await transportationDatabaseAdapterInstance.storeLoadPlan(
          result.loadPlan as any,
          { tenantId, createdBy: userId },
        );
        return NextResponse.json(result, { status: 200 });
      }

      if (action === "balance-wagons") {
        const wagonRequest: WagonBalancingRequest = body.request;

        if (
          !wagonRequest.wagons ||
          !wagonRequest.items ||
          !wagonRequest.createdBy
        ) {
          return NextResponse.json(
            { error: "Missing required fields: wagons, items, createdBy" },
            { status: 400 },
          );
        }

        const result =
          await advancedLoadBuildingService.balanceWagons(wagonRequest);
        return NextResponse.json(result, { status: 200 });
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
      console.error("Error in load building:", error);
      const errorResponse = handleTransportationError(error);
      return NextResponse.json(
        { error: errorResponse.message, details: errorResponse.details },
        { status: errorResponse.statusCode },
      );
    }
  },
  {
    featureId: "load-building",
    action: "create",
    requireAuth: true,
    rateLimit: true,
  },
);

export const GET = withTransportationAPI(
  async (request: NextRequest, ctx: { tenantId?: string }) => {
    try {
      const tenantId = ctx.tenantId;
      if (!tenantId)
        return NextResponse.json(
          { error: "Tenant context required" },
          { status: 400 },
        );

      const searchParams = request.nextUrl.searchParams;
      const loadPlanId = searchParams.get("loadPlanId");

      if (loadPlanId) {
        const loadPlan =
          await transportationDatabaseAdapterInstance.getLoadPlan(
            tenantId,
            loadPlanId,
          );
        if (!loadPlan) {
          return NextResponse.json(
            { error: "Load plan not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({ loadPlan });
      }

      // List all load plans
      const loadPlans =
        await transportationDatabaseAdapterInstance.listLoadPlans({
          tenantId,
          limit: 500,
          offset: 0,
        });
      return NextResponse.json({ loadPlans });
    } catch (error) {
      console.error("Error fetching load plans:", error);
      const errorResponse = handleTransportationError(error);
      return NextResponse.json(
        { error: errorResponse.message, details: errorResponse.details },
        { status: errorResponse.statusCode },
      );
    }
  },
  {
    featureId: "load-building",
    action: "read_only",
    requireAuth: true,
    rateLimit: true,
  },
);

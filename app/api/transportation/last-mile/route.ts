/**
 * Last-Mile Optimization API
 *
 * Route optimization for last-mile delivery
 */

import { NextRequest, NextResponse } from "next/server";
import {
  lastMileOptimizationService,
  handleTransportationError,
} from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import type { LastMileOptimizationRequest } from "@/lib/services/transportation";

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

      if (action === "optimize") {
        const optimizationRequest: LastMileOptimizationRequest = body.request;

        if (
          !optimizationRequest.stops ||
          !optimizationRequest.vehicle ||
          !optimizationRequest.objectives ||
          !optimizationRequest.createdBy
        ) {
          return NextResponse.json(
            {
              error:
                "Missing required fields: stops, vehicle, objectives, createdBy",
            },
            { status: 400 },
          );
        }

        const result =
          await lastMileOptimizationService.optimizeRoute(optimizationRequest);
        await transportationDatabaseAdapterInstance.storeLastMileRoute(
          result.route as any,
          { tenantId, createdBy: userId },
        );
        return NextResponse.json(result, { status: 200 });
      }

      if (action === "update-stop-status") {
        const { routeId, stopId, status, notes } = body;

        if (!routeId || !stopId || !status) {
          return NextResponse.json(
            { error: "Missing required fields: routeId, stopId, status" },
            { status: 400 },
          );
        }

        await lastMileOptimizationService.updateStopStatus(
          routeId,
          stopId,
          status,
          notes,
        );
        const updated = lastMileOptimizationService.getRoute(routeId);
        if (updated) {
          await transportationDatabaseAdapterInstance.storeLastMileRoute(
            updated as any,
            { tenantId, createdBy: userId },
          );
        }
        return NextResponse.json({ success: true }, { status: 200 });
      }

      if (action === "send-notification") {
        const { shipmentId, stopId, type, estimatedArrival } = body;

        if (!shipmentId || !stopId || !type) {
          return NextResponse.json(
            { error: "Missing required fields: shipmentId, stopId, type" },
            { status: 400 },
          );
        }

        const notificationId =
          await lastMileOptimizationService.sendCustomerNotification(
            shipmentId,
            stopId,
            type,
            estimatedArrival ? new Date(estimatedArrival) : undefined,
          );

        return NextResponse.json({ notificationId }, { status: 200 });
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
      console.error("Error in last-mile optimization:", error);
      const errorResponse = handleTransportationError(error);
      return NextResponse.json(
        { error: errorResponse.message, details: errorResponse.details },
        { status: errorResponse.statusCode },
      );
    }
  },
  {
    featureId: "last-mile",
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
      const routeId = searchParams.get("routeId");

      if (routeId) {
        const route =
          (await transportationDatabaseAdapterInstance.getLastMileRoute(
            tenantId,
            routeId,
          )) || lastMileOptimizationService.getRoute(routeId);
        if (!route) {
          return NextResponse.json(
            { error: "Route not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({ route });
      }

      // List all routes
      const routes =
        await transportationDatabaseAdapterInstance.listLastMileRoutes({
          tenantId,
          limit: 500,
          offset: 0,
        });
      return NextResponse.json({ routes });
    } catch (error) {
      console.error("Error fetching last-mile routes:", error);
      const errorResponse = handleTransportationError(error);
      return NextResponse.json(
        { error: errorResponse.message, details: errorResponse.details },
        { status: errorResponse.statusCode },
      );
    }
  },
  {
    featureId: "last-mile",
    action: "read_only",
    requireAuth: true,
    rateLimit: true,
  },
);

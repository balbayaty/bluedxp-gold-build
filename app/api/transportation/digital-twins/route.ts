/**
 * Digital Twins API
 *
 * Virtual fleet representation and predictive maintenance
 */

import { NextRequest, NextResponse } from "next/server";
import {
  digitalTwinsService,
  handleTransportationError,
} from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import type {
  PhysicalProperties,
  VirtualProperties,
} from "@/lib/services/transportation";

export const POST = withTransportationAPI(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { action } = body;

      if (action === "create-twin") {
        const {
          entityType,
          entityId,
          name,
          physicalProperties,
          virtualProperties,
        } = body;

        if (!entityType || !entityId || !name || !physicalProperties) {
          return NextResponse.json(
            {
              error:
                "Missing required fields: entityType, entityId, name, physicalProperties",
            },
            { status: 400 },
          );
        }

        const twinId = await digitalTwinsService.createTwin(
          entityType,
          entityId,
          name,
          physicalProperties,
          virtualProperties,
        );

        return NextResponse.json({ twinId }, { status: 201 });
      }

      if (action === "sync") {
        const { twinId, source, data } = body;

        if (!twinId || !source || !data) {
          return NextResponse.json(
            { error: "Missing required fields: twinId, source, data" },
            { status: 400 },
          );
        }

        const sync = await digitalTwinsService.syncTwin(twinId, source, data);
        return NextResponse.json({ sync }, { status: 200 });
      }

      if (action === "sync-from-iot") {
        const { twinId, shipmentId } = body;

        if (!twinId) {
          return NextResponse.json(
            { error: "Missing twinId" },
            { status: 400 },
          );
        }

        const sync = await digitalTwinsService.syncFromIoT(twinId, shipmentId);
        return NextResponse.json({ sync }, { status: 200 });
      }

      if (action === "simulate") {
        const { twinId, scenario } = body;

        if (!twinId || !scenario) {
          return NextResponse.json(
            { error: "Missing required fields: twinId, scenario" },
            { status: 400 },
          );
        }

        const result = await digitalTwinsService.simulateScenario(
          twinId,
          scenario,
        );
        return NextResponse.json(result, { status: 200 });
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
      console.error("Error in digital twins:", error);
      const errorResponse = handleTransportationError(error);
      return NextResponse.json(
        { error: errorResponse.message, details: errorResponse.details },
        { status: errorResponse.statusCode },
      );
    }
  },
  {
    featureId: "digital-twins",
    action: "create",
    requireAuth: true,
    rateLimit: true,
  },
);

export const GET = withTransportationAPI(
  async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const twinId = searchParams.get("twinId");
      const entityType = searchParams.get("entityType");
      const entityId = searchParams.get("entityId");

      if (twinId) {
        const twin = digitalTwinsService.getTwin(twinId);
        if (!twin) {
          return NextResponse.json(
            { error: "Digital twin not found" },
            { status: 404 },
          );
        }

        const syncHistory = digitalTwinsService.getSyncHistory(twinId);
        return NextResponse.json({ twin, syncHistory });
      }

      if (entityType && entityId) {
        const twin = digitalTwinsService.getTwinByEntity(
          entityType as any,
          entityId,
        );
        if (!twin) {
          return NextResponse.json(
            { error: "Digital twin not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({ twin });
      }

      // List all twins
      const twins = digitalTwinsService.listTwins(entityType as any);
      return NextResponse.json({ twins });
    } catch (error) {
      console.error("Error fetching digital twins:", error);
      const errorResponse = handleTransportationError(error);
      return NextResponse.json(
        { error: errorResponse.message, details: errorResponse.details },
        { status: errorResponse.statusCode },
      );
    }
  },
  {
    featureId: "digital-twins",
    action: "read_only",
    requireAuth: true,
    rateLimit: true,
  },
);

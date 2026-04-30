/**
 * Ports & Terminals Management API
 *
 * Manage port operations and terminal activities
 */

import { NextRequest, NextResponse } from "next/server";
import { portsService } from "@/lib/services/transportation/portsService";
import type { CreatePortRequest } from "@/lib/services/transportation/portsService";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import { evidenceService } from "@/lib/services/evidence";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";

async function postHandler(
  request: NextRequest,
  context: { tenantId?: string; userId?: string },
) {
  try {
    const tenantId = context.tenantId;
    const userId = context.userId || "api-user";
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body = await request.json();
    const action = body.action || "create";

    if (action === "create") {
      const portRequest: CreatePortRequest = {
        code: body.code,
        name: body.name,
        country: body.country,
        region: body.region,
        type: body.type,
        status: body.status || "OPERATIONAL",
        location: body.location,
        operatingHours: body.operatingHours,
        capacity: body.capacity,
        metadata: body.metadata,
        createdBy: userId,
        tenantId,
      };

      if (
        !portRequest.code ||
        !portRequest.name ||
        !portRequest.country ||
        !portRequest.type
      ) {
        return NextResponse.json(
          { error: "Missing required fields: code, name, country, type" },
          { status: 400 },
        );
      }

      const port = await portsService.createPort(portRequest);

      // Persist to database
      await transportationDatabaseAdapterInstance.storePort(port as any, {
        tenantId,
        createdBy: userId,
      });

      const evidence = await evidenceService.create({
        tenantId,
        type: "event",
        category: "port",
        title: `Port created: ${port.name}`,
        description: "Port created",
        content: JSON.stringify(port, null, 2),
        createdBy: userId,
        metadata: {
          source: "transportation-api",
          capturedAt: new Date().toISOString(),
        },
        relatedEntities: [
          { entityId: port.id, entityType: "port", relationship: "subject" },
        ],
        tags: ["tms", "transportation", "port"],
      } as any);

      return NextResponse.json(port, { status: 201 });
    }

    if (action === "update_utilization") {
      const { portId, currentShipments, containers } = body;

      if (
        !portId ||
        currentShipments === undefined ||
        containers === undefined
      ) {
        return NextResponse.json(
          {
            error:
              "Missing required fields: portId, currentShipments, containers",
          },
          { status: 400 },
        );
      }

      const port = await portsService.updatePortUtilization(
        portId,
        currentShipments,
        containers,
        tenantId,
      );
      if (!port) {
        return NextResponse.json({ error: "Port not found" }, { status: 404 });
      }

      // Update in database
      await transportationDatabaseAdapterInstance.storePort(port as any, {
        tenantId,
        createdBy: userId,
      });

      return NextResponse.json(port);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in ports API:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
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
    const action = searchParams.get("action") || "list";
    const portId = searchParams.get("portId");
    const code = searchParams.get("code");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const country = searchParams.get("country");

    if (action === "statistics") {
      const stats = await portsService.getStatistics(tenantId);
      return NextResponse.json(stats);
    }

    if (portId) {
      const port = await portsService.getPort(portId, tenantId);
      if (!port) {
        return NextResponse.json({ error: "Port not found" }, { status: 404 });
      }
      return NextResponse.json(port);
    }

    if (code) {
      const port = await portsService.getPortByCode(code, tenantId);
      if (!port) {
        return NextResponse.json({ error: "Port not found" }, { status: 404 });
      }
      return NextResponse.json(port);
    }

    // List all ports
    const ports = await portsService.getPorts(tenantId, {
      type: type || undefined,
      status: status || undefined,
      country: country || undefined,
    });

    return NextResponse.json({ ports });
  } catch (error) {
    console.error("Error getting ports data:", error);
    return NextResponse.json(
      {
        error: "Failed to get ports data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function putHandler(
  request: NextRequest,
  context: { tenantId?: string; userId?: string },
) {
  try {
    const tenantId = context.tenantId;
    const userId = context.userId || "api-user";
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const port = await portsService.updatePort(id, updates, tenantId);
    if (!port) {
      return NextResponse.json({ error: "Port not found" }, { status: 404 });
    }

    // Update in database
    await transportationDatabaseAdapterInstance.storePort(port as any, {
      tenantId,
      createdBy: userId,
    });

    return NextResponse.json(port);
  } catch (error) {
    console.error("Error updating port:", error);
    return NextResponse.json(
      {
        error: "Failed to update",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(postHandler, {
  featureId: "ports",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withTransportationAPI(getHandler, {
  featureId: "ports",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});

export const PUT = withTransportationAPI(putHandler, {
  featureId: "ports",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

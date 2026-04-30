/**
 * Transportation Shipments API
 *
 * Handles CRUD operations for shipments with comprehensive intelligence
 * Fully integrated with ecosystem - no duplication
 */

import { NextRequest, NextResponse } from "next/server";
import type { Shipment } from "@/types/tms";
import { comprehensiveShipmentService } from "@/lib/services/transportation";
import type { CreateShipmentRequest } from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { handleTransportationError } from "@/lib/services/transportation";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import { evidenceService } from "@/lib/services/evidence";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";
import {
  generateDemoShipments,
  isDemoModeEnabled,
} from "@/lib/services/demo/demoDataService";

export const GET = withTransportationAPI(
  async (request: NextRequest, apiContext: { tenantId?: string }) => {
    try {
      const tenantId = apiContext.tenantId || "demo-tenant";

      const searchParams = request.nextUrl.searchParams;
      const status = searchParams.get("status");
      const carrierId = searchParams.get("carrierId");
      const trackingNumber = searchParams.get("trackingNumber");
      const includeIntelligence =
        searchParams.get("includeIntelligence") === "true";

      // Return demo data immediately if enabled (fast response) - CHECK FIRST
      if (isDemoModeEnabled()) {
        const limit = parseInt(searchParams.get("limit") || "50");
        const demoShipments = generateDemoShipments({ count: limit });
        logger.info("Returning demo shipments data", {
          count: demoShipments.length,
        });
        return NextResponse.json(demoShipments);
      }

      // Filter shipments based on query parameters (tenant-scoped)
      let filteredShipments =
        await transportationDatabaseAdapterInstance.listShipments({
          tenantId,
          status: status || undefined,
          carrierId: carrierId || undefined,
          limit: 500,
          offset: 0,
        });

      if (status) {
        const statuses = status.split(",");
        filteredShipments = filteredShipments.filter((s) =>
          statuses.includes(s.status),
        );
      }

      if (carrierId) {
        filteredShipments = filteredShipments.filter(
          (s) => s.carrierId === carrierId,
        );
      }

      if (trackingNumber) {
        filteredShipments = filteredShipments.filter(
          (s) =>
            s.trackingNumber === trackingNumber ||
            s.shipmentNumber === trackingNumber,
        );
      }

      // If no data and demo mode enabled, return demo data
      if (filteredShipments.length === 0 && isDemoModeEnabled()) {
        const limit = parseInt(searchParams.get("limit") || "500");
        const demoData = generateDemoShipments({ count: limit });
        logger.info("Returning demo shipments data", {
          count: demoData.length,
        });
        return NextResponse.json(demoData);
      }

      // If intelligence requested, enrich shipments
      if (includeIntelligence && filteredShipments.length > 0) {
        const enrichedShipments = await Promise.all(
          filteredShipments.map(async (shipment) => {
            const comprehensive =
              await comprehensiveShipmentService.updateShipmentWithIntelligence(
                shipment,
                {
                  refreshRouteComparison: true,
                  refreshPricingIntelligence: true,
                  recalculateEmissions: true,
                  repredictTransitTime: true,
                  regenerateAIInsights: true,
                },
              );
            return comprehensive.shipment;
          }),
        );
        return NextResponse.json(enrichedShipments);
      }

      return NextResponse.json(filteredShipments);
    } catch (error) {
      logger.error("Error fetching shipments", {
        error: error instanceof Error ? error.message : String(error),
      });
      errorTrackingService.captureException(
        error instanceof Error ? error : new Error(String(error)),
        { context: "transportation-shipments", action: "fetch" },
      );
      const errorResponse = handleTransportationError(error);
      return NextResponse.json(
        { error: errorResponse.message, details: errorResponse.details },
        { status: errorResponse.statusCode },
      );
    }
  },
  {
    featureId: "shipments",
    action: "read_only",
    requireAuth: true,
    rateLimit: true,
  },
);

export const POST = withTransportationAPI(
  async (
    request: NextRequest,
    apiContext: { tenantId?: string; userId?: string },
  ) => {
    try {
      const tenantId = apiContext.tenantId;
      const userId = apiContext.userId || "unknown";
      if (!tenantId) {
        return NextResponse.json(
          { error: "Tenant context required" },
          { status: 400 },
        );
      }

      const body: CreateShipmentRequest = await request.json();

      // Validate required fields
      if (
        !body.origin ||
        !body.destination ||
        !body.type ||
        !body.mode ||
        !body.cargo ||
        !body.createdBy
      ) {
        return NextResponse.json(
          {
            error:
              "Missing required fields: origin, destination, type, mode, cargo, createdBy",
          },
          { status: 400 },
        );
      }

      // Create comprehensive shipment
      const comprehensive =
        await comprehensiveShipmentService.createComprehensiveShipment({
          ...body,
          tenantId,
          createdBy: userId,
          options: body.options || {
            generateRouteComparison: true,
            generatePricingIntelligence: true,
            calculateEmissions: true,
            predictTransitTime: true,
            generateAIInsights: true,
            linkToJourney: true,
            linkToLifecycle: true,
          },
        });

      // Initialize ALL platform integrations
      const { comprehensiveTransportationIntegration } =
        await import("@/lib/services/transportation/integration");
      const integrationResult =
        await comprehensiveTransportationIntegration.initializeShipmentIntegration(
          comprehensive.shipment as Shipment,
          tenantId,
          userId,
        );

      // Update shipment with integration IDs
      comprehensive.shipment.lifecycleId = integrationResult.lifecycleId;
      comprehensive.shipment.etwId =
        integrationResult.etwId || comprehensive.etwId;

      console.log(
        `✅ Shipment integrations initialized:`,
        integrationResult.integrations,
      );

      // Store shipment (tenant-scoped persistence with in-memory fallback)
      await transportationDatabaseAdapterInstance.storeShipment(
        comprehensive.shipment as Shipment,
        {
          tenantId,
          createdBy: body.createdBy || userId,
        },
      );

      // Evidence + event (auditability + ecosystem integration)
      const evidence = await evidenceService.create({
        tenantId,
        type: "event",
        category: "operational",
        title: `Shipment created: ${comprehensive.shipment.shipmentNumber || comprehensive.shipment.id}`,
        description: "Shipment created via Transportation API",
        content: JSON.stringify(
          {
            shipmentId: comprehensive.shipment.id,
            shipmentNumber: comprehensive.shipment.shipmentNumber,
            mode: comprehensive.shipment.mode,
            type: comprehensive.shipment.type,
            status: comprehensive.shipment.status,
          },
          null,
          2,
        ),
        createdBy: body.createdBy || userId,
        metadata: {
          source: "transportation-api",
          capturedAt: new Date().toISOString(),
          capturedMethod: "api",
        },
        relatedEntities: [
          {
            entityId: comprehensive.shipment.id,
            entityType: "shipment",
            relationship: "subject",
            addedAt: new Date().toISOString(),
          },
        ],
        tags: ["tms", "transportation", "shipment"],
      } as any);

      await eventBus.publish(
        createEvent(
          "transportation.shipment.created",
          comprehensive.shipment.id,
          "Shipment",
          {
            shipmentId: comprehensive.shipment.id,
            shipmentNumber: comprehensive.shipment.shipmentNumber,
            status: comprehensive.shipment.status,
            mode: comprehensive.shipment.mode,
            type: comprehensive.shipment.type,
            evidenceId: evidence.id,
          },
          1,
          { tenantId, userId: body.createdBy || userId },
        ),
      );

      // Return comprehensive data
      return NextResponse.json(comprehensive, { status: 201 });
    } catch (error) {
      logger.error("Error creating shipment", {
        error: error instanceof Error ? error.message : String(error),
      });
      errorTrackingService.captureException(
        error instanceof Error ? error : new Error(String(error)),
        { context: "transportation-shipments", action: "create" },
      );
      const errorResponse = handleTransportationError(error);
      return NextResponse.json(
        { error: errorResponse.message, details: errorResponse.details },
        { status: errorResponse.statusCode },
      );
    }
  },
  {
    featureId: "shipments",
    action: "write",
    requireAuth: true,
    rateLimit: true,
  },
);

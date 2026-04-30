/**
 * Transportation Module Initialization
 *
 * Comprehensive initialization of transportation services.
 * Multi-tenant from day 1: tenantId must be explicit (no implicit defaults for production safety).
 */

import { eventBus, createEvent } from "@/lib/services/event-store";
import { initializeTransportationIntegrations } from "./integrationUtilities";
import {
  transportationIoTIntegrationService,
  transportationWebhookService,
  transportationRealtimeService,
} from "./index";
import { elmRabetAdapter } from "@/lib/adapters/government/elmRabetAdapter";
import { transportationDatabaseAdapterInstance } from "./database/transportationDatabaseAdapter";
import { webhookService as processLifecycleWebhookService } from "@/lib/services/process-lifecycle/webhooks/webhookService";
import { initializeCustomsSubmissionWorker } from "./customs/customsSubmissionWorker";

export async function initializeTransportationModule(
  tenantId: string,
): Promise<void> {
  if (!tenantId || tenantId.trim().length === 0) {
    throw new Error(
      "tenantId is required to initialize Transportation module (multi-tenant day 1)",
    );
  }

  // Initialize database adapter (optional - will fallback to in-memory if not configured)
  try {
    await transportationDatabaseAdapterInstance.initialize();
  } catch (error) {
    console.warn(
      "⚠️ Transportation database adapter initialization skipped:",
      error,
    );
  }

  console.log("🚀 Initializing Transportation Module...");

  // 1) Initialize ecosystem integrations
  await initializeTransportationIntegrations();

  // 2) Subscribe to platform events (cross-module interop)
  await subscribeToPlatformEvents(tenantId);

  // 2b) Initialize customs submission worker (integration-first adapter routing)
  initializeCustomsSubmissionWorker();

  // 3) Initialize IoT integration (if configured)
  initializeIoTIntegration();

  // 4) Initialize government integrations (if configured)
  initializeGovernmentIntegrations();

  // 5) Publish initialization event
  await eventBus.publish(
    createEvent(
      "transportation.module.initialized",
      `transportation-${tenantId}`,
      "TransportationModule",
      { tenantId, timestamp: new Date().toISOString(), version: "1.0.0" },
      1,
      { tenantId, userId: "system" },
    ),
  );

  console.log("✅ Transportation Module initialized.");
}

async function subscribeToPlatformEvents(tenantId: string): Promise<void> {
  // WMS Events
  eventBus.subscribe("wms.shipment.created", async (event) => {
    console.log("WMS shipment created:", event.payload || event);
  });

  eventBus.subscribe("wms.inventory.updated", async (event) => {
    console.log("WMS inventory updated:", event.payload || event);
  });

  // Journey Events
  eventBus.subscribe("journey.stage.changed", async (event) => {
    console.log("Journey stage changed:", event.payload || event);
  });

  // Process Lifecycle Events
  eventBus.subscribe("process-lifecycle.stage.changed", async (event) => {
    console.log("Process lifecycle stage changed:", event.payload || event);
  });

  // ETW (e-Waybill) Events - Deep Integration with Transportation
  const { etwIntegrationService } = await import("./etwIntegrationService");

  eventBus.subscribe("etw.created", async (event) => {
    const payload = event.payload || event;
    if (payload?.shipmentId && payload?.etwId) {
      // ETW is already linked via shipmentId field, but ensure bidirectional link
      try {
        await etwIntegrationService.linkETWToShipment(
          payload.etwId,
          payload.shipmentId,
          tenantId,
        );
        console.log(
          `✅ ETW ${payload.etwId} linked to shipment ${payload.shipmentId}`,
        );
      } catch (error) {
        console.error("Error linking ETW to shipment:", error);
      }
    }
  });

  eventBus.subscribe("etw.status.changed", async (event) => {
    const payload = event.payload || event;
    if (payload?.shipmentId && payload?.etwId && payload?.status) {
      // Sync ETW status to shipment
      try {
        await etwIntegrationService.syncETWStatusToShipment(
          payload.etwId,
          payload.shipmentId,
          tenantId,
        );
        console.log(
          `✅ Synced ETW ${payload.etwId} status to shipment ${payload.shipmentId}`,
        );
      } catch (error) {
        console.error("Error syncing ETW status to shipment:", error);
      }
    }
  });

  eventBus.subscribe("etw.delivered", async (event) => {
    const payload = event.payload || event;
    if (payload?.shipmentId && payload?.etwId) {
      // Sync ETW delivery to shipment
      try {
        await etwIntegrationService.syncETWStatusToShipment(
          payload.etwId,
          payload.shipmentId,
          tenantId,
        );
        console.log(
          `✅ ETW ${payload.etwId} delivered, shipment ${payload.shipmentId} marked as delivered`,
        );
      } catch (error) {
        console.error("Error syncing ETW delivery to shipment:", error);
      }
    }
  });

  // Subscribe to shipment events to sync to ETW
  eventBus.subscribe(
    "transportation.shipment.status.changed",
    async (event) => {
      const payload = event.payload || event;
      if (payload?.shipmentId) {
        // Get ETW for shipment and sync status
        try {
          const etw = await etwIntegrationService.getETWForShipment(
            payload.shipmentId,
            tenantId,
          );
          if (etw) {
            await etwIntegrationService.syncShipmentStatusToETW(
              payload.shipmentId,
              etw.id,
              tenantId,
            );
            console.log(
              `✅ Synced shipment ${payload.shipmentId} status to ETW ${etw.id}`,
            );
          }
        } catch (error) {
          console.error("Error syncing shipment status to ETW:", error);
        }
      }
    },
  );

  // Tenant-scoped (optional) hooks can be added later using tenantId
  // Transportation Control Tower → Webhooks bridge (tenant-scoped)
  // This allows external systems to subscribe using the Process Lifecycle webhook management system.
  eventBus.subscribe(
    "transportation.control_tower.incident.created",
    async (event) => {
      await processLifecycleWebhookService.triggerWebhook({
        type: "transportation.control_tower.incident.created",
        tenantId,
        payload: event.payload || {},
        timestamp: new Date().toISOString(),
        metadata: { source: "transportation", busEventType: event.type },
      });
    },
  );

  eventBus.subscribe(
    "transportation.control_tower.incident.packet_created",
    async (event) => {
      await processLifecycleWebhookService.triggerWebhook({
        type: "transportation.control_tower.incident.packet_created",
        tenantId,
        payload: event.payload || {},
        timestamp: new Date().toISOString(),
        metadata: { source: "transportation", busEventType: event.type },
      });
    },
  );
}

function initializeIoTIntegration(): void {
  const iotConfig = {
    integrationType:
      (process.env.TRANSPORTATION_IOT_TYPE as
        | "DIRECT"
        | "GOVERNMENT"
        | "BOTH") || "BOTH",
    directProviders: process.env.TRANSPORTATION_IOT_PROVIDERS
      ? JSON.parse(process.env.TRANSPORTATION_IOT_PROVIDERS)
      : [],
    governmentIntegration:
      process.env.TRANSPORTATION_GOV_IOT_ENABLED === "true"
        ? {
            country: process.env.TRANSPORTATION_GOV_COUNTRY || "Saudi Arabia",
            provider:
              (process.env.TRANSPORTATION_GOV_PROVIDER as
                | "ELM"
                | "RABET"
                | "OTHER") || "ELM",
            config: {
              apiUrl: process.env.ELM_API_URL,
              apiKey: process.env.ELM_API_KEY,
              organizationId: process.env.ELM_ORGANIZATION_ID,
            },
          }
        : undefined,
  };

  // Initialize IoT integration (default is 'BOTH' which enables both direct and government integrations)
  try {
    transportationIoTIntegrationService.initialize(iotConfig as any);
  } catch (error) {
    console.warn(
      "⚠️ Transportation IoT integration initialization skipped:",
      error,
    );
  }
}

function initializeGovernmentIntegrations(): void {
  // ELM/Rabet.sa (Saudi Arabia)
  if (process.env.ELM_API_URL && process.env.ELM_API_KEY) {
    try {
      elmRabetAdapter.initialize({
        apiUrl: process.env.ELM_API_URL,
        apiKey: process.env.ELM_API_KEY,
        organizationId: process.env.ELM_ORGANIZATION_ID || "",
        region: "SAUDI_ARABIA",
      });
    } catch (error) {
      console.warn(
        "⚠️ Transportation government integration initialization skipped:",
        error,
      );
    }
  }
}

// Export services for convenience (not required, but used by some consumers)
export { transportationWebhookService, transportationRealtimeService };

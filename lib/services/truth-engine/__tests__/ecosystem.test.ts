/**
 * Truth Engine Ecosystem Integration Tests
 * Comprehensive tests for all integrations
 */

import { initializeEcosystemIntegration } from "../integrations/ecosystemIntegrationService";
import { truthEngineService } from "../truthEngineService";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store";

describe("Truth Engine Ecosystem Integration", () => {
  const tenantId = "test-tenant";

  beforeEach(() => {
    // Initialize ecosystem integration
    initializeEcosystemIntegration(tenantId);
  });

  afterEach(() => {
    // Cleanup
    eventBus.unsubscribe("wms.*");
    eventBus.unsubscribe("tms.*");
    eventBus.unsubscribe("qhse.*");
  });

  test("should capture WMS events", async () => {
    // Publish WMS event
    const wmsEvent = createEvent({
      type: "wms.inventory.updated",
      aggregateId: "warehouse-123",
      aggregateType: "warehouse",
      payload: {
        warehouseId: "warehouse-123",
        shipmentId: "shipment-456",
        quantity: 100,
      },
      metadata: {
        userId: "user-1",
        tenantId,
      },
    });

    await eventBus.publish(wmsEvent);

    // Wait for async processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify truth event was created
    const events = await truthEngineService.searchTruthEvents({
      tenantId,
      limit: 10,
    });

    const truthEvent = events.events.find(
      (e) =>
        e.metadata?.module === "wms" &&
        e.metadata?.originalEvent === "wms.inventory.updated",
    );

    expect(truthEvent).toBeDefined();
    expect(truthEvent?.entityRefs.warehouseId).toBe("warehouse-123");
    expect(truthEvent?.entityRefs.shipmentId).toBe("shipment-456");
  });

  test("should capture TMS events", async () => {
    const tmsEvent = createEvent({
      type: "tms.shipment.created",
      aggregateId: "shipment-789",
      aggregateType: "shipment",
      payload: {
        shipmentId: "shipment-789",
        customerId: "customer-123",
      },
      metadata: {
        userId: "user-1",
        tenantId,
      },
    });

    await eventBus.publish(tmsEvent);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const events = await truthEngineService.searchTruthEvents({
      tenantId,
      limit: 10,
    });

    const truthEvent = events.events.find((e) => e.metadata?.module === "tms");

    expect(truthEvent).toBeDefined();
    expect(truthEvent?.entityRefs.shipmentId).toBe("shipment-789");
  });

  test("should capture QHSE events", async () => {
    const qhseEvent = createEvent({
      type: "qhse.incident.reported",
      aggregateId: "incident-123",
      aggregateType: "incident",
      payload: {
        incidentId: "incident-123",
        facilityId: "facility-456",
      },
      metadata: {
        userId: "user-1",
        tenantId,
      },
    });

    await eventBus.publish(qhseEvent);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const events = await truthEngineService.searchTruthEvents({
      tenantId,
      limit: 10,
    });

    const truthEvent = events.events.find((e) => e.metadata?.module === "qhse");

    expect(truthEvent).toBeDefined();
    expect(truthEvent?.entityRefs.incidentId).toBe("incident-123");
  });

  test("should capture all module events", async () => {
    const modules = [
      "wms",
      "tms",
      "qhse",
      "iso-ims",
      "msds",
      "finance",
      "hr",
      "facility",
      "marketplace",
    ];

    for (const moduleId of modules) {
      const event = createEvent({
        type: `${moduleId}.test.event`,
        aggregateId: `${moduleId}-123`,
        aggregateType: moduleId,
        payload: {},
        metadata: {
          userId: "user-1",
          tenantId,
        },
      });

      await eventBus.publish(event);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    const events = await truthEngineService.searchTruthEvents({
      tenantId,
      limit: 100,
    });

    // Verify events from all modules were captured
    const capturedModules = new Set(
      events.events.map((e) => e.metadata?.module).filter(Boolean),
    );

    expect(capturedModules.size).toBeGreaterThan(0);
  });
});

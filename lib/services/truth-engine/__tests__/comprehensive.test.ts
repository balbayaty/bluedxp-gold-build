/**
 * Comprehensive Truth Engine Test Suite
 * Tests all functionality, integrations, and workflows
 */

import { truthEngineService } from "../truthEngineService";
import { truthSDK } from "../sdk";
import { initializeTruthEngine } from "../initialize";
import { initializeEcosystemIntegration } from "../integrations/ecosystemIntegrationService";
import { eventBus } from "@/lib/services/event-store";
import { evidenceService } from "@/lib/services/evidence/evidenceService";
import {
  TruthEvent,
  TruthEvidenceItem,
  TruthKPI,
  AdversarialReview,
} from "@/types/truth-engine";
import { DomainEvent } from "@/types/cqrs";

describe("Truth Engine - Comprehensive Test Suite", () => {
  const tenantId = "test-tenant";
  let testEventId: string;
  let testEvidenceId: string;
  let testKPIId: string;

  beforeAll(async () => {
    // Initialize Truth Engine
    await initializeTruthEngine({
      tenantId,
      enableRealTimeClaims: true,
      enableEcosystemIntegration: true,
    });
  });

  describe("1. Core Functionality", () => {
    test("should record evidence", async () => {
      const evidence = await truthSDK.recordEvidence({
        tenantId,
        type: "document",
        sourceSystem: "wms",
        title: "Test Document",
        storageRef: "s3://bucket/test.pdf",
        extractedMetadata: {
          fileName: "test.pdf",
          fileSize: 1024,
        },
      });

      expect(evidence).toBeDefined();
      expect(evidence.id).toBeDefined();
      expect(evidence.type).toBe("document");
      testEvidenceId = evidence.id;
    });

    test("should record truth event", async () => {
      const event = await truthSDK.recordTruthEvent({
        tenantId,
        eventType: "ENTITY_CREATED",
        happenedAt: new Date(),
        recordedAt: new Date(),
        actor: {
          type: "user",
          id: "user-123",
          name: "Test User",
        },
        entityRefs: {
          shipmentId: "shipment-123",
        },
        evidenceLinks: [testEvidenceId],
        confidenceScore: 0.95,
      });

      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.eventType).toBe("ENTITY_CREATED");
      testEventId = event.id;
    });

    test("should link evidence to event", async () => {
      const result = await truthEngineService.linkEvidenceToEvent(
        testEventId,
        testEvidenceId,
        tenantId,
      );

      expect(result).toBe(true);
    });

    test("should get truth timeline", async () => {
      const timeline = await truthEngineService.getTruthTimeline(
        "shipment",
        "shipment-123",
        {},
        tenantId,
      );

      expect(timeline).toBeDefined();
      expect(timeline.events.length).toBeGreaterThan(0);
      expect(timeline.events[0].id).toBe(testEventId);
    });

    test("should register KPI", async () => {
      const kpi = await truthEngineService.registerKPI({
        tenantId,
        name: "test-kpi",
        description: "Test KPI",
        formula: "SUM(events)",
        entityType: "shipment",
        evidenceRequired: true,
      });

      expect(kpi).toBeDefined();
      expect(kpi.name).toBe("test-kpi");
    });

    test("should calculate KPI", async () => {
      const kpi = await truthEngineService.calculateKPI(
        "test-kpi",
        "shipment-123",
        tenantId,
      );

      expect(kpi).toBeDefined();
      expect(kpi.value).toBeDefined();
      testKPIId = kpi.id;
    });

    test("should get KPI evidence", async () => {
      const evidence = await truthEngineService.getKPIEvidence(
        testKPIId,
        tenantId,
      );

      expect(evidence).toBeDefined();
      expect(Array.isArray(evidence)).toBe(true);
    });
  });

  describe("2. Adversarial Review", () => {
    test("should perform adversarial review", async () => {
      const decision: any = {
        type: "approval",
        entityId: "shipment-123",
        entityType: "shipment",
        decision: "approved",
        rationale: "Test approval",
      };

      const review = await truthEngineService.reviewDecision(
        decision,
        {
          tenantId,
          context: "test-context",
        },
        tenantId,
      );

      expect(review).toBeDefined();
      expect(review.personas.length).toBe(4); // Regulator, CFO, Competitor, Litigator
      expect(review.overallRisk).toBeDefined();
    });
  });

  describe("3. Ecosystem Integration", () => {
    test("should integrate with Event Bus", async () => {
      const integration = initializeEcosystemIntegration(tenantId);
      expect(integration).toBeDefined();

      // Publish a test event
      const testEvent: DomainEvent = {
        id: "test-event-123",
        type: "wms.inventory.updated",
        aggregateId: "warehouse-123",
        aggregateType: "warehouse",
        version: 1,
        timestamp: new Date().toISOString(),
        metadata: {
          userId: "user-123",
        },
        payload: {
          warehouseId: "warehouse-123",
          inventoryCount: 1000,
        },
      };

      await eventBus.publish(testEvent);

      // Wait a bit for event processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify truth event was created
      const timeline = await truthEngineService.getTruthTimeline(
        "warehouse",
        "warehouse-123",
        {},
        tenantId,
      );

      expect(timeline.events.length).toBeGreaterThan(0);
    });

    test("should handle WMS events", async () => {
      const wmsEvent: DomainEvent = {
        id: "wms-event-123",
        type: "wms.shipment.received",
        aggregateId: "shipment-456",
        aggregateType: "shipment",
        version: 1,
        timestamp: new Date().toISOString(),
        metadata: {
          userId: "user-123",
        },
        payload: {
          shipmentId: "shipment-456",
          warehouseId: "warehouse-123",
        },
      };

      await eventBus.publish(wmsEvent);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const timeline = await truthEngineService.getTruthTimeline(
        "shipment",
        "shipment-456",
        {},
        tenantId,
      );

      expect(timeline.events.length).toBeGreaterThan(0);
    });

    test("should handle TMS events", async () => {
      const tmsEvent: DomainEvent = {
        id: "tms-event-123",
        type: "tms.delivery.completed",
        aggregateId: "delivery-123",
        aggregateType: "delivery",
        version: 1,
        timestamp: new Date().toISOString(),
        metadata: {
          userId: "user-123",
        },
        payload: {
          shipmentId: "shipment-456",
          podEvidenceId: "evidence-pod-123",
        },
      };

      await eventBus.publish(tmsEvent);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const timeline = await truthEngineService.getTruthTimeline(
        "shipment",
        "shipment-456",
        {},
        tenantId,
      );

      expect(timeline.events.length).toBeGreaterThan(0);
    });

    test("should handle QHSE events", async () => {
      const qhseEvent: DomainEvent = {
        id: "qhse-event-123",
        type: "qhse.incident.reported",
        aggregateId: "incident-123",
        aggregateType: "incident",
        version: 1,
        timestamp: new Date().toISOString(),
        metadata: {
          userId: "user-123",
        },
        payload: {
          incidentId: "incident-123",
          facilityId: "facility-123",
        },
      };

      await eventBus.publish(qhseEvent);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const timeline = await truthEngineService.getTruthTimeline(
        "incident",
        "incident-123",
        {},
        tenantId,
      );

      expect(timeline.events.length).toBeGreaterThan(0);
    });
  });

  describe("4. Search and Analytics", () => {
    test("should search truth events", async () => {
      const result = await truthEngineService.searchTruthEvents({
        tenantId,
        eventTypes: ["ENTITY_CREATED"],
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.events).toBeDefined();
      expect(Array.isArray(result.events)).toBe(true);
    });

    test("should detect timeline gaps", async () => {
      const timeline = await truthEngineService.getTruthTimeline(
        "shipment",
        "shipment-123",
        {},
        tenantId,
      );

      expect(timeline.gaps).toBeDefined();
      expect(Array.isArray(timeline.gaps)).toBe(true);
    });
  });

  describe("5. Board Brief", () => {
    test("should generate board brief", async () => {
      const brief = await truthEngineService.generateBoardBrief(tenantId, {
        timeRange: "30d",
      });

      expect(brief).toBeDefined();
      expect(brief.signals).toBeDefined();
      expect(Array.isArray(brief.signals)).toBe(true);
      expect(brief.recommendations).toBeDefined();
      expect(Array.isArray(brief.recommendations)).toBe(true);
    });
  });

  describe("6. Error Handling", () => {
    test("should handle invalid event gracefully", async () => {
      await expect(
        truthSDK.recordTruthEvent({
          tenantId,
          eventType: "INVALID_TYPE" as any,
          happenedAt: new Date(),
          recordedAt: new Date(),
          actor: {
            type: "user",
            id: "user-123",
          },
          entityRefs: {},
          confidenceScore: 1.5, // Invalid: > 1.0
        }),
      ).rejects.toThrow();
    });

    test("should handle missing evidence gracefully", async () => {
      const result = await truthEngineService.linkEvidenceToEvent(
        testEventId,
        "non-existent-evidence",
        tenantId,
      );

      expect(result).toBe(false);
    });
  });

  describe("7. Performance", () => {
    test("should handle bulk event recording", async () => {
      const events = Array.from({ length: 10 }, (_, i) => ({
        tenantId,
        eventType: "ENTITY_UPDATED" as const,
        happenedAt: new Date(),
        recordedAt: new Date(),
        actor: {
          type: "system" as const,
          id: "system-123",
        },
        entityRefs: {
          shipmentId: `shipment-${i}`,
        },
        confidenceScore: 0.95,
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        events.map((e) => truthSDK.recordTruthEvent(e)),
      );
      const endTime = Date.now();

      expect(results.length).toBe(10);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in < 5 seconds
    });
  });
});

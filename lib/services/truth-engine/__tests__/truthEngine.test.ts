/**
 * Truth Engine Test Suite
 * Comprehensive tests for Truth Engine functionality
 *
 * Run with: npm test -- truthEngine.test.ts
 */

import { truthEngineService } from "../truthEngineService";
import { truthSDK } from "../sdk";
import type {
  TruthEvent,
  TruthEvidenceItem,
  DecisionObject,
  ReviewContext,
} from "@/types/truth-engine";

describe("Truth Engine Service", () => {
  const testTenantId = "test-tenant-1";

  describe("Evidence Operations", () => {
    it("should record evidence", async () => {
      const evidence = await truthEngineService.recordEvidence({
        type: "document",
        category: "operational",
        title: "Test POD Document",
        sourceSystem: "telematics",
        validationState: "pending",
        metadata: {
          source: "telematics",
          capturedAt: new Date().toISOString(),
          capturedMethod: "api",
          processed: false,
        },
        relatedEntities: [],
        tags: ["test"],
      });

      expect(evidence).toBeDefined();
      expect(evidence.id).toBeDefined();
      expect(evidence.sourceSystem).toBe("telematics");
      expect(evidence.title).toBe("Test POD Document");
      expect(evidence.hash).toBeDefined();
    });
  });

  describe("Truth Event Operations", () => {
    it("should record truth event", async () => {
      const event = await truthEngineService.recordTruthEvent({
        eventType: "delivered",
        tenantId: testTenantId,
        happenedAt: new Date().toISOString(),
        recordedAt: new Date().toISOString(),
        actor: {
          type: "driver",
          id: "driver-1",
          name: "John Doe",
        },
        entityRefs: {
          shipmentId: "ship-123",
          customerId: "cust-456",
        },
        evidenceLinks: [],
        confidenceScore: 0.95,
        derivedFrom: {
          sourceSystem: "tms",
        },
        status: "active",
      });

      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.eventType).toBe("delivered");
      expect(event.tenantId).toBe(testTenantId);
      expect(event.confidenceScore).toBe(0.95);
    });

    it("should get truth timeline", async () => {
      const timeline = await truthEngineService.getTruthTimeline(
        "shipment",
        "ship-123",
      );

      expect(timeline).toBeDefined();
      expect(timeline.entityType).toBe("shipment");
      expect(timeline.entityId).toBe("ship-123");
      expect(Array.isArray(timeline.events)).toBe(true);
      expect(Array.isArray(timeline.evidence)).toBe(true);
    });
  });

  describe("Adversarial Review", () => {
    it("should create adversarial review", async () => {
      const decision: DecisionObject = {
        type: "pricing_change",
        id: "decision-1",
        data: { newPrice: 1000 },
        relatedEntityIds: { customerId: "cust-1" },
      };

      const context: ReviewContext = {
        tenantId: testTenantId,
        relatedTruthEvents: [],
        relatedEvidence: [],
      };

      const review = await truthEngineService.reviewDecision(decision, context);

      expect(review).toBeDefined();
      expect(review.id).toBeDefined();
      expect(review.decisionId).toBe("decision-1");
      expect(review.personas).toBeDefined();
      expect(review.personas.regulator).toBeDefined();
      expect(review.personas.cfo).toBeDefined();
      expect(review.personas.competitor).toBeDefined();
      expect(review.personas.litigator).toBeDefined();
      expect(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).toContain(
        review.overallRisk,
      );
    });
  });

  describe("Truth KPIs", () => {
    it("should register KPI", async () => {
      const kpi = await truthEngineService.registerKPI({
        name: "test_on_time_delivery",
        description: "Test on-time delivery rate",
        formula: "count(delivered) / count(truck_departed) * 100",
        requiredEventTypes: ["delivered", "truck_departed"],
        minimumEvidenceRequirements: [
          { eventType: "delivered", minEvidenceCount: 1 },
        ],
        category: "operational",
      });

      expect(kpi).toBeDefined();
      expect(kpi.id).toBeDefined();
      expect(kpi.name).toBe("test_on_time_delivery");
      expect(kpi.value).toBe(0);
    });
  });

  describe("SDK Operations", () => {
    it("should record simple event via SDK", async () => {
      const event = await truthSDK.recordSimpleEvent(
        "delivered",
        testTenantId,
        { shipmentId: "ship-sdk-test" },
        { type: "driver", id: "driver-1" },
        {
          type: "document",
          title: "SDK Test Evidence",
          sourceSystem: "telematics",
        },
        0.95,
      );

      expect(event).toBeDefined();
      expect(event.eventType).toBe("delivered");
      expect(event.evidenceLinks.length).toBe(1);
    });
  });
});

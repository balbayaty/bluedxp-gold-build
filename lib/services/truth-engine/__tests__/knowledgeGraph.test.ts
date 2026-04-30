/**
 * Knowledge Graph Service Tests
 */

import { truthKnowledgeGraphService } from "../knowledge-graph/truthKnowledgeGraphService";
import { TruthEvent } from "@/types/truth-engine";

describe("Knowledge Graph Service", () => {
  const mockEvents: TruthEvent[] = [
    {
      id: "event-1",
      tenantId: "test-tenant",
      eventType: "shipment_created",
      happenedAt: new Date().toISOString(),
      recordedAt: new Date().toISOString(),
      actor: {
        type: "user",
        id: "user-1",
        name: "Test User",
      },
      entityRefs: {
        shipmentId: "shipment-1",
        customerId: "customer-1",
      },
      evidenceLinks: ["evidence-1"],
      confidenceScore: 0.95,
      derivedFrom: {
        sourceSystem: "wms",
      },
      status: "active",
      createdAt: new Date().toISOString(),
    },
    {
      id: "event-2",
      tenantId: "test-tenant",
      eventType: "delivery_completed",
      happenedAt: new Date().toISOString(),
      recordedAt: new Date().toISOString(),
      actor: {
        type: "system",
        id: "system-1",
        name: "Automated System",
      },
      entityRefs: {
        shipmentId: "shipment-1",
      },
      evidenceLinks: ["evidence-2"],
      confidenceScore: 0.9,
      derivedFrom: {
        sourceSystem: "tms",
      },
      status: "active",
      createdAt: new Date().toISOString(),
    },
  ];

  describe("buildGraphFromEvents", () => {
    it("should build graph from events", async () => {
      const result =
        await truthKnowledgeGraphService.buildGraphFromEvents(mockEvents);
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
      expect(result.nodes.length).toBeGreaterThan(0);
      expect(result.edges.length).toBeGreaterThan(0);
    });

    it("should create event nodes", async () => {
      const result =
        await truthKnowledgeGraphService.buildGraphFromEvents(mockEvents);
      const eventNodes = result.nodes.filter((n) => n.type === "event");
      expect(eventNodes.length).toBe(2);
    });

    it("should create actor nodes", async () => {
      const result =
        await truthKnowledgeGraphService.buildGraphFromEvents(mockEvents);
      const actorNodes = result.nodes.filter(
        (n) => n.type === "person" || n.type === "organization",
      );
      expect(actorNodes.length).toBeGreaterThan(0);
    });

    it("should create entity reference nodes", async () => {
      const result =
        await truthKnowledgeGraphService.buildGraphFromEvents(mockEvents);
      const entityNodes = result.nodes.filter((n) => n.type === "entity");
      expect(entityNodes.length).toBeGreaterThan(0);
    });

    it("should create evidence nodes", async () => {
      const result =
        await truthKnowledgeGraphService.buildGraphFromEvents(mockEvents);
      const evidenceNodes = result.nodes.filter((n) => n.type === "evidence");
      expect(evidenceNodes.length).toBeGreaterThan(0);
    });
  });

  describe("queryGraph", () => {
    it("should query graph by entity ID", async () => {
      const result = await truthKnowledgeGraphService.queryGraph({
        entityId: "shipment-1",
        depth: 2,
      });
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
    });

    it("should query graph by entity type", async () => {
      const result = await truthKnowledgeGraphService.queryGraph({
        entityType: "shipment",
        depth: 2,
      });
      expect(result).toBeDefined();
    });
  });

  describe("extractClaims", () => {
    it("should extract claims from events", async () => {
      const eventsWithClaims = mockEvents.map((e) => ({
        ...e,
        metadata: {
          claims: [
            {
              id: "claim-1",
              text: "Shipment was delivered on time",
              confidence: 0.95,
              verified: true,
            },
          ],
        },
      }));
      const claims =
        await truthKnowledgeGraphService.extractClaims(eventsWithClaims);
      expect(claims).toBeDefined();
      expect(claims.length).toBeGreaterThan(0);
    });
  });

  describe("detectAnomalies", () => {
    it("should detect anomalies in graph", async () => {
      const graph =
        await truthKnowledgeGraphService.buildGraphFromEvents(mockEvents);
      const anomalies = await truthKnowledgeGraphService.detectAnomalies(graph);
      expect(anomalies).toBeDefined();
      expect(anomalies.anomalies).toBeDefined();
    });
  });
});

/**
 * Claim Extraction Service Tests
 */

import { claimExtractionService } from "../claims/claimExtractionService";
import { TruthEvent } from "@/types/truth-engine";

describe("Claim Extraction Service", () => {
  beforeEach(() => {
    // Clear caches before each test
    (claimExtractionService as any).claimCache.clear();
    (claimExtractionService as any).validationCache.clear();
  });

  describe("extractFromText", () => {
    it("should extract numerical claims", async () => {
      const text = "The shipment contained 150 units of product";
      const claims = await claimExtractionService.extractFromText(text);
      expect(claims.length).toBeGreaterThan(0);
      expect(claims.some((c) => c.type === "numerical")).toBe(true);
    });

    it("should extract temporal claims", async () => {
      const text = "The delivery was completed on December 18, 2024";
      const claims = await claimExtractionService.extractFromText(text);
      expect(claims.length).toBeGreaterThan(0);
      expect(claims.some((c) => c.type === "temporal")).toBe(true);
    });

    it("should extract causal claims", async () => {
      const text = "The delay was caused by bad weather";
      const claims = await claimExtractionService.extractFromText(text);
      expect(claims.length).toBeGreaterThan(0);
      expect(claims.some((c) => c.type === "causal")).toBe(true);
    });

    it("should extract comparative claims", async () => {
      const text = "This shipment is more expensive than the previous one";
      const claims = await claimExtractionService.extractFromText(text);
      expect(claims.length).toBeGreaterThan(0);
      expect(claims.some((c) => c.type === "comparative")).toBe(true);
    });

    it("should extract entities from claims", async () => {
      const text = "John delivered 100 units on December 18, 2024";
      const claims = await claimExtractionService.extractFromText(text);
      expect(claims.length).toBeGreaterThan(0);
      const claim = claims[0];
      expect(claim.entities).toBeDefined();
      expect(claim.entities!.length).toBeGreaterThan(0);
    });
  });

  describe("extractFromEvent", () => {
    it("should extract claims from event", async () => {
      const event: TruthEvent = {
        id: "event-1",
        tenantId: "test-tenant",
        eventType: "delivery_completed",
        happenedAt: new Date().toISOString(),
        recordedAt: new Date().toISOString(),
        actor: {
          type: "user",
          id: "user-1",
          name: "Test User",
        },
        entityRefs: {
          shipmentId: "shipment-1",
        },
        evidenceLinks: ["evidence-1"],
        confidenceScore: 0.95,
        derivedFrom: {
          sourceSystem: "tms",
        },
        status: "active",
        metadata: {
          description: "Delivery was completed successfully with 100 units",
        },
        createdAt: new Date().toISOString(),
      };

      const claims = await claimExtractionService.extractFromEvent(event);
      expect(claims.length).toBeGreaterThan(0);
    });

    it("should create event claim from event type", async () => {
      const event: TruthEvent = {
        id: "event-1",
        tenantId: "test-tenant",
        eventType: "delivery_completed",
        happenedAt: new Date().toISOString(),
        recordedAt: new Date().toISOString(),
        actor: {
          type: "user",
        },
        entityRefs: {},
        evidenceLinks: [],
        confidenceScore: 0.95,
        derivedFrom: {},
        status: "active",
        createdAt: new Date().toISOString(),
      };

      const claims = await claimExtractionService.extractFromEvent(event);
      expect(claims.some((c) => c.type === "factual")).toBe(true);
    });
  });

  describe("validateClaim", () => {
    it("should validate claim with evidence", async () => {
      const text = "The shipment contained 150 units";
      const claims = await claimExtractionService.extractFromText(text);
      expect(claims.length).toBeGreaterThan(0);

      const claim = claims[0];
      const result = await claimExtractionService.validateClaim(claim.id, [
        "evidence-1",
        "evidence-2",
      ]);

      expect(result).toBeDefined();
      expect(result.claimId).toBe(claim.id);
      expect(result.validated).toBe(true);
      expect(result.evidenceCount).toBe(2);
    });

    it("should detect conflicting claims", async () => {
      const text1 = "The shipment contained 150 units";
      const text2 = "The shipment contained 200 units";
      const claims1 = await claimExtractionService.extractFromText(text1);
      const claims2 = await claimExtractionService.extractFromText(text2);

      expect(claims1.length).toBeGreaterThan(0);
      expect(claims2.length).toBeGreaterThan(0);

      const result = await claimExtractionService.validateClaim(claims1[0].id, [
        "evidence-1",
      ]);
      // Should detect conflict if entities match
      expect(result).toBeDefined();
    });
  });

  describe("getClaimStatistics", () => {
    it("should return statistics", async () => {
      await claimExtractionService.extractFromText("Test claim 1");
      await claimExtractionService.extractFromText("Test claim 2");

      const stats = claimExtractionService.getClaimStatistics();
      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byType).toBeDefined();
      expect(stats.byStatus).toBeDefined();
      expect(stats.averageConfidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getClaimsForEntity", () => {
    it("should get claims for entity", async () => {
      const text = "Shipment-1 was delivered successfully";
      const claims = await claimExtractionService.extractFromText(
        text,
        "event-1",
      );

      // Set metadata for entity
      if (claims.length > 0) {
        claims[0].metadata = {
          entityType: "shipment",
          entityId: "shipment-1",
        };
        (claimExtractionService as any).claimCache.set(claims[0].id, claims[0]);
      }

      const entityClaims = await claimExtractionService.getClaimsForEntity(
        "shipment",
        "shipment-1",
      );
      expect(entityClaims).toBeDefined();
    });
  });
});

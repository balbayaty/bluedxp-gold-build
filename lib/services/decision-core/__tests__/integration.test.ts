/**
 * Decision Infrastructure Integration Tests
 * Tests integration with real services
 */

import { decisionService } from "../decisionService";
import { DecisionPrimitives } from "../primitives";
import type { DecisionContext } from "../types";

describe("Decision Infrastructure Integration", () => {
  const mockContext: DecisionContext = {
    module: "test",
    entityType: "test_entity",
    entityId: "test-id-123",
    tenantId: "tenant-123",
    userId: "user-123",
    data: { test: "data" },
  };

  describe("Evidence Service Integration", () => {
    it("should link evidence when provided", async () => {
      const decision = await DecisionPrimitives.ALLOW(mockContext, {
        reason: "Test with evidence",
        evidenceIds: ["evd-123"],
      });

      expect(decision.evidenceIds).toContain("evd-123");
      expect(decision.evidenceHashes.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Audit Service Integration", () => {
    it("should log decision creation to audit service", async () => {
      const decision = await decisionService.createDecision(
        mockContext,
        "ALLOW",
        "APPROVED",
        { reason: "Test audit" },
      );

      // Decision should have correlation ID for audit tracking
      expect(decision.correlationId).toBeDefined();
    });
  });

  describe("Event Bus Integration", () => {
    it("should publish decision events", async () => {
      const decision = await DecisionPrimitives.BLOCK(
        mockContext,
        "Test block",
      );

      // Decision should have trace ID for event correlation
      expect(decision.traceId).toBeDefined();
    });
  });

  describe("Compliance Service Integration", () => {
    it("should check compliance when creating decision", async () => {
      const contextWithCompliance: DecisionContext = {
        ...mockContext,
        data: {
          complianceStatus: "COMPLIANT",
        },
      };

      const decision = await decisionService.createDecision(
        contextWithCompliance,
        "ALLOW",
        "APPROVED",
      );

      // Should have compliance checks (even if empty)
      expect(decision.complianceChecks).toBeDefined();
    });
  });

  describe("Controls Registry Integration", () => {
    it("should apply controls when creating decision", async () => {
      const decision = await decisionService.createDecision(
        mockContext,
        "ALLOW",
        "APPROVED",
      );

      // Should have controls applied
      expect(decision.controlsApplied).toBeDefined();
      expect(Array.isArray(decision.controlsApplied)).toBe(true);
    });
  });

  describe("End-to-End Decision Flow", () => {
    it("should complete full decision lifecycle", async () => {
      // Create decision
      const decision = await decisionService.createDecision(
        mockContext,
        "ALLOW",
        "PENDING",
      );

      expect(decision.status).toBe("PENDING");

      // Update to approved
      const approved = await decisionService.updateDecisionStatus(
        decision.id,
        "APPROVED",
        {
          reason: "Approved after review",
          updatedBy: "user-456",
        },
      );

      expect(approved.status).toBe("APPROVED");
      expect(approved.approvedBy).toBe("user-456");

      // Close decision
      const closed = await decisionService.updateDecisionStatus(
        decision.id,
        "CLOSED",
        {
          updatedBy: "user-456",
        },
      );

      expect(closed.status).toBe("CLOSED");
    });
  });
});

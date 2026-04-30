/**
 * Decision Service Tests
 * Comprehensive test suite for decision service
 */

import { decisionService } from "../decisionService";
import type { DecisionContext, DecisionStatus } from "../types";

describe("DecisionService", () => {
  const mockContext: DecisionContext = {
    module: "test",
    entityType: "test_entity",
    entityId: "test-id-123",
    tenantId: "tenant-123",
    userId: "user-123",
    data: { test: "data" },
  };

  beforeEach(() => {
    // Clear decisions before each test
    // In a real implementation, this would reset the store
  });

  describe("createDecision", () => {
    it("should create a decision record", async () => {
      const decision = await decisionService.createDecision(
        mockContext,
        "ALLOW",
        "APPROVED",
        {
          reason: "Test decision",
        },
      );

      expect(decision).toBeDefined();
      expect(decision.id).toBeDefined();
      expect(decision.status).toBe("APPROVED");
      expect(decision.primitive).toBe("ALLOW");
      expect(decision.reason).toBe("Test decision");
      expect(decision.module).toBe("test");
      expect(decision.entityType).toBe("test_entity");
      expect(decision.entityId).toBe("test-id-123");
      expect(decision.correlationId).toBeDefined();
    });

    it("should set approvedBy and approvedAt for APPROVED status", async () => {
      const decision = await decisionService.createDecision(
        mockContext,
        "ALLOW",
        "APPROVED",
      );

      expect(decision.approvedBy).toBe("user-123");
      expect(decision.approvedAt).toBeDefined();
    });

    it("should set rejectedBy and rejectedAt for REJECTED status", async () => {
      const decision = await decisionService.createDecision(
        mockContext,
        "BLOCK",
        "REJECTED",
        {
          reason: "Test rejection",
        },
      );

      expect(decision.rejectedBy).toBe("user-123");
      expect(decision.rejectedAt).toBeDefined();
    });
  });

  describe("updateDecisionStatus", () => {
    it("should update decision status", async () => {
      const decision = await decisionService.createDecision(
        mockContext,
        "ALLOW",
        "PENDING",
      );

      const updated = await decisionService.updateDecisionStatus(
        decision.id,
        "APPROVED",
        {
          reason: "Updated to approved",
          updatedBy: "user-456",
        },
      );

      expect(updated.status).toBe("APPROVED");
      expect(updated.approvedBy).toBe("user-456");
      expect(updated.approvedAt).toBeDefined();
    });

    it("should validate status transitions", async () => {
      const decision = await decisionService.createDecision(
        mockContext,
        "ALLOW",
        "CLOSED",
      );

      await expect(
        decisionService.updateDecisionStatus(decision.id, "PENDING"),
      ).rejects.toThrow("Invalid status transition");
    });
  });

  describe("getDecisionsForEntity", () => {
    it("should get decisions for an entity", async () => {
      await decisionService.createDecision(mockContext, "ALLOW", "APPROVED");
      await decisionService.createDecision(mockContext, "BLOCK", "REJECTED");

      const decisions = await decisionService.getDecisionsForEntity(
        "test_entity",
        "test-id-123",
      );

      expect(decisions.length).toBeGreaterThanOrEqual(2);
      expect(decisions[0].entityId).toBe("test-id-123");
    });
  });

  describe("queryDecisions", () => {
    it("should filter decisions by status", async () => {
      await decisionService.createDecision(mockContext, "ALLOW", "APPROVED");
      await decisionService.createDecision(mockContext, "BLOCK", "REJECTED");

      const result = await decisionService.queryDecisions({
        status: ["APPROVED"],
      });

      expect(result.decisions.every((d) => d.status === "APPROVED")).toBe(true);
    });

    it("should filter decisions by module", async () => {
      await decisionService.createDecision(mockContext, "ALLOW", "APPROVED");

      const result = await decisionService.queryDecisions({
        module: "test",
      });

      expect(result.decisions.every((d) => d.module === "test")).toBe(true);
    });
  });

  describe("getStatistics", () => {
    it("should calculate statistics", async () => {
      await decisionService.createDecision(mockContext, "ALLOW", "APPROVED");
      await decisionService.createDecision(mockContext, "BLOCK", "REJECTED");

      const stats = await decisionService.getStatistics();

      expect(stats.total).toBeGreaterThanOrEqual(2);
      expect(stats.byStatus.APPROVED).toBeGreaterThanOrEqual(1);
      expect(stats.byStatus.REJECTED).toBeGreaterThanOrEqual(1);
    });
  });
});

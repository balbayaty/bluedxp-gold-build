/**
 * Decision Primitives Tests
 * Test suite for all decision primitives
 */

import { DecisionPrimitives } from "../primitives";
import type { DecisionContext } from "../types";

describe("DecisionPrimitives", () => {
  const mockContext: DecisionContext = {
    module: "test",
    entityType: "test_entity",
    entityId: "test-id-123",
    tenantId: "tenant-123",
    userId: "user-123",
    data: { test: "data" },
  };

  describe("ALLOW", () => {
    it("should create an ALLOW decision", async () => {
      const decision = await DecisionPrimitives.ALLOW(mockContext, {
        reason: "Test allow",
      });

      expect(decision.primitive).toBe("ALLOW");
      expect(decision.status).toBe("APPROVED");
      expect(decision.reason).toBe("Test allow");
    });
  });

  describe("ALLOW_WITH_CONDITIONS", () => {
    it("should create an ALLOW_WITH_CONDITIONS decision", async () => {
      const decision = await DecisionPrimitives.ALLOW_WITH_CONDITIONS(
        mockContext,
        ["Condition 1", "Condition 2"],
        {
          reason: "Test allow with conditions",
        },
      );

      expect(decision.primitive).toBe("ALLOW_WITH_CONDITIONS");
      expect(decision.status).toBe("APPROVED_WITH_CONDITIONS");
      expect(decision.conditions).toEqual(["Condition 1", "Condition 2"]);
    });

    it("should throw error if conditions are missing", async () => {
      await expect(
        DecisionPrimitives.ALLOW_WITH_CONDITIONS(mockContext, []),
      ).rejects.toThrow("Conditions are required");
    });
  });

  describe("BLOCK", () => {
    it("should create a BLOCK decision", async () => {
      const decision = await DecisionPrimitives.BLOCK(
        mockContext,
        "Test block",
      );

      expect(decision.primitive).toBe("BLOCK");
      expect(decision.status).toBe("REJECTED");
      expect(decision.reason).toBe("Test block");
    });

    it("should throw error if reason is missing", async () => {
      await expect(DecisionPrimitives.BLOCK(mockContext, "")).rejects.toThrow(
        "Reason is required",
      );
    });
  });

  describe("ESCALATE_TO", () => {
    it("should create an ESCALATE_TO decision", async () => {
      const decision = await DecisionPrimitives.ESCALATE_TO(
        mockContext,
        "manager",
        "Test escalation",
      );

      expect(decision.primitive).toBe("ESCALATE_TO");
      expect(decision.status).toBe("ESCALATED");
      expect(decision.escalatedTo).toBe("manager");
    });
  });

  describe("APPROVE_SPEND", () => {
    it("should create an APPROVE_SPEND decision", async () => {
      const decision = await DecisionPrimitives.APPROVE_SPEND(mockContext, {
        amount: 50000,
        currency: "SAR",
      });

      expect(decision.primitive).toBe("APPROVE_SPEND");
      expect(decision.status).toBe("APPROVED");
    });

    it("should create APPROVED_WITH_CONDITIONS if conditions provided", async () => {
      const decision = await DecisionPrimitives.APPROVE_SPEND(
        mockContext,
        {
          amount: 50000,
          currency: "SAR",
        },
        {
          conditions: ["Monitor budget"],
        },
      );

      expect(decision.status).toBe("APPROVED_WITH_CONDITIONS");
      expect(decision.conditions).toEqual(["Monitor budget"]);
    });
  });

  describe("OVERRIDE", () => {
    it("should create an OVERRIDE decision", async () => {
      const decision = await DecisionPrimitives.OVERRIDE(mockContext, {
        reason: "Test override",
        authority: "director",
      });

      expect(decision.primitive).toBe("OVERRIDE");
      expect(decision.status).toBe("OVERRIDE_APPLIED");
      expect(decision.override?.authority).toBe("director");
    });
  });
});

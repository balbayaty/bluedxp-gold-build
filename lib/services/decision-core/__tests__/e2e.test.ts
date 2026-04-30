/**
 * Decision Infrastructure E2E Tests
 * Full end-to-end decision flows
 */

import { decisionService } from "../decisionService";
import { DecisionPrimitives } from "../primitives";
import type { DecisionContext } from "../types";

describe("Decision Infrastructure E2E", () => {
  describe("MSDS Approval Flow", () => {
    it("should handle complete MSDS approval workflow", async () => {
      const context: DecisionContext = {
        module: "hazalyze",
        entityType: "msds",
        entityId: "msds-123",
        tenantId: "tenant-123",
        userId: "user-123",
        data: {
          complianceStatus: "COMPLIANT",
          safetyData: true,
          hazardInformation: true,
        },
      };

      // Create approval decision
      const decision = await DecisionPrimitives.ALLOW(context, {
        reason: "MSDS is compliant with all regulations",
        evidenceIds: ["evd-msds-123"],
      });

      expect(decision.status).toBe("APPROVED");
      expect(decision.module).toBe("hazalyze");
      expect(decision.entityType).toBe("msds");
      expect(decision.primitive).toBe("ALLOW");
    });

    it("should handle MSDS rejection workflow", async () => {
      const context: DecisionContext = {
        module: "hazalyze",
        entityType: "msds",
        entityId: "msds-456",
        tenantId: "tenant-123",
        userId: "user-123",
        data: {
          complianceStatus: "NON_COMPLIANT",
        },
      };

      const decision = await DecisionPrimitives.BLOCK(
        context,
        "MSDS does not meet compliance requirements",
      );

      expect(decision.status).toBe("REJECTED");
      expect(decision.primitive).toBe("BLOCK");
      expect(decision.reason).toContain("compliance");
    });
  });

  describe("Procurement Approval Flow", () => {
    it("should handle purchase order approval with spend limits", async () => {
      const context: DecisionContext = {
        module: "procurement",
        entityType: "purchase_order",
        entityId: "po-123",
        tenantId: "tenant-123",
        userId: "user-123",
        data: {
          amount: 50000,
          currency: "SAR",
          approvalLimit: 100000,
        },
      };

      const decision = await DecisionPrimitives.APPROVE_SPEND(context, {
        amount: 50000,
        currency: "SAR",
        reason: "Purchase order approved within limits",
      });

      expect(decision.status).toBe("APPROVED");
      expect(decision.primitive).toBe("APPROVE_SPEND");
    });

    it("should escalate high-value purchases", async () => {
      const context: DecisionContext = {
        module: "procurement",
        entityType: "purchase_order",
        entityId: "po-456",
        tenantId: "tenant-123",
        userId: "user-123",
        data: {
          amount: 150000,
          currency: "SAR",
          approvalLimit: 100000,
        },
      };

      const decision = await DecisionPrimitives.ESCALATE_TO(
        context,
        "finance_director",
        "Purchase order exceeds approval limit",
      );

      expect(decision.status).toBe("ESCALATED");
      expect(decision.escalatedTo).toBe("finance_director");
    });
  });

  describe("Route Operations Flow", () => {
    it("should handle route hold decision", async () => {
      const context: DecisionContext = {
        module: "route-ops",
        entityType: "shipment",
        entityId: "ship-123",
        tenantId: "tenant-123",
        userId: "user-123",
        data: {
          estimatedArrivalHour: 23, // Outside border hours
          borderHours: { open: 6, close: 22 },
        },
      };

      const holdUntil = new Date();
      holdUntil.setHours(6, 0, 0, 0); // Next day 6 AM

      const decision = await DecisionPrimitives.HOLD_UNTIL(
        context,
        holdUntil,
        "Border closed outside operating hours",
      );

      expect(decision.status).toBe("ON_HOLD");
      expect(decision.holdReason).toContain("Border closed");
    });
  });

  describe("Override Flow", () => {
    it("should handle decision override with proper audit trail", async () => {
      const context: DecisionContext = {
        module: "procurement",
        entityType: "purchase_order",
        entityId: "po-789",
        tenantId: "tenant-123",
        userId: "director-123",
        data: {},
      };

      // First, create a rejected decision
      const rejected = await DecisionPrimitives.BLOCK(
        context,
        "Initial rejection",
      );

      // Override with authority
      const overridden = await DecisionPrimitives.OVERRIDE(context, {
        reason: "Business critical purchase",
        authority: "finance_director",
        originalDecisionId: rejected.id,
      });

      expect(overridden.status).toBe("OVERRIDE_APPLIED");
      expect(overridden.override?.authority).toBe("finance_director");
      expect(overridden.override?.reason).toContain("Business critical");
    });
  });
});

/**
 * Procurement Decision Integration
 * Example integration for purchase order and vendor approval decisions
 */

import { DecisionPrimitives } from "../primitives";
import type { DecisionContext } from "../types";

/**
 * Decide purchase order approval
 * Integrates with procurement module for PO approvals
 */
export async function decidePOApproval(
  poId: string,
  tenantId: string,
  userId: string,
  poData: {
    amount: number;
    currency: string;
    vendorId: string;
    items: any[];
    approvalLimit?: number;
    budgetCode?: string;
    evidenceIds?: string[];
  },
): Promise<void> {
  const context: DecisionContext = {
    module: "procurement",
    entityType: "purchase_order",
    entityId: poId,
    tenantId,
    userId,
    data: poData,
  };

  // Check spend limits and escalate if needed
  const approvalLimit = poData.approvalLimit || 100000;

  if (poData.amount > approvalLimit) {
    // Escalate to finance director
    await DecisionPrimitives.ESCALATE_TO(
      context,
      "finance_director",
      `Purchase order amount ${poData.amount} ${poData.currency} exceeds approval limit ${approvalLimit}`,
      {
        evidenceIds: poData.evidenceIds,
      },
    );
  } else if (poData.amount > approvalLimit * 0.8) {
    // Approve with conditions (approaching limit)
    await DecisionPrimitives.APPROVE_SPEND(
      context,
      {
        amount: poData.amount,
        currency: poData.currency,
        reason: "Purchase order approved - approaching limit",
        budgetCode: poData.budgetCode,
      },
      {
        conditions: [
          "Monitor budget utilization",
          "Obtain additional approval for future orders",
        ],
        evidenceIds: poData.evidenceIds,
      },
    );
  } else {
    // Standard approval
    await DecisionPrimitives.APPROVE_SPEND(
      context,
      {
        amount: poData.amount,
        currency: poData.currency,
        reason: "Purchase order approved within limits",
        budgetCode: poData.budgetCode,
      },
      {
        evidenceIds: poData.evidenceIds,
      },
    );
  }
}

/**
 * Flag vendor for payment hold
 */
export async function flagVendorPaymentHold(
  vendorId: string,
  tenantId: string,
  userId: string,
  reason: string,
  evidenceIds?: string[],
): Promise<void> {
  const context: DecisionContext = {
    module: "procurement",
    entityType: "vendor",
    entityId: vendorId,
    tenantId,
    userId,
    data: { vendorId },
  };

  await DecisionPrimitives.FLAG_FOR_PAYMENT_HOLD(context, reason, {
    evidenceIds,
  });
}

/**
 * Override procurement decision
 */
export async function overrideProcurementDecision(
  entityId: string,
  entityType: "purchase_order" | "vendor",
  tenantId: string,
  userId: string,
  overrideData: {
    reason: string;
    authority: string;
    originalDecisionId?: string;
  },
): Promise<void> {
  const context: DecisionContext = {
    module: "procurement",
    entityType,
    entityId,
    tenantId,
    userId,
    data: {},
  };

  await DecisionPrimitives.OVERRIDE(context, overrideData);
}

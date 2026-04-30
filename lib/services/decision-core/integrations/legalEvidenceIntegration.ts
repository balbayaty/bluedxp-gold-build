/**
 * Legal Evidence Decision Integration
 * Example integration for legal evidence compilation and payment hold decisions
 */

import { DecisionPrimitives } from "../primitives";
import type { DecisionContext } from "../types";

/**
 * Escalate for legal review
 */
export async function escalateForLegalReview(
  entityId: string,
  entityType: string,
  tenantId: string,
  userId: string,
  escalationData: {
    reason: string;
    legalIssue: string;
    urgency: "low" | "medium" | "high" | "critical";
    evidenceIds?: string[];
  },
): Promise<void> {
  const context: DecisionContext = {
    module: "legal",
    entityType,
    entityId,
    tenantId,
    userId,
    data: escalationData,
    options: {
      escalationPath: ["legal_reviewer", "legal_director"],
    },
  };

  await DecisionPrimitives.ESCALATE_TO(
    context,
    "legal_reviewer",
    `Legal review required: ${escalationData.legalIssue}. ${escalationData.reason}`,
    {
      evidenceIds: escalationData.evidenceIds,
    },
  );
}

/**
 * Flag for payment hold due to legal issues
 */
export async function flagPaymentHoldLegal(
  entityId: string,
  entityType: string,
  tenantId: string,
  userId: string,
  holdData: {
    reason: string;
    legalIssue: string;
    holdUntil?: Date | string;
    evidenceIds?: string[];
  },
): Promise<void> {
  const context: DecisionContext = {
    module: "legal",
    entityType,
    entityId,
    tenantId,
    userId,
    data: holdData,
  };

  await DecisionPrimitives.FLAG_FOR_PAYMENT_HOLD(
    context,
    `Payment hold due to legal issue: ${holdData.legalIssue}. ${holdData.reason}`,
    {
      evidenceIds: holdData.evidenceIds,
      holdUntil: holdData.holdUntil,
    },
  );
}

/**
 * Open NCR for legal compliance
 */
export async function openLegalNCR(
  entityId: string,
  entityType: string,
  tenantId: string,
  userId: string,
  ncrData: {
    title: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    legalRequirement?: string;
    evidenceIds?: string[];
  },
): Promise<void> {
  const context: DecisionContext = {
    module: "legal",
    entityType,
    entityId,
    tenantId,
    userId,
    data: ncrData,
  };

  await DecisionPrimitives.OPEN_NCR(
    context,
    {
      ...ncrData,
      category: "legal_compliance",
    },
    {
      evidenceIds: ncrData.evidenceIds,
    },
  );
}

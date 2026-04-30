/**
 * Hazalyze/MSDS Decision Integration
 * Example integration for MSDS acceptance/rejection decisions
 */

import { DecisionPrimitives } from "../primitives";
import type { DecisionContext } from "../types";

/**
 * Decide MSDS acceptance
 * Integrates with Hazalyze MSDS approval workflow
 */
export async function decideMSDSAcceptance(
  msdsId: string,
  tenantId: string,
  userId: string,
  msdsData: {
    complianceStatus: "COMPLIANT" | "NON_COMPLIANT" | "REQUIRES_REVISION";
    safetyData?: any;
    hazardInformation?: any;
    evidenceId?: string;
  },
): Promise<void> {
  const context: DecisionContext = {
    module: "hazalyze",
    entityType: "msds",
    entityId: msdsId,
    tenantId,
    userId,
    data: msdsData,
  };

  // Check compliance status and make decision
  if (msdsData.complianceStatus === "COMPLIANT") {
    await DecisionPrimitives.ALLOW(context, {
      reason: "MSDS is compliant with all regulations",
      evidenceIds: msdsData.evidenceId ? [msdsData.evidenceId] : undefined,
    });
  } else if (msdsData.complianceStatus === "NON_COMPLIANT") {
    await DecisionPrimitives.BLOCK(
      context,
      "MSDS does not meet compliance requirements",
      {
        evidenceIds: msdsData.evidenceId ? [msdsData.evidenceId] : undefined,
      },
    );
  } else if (msdsData.complianceStatus === "REQUIRES_REVISION") {
    await DecisionPrimitives.ALLOW_WITH_CONDITIONS(
      context,
      [
        "Update safety data section",
        "Add missing hazard information",
        "Complete regulatory compliance checklist",
      ],
      {
        reason: "MSDS approved with required revisions",
        evidenceIds: msdsData.evidenceId ? [msdsData.evidenceId] : undefined,
      },
    );
  }
}

/**
 * Request additional MSDS evidence
 */
export async function requestMSDSEvidence(
  msdsId: string,
  tenantId: string,
  userId: string,
  evidenceRequest: {
    type: string;
    description: string;
    dueDate?: Date | string;
  },
): Promise<void> {
  const context: DecisionContext = {
    module: "hazalyze",
    entityType: "msds",
    entityId: msdsId,
    tenantId,
    userId,
    data: {},
  };

  await DecisionPrimitives.REQUEST_EVIDENCE(context, evidenceRequest);
}

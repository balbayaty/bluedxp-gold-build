/**
 * Trade Compliance Integration Service
 * Integrates customs with trade compliance module
 */

import type { TradeComplianceRecord } from "@/types/trade-compliance";
import type { CustomsDeclaration } from "@/types/customs";
import { complianceService } from "../complianceService";
import { eventBus } from "@/lib/services/event-store";

/**
 * Initialize Trade Compliance integration
 */
export function initializeTradeComplianceIntegration() {
  // Subscribe to trade compliance events
  eventBus.subscribe("trade-compliance.record.created", async (event) => {
    await handleComplianceRecordCreated(event.data as TradeComplianceRecord);
  });

  eventBus.subscribe("trade-compliance.requirement.updated", async (event) => {
    await handleRequirementUpdated(event.data);
  });

  console.log("[Customs] Trade Compliance integration initialized");
}

/**
 * Handle compliance record created
 */
async function handleComplianceRecordCreated(record: TradeComplianceRecord) {
  // Sync requirements with customs
  console.log("[Customs] Compliance record created:", record.id);
}

/**
 * Handle requirement updated
 */
async function handleRequirementUpdated(requirement: any) {
  // Update customs requirements
  console.log("[Customs] Requirement updated:", requirement.id);
}

/**
 * Get compliance requirements for declaration
 */
export async function getComplianceRequirements(
  declaration: Partial<CustomsDeclaration>,
): Promise<any[]> {
  try {
    const result = await complianceService.checkRequirements(declaration);
    return result.requirements;
  } catch (error) {
    console.error("[Customs] Failed to get compliance requirements:", error);
    return [];
  }
}

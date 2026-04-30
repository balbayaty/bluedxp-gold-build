/**
 * Proposal Service Helper
 *
 * Central helper to get proposals - uses unified service
 * This ensures all routes use the same service for consistency
 */

import { unifiedProposalService } from "./unifiedProposalService";
import type { Proposal } from "@/types/proposals";

/**
 * Get proposal by ID - uses unified service
 * Fast and consistent across all routes
 */
export async function getProposal(
  proposalId: string,
  tenantId?: string,
): Promise<Proposal | null> {
  try {
    return await unifiedProposalService.getProposal(proposalId);
  } catch (error) {
    console.error("[Proposal Helper] Error getting proposal:", error);
    return null;
  }
}

/**
 * List proposals - uses unified service
 */
export async function listProposals(filters?: {
  status?: Proposal["status"];
  type?: Proposal["type"];
  customerId?: string;
  tenantId?: string;
}): Promise<Proposal[]> {
  try {
    return await unifiedProposalService.listProposals(filters);
  } catch (error) {
    console.error("[Proposal Helper] Error listing proposals:", error);
    return [];
  }
}

/**
 * Update proposal - uses unified service
 */
export async function updateProposal(
  id: string,
  updates: Partial<Proposal>,
  updatedBy?: string,
  tenantId?: string,
): Promise<Proposal | null> {
  try {
    return await unifiedProposalService.updateProposal(
      id,
      updates,
      updatedBy,
      tenantId,
    );
  } catch (error) {
    console.error("[Proposal Helper] Error updating proposal:", error);
    return null;
  }
}

/**
 * Delete proposal - uses unified service
 */
export async function deleteProposal(id: string): Promise<boolean> {
  try {
    return await unifiedProposalService.deleteProposal(id);
  } catch (error) {
    console.error("[Proposal Helper] Error deleting proposal:", error);
    return false;
  }
}

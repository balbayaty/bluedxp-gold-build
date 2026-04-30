/**
 * MSDS-SKU Linking Service
 * Core service for managing MSDS to SKU links with intelligent matching
 * Deep Architecture • Integration-First • 4IR & 5IR Aligned
 */

import { MSDSDocument } from "@/types/chemical";
import { SKU } from "@/types/sku";
import {
  MSDSSKULink,
  MSDSSKULinkStatus,
  MatchingStrategy,
  MatchingEvidence,
  LinkSearchFilters,
  LinkSearchResult,
  BulkLinkRequest,
  BulkLinkResult,
  BulkLinkError,
} from "@/types/msdsSkuLinking";
import { intelligentMatchingService } from "./intelligentMatchingService";
import { eventBus } from "@/lib/services/event-store";
import { entityGraphService } from "@/lib/services/graph/entityGraphService";
import { createEvent } from "@/lib/services/event-store/utils";

// ============================================================================
// IN-MEMORY STORAGE (Will be replaced with database)
// ============================================================================

class LinkStore {
  private links: Map<string, MSDSSKULink> = new Map();
  private tenantLinks: Map<string, Set<string>> = new Map(); // tenantId -> linkIds
  private msdsLinks: Map<string, Set<string>> = new Map(); // msdsId -> linkIds
  private skuLinks: Map<string, Set<string>> = new Map(); // skuId -> linkIds
  private customerLinks: Map<string, Set<string>> = new Map(); // customerId -> linkIds

  get(id: string): MSDSSKULink | undefined {
    return this.links.get(id);
  }

  set(link: MSDSSKULink): void {
    this.links.set(link.id, link);

    // Index by tenant
    if (!this.tenantLinks.has(link.tenantId)) {
      this.tenantLinks.set(link.tenantId, new Set());
    }
    this.tenantLinks.get(link.tenantId)!.add(link.id);

    // Index by MSDS
    if (!this.msdsLinks.has(link.msdsId)) {
      this.msdsLinks.set(link.msdsId, new Set());
    }
    this.msdsLinks.get(link.msdsId)!.add(link.id);

    // Index by SKU
    if (!this.skuLinks.has(link.skuId)) {
      this.skuLinks.set(link.skuId, new Set());
    }
    this.skuLinks.get(link.skuId)!.add(link.id);

    // Index by customer
    if (!this.customerLinks.has(link.customerId)) {
      this.customerLinks.set(link.customerId, new Set());
    }
    this.customerLinks.get(link.customerId)!.add(link.id);
  }

  delete(id: string): boolean {
    const link = this.links.get(id);
    if (!link) return false;

    this.tenantLinks.get(link.tenantId)?.delete(id);
    this.msdsLinks.get(link.msdsId)?.delete(id);
    this.skuLinks.get(link.skuId)?.delete(id);
    this.customerLinks.get(link.customerId)?.delete(id);

    return this.links.delete(id);
  }

  getAll(tenantId: string): MSDSSKULink[] {
    const ids = this.tenantLinks.get(tenantId) || new Set();
    return Array.from(ids)
      .map((id) => this.links.get(id))
      .filter((link): link is MSDSSKULink => link !== undefined);
  }

  getByMSDS(tenantId: string, msdsId: string): MSDSSKULink[] {
    const linkIds = this.msdsLinks.get(msdsId) || new Set();
    return Array.from(linkIds)
      .map((id) => this.links.get(id))
      .filter((link): link is MSDSSKULink => link !== undefined)
      .filter((link) => link.tenantId === tenantId);
  }

  getBySKU(tenantId: string, skuId: string): MSDSSKULink[] {
    const linkIds = this.skuLinks.get(skuId) || new Set();
    return Array.from(linkIds)
      .map((id) => this.links.get(id))
      .filter((link): link is MSDSSKULink => link !== undefined)
      .filter((link) => link.tenantId === tenantId);
  }

  getByCustomer(tenantId: string, customerId: string): MSDSSKULink[] {
    const linkIds = this.customerLinks.get(customerId) || new Set();
    return Array.from(linkIds)
      .map((id) => this.links.get(id))
      .filter((link): link is MSDSSKULink => link !== undefined)
      .filter((link) => link.tenantId === tenantId);
  }
}

const store = new LinkStore();

// ============================================================================
// MSDS-SKU LINKING SERVICE
// ============================================================================

export class MSDSSKULinkingService {
  private requireTenant(tenantId: string) {
    if (!tenantId || tenantId.trim().length === 0) {
      throw new Error("tenantId is required (multi-tenant day 1)");
    }
    if (process.env.NODE_ENV === "production" && tenantId === "default") {
      throw new Error("Invalid tenantId");
    }
  }

  /**
   * Create a link between MSDS and SKU
   */
  async createLink(
    msdsId: string,
    skuId: string,
    customerId: string,
    options: {
      matchingStrategy?: MatchingStrategy;
      confidenceScore?: number;
      matchingEvidence?: MatchingEvidence;
      status?: MSDSSKULinkStatus;
      linkedBy?: string;
      tenantId: string;
      notes?: string;
    } = {},
  ): Promise<MSDSSKULink> {
    try {
      this.requireTenant(options.tenantId);
      // Validate inputs
      if (!msdsId || !skuId || !customerId) {
        throw new Error("MSDS ID, SKU ID, and Customer ID are required");
      }

      // Check for existing link
      const existing = this.findExistingLink(
        options.tenantId,
        msdsId,
        skuId,
        customerId,
      );
      if (existing && existing.status === "APPROVED") {
        throw new Error(
          "An approved link already exists between this MSDS and SKU",
        );
      }

      // Generate link ID
      const linkId = `link-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      // Create link
      const link: MSDSSKULink = {
        id: linkId,
        msdsId,
        skuId,
        customerId,
        tenantId: options.tenantId,
        status: options.status || "PENDING",
        matchingStrategy: options.matchingStrategy || "MANUAL",
        confidenceScore: options.confidenceScore || 0,
        matchingEvidence: options.matchingEvidence || {
          strategy: options.matchingStrategy || "MANUAL",
          confidenceScore: options.confidenceScore || 0,
          matchedFields: [],
          similarityScores: {},
        },
        linkedAt: new Date().toISOString(),
        linkedBy: options.linkedBy,
        notes: options.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: options.linkedBy,
      };

      // Store link
      store.set(link);

      // Create entity graph relationship
      try {
        await entityGraphService.createRelationship({
          sourceEntityId: msdsId,
          sourceEntityType: "document",
          targetEntityId: skuId,
          targetEntityType: "product",
          type: "references",
          label: "MSDS-SKU Link",
          direction: "bidirectional",
          strength: (link.confidenceScore || 0) / 100,
          metadata: {
            linkId: link.id,
            customerId: link.customerId,
            status: link.status,
            matchingStrategy: link.matchingStrategy,
          },
          isActive: link.status === "APPROVED",
          createdAt: new Date().toISOString(),
        });
      } catch (graphError) {
        console.warn("Failed to create entity graph relationship:", graphError);
        // Don't fail the link creation if graph fails
      }

      // Publish event
      await eventBus.publish(
        createEvent(
          "msds.link.created",
          link.id,
          "MSDSSKULink",
          {
            linkId: link.id,
            msdsId: link.msdsId,
            skuId: link.skuId,
            customerId: link.customerId,
            status: link.status,
            matchingStrategy: link.matchingStrategy,
            confidenceScore: link.confidenceScore,
          },
          1,
          {
            tenantId: link.tenantId,
            userId: options.linkedBy,
            correlationId: `msds-link-create-${Date.now()}`,
            source: "msds-sku-linking",
          },
        ),
      );

      return link;
    } catch (error) {
      console.error("Error creating MSDS-SKU link:", error);
      throw error;
    }
  }

  /**
   * Get link by ID
   */
  async getLink(tenantId: string, id: string): Promise<MSDSSKULink | null> {
    try {
      this.requireTenant(tenantId);
      const link = store.get(id) || null;
      if (!link) return null;
      if (link.tenantId !== tenantId) return null;
      return link;
    } catch (error) {
      console.error("Error getting link:", error);
      throw error;
    }
  }

  /**
   * Update link
   */
  async updateLink(
    tenantId: string,
    id: string,
    updates: Partial<MSDSSKULink>,
  ): Promise<MSDSSKULink> {
    try {
      this.requireTenant(tenantId);
      const existing = store.get(id);
      if (!existing) {
        throw new Error(`Link ${id} not found`);
      }
      if (existing.tenantId !== tenantId) {
        throw new Error(`Link ${id} not found`);
      }

      const updated: MSDSSKULink = {
        ...existing,
        ...updates,
        id, // Prevent ID change
        updatedAt: new Date().toISOString(),
        updatedBy: updates.updatedBy,
      };

      store.set(updated);

      // Update entity graph if status changed
      if (updates.status) {
        try {
          const relationships = await entityGraphService.findRelated(
            existing.msdsId,
            {
              targetEntityTypes: ["product"],
              maxDepth: 1,
            },
          );
          // Update relationship status if found
          // (Simplified - in production, would find and update the specific relationship)
        } catch (graphError) {
          console.warn(
            "Failed to update entity graph relationship:",
            graphError,
          );
        }
      }

      // Publish event
      await eventBus.publish(
        createEvent(
          "msds.link.updated",
          updated.id,
          "MSDSSKULink",
          {
            linkId: updated.id,
            msdsId: updated.msdsId,
            skuId: updated.skuId,
            status: updated.status,
            changes: Object.keys(updates),
          },
          1,
          {
            tenantId: updated.tenantId,
            userId: updates.updatedBy,
            correlationId: `msds-link-update-${Date.now()}`,
            source: "msds-sku-linking",
          },
        ),
      );

      return updated;
    } catch (error) {
      console.error("Error updating link:", error);
      throw error;
    }
  }

  /**
   * Delete link
   */
  async deleteLink(
    tenantId: string,
    id: string,
    deletedBy?: string,
  ): Promise<void> {
    try {
      this.requireTenant(tenantId);
      const link = store.get(id);
      if (!link) {
        throw new Error(`Link ${id} not found`);
      }
      if (link.tenantId !== tenantId) {
        throw new Error(`Link ${id} not found`);
      }

      store.delete(id);

      // Publish event
      await eventBus.publish(
        createEvent(
          "msds.link.deleted",
          id,
          "MSDSSKULink",
          {
            linkId: id,
            msdsId: link.msdsId,
            skuId: link.skuId,
            customerId: link.customerId,
          },
          1,
          {
            tenantId: link.tenantId,
            userId: deletedBy,
            correlationId: `msds-link-delete-${Date.now()}`,
            source: "msds-sku-linking",
          },
        ),
      );
    } catch (error) {
      console.error("Error deleting link:", error);
      throw error;
    }
  }

  /**
   * Approve link
   */
  async approveLink(
    id: string,
    tenantId: string,
    options: {
      approvedBy: string;
      approvalLevel?: string;
      conditions?: any[];
      notes?: string;
    },
  ): Promise<MSDSSKULink> {
    try {
      const link = await this.updateLink(tenantId, id, {
        status: "APPROVED",
        approvedBy: options.approvedBy,
        approvedAt: new Date().toISOString(),
        approvalLevel: options.approvalLevel as any,
        conditions: options.conditions,
        notes: options.notes,
        updatedBy: options.approvedBy,
      });

      // Publish approval event
      await eventBus.publish(
        createEvent(
          "msds.linked",
          link.id,
          "MSDSSKULink",
          {
            linkId: link.id,
            msdsId: link.msdsId,
            skuId: link.skuId,
            customerId: link.customerId,
            approvedBy: options.approvedBy,
          },
          1,
          {
            tenantId: link.tenantId,
            userId: options.approvedBy,
            correlationId: `msds-link-approve-${Date.now()}`,
            source: "msds-sku-linking",
          },
        ),
      );

      return link;
    } catch (error) {
      console.error("Error approving link:", error);
      throw error;
    }
  }

  /**
   * Reject link
   */
  async rejectLink(
    id: string,
    tenantId: string,
    options: {
      rejectedBy: string;
      rejectionReason: string;
    },
  ): Promise<MSDSSKULink> {
    try {
      const link = await this.updateLink(tenantId, id, {
        status: "REJECTED",
        rejectedBy: options.rejectedBy,
        rejectedAt: new Date().toISOString(),
        rejectionReason: options.rejectionReason,
        updatedBy: options.rejectedBy,
      });

      // Publish rejection event
      await eventBus.publish(
        createEvent(
          "msds.link.rejected",
          link.id,
          "MSDSSKULink",
          {
            linkId: link.id,
            msdsId: link.msdsId,
            skuId: link.skuId,
            customerId: link.customerId,
            rejectedBy: options.rejectedBy,
            rejectionReason: options.rejectionReason,
          },
          1,
          {
            tenantId: link.tenantId,
            userId: options.rejectedBy,
            correlationId: `msds-link-reject-${Date.now()}`,
            source: "msds-sku-linking",
          },
        ),
      );

      return link;
    } catch (error) {
      console.error("Error rejecting link:", error);
      throw error;
    }
  }

  /**
   * Find matches for MSDS
   */
  async findMatchesForMSDS(
    msds: MSDSDocument,
    customerId: string,
    skus?: SKU[],
  ): Promise<{
    matches: any[];
    suggestions: any[];
    warnings: string[];
  }> {
    try {
      // If SKUs not provided, would need to fetch from SKU service
      // For now, assume they're provided
      if (!skus || skus.length === 0) {
        return {
          matches: [],
          suggestions: [],
          warnings: ["No SKUs provided for matching"],
        };
      }

      // Use intelligent matching service
      const result = await intelligentMatchingService.findMatchesForMSDS(
        msds,
        skus,
        customerId,
      );

      return result;
    } catch (error) {
      console.error("Error finding matches:", error);
      throw error;
    }
  }

  /**
   * Bulk create links
   */
  async bulkCreateLinks(
    tenantId: string,
    request: BulkLinkRequest,
    linkedBy?: string,
  ): Promise<BulkLinkResult> {
    const result: BulkLinkResult = {
      total: 0,
      successful: 0,
      failed: 0,
      links: [],
      errors: [],
    };

    try {
      this.requireTenant(tenantId);
      for (const linkRequest of request.links) {
        result.total++;

        try {
          // Create link for each SKU
          for (const skuId of linkRequest.skuIds) {
            const link = await this.createLink(
              linkRequest.msdsId,
              skuId,
              request.customerId,
              {
                matchingStrategy: linkRequest.matchingStrategy || "BULK_IMPORT",
                confidenceScore: linkRequest.confidenceThreshold || 50,
                status: request.autoApprove ? "APPROVED" : "PENDING",
                tenantId,
                linkedBy,
              },
            );

            result.links.push(link);
            result.successful++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            msdsId: linkRequest.msdsId,
            skuIds: linkRequest.skuIds,
            error: error instanceof Error ? error.message : "Unknown error",
            code: "BULK_LINK_ERROR",
          });
        }
      }

      return result;
    } catch (error) {
      console.error("Error in bulk create links:", error);
      throw error;
    }
  }

  /**
   * Search links
   */
  async searchLinks(
    tenantId: string,
    filters: LinkSearchFilters,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<LinkSearchResult> {
    try {
      this.requireTenant(tenantId);
      let links = store.getAll(tenantId);

      // Apply filters
      if (filters.customerId) {
        links = links.filter((l) => l.customerId === filters.customerId);
      }
      if (filters.msdsId) {
        links = links.filter((l) => l.msdsId === filters.msdsId);
      }
      if (filters.skuId) {
        links = links.filter((l) => l.skuId === filters.skuId);
      }
      if (filters.status?.length) {
        links = links.filter((l) => filters.status!.includes(l.status));
      }
      if (filters.matchingStrategy?.length) {
        links = links.filter((l) =>
          filters.matchingStrategy!.includes(l.matchingStrategy),
        );
      }
      if (filters.minConfidence !== undefined) {
        links = links.filter(
          (l) => l.confidenceScore >= filters.minConfidence!,
        );
      }
      if (filters.maxConfidence !== undefined) {
        links = links.filter(
          (l) => l.confidenceScore <= filters.maxConfidence!,
        );
      }

      // Sort by creation date (newest first)
      links.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      // Pagination
      const total = links.length;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedLinks = links.slice(start, end);

      return {
        links: paginatedLinks,
        total,
        page,
        pageSize,
        filters,
      };
    } catch (error) {
      console.error("Error searching links:", error);
      throw error;
    }
  }

  /**
   * Get links by MSDS
   */
  async getLinksByMSDS(msdsId: string): Promise<MSDSSKULink[]> {
    try {
      throw new Error("Use getLinksByMSDSForTenant");
    } catch (error) {
      console.error("Error getting links by MSDS:", error);
      throw error;
    }
  }

  async getLinksByMSDSForTenant(
    tenantId: string,
    msdsId: string,
  ): Promise<MSDSSKULink[]> {
    this.requireTenant(tenantId);
    return store.getByMSDS(tenantId, msdsId);
  }

  /**
   * Get links by SKU
   */
  async getLinksBySKU(skuId: string): Promise<MSDSSKULink[]> {
    try {
      throw new Error("Use getLinksBySKUForTenant");
    } catch (error) {
      console.error("Error getting links by SKU:", error);
      throw error;
    }
  }

  async getLinksBySKUForTenant(
    tenantId: string,
    skuId: string,
  ): Promise<MSDSSKULink[]> {
    this.requireTenant(tenantId);
    return store.getBySKU(tenantId, skuId);
  }

  /**
   * Get links by customer
   */
  async getLinksByCustomer(customerId: string): Promise<MSDSSKULink[]> {
    try {
      throw new Error("Use getLinksByCustomerForTenant");
    } catch (error) {
      console.error("Error getting links by customer:", error);
      throw error;
    }
  }

  async getLinksByCustomerForTenant(
    tenantId: string,
    customerId: string,
  ): Promise<MSDSSKULink[]> {
    this.requireTenant(tenantId);
    return store.getByCustomer(tenantId, customerId);
  }

  /**
   * Find existing link
   */
  private findExistingLink(
    tenantId: string,
    msdsId: string,
    skuId: string,
    customerId: string,
  ): MSDSSKULink | null {
    const msdsLinks = store.getByMSDS(tenantId, msdsId);
    return (
      msdsLinks.find(
        (link) => link.skuId === skuId && link.customerId === customerId,
      ) || null
    );
  }
}

export const msdsSkuLinkingService = new MSDSSKULinkingService();

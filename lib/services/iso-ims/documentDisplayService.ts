/**
 * Document Display Service
 *
 * Multi-Module Document Display & Discovery
 *
 * Provides:
 * - Get documents by facility/asset/space
 * - Get documents by standard requirement
 * - Get documents by material/order
 * - Get documents by user permissions
 * - Get documents by context (current module)
 * - Permission-aware document filtering
 * - Context-aware document display
 */

import { documentService } from "./documentService";
import { documentIntelligenceService } from "./documentIntelligenceService";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { permissionService } from "@/lib/services/user/permissionService";
import type { Document, ISOIMSQuery } from "./types";
import type { DocumentSortConfig } from "./documentIntelligenceService";

// ============================================================================
// TYPES
// ============================================================================

export interface DocumentDisplayQuery {
  tenantId: string;
  userId?: string;
  context?: {
    module?: string;
    facilityId?: string;
    assetId?: string;
    spaceId?: string;
    materialId?: string;
    orderId?: string;
    standardCode?: string;
    requirementId?: string;
    ncrId?: string;
    capaId?: string;
  };
  filters?: {
    documentType?: string;
    category?: string;
    status?: string;
    standard?: string;
    search?: string;
  };
  sortConfig?: DocumentSortConfig;
  pagination?: {
    page: number;
    pageSize: number;
  };
}

export interface DocumentDisplayResult {
  documents: Document[];
  total: number;
  intelligence: {
    sortedBy: string;
    relevanceScores: Record<string, number>;
    suggestedLinks: Record<
      string,
      Array<{ type: string; id: string; confidence: number; reason: string }>
    >;
  };
  permissions: {
    canView: Record<string, boolean>;
    canEdit: Record<string, boolean>;
    canDelete: Record<string, boolean>;
  };
}

// ============================================================================
// DOCUMENT DISPLAY SERVICE
// ============================================================================

class DocumentDisplayService {
  /**
   * Get documents for display in any module
   * Context-aware, permission-aware, intelligent sorting
   */
  async getDocumentsForDisplay(
    query: DocumentDisplayQuery,
  ): Promise<DocumentDisplayResult> {
    try {
      // Build base query
      const baseQuery: ISOIMSQuery = {
        tenantId: query.tenantId,
        filters: query.filters || {},
        pagination: query.pagination || { page: 1, pageSize: 20 },
      };

      // Add context filters
      if (query.context) {
        if (query.context.facilityId) {
          // Will need to query by facilityId once schema is updated
          // For now, use metadata search
        }
        if (query.context.standardCode) {
          baseQuery.filters = {
            ...baseQuery.filters,
            search: query.context.standardCode,
          };
        }
      }

      // Get documents
      const { documents, total } =
        await documentService.getDocuments(baseQuery);

      // Filter by context (facility, asset, etc.)
      let filteredDocuments = documents;
      if (query.context) {
        filteredDocuments = this.filterByContext(documents, query.context);
      }

      // Apply intelligent sorting
      let sortedDocuments = filteredDocuments;
      if (query.sortConfig) {
        const sortResult =
          await documentIntelligenceService.sortDocumentsIntelligently(
            filteredDocuments,
            query.sortConfig,
          );
        sortedDocuments = sortResult.sortedDocuments;
      } else {
        // Default intelligent sort
        const defaultSortConfig: DocumentSortConfig = {
          criteria: [
            { field: "relevance", direction: "DESC", weight: 0.4 },
            { field: "compliancePriority", direction: "DESC", weight: 0.3 },
            { field: "recency", direction: "DESC", weight: 0.2 },
            { field: "importance", direction: "DESC", weight: 0.1 },
          ],
          context: query.context,
          personalizationEnabled: !!query.userId,
        };
        const sortResult =
          await documentIntelligenceService.sortDocumentsIntelligently(
            filteredDocuments,
            defaultSortConfig,
          );
        sortedDocuments = sortResult.sortedDocuments;
      }

      // Check permissions
      const permissions = await this.checkPermissions(
        sortedDocuments,
        query.userId || "",
        query.tenantId,
      );

      return {
        documents: sortedDocuments,
        total: filteredDocuments.length,
        intelligence: {
          sortedBy: "intelligent-multi-criteria",
          relevanceScores: {},
          suggestedLinks: {},
        },
        permissions,
      };
    } catch (error) {
      console.error("Error getting documents for display:", error);
      throw error;
    }
  }

  /**
   * Get documents by facility
   */
  async getDocumentsByFacility(
    facilityId: string,
    tenantId: string,
    userId?: string,
  ): Promise<Document[]> {
    try {
      // Query documents linked to facility
      // For now, use knowledge base search until schema is updated
      const searchResults = await knowledgeBaseService.search({
        query: `facility ${facilityId}`,
        filters: { types: ["fact", "procedure"] },
        limit: 100,
      });

      // Extract document IDs and fetch documents
      const documentIds = searchResults.results
        .map((r) => r.entry.metadata?.documentId)
        .filter(Boolean) as string[];

      const documents: Document[] = [];
      for (const docId of documentIds) {
        const doc = await documentService.getDocument(docId, tenantId);
        if (doc) documents.push(doc);
      }

      return documents;
    } catch (error) {
      console.error("Error getting documents by facility:", error);
      return [];
    }
  }

  /**
   * Get documents by asset
   */
  async getDocumentsByAsset(
    assetId: string,
    tenantId: string,
    userId?: string,
  ): Promise<Document[]> {
    try {
      // Similar to facility, query by asset
      const searchResults = await knowledgeBaseService.search({
        query: `asset ${assetId}`,
        filters: { types: ["fact", "procedure"] },
        limit: 100,
      });

      const documentIds = searchResults.results
        .map((r) => r.entry.metadata?.documentId)
        .filter(Boolean) as string[];

      const documents: Document[] = [];
      for (const docId of documentIds) {
        const doc = await documentService.getDocument(docId, tenantId);
        if (doc) documents.push(doc);
      }

      return documents;
    } catch (error) {
      console.error("Error getting documents by asset:", error);
      return [];
    }
  }

  /**
   * Get documents by standard requirement
   */
  async getDocumentsByStandard(
    standardCode: string,
    requirementId: string,
    tenantId: string,
  ): Promise<Document[]> {
    try {
      const { documents } = await documentService.getDocuments({
        tenantId,
        filters: {
          search: standardCode,
        },
        pagination: { page: 1, pageSize: 100 },
      });

      // Filter by requirement (would check clauses)
      return documents.filter(
        (doc) =>
          doc.clauses?.some((c) => c.includes(requirementId)) ||
          doc.isoStandards?.some((s) => s.includes(standardCode)),
      );
    } catch (error) {
      console.error("Error getting documents by standard:", error);
      return [];
    }
  }

  /**
   * Filter documents by context
   */
  private filterByContext(
    documents: Document[],
    context: DocumentDisplayQuery["context"],
  ): Document[] {
    if (!context) return documents;

    return documents.filter((doc) => {
      // Filter by facility
      if (context.facilityId) {
        if (doc.facilityId === context.facilityId) return true;
        if (doc.linkedFacilities?.includes(context.facilityId)) return true;
      }

      // Filter by asset
      if (context.assetId) {
        if (doc.linkedAssets?.includes(context.assetId)) return true;
      }

      // Filter by space
      if (context.spaceId) {
        if (doc.linkedSpaces?.includes(context.spaceId)) return true;
      }

      // Filter by standard
      if (context.standardCode) {
        if (doc.isoStandards?.some((s) => s.includes(context.standardCode!)))
          return true;
      }

      // If no specific context filters, include all
      if (
        !context.facilityId &&
        !context.assetId &&
        !context.spaceId &&
        !context.standardCode
      ) {
        return true;
      }

      return false;
    });
  }

  /**
   * Check permissions for documents
   */
  private async checkPermissions(
    documents: Document[],
    userId: string,
    tenantId: string,
  ): Promise<{
    canView: Record<string, boolean>;
    canEdit: Record<string, boolean>;
    canDelete: Record<string, boolean>;
  }> {
    const permissions = {
      canView: {} as Record<string, boolean>,
      canEdit: {} as Record<string, boolean>,
      canDelete: {} as Record<string, boolean>,
    };

    try {
      for (const doc of documents) {
        // Check view permission
        const canView = await permissionService.hasPermission(
          userId,
          {
            module: "iso-ims",
            feature: "documents",
            action: "read",
          },
          tenantId,
        );
        permissions.canView[doc.id] = canView;

        // Check edit permission
        const canEdit = await permissionService.hasPermission(
          userId,
          {
            module: "iso-ims",
            feature: "documents",
            action: "write",
          },
          tenantId,
        );
        permissions.canEdit[doc.id] = canEdit;

        // Check delete permission
        const canDelete = await permissionService.hasPermission(
          userId,
          {
            module: "iso-ims",
            feature: "documents",
            action: "delete",
          },
          tenantId,
        );
        permissions.canDelete[doc.id] = canDelete;
      }
    } catch (error) {
      console.warn("Error checking permissions:", error);
      // Default to false for security
      documents.forEach((doc) => {
        permissions.canView[doc.id] = false;
        permissions.canEdit[doc.id] = false;
        permissions.canDelete[doc.id] = false;
      });
    }

    return permissions;
  }
}

export const documentDisplayService = new DocumentDisplayService();

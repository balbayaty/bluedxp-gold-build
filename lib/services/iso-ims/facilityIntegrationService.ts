/**
 * ISO IMS Facility Integration Service
 *
 * Deep integration between ISO IMS and Facility Management
 *
 * Provides:
 * - Bidirectional linking between documents and facilities/assets/spaces
 * - CAD drawing integration
 * - Facility-aware document queries
 * - Auto-linking based on content analysis
 */

import { documentService } from "./documentService";
import { documentIntelligenceService } from "./documentIntelligenceService";
import { eventBus, createEvent } from "@/lib/services/event-bus";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import type { Document } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface FacilityDocumentLink {
  documentId: string;
  facilityId: string;
  linkType: "FACILITY" | "ASSET" | "SPACE" | "CAD";
  linkedEntityId: string;
  confidence: number;
  reason: string;
  createdAt: Date;
  createdBy: string;
}

export interface FacilityDocumentQuery {
  facilityId?: string;
  assetId?: string;
  spaceId?: string;
  cadDrawingId?: string;
  documentType?: string;
  category?: string;
  standard?: string;
  tenantId: string;
}

// ============================================================================
// FACILITY INTEGRATION SERVICE
// ============================================================================

class ISOIMSFacilityIntegrationService {
  /**
   * Link document to facility (bidirectional)
   */
  async linkDocumentToFacility(
    documentId: string,
    facilityId: string,
    tenantId: string,
    userId: string,
  ): Promise<{ document: Document; facilityUpdated: boolean }> {
    try {
      // Link document to facility
      const document = await documentService.linkToFacility(
        documentId,
        facilityId,
        tenantId,
        userId,
      );

      // Publish event for facility module to update
      await eventBus.publish(
        createEvent(
          "facility.document.linked",
          facilityId,
          "FACILITY",
          { facilityId, documentId, tenantId },
          1,
          { tenantId, userId },
        ),
      );

      return {
        document,
        facilityUpdated: true,
      };
    } catch (error) {
      console.error("Error linking document to facility:", error);
      throw error;
    }
  }

  /**
   * Link document to asset (bidirectional)
   */
  async linkDocumentToAsset(
    documentId: string,
    assetId: string,
    tenantId: string,
    userId: string,
  ): Promise<{ document: Document; assetUpdated: boolean }> {
    try {
      const document = await documentService.linkToAsset(
        documentId,
        assetId,
        tenantId,
        userId,
      );

      await eventBus.publish(
        createEvent(
          "facility.asset.document.linked",
          assetId,
          "ASSET",
          { assetId, documentId, tenantId },
          1,
          { tenantId, userId },
        ),
      );

      return {
        document,
        assetUpdated: true,
      };
    } catch (error) {
      console.error("Error linking document to asset:", error);
      throw error;
    }
  }

  /**
   * Auto-link document to facilities/assets based on content analysis
   */
  async autoLinkDocument(
    documentId: string,
    tenantId: string,
  ): Promise<
    Array<{ type: string; id: string; confidence: number; reason: string }>
  > {
    try {
      const document = await documentService.getDocument(documentId, tenantId);
      if (!document) {
        throw new Error("Document not found");
      }

      // Use document intelligence to suggest links
      const suggestions = await documentService.suggestLinks(
        documentId,
        tenantId,
      );

      // Auto-link high-confidence suggestions
      const linked: Array<{
        type: string;
        id: string;
        confidence: number;
        reason: string;
      }> = [];

      for (const suggestion of suggestions) {
        if (suggestion.confidence >= 0.8) {
          try {
            if (suggestion.type === "FACILITY") {
              await documentService.linkToFacility(
                documentId,
                suggestion.id,
                tenantId,
                "system",
              );
              linked.push(suggestion);
            } else if (suggestion.type === "ASSET") {
              await documentService.linkToAsset(
                documentId,
                suggestion.id,
                tenantId,
                "system",
              );
              linked.push(suggestion);
            } else if (suggestion.type === "SPACE") {
              await documentService.linkToSpace(
                documentId,
                suggestion.id,
                tenantId,
                "system",
              );
              linked.push(suggestion);
            } else if (suggestion.type === "CAD") {
              await documentService.linkToCADDrawing(
                documentId,
                suggestion.id,
                tenantId,
                "system",
              );
              linked.push(suggestion);
            }
          } catch (error) {
            console.warn(
              `Failed to auto-link ${suggestion.type} ${suggestion.id}:`,
              error,
            );
          }
        }
      }

      return linked;
    } catch (error) {
      console.error("Error auto-linking document:", error);
      return [];
    }
  }

  /**
   * Get all documents for a facility
   */
  async getFacilityDocuments(
    facilityId: string,
    tenantId: string,
    filters?: {
      documentType?: string;
      category?: string;
      standard?: string;
    },
  ): Promise<Document[]> {
    try {
      const documents = await documentService.getDocumentsByFacility(
        facilityId,
        tenantId,
      );

      // Apply filters
      let filtered = documents;
      if (filters) {
        if (filters.documentType) {
          filtered = filtered.filter(
            (d) => d.documentType === filters.documentType,
          );
        }
        if (filters.category) {
          filtered = filtered.filter((d) => d.category === filters.category);
        }
        if (filters.standard) {
          filtered = filtered.filter((d) =>
            d.isoStandards?.some((s) => s.includes(filters.standard!)),
          );
        }
      }

      return filtered;
    } catch (error) {
      console.error("Error getting facility documents:", error);
      return [];
    }
  }

  /**
   * Get all documents for an asset
   */
  async getAssetDocuments(
    assetId: string,
    tenantId: string,
  ): Promise<Document[]> {
    try {
      return await documentService.getDocumentsByAsset(assetId, tenantId);
    } catch (error) {
      console.error("Error getting asset documents:", error);
      return [];
    }
  }

  /**
   * Get CAD drawings linked to ISO IMS documents
   */
  async getLinkedCADDrawings(
    documentId: string,
    tenantId: string,
  ): Promise<
    Array<{ id: string; name: string; type: string; fileUrl: string }>
  > {
    try {
      const document = await documentService.getDocument(documentId, tenantId);
      if (
        !document ||
        !document.linkedCADDrawings ||
        document.linkedCADDrawings.length === 0
      ) {
        return [];
      }

      // Would integrate with CAD Document Service
      // For now, return metadata
      return document.linkedCADDrawings.map((id) => ({
        id,
        name: `CAD Drawing ${id}`,
        type: "DWG",
        fileUrl: "",
      }));
    } catch (error) {
      console.error("Error getting linked CAD drawings:", error);
      return [];
    }
  }

  /**
   * Get ISO IMS documents linked to a CAD drawing
   */
  async getDocumentsForCADDrawing(
    cadDrawingId: string,
    tenantId: string,
  ): Promise<Document[]> {
    try {
      // Query documents with this CAD drawing in linkedCADDrawings
      const { documents } = await documentService.getDocuments({
        tenantId,
        pagination: { page: 1, pageSize: 100 },
      });

      return documents.filter((doc) =>
        doc.linkedCADDrawings?.includes(cadDrawingId),
      );
    } catch (error) {
      console.error("Error getting documents for CAD drawing:", error);
      return [];
    }
  }
}

export const isoIMSFacilityIntegrationService =
  new ISOIMSFacilityIntegrationService();

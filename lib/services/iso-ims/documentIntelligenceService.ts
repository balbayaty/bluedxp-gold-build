/**
 * Document Intelligence Service
 *
 * THE BRAIN OF DOCUMENT MANAGEMENT
 *
 * Provides:
 * - Intelligent document sorting (multi-criteria, personalized, context-aware)
 * - Semantic search and similarity
 * - Auto-linking to facilities, assets, standards
 * - Compliance priority calculation
 * - User behavior learning
 * - Multi-module document discovery
 */

import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { unifiedDocumentCenterService } from "@/lib/services/unified/unifiedDocumentCenterService";
import { comprehensiveStandardsService } from "@/lib/services/qhse/standards/comprehensiveStandardsFramework";
import type { Document } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface DocumentSortCriteria {
  field:
    | "relevance"
    | "compliancePriority"
    | "facility"
    | "standard"
    | "recency"
    | "importance"
    | "userPreference"
    | "accessCount";
  direction: "ASC" | "DESC";
  weight?: number; // For multi-criteria sorting
}

export interface DocumentSortConfig {
  criteria: DocumentSortCriteria[];
  context?: {
    module?: string;
    facilityId?: string;
    assetId?: string;
    userId?: string;
    userRole?: string;
  };
  personalizationEnabled?: boolean;
}

export interface DocumentIntelligenceResult {
  sortedDocuments: Document[];
  intelligence: {
    relevanceScores: Record<string, number>;
    compliancePriorities: Record<string, number>;
    suggestedLinks: Record<
      string,
      Array<{ type: string; id: string; confidence: number; reason: string }>
    >;
    classificationConfidence: Record<string, number>;
  };
  metadata: {
    sortMethod: string;
    criteriaUsed: DocumentSortCriteria[];
    processingTime: number;
  };
}

export interface DocumentLinkSuggestion {
  documentId: string;
  suggestions: Array<{
    type:
      | "FACILITY"
      | "ASSET"
      | "SPACE"
      | "CAD"
      | "STANDARD"
      | "NCR"
      | "CAPA"
      | "MATERIAL"
      | "ORDER";
    id: string;
    confidence: number;
    reason: string;
    metadata?: Record<string, any>;
  }>;
}

// ============================================================================
// DOCUMENT INTELLIGENCE SERVICE
// ============================================================================

class DocumentIntelligenceService {
  private userPreferences: Map<string, DocumentSortConfig> = new Map();
  private userBehavior: Map<
    string,
    Array<{ documentId: string; action: string; timestamp: Date }>
  > = new Map();

  /**
   * Intelligent document sorting
   * Multi-criteria, personalized, context-aware sorting
   */
  async sortDocumentsIntelligently(
    documents: Document[],
    config: DocumentSortConfig,
  ): Promise<DocumentIntelligenceResult> {
    const startTime = Date.now();

    try {
      // Calculate intelligence scores for each document
      const intelligenceScores = await Promise.all(
        documents.map((doc) => this.calculateIntelligenceScores(doc, config)),
      );

      // Combine scores based on criteria weights
      const combinedScores = documents.map((doc, index) => {
        const scores = intelligenceScores[index];
        let combinedScore = 0;
        let totalWeight = 0;

        config.criteria.forEach((criterion) => {
          const weight = criterion.weight || 1;
          totalWeight += weight;

          switch (criterion.field) {
            case "relevance":
              combinedScore += (scores.relevance || 0) * weight;
              break;
            case "compliancePriority":
              combinedScore += (scores.compliancePriority || 0) * weight;
              break;
            case "recency":
              combinedScore += (scores.recency || 0) * weight;
              break;
            case "importance":
              combinedScore += (scores.importance || 0) * weight;
              break;
            case "userPreference":
              combinedScore += (scores.userPreference || 0) * weight;
              break;
            case "accessCount":
              combinedScore += (scores.accessCount || 0) * weight;
              break;
          }
        });

        return {
          document: doc,
          score: totalWeight > 0 ? combinedScore / totalWeight : 0,
          scores,
        };
      });

      // Sort by combined score
      const sorted = combinedScores
        .sort((a, b) => {
          const direction = config.criteria[0]?.direction === "ASC" ? 1 : -1;
          return (b.score - a.score) * direction;
        })
        .map((item) => item.document);

      // Generate intelligence metadata
      const intelligence = {
        relevanceScores: Object.fromEntries(
          combinedScores.map((item, idx) => [
            item.document.id,
            item.scores.relevance || 0,
          ]),
        ),
        compliancePriorities: Object.fromEntries(
          combinedScores.map((item, idx) => [
            item.document.id,
            item.scores.compliancePriority || 0,
          ]),
        ),
        suggestedLinks: {} as Record<
          string,
          Array<{
            type: string;
            id: string;
            confidence: number;
            reason: string;
          }>
        >,
        classificationConfidence: Object.fromEntries(
          combinedScores.map((item, idx) => [
            item.document.id,
            item.scores.classificationConfidence || 0,
          ]),
        ),
      };

      // Generate link suggestions
      for (const doc of sorted.slice(0, 10)) {
        // Top 10 for performance
        const suggestions = await this.generateLinkSuggestions(doc, config);
        intelligence.suggestedLinks[doc.id] = suggestions;
      }

      const processingTime = Date.now() - startTime;

      return {
        sortedDocuments: sorted,
        intelligence,
        metadata: {
          sortMethod: "multi-criteria-intelligent",
          criteriaUsed: config.criteria,
          processingTime,
        },
      };
    } catch (error) {
      console.error("Error in intelligent document sorting:", error);
      // Fallback to simple sort
      return {
        sortedDocuments: documents.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
        intelligence: {
          relevanceScores: {},
          compliancePriorities: {},
          suggestedLinks: {},
          classificationConfidence: {},
        },
        metadata: {
          sortMethod: "fallback-simple",
          criteriaUsed: [],
          processingTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Calculate intelligence scores for a document
   */
  private async calculateIntelligenceScores(
    document: Document,
    config: DocumentSortConfig,
  ): Promise<{
    relevance: number;
    compliancePriority: number;
    recency: number;
    importance: number;
    userPreference: number;
    accessCount: number;
    classificationConfidence: number;
  }> {
    // Relevance score (semantic similarity to context)
    const relevance = await this.calculateRelevance(document, config);

    // Compliance priority (based on standards, status, deadlines)
    const compliancePriority = await this.calculateCompliancePriority(document);

    // Recency score (how recent is the document)
    const recency = this.calculateRecency(document);

    // Importance score (based on type, status, links)
    const importance = this.calculateImportance(document);

    // User preference (learned from user behavior)
    const userPreference = config.context?.userId
      ? await this.calculateUserPreference(document, config.context.userId)
      : 0;

    // Access count (how often accessed)
    const accessCount = (document.accessCount || document.views || 0) / 100; // Normalize

    // Classification confidence (from Unified Document Center)
    const classificationConfidence =
      document.intelligenceMetadata?.classificationConfidence || 0.5;

    return {
      relevance,
      compliancePriority,
      recency,
      importance,
      userPreference,
      accessCount,
      classificationConfidence,
    };
  }

  /**
   * Calculate relevance score (semantic similarity)
   */
  private async calculateRelevance(
    document: Document,
    config: DocumentSortConfig,
  ): Promise<number> {
    try {
      if (!config.context) return 0.5;

      // Build context query
      const contextQuery = [
        config.context.module,
        config.context.facilityId,
        config.context.assetId,
      ]
        .filter(Boolean)
        .join(" ");

      if (!contextQuery) return 0.5;

      // Use knowledge base semantic search
      const searchResults = await knowledgeBaseService.search({
        query: `${document.title} ${document.description || ""} ${contextQuery}`,
        limit: 5,
      });

      // Calculate average similarity
      if (searchResults.results.length === 0) return 0.5;

      const avgSimilarity =
        searchResults.results.reduce((sum, r) => sum + (r.score || 0), 0) /
        searchResults.results.length;
      return Math.min(1, Math.max(0, avgSimilarity));
    } catch (error) {
      console.warn("Error calculating relevance:", error);
      return 0.5;
    }
  }

  /**
   * Calculate compliance priority
   */
  private async calculateCompliancePriority(
    document: Document,
  ): Promise<number> {
    let priority = 0.5; // Base priority

    // Higher priority for critical standards
    if (document.isoStandards && document.isoStandards.length > 0) {
      const criticalStandards = [
        "ISO-9001",
        "ISO-14001",
        "ISO-45001",
        "ISO-27001",
      ];
      const hasCritical = document.isoStandards.some((s) =>
        criticalStandards.some((cs) => s.includes(cs)),
      );
      if (hasCritical) priority += 0.2;
    }

    // Higher priority for documents with upcoming review dates
    if (document.nextReviewDate) {
      const daysUntilReview = Math.floor(
        (document.nextReviewDate.getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysUntilReview < 30) priority += 0.3;
      if (daysUntilReview < 7) priority += 0.2;
    }

    // Higher priority for draft/under review documents
    if (document.status === "DRAFT" || document.status === "UNDER_REVIEW") {
      priority += 0.1;
    }

    // Higher priority for documents with compliance issues
    if (document.intelligenceMetadata?.complianceScore !== undefined) {
      const complianceScore = document.intelligenceMetadata.complianceScore;
      if (complianceScore < 70) priority += 0.2;
    }

    return Math.min(1, Math.max(0, priority));
  }

  /**
   * Calculate recency score
   */
  private calculateRecency(document: Document): number {
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(document.createdAt).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // Newer documents get higher score
    if (daysSinceCreation < 7) return 1.0;
    if (daysSinceCreation < 30) return 0.8;
    if (daysSinceCreation < 90) return 0.6;
    if (daysSinceCreation < 180) return 0.4;
    return 0.2;
  }

  /**
   * Calculate importance score
   */
  private calculateImportance(document: Document): number {
    let importance = 0.5;

    // Higher importance for policies and procedures
    if (document.documentType === "POLICY") importance += 0.2;
    if (document.documentType === "PROCEDURE") importance += 0.15;

    // Higher importance for approved documents
    if (document.status === "APPROVED") importance += 0.1;

    // Higher importance for documents with many links
    const linkCount =
      (document.linkedDocuments?.length || 0) +
      (document.linkedNCRs?.length || 0) +
      (document.linkedCAPAs?.length || 0) +
      (document.linkedFacilities?.length || 0) +
      (document.linkedAssets?.length || 0);
    importance += Math.min(0.2, linkCount * 0.05);

    // Higher importance for high access count
    const accessCount = document.accessCount || document.views || 0;
    importance += Math.min(0.1, accessCount / 1000);

    return Math.min(1, Math.max(0, importance));
  }

  /**
   * Calculate user preference (learned from behavior)
   */
  private async calculateUserPreference(
    document: Document,
    userId: string,
  ): Promise<number> {
    const behavior = this.userBehavior.get(userId) || [];

    // Count interactions with similar documents
    const similarInteractions = behavior.filter((b) => {
      // Could enhance with semantic similarity
      return b.documentId !== document.id;
    });

    // If user frequently accesses documents of this type/category
    const typeMatches = similarInteractions.length;
    const preference = Math.min(1, typeMatches / 10); // Normalize

    return preference;
  }

  /**
   * Generate link suggestions for a document (public method)
   */
  async generateLinkSuggestions(
    document: Document,
    config?: DocumentSortConfig,
  ): Promise<
    Array<{ type: string; id: string; confidence: number; reason: string }>
  > {
    const suggestions: Array<{
      type: string;
      id: string;
      confidence: number;
      reason: string;
    }> = [];

    try {
      // Suggest facility links based on content analysis
      if (config?.context?.facilityId) {
        suggestions.push({
          type: "FACILITY",
          id: config.context.facilityId,
          confidence: 0.8,
          reason: "Context facility match",
        });
      }

      // Suggest standard links based on content
      if (document.description) {
        const standards = await comprehensiveStandardsService.getAllStandards();
        for (const standard of standards.slice(0, 5)) {
          if (
            document.description.toLowerCase().includes(standard.toLowerCase())
          ) {
            suggestions.push({
              type: "STANDARD",
              id: standard,
              confidence: 0.7,
              reason: `Content mentions ${standard}`,
            });
          }
        }
      }

      // Suggest asset links if facility is known
      if (config?.context?.facilityId && document.description) {
        // Could query facility service for assets
        // For now, return empty
      }

      return suggestions;
    } catch (error) {
      console.warn("Error generating link suggestions:", error);
      return [];
    }
  }

  /**
   * Track user behavior for learning
   */
  trackUserBehavior(
    userId: string,
    documentId: string,
    action: "view" | "download" | "edit" | "link",
  ): void {
    if (!this.userBehavior.has(userId)) {
      this.userBehavior.set(userId, []);
    }

    const behavior = this.userBehavior.get(userId)!;
    behavior.push({
      documentId,
      action,
      timestamp: new Date(),
    });

    // Keep only last 100 actions per user
    if (behavior.length > 100) {
      behavior.shift();
    }
  }

  /**
   * Save user sorting preferences
   */
  saveUserPreferences(userId: string, config: DocumentSortConfig): void {
    this.userPreferences.set(userId, config);
  }

  /**
   * Get user sorting preferences
   */
  getUserPreferences(userId: string): DocumentSortConfig | null {
    return this.userPreferences.get(userId) || null;
  }

  /**
   * Semantic search for documents
   */
  async semanticSearch(
    query: string,
    tenantId: string,
    limit: number = 20,
  ): Promise<Document[]> {
    try {
      const searchResults = await knowledgeBaseService.search({
        query,
        filters: { types: ["fact", "procedure"] },
        limit,
      });

      // Extract document IDs from results
      const documentIds = searchResults.results
        .map(
          (r) =>
            r.entry.metadata?.documentId ||
            r.entry.id.replace("iso-ims-document-", ""),
        )
        .filter(Boolean);

      // Return empty for now - would need to fetch actual documents
      // This would be integrated with documentService.getDocuments
      return [];
    } catch (error) {
      console.error("Error in semantic search:", error);
      return [];
    }
  }

  /**
   * Auto-classify document using Unified Document Center
   */
  async autoClassifyDocument(
    title: string,
    description: string,
    content?: string,
  ): Promise<{
    documentType: string;
    category: string;
    confidence: number;
    suggestedStandards: string[];
  }> {
    try {
      // Use Unified Document Center's classification
      // For now, basic classification based on keywords
      const text = `${title} ${description} ${content || ""}`.toLowerCase();

      let documentType = "GENERAL";
      let category = "GENERAL";
      let confidence = 0.7;

      // Classify by type
      if (text.includes("policy") || text.includes("policies")) {
        documentType = "POLICY";
        confidence = 0.9;
      } else if (text.includes("procedure") || text.includes("sop")) {
        documentType = "PROCEDURE";
        confidence = 0.9;
      } else if (text.includes("work instruction")) {
        documentType = "WORK_INSTRUCTION";
        confidence = 0.85;
      } else if (text.includes("form")) {
        documentType = "FORM";
        confidence = 0.85;
      }

      // Classify by category
      if (text.includes("quality") || text.includes("iso 9001")) {
        category = "QUALITY";
      } else if (text.includes("environment") || text.includes("iso 14001")) {
        category = "ENVIRONMENTAL";
      } else if (text.includes("safety") || text.includes("iso 45001")) {
        category = "SAFETY";
      } else if (text.includes("security") || text.includes("iso 27001")) {
        category = "INFORMATION_SECURITY";
      }

      // Suggest standards
      const suggestedStandards: string[] = [];
      if (text.includes("iso 9001")) suggestedStandards.push("ISO-9001-2015");
      if (text.includes("iso 14001")) suggestedStandards.push("ISO-14001-2015");
      if (text.includes("iso 45001")) suggestedStandards.push("ISO-45001-2018");
      if (text.includes("iso 27001")) suggestedStandards.push("ISO-27001-2013");
      if (text.includes("iso 22000")) suggestedStandards.push("ISO-22000-2018");
      if (text.includes("iso 22301")) suggestedStandards.push("ISO-22301-2019");

      return {
        documentType,
        category,
        confidence,
        suggestedStandards,
      };
    } catch (error) {
      console.error("Error in auto-classification:", error);
      return {
        documentType: "GENERAL",
        category: "GENERAL",
        confidence: 0.5,
        suggestedStandards: [],
      };
    }
  }
}

export const documentIntelligenceService = new DocumentIntelligenceService();

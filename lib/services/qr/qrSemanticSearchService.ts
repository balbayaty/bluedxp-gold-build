/**
 * QR Semantic Search Service
 * Use Knowledge Base for intelligent QR code search
 * Future-Ready (2024-2040)
 *
 * Features:
 * - Semantic QR code search
 * - Natural language queries
 * - Context-aware results
 * - Learning from searches
 * - Multi-modal search (text, voice, image)
 */

import { knowledgeBaseService } from "@/lib/services/knowledge-base";

export interface QRSemanticSearchResult {
  qrId: string;
  relevance: number;
  summary: string;
  highlights: string[];
  context: {
    module: string;
    documentType: string;
    location?: string;
    relatedQRs?: string[];
  };
  actions: Array<{
    label: string;
    action: string;
    url: string;
  }>;
}

export class QRSemanticSearchService {
  /**
   * Semantic search for QR codes
   */
  async searchQRs(
    query: string,
    options?: {
      tenantId?: string;
      modules?: string[];
      limit?: number;
      minRelevance?: number;
    },
  ): Promise<QRSemanticSearchResult[]> {
    try {
      // Use knowledge base for semantic search
      const kbResults = await knowledgeBaseService.semanticSearch(query, {
        tenantId: options?.tenantId,
        limit: options?.limit || 20,
        filters: {
          categories: ["qr_code", "document", "msds", "certificate"],
          minConfidence: options?.minRelevance || 0.5,
        },
      });

      // Map knowledge base results to QR codes
      const qrResults: QRSemanticSearchResult[] = kbResults
        .filter((result) => result.score >= (options?.minRelevance || 0.5))
        .map((result) => {
          const qrId =
            result.entry.metadata?.qrId || result.entry.sourceId || "unknown";

          return {
            qrId,
            relevance: result.score,
            summary: result.entry.summary || result.entry.content.slice(0, 200),
            highlights: result.highlights || [],
            context: {
              module: result.entry.metadata?.module || "unknown",
              documentType: result.entry.metadata?.documentType || "unknown",
              location: result.entry.metadata?.location,
              relatedQRs: result.entry.metadata?.relatedQRs,
            },
            actions: [
              {
                label: "View QR",
                action: "view",
                url: `/admin/qr-analytics?qrId=${qrId}`,
              },
              {
                label: "View Analytics",
                action: "analytics",
                url: `/admin/qr-analytics/detailed?qrId=${qrId}`,
              },
              {
                label: "View Document",
                action: "document",
                url:
                  result.entry.metadata?.documentUrl ||
                  `/${result.entry.metadata?.documentType}/${qrId}`,
              },
            ],
          };
        });

      // Learn from search
      await this.learnFromSearch(query, qrResults);

      return qrResults;
    } catch (error) {
      console.error("Error in semantic search:", error);
      // Return empty results on error
      return [];
    }
  }

  /**
   * Find similar QR codes
   */
  async findSimilarQRs(
    qrId: string,
    limit: number = 10,
  ): Promise<QRSemanticSearchResult[]> {
    try {
      // Get QR code knowledge entry
      const kbEntry = await knowledgeBaseService.read(qrId);

      if (!kbEntry) {
        return [];
      }

      // Find similar entries
      const similar = await knowledgeBaseService.findSimilar(qrId, limit);

      return similar.map((result) => ({
        qrId: result.entry.metadata?.qrId || result.entry.id,
        relevance: result.score,
        summary: result.entry.summary || result.entry.content.slice(0, 200),
        highlights: [],
        context: {
          module: result.entry.metadata?.module || "unknown",
          documentType: result.entry.metadata?.documentType || "unknown",
          location: result.entry.metadata?.location,
        },
        actions: [
          {
            label: "View QR",
            action: "view",
            url: `/admin/qr-analytics?qrId=${result.entry.metadata?.qrId || result.entry.id}`,
          },
        ],
      }));
    } catch (error) {
      console.error("Error finding similar QR codes:", error);
      return [];
    }
  }

  /**
   * Multi-modal search (text, voice, image)
   */
  async multiModalSearch(params: {
    text?: string;
    voice?: Blob | string;
    image?: Blob | string;
    tenantId?: string;
  }): Promise<QRSemanticSearchResult[]> {
    let query = params.text || "";

    // Process voice if provided
    if (params.voice) {
      // In production, use speech-to-text
      // For now, assume it's already text
      if (typeof params.voice === "string") {
        query += " " + params.voice;
      }
    }

    // Process image if provided
    if (params.image) {
      // In production, use vision AI to extract text/context from image
      // For now, add image context to query
      query += " [image context]";
    }

    return await this.searchQRs(query, { tenantId: params.tenantId });
  }

  /**
   * Context-aware search
   */
  async contextAwareSearch(
    query: string,
    context: {
      currentPage?: string;
      userRole?: string;
      recentQRs?: string[];
      modules?: string[];
    },
  ): Promise<QRSemanticSearchResult[]> {
    try {
      // Enhance query with context
      let enhancedQuery = query;

      if (context.currentPage) {
        enhancedQuery += ` related to ${context.currentPage}`;
      }

      if (context.modules && context.modules.length > 0) {
        enhancedQuery += ` in modules: ${context.modules.join(", ")}`;
      }

      // Search
      const results = await this.searchQRs(enhancedQuery, {
        modules: context.modules,
      });

      // Boost relevance for recent QR codes
      if (context.recentQRs && context.recentQRs.length > 0) {
        results.forEach((result) => {
          if (context.recentQRs!.includes(result.qrId)) {
            result.relevance += 0.1;
          }
        });
        results.sort((a, b) => b.relevance - a.relevance);
      }

      return results;
    } catch (error) {
      console.error("Error in context-aware search:", error);
      return [];
    }
  }

  /**
   * Learn from search patterns
   */
  private async learnFromSearch(
    query: string,
    results: QRSemanticSearchResult[],
  ) {
    try {
      // Store search pattern in knowledge base
      await knowledgeBaseService.create({
        content: `User searched for: "${query}". Found ${results.length} QR codes.`,
        type: "pattern",
        category: "qr_search",
        metadata: {
          query,
          resultsCount: results.length,
          topResults: results.slice(0, 3).map((r) => r.qrId),
        },
      });
    } catch (error) {
      console.warn("Could not store search pattern in knowledge base:", error);
      // Continue - this is not critical
    }
  }
}

export const qrSemanticSearchService = new QRSemanticSearchService();

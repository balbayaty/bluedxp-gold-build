/**
 * PostgreSQL Knowledge Base Store
 * Uses pgvector for vector similarity search
 */

import { prisma } from "@/lib/services/database/prismaClient";
import type {
  KnowledgeEntry,
  SearchQuery,
  SearchResult,
  TenantKnowledgeConfig,
  AgentKnowledgeConfig,
  LearningEvent,
  Feedback,
  FederatedInsight,
} from "@/types/knowledgeBase";

export class PostgreSQLKnowledgeStore {
  /**
   * Get knowledge entry by ID
   */
  async getEntry(id: string): Promise<KnowledgeEntry | null> {
    try {
      const entry = await prisma.knowledgeBase.findUnique({
        where: { id },
      });

      if (!entry) return null;

      return this.mapToKnowledgeEntry(entry);
    } catch (error) {
      console.error("Error getting knowledge entry:", error);
      throw error;
    }
  }

  /**
   * Set knowledge entry (create or update)
   */
  async setEntry(entry: KnowledgeEntry): Promise<void> {
    try {
      // Use raw SQL for vector operations since Prisma doesn't support pgvector directly
      const embeddingArray = entry.embedding
        ? `[${entry.embedding.join(",")}]`
        : null;

      await prisma.$executeRawUnsafe(
        `
        INSERT INTO "KnowledgeBase" (
          id, "tenantId", title, content, category, tags, embedding, metadata, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7::vector, $8::jsonb, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          category = EXCLUDED.category,
          tags = EXCLUDED.tags,
          embedding = EXCLUDED.embedding,
          metadata = EXCLUDED.metadata,
          "updatedAt" = NOW()
      `,
        entry.id,
        entry.tenantId || "",
        entry.summary || entry.content.substring(0, 100),
        entry.content,
        entry.category || null,
        entry.keywords || [],
        embeddingArray,
        JSON.stringify(entry.metadata || {}),
      );
    } catch (error) {
      console.error("Error setting knowledge entry:", error);
      throw error;
    }
  }

  /**
   * Delete knowledge entry
   */
  async deleteEntry(id: string): Promise<boolean> {
    try {
      await prisma.knowledgeBase.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("Error deleting knowledge entry:", error);
      return false;
    }
  }

  /**
   * Get all entries
   */
  async getAllEntries(): Promise<KnowledgeEntry[]> {
    try {
      const entries = await prisma.knowledgeBase.findMany();
      return entries.map((e) => this.mapToKnowledgeEntry(e));
    } catch (error) {
      console.error("Error getting all entries:", error);
      return [];
    }
  }

  /**
   * Get entries by tenant
   */
  async getEntriesByTenant(tenantId: string): Promise<KnowledgeEntry[]> {
    try {
      const entries = await prisma.knowledgeBase.findMany({
        where: { tenantId },
      });
      return entries.map((e) => this.mapToKnowledgeEntry(e));
    } catch (error) {
      console.error("Error getting entries by tenant:", error);
      return [];
    }
  }

  /**
   * Get entries by agent (stored in metadata)
   */
  async getEntriesByAgent(agentId: string): Promise<KnowledgeEntry[]> {
    try {
      const entries = await prisma.knowledgeBase.findMany({
        where: {
          metadata: {
            path: ["agentId"],
            equals: agentId,
          },
        },
      });
      return entries.map((e) => this.mapToKnowledgeEntry(e));
    } catch (error) {
      console.error("Error getting entries by agent:", error);
      return [];
    }
  }

  /**
   * Vector similarity search using pgvector
   */
  async search(query: SearchQuery): Promise<SearchResult[]> {
    try {
      // Generate query embedding (should be done by caller)
      // For now, we'll use a placeholder - the actual embedding should be passed
      const queryEmbedding = query.embedding || [];

      if (queryEmbedding.length === 0) {
        // Fallback to text search if no embedding
        return this.textSearch(query);
      }

      // Build WHERE clause for filters
      const whereClause: any = {
        status: "active",
      };

      if (query.tenantId) {
        whereClause.tenantId = query.tenantId;
      }

      if (query.filters?.types?.length) {
        whereClause.metadata = {
          path: ["type"],
          in: query.filters.types,
        };
      }

      if (query.filters?.categories?.length) {
        whereClause.category = { in: query.filters.categories };
      }

      // Use pgvector cosine similarity search
      // Note: Prisma doesn't support pgvector operators directly, so we use raw SQL
      const embeddingArray = `[${queryEmbedding.join(",")}]`;
      const threshold = query.threshold || 0.5;
      const limit = query.limit || 10;

      // Build query with proper parameterization
      let sqlQuery = `
        SELECT 
          id,
          "tenantId",
          title,
          content,
          category,
          tags,
          embedding::text,
          metadata,
          "createdAt",
          "updatedAt",
          1 - (embedding <=> $1::vector) as similarity
        FROM "KnowledgeBase"
        WHERE embedding IS NOT NULL
      `;
      const params: any[] = [embeddingArray];

      if (query.tenantId) {
        sqlQuery += ` AND "tenantId" = $2`;
        params.push(query.tenantId);
      }

      sqlQuery += ` ORDER BY embedding <=> $1::vector LIMIT $${params.length + 1}`;
      params.push(limit);

      const results = await prisma.$queryRawUnsafe<
        Array<{
          id: string;
          tenantId: string;
          title: string;
          content: string;
          category: string | null;
          tags: string[];
          embedding: string | null;
          metadata: any;
          createdAt: Date;
          updatedAt: Date;
          similarity: number;
        }>
      >(sqlQuery, ...params);

      // Filter by threshold and map to SearchResult
      return results
        .filter((r) => r.similarity >= threshold)
        .map((r) => ({
          entry: this.mapToKnowledgeEntry({
            id: r.id,
            tenantId: r.tenantId,
            title: r.title,
            content: r.content,
            category: r.category,
            tags: r.tags,
            embedding: r.embedding
              ? this.parseEmbedding(r.embedding)
              : undefined,
            metadata: r.metadata,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          }),
          score: r.similarity,
          highlights: this.extractHighlights(r.content, query.query),
        }))
        .slice(0, limit);
    } catch (error) {
      console.error("Error in vector search:", error);
      // Fallback to text search
      return this.textSearch(query);
    }
  }

  /**
   * Text-based search (fallback)
   */
  private async textSearch(query: SearchQuery): Promise<SearchResult[]> {
    try {
      const whereClause: any = {};

      if (query.tenantId) {
        whereClause.tenantId = query.tenantId;
      }

      const entries = await prisma.knowledgeBase.findMany({
        where: whereClause,
        take: query.limit || 10,
      });

      return entries.map((entry) => ({
        entry: this.mapToKnowledgeEntry(entry),
        score: 0.5, // Default score for text search
        highlights: this.extractHighlights(entry.content, query.query),
      }));
    } catch (error) {
      console.error("Error in text search:", error);
      return [];
    }
  }

  /**
   * Map database record to KnowledgeEntry
   */
  private mapToKnowledgeEntry(record: any): KnowledgeEntry {
    const metadata =
      typeof record.metadata === "string"
        ? JSON.parse(record.metadata)
        : record.metadata || {};
    const createdAt =
      record.createdAt instanceof Date
        ? record.createdAt
        : new Date(record.createdAt);
    const updatedAt =
      record.updatedAt instanceof Date
        ? record.updatedAt
        : new Date(record.updatedAt);

    return {
      id: record.id,
      tenantId: record.tenantId,
      agentId: metadata?.agentId,
      type: metadata?.type || "general",
      category: record.category || "general",
      content: record.content,
      summary: record.title,
      keywords: record.tags || [],
      searchableText: record.content,
      source: metadata?.source || "user_input",
      embedding: record.embedding
        ? this.parseEmbedding(record.embedding)
        : undefined,
      confidence: metadata?.confidence || 70,
      verified: metadata?.verified || false,
      feedbackScore: metadata?.feedbackScore || 0,
      usageCount: metadata?.usageCount || 0,
      status: "active",
      metadata: metadata,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      version: metadata?.version || 1,
    };
  }

  /**
   * Parse embedding string to array
   */
  private parseEmbedding(embedding: string | null): number[] | undefined {
    if (!embedding) return undefined;
    try {
      // Handle both string format "[1,2,3]" and array
      if (typeof embedding === "string") {
        return JSON.parse(embedding);
      }
      return embedding as number[];
    } catch {
      return undefined;
    }
  }

  /**
   * Extract highlights from content
   */
  private extractHighlights(content: string, query: string): string[] {
    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);
    const sentences = content.split(/[.!?]+/);

    return sentences
      .filter((sentence) =>
        words.some((word) => sentence.toLowerCase().includes(word)),
      )
      .slice(0, 3)
      .map((s) => s.trim());
  }

  /**
   * Tenant config management
   */
  async getTenantConfig(
    tenantId: string,
  ): Promise<TenantKnowledgeConfig | null> {
    // Store configs in metadata for now, or create separate table
    // For now, return default config
    return null;
  }

  async setTenantConfig(config: TenantKnowledgeConfig): Promise<void> {
    // Store in metadata or separate table
  }

  /**
   * Agent config management
   */
  async getAgentConfig(agentId: string): Promise<AgentKnowledgeConfig | null> {
    // Store configs in metadata
    return null;
  }

  async setAgentConfig(config: AgentKnowledgeConfig): Promise<void> {
    // Store in metadata
  }

  /**
   * Learning events (store in separate table or metadata)
   */
  async addLearningEvent(event: LearningEvent): Promise<void> {
    // Store in separate table or metadata
  }

  async getLearningEvents(): Promise<LearningEvent[]> {
    return [];
  }

  /**
   * Feedback (store in metadata)
   */
  async addFeedback(feedback: Feedback): Promise<void> {
    // Store in metadata or separate table
  }

  async getFeedbacks(): Promise<Feedback[]> {
    return [];
  }

  /**
   * Federated insights
   */
  async addFederatedInsight(insight: FederatedInsight): Promise<void> {
    // Store in metadata or separate table
  }

  async getFederatedInsights(): Promise<FederatedInsight[]> {
    return [];
  }
}

export const postgresKnowledgeStore = new PostgreSQLKnowledgeStore();

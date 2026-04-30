/**
 * Content Block Library Service
 * Reusable content blocks for proposals (like Loopio, RFPIO)
 * Versioned, approved, searchable content blocks
 */

import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";

// ============================================================================
// TYPES
// ============================================================================

export interface ContentBlock {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  type: "TEXT" | "PRICING" | "TABLE" | "LIST" | "CUSTOM";

  // Versioning
  version: number;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "ARCHIVED";
  approvedBy?: string;
  approvedAt?: Date | string;

  // Usage
  usageCount: number;
  lastUsedAt?: Date | string;
  usedInProposals: string[]; // Proposal IDs

  // Metadata
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  metadata: Record<string, any>;

  // Search
  keywords: string[];
  searchableText: string;
}

export interface ContentBlockLibrary {
  blocks: ContentBlock[];
  categories: string[];
  tags: string[];
  totalBlocks: number;
  approvedBlocks: number;
  mostUsed: ContentBlock[];
}

// ============================================================================
// CONTENT BLOCK LIBRARY SERVICE
// ============================================================================

class ContentBlockLibraryService {
  private blocks: Map<string, ContentBlock> = new Map();
  private blockVersions: Map<string, ContentBlock[]> = new Map(); // blockId -> versions

  constructor() {
    this.initializeDefaultBlocks();
  }

  /**
   * Initialize default content blocks
   */
  private initializeDefaultBlocks(): void {
    const defaultBlocks: ContentBlock[] = [
      {
        id: "block-executive-summary-warehousing",
        title: "Warehousing Executive Summary",
        content:
          "Our comprehensive warehousing solutions provide secure, efficient storage with state-of-the-art facilities and advanced inventory management systems.",
        category: "EXECUTIVE_SUMMARY",
        tags: ["warehousing", "storage", "inventory"],
        type: "TEXT",
        version: 1,
        status: "APPROVED",
        usageCount: 0,
        usedInProposals: [],
        createdBy: "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {},
        keywords: ["warehousing", "storage", "inventory", "facilities"],
        searchableText: "warehousing storage inventory facilities",
      },
      {
        id: "block-pricing-warehousing",
        title: "Warehousing Pricing Structure",
        content:
          "Standard Storage: SAR 50/pallet/month\nPick & Pack: SAR 5/order\nInventory Management: SAR 100/month",
        category: "PRICING",
        tags: ["warehousing", "pricing"],
        type: "PRICING",
        version: 1,
        status: "APPROVED",
        usageCount: 0,
        usedInProposals: [],
        createdBy: "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {},
        keywords: ["warehousing", "pricing", "storage", "rates"],
        searchableText: "warehousing pricing storage rates",
      },
    ];

    defaultBlocks.forEach((block) => {
      this.blocks.set(block.id, block);
      this.blockVersions.set(block.id, [block]);
    });
  }

  /**
   * Create content block
   */
  async createBlock(
    block: Omit<
      ContentBlock,
      | "id"
      | "version"
      | "usageCount"
      | "usedInProposals"
      | "createdAt"
      | "updatedAt"
    >,
  ): Promise<ContentBlock> {
    const newBlock: ContentBlock = {
      ...block,
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      version: 1,
      usageCount: 0,
      usedInProposals: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      keywords: this.extractKeywords(block.content, block.title),
      searchableText: `${block.title} ${block.content} ${block.tags.join(" ")}`,
    };

    this.blocks.set(newBlock.id, newBlock);
    this.blockVersions.set(newBlock.id, [newBlock]);

    // Store in knowledge base for RAG
    await knowledgeBaseService.create({
      type: "content_block",
      category: "proposal_content",
      content: newBlock.content,
      metadata: {
        blockId: newBlock.id,
        title: newBlock.title,
        category: newBlock.category,
        tags: newBlock.tags,
      },
      source: "content_library",
      sourceId: newBlock.id,
      confidence: 90,
      verified: newBlock.status === "APPROVED",
      keywords: newBlock.keywords,
      searchableText: newBlock.searchableText,
    });

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.content-block.created",
      aggregateId: newBlock.id,
      aggregateType: "CONTENT_BLOCK",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { blockId: newBlock.id, category: newBlock.category },
    });

    return newBlock;
  }

  /**
   * Search content blocks
   */
  async searchBlocks(
    query: string,
    filters?: {
      category?: string;
      tags?: string[];
      status?: ContentBlock["status"];
      type?: ContentBlock["type"];
    },
  ): Promise<ContentBlock[]> {
    // Use knowledge base for semantic search
    const searchResults = await knowledgeBaseService.semanticSearch(
      `proposal content block ${query}`,
      {
        limit: 20,
        threshold: 0.6,
      },
    );

    // Get blocks from search results
    const blockIds = searchResults.results
      .map((r) => r.entry.metadata?.blockId)
      .filter(Boolean) as string[];

    let blocks = blockIds
      .map((id) => this.blocks.get(id))
      .filter(Boolean) as ContentBlock[];

    // Apply filters
    if (filters) {
      if (filters.category) {
        blocks = blocks.filter((b) => b.category === filters.category);
      }
      if (filters.tags && filters.tags.length > 0) {
        blocks = blocks.filter((b) =>
          filters.tags!.some((tag) => b.tags.includes(tag)),
        );
      }
      if (filters.status) {
        blocks = blocks.filter((b) => b.status === filters.status);
      }
      if (filters.type) {
        blocks = blocks.filter((b) => b.type === filters.type);
      }
    }

    // Sort by relevance (usage count, recency)
    return blocks.sort((a, b) => {
      const scoreA = a.usageCount + (a.lastUsedAt ? 1 : 0);
      const scoreB = b.usageCount + (b.lastUsedAt ? 1 : 0);
      return scoreB - scoreA;
    });
  }

  /**
   * Get block by ID
   */
  getBlock(id: string): ContentBlock | undefined {
    return this.blocks.get(id);
  }

  /**
   * Update block
   */
  async updateBlock(
    id: string,
    updates: Partial<ContentBlock>,
  ): Promise<ContentBlock | null> {
    const existing = this.blocks.get(id);
    if (!existing) return null;

    // Create new version if content changed
    const contentChanged =
      updates.content && updates.content !== existing.content;
    const newVersion = contentChanged ? existing.version + 1 : existing.version;

    const updated: ContentBlock = {
      ...existing,
      ...updates,
      version: newVersion,
      updatedAt: new Date().toISOString(),
      keywords: updates.content
        ? this.extractKeywords(updates.content, updates.title || existing.title)
        : existing.keywords,
      searchableText: updates.content
        ? `${updates.title || existing.title} ${updates.content} ${(updates.tags || existing.tags).join(" ")}`
        : existing.searchableText,
    };

    this.blocks.set(id, updated);

    // Store version history
    if (contentChanged) {
      const versions = this.blockVersions.get(id) || [];
      versions.push(updated);
      this.blockVersions.set(id, versions);
    }

    return updated;
  }

  /**
   * Approve block
   */
  async approveBlock(
    id: string,
    approvedBy: string,
  ): Promise<ContentBlock | null> {
    return this.updateBlock(id, {
      status: "APPROVED",
      approvedBy,
      approvedAt: new Date().toISOString(),
    });
  }

  /**
   * Track block usage
   */
  async trackUsage(blockId: string, proposalId: string): Promise<void> {
    const block = this.blocks.get(blockId);
    if (!block) return;

    block.usageCount += 1;
    block.lastUsedAt = new Date().toISOString();
    if (!block.usedInProposals.includes(proposalId)) {
      block.usedInProposals.push(proposalId);
    }

    this.blocks.set(blockId, block);
  }

  /**
   * Get library stats
   */
  getLibraryStats(): ContentBlockLibrary {
    const allBlocks = Array.from(this.blocks.values());
    const categories = [...new Set(allBlocks.map((b) => b.category))];
    const tags = [...new Set(allBlocks.flatMap((b) => b.tags))];

    return {
      blocks: allBlocks,
      categories,
      tags,
      totalBlocks: allBlocks.length,
      approvedBlocks: allBlocks.filter((b) => b.status === "APPROVED").length,
      mostUsed: allBlocks
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10),
    };
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(content: string, title: string): string[] {
    const text = `${title} ${content}`.toLowerCase();
    const words = text.split(/\s+/);
    const commonWords = [
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
    ];
    return [
      ...new Set(words.filter((w) => w.length > 3 && !commonWords.includes(w))),
    ];
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const contentBlockLibraryService = new ContentBlockLibraryService();

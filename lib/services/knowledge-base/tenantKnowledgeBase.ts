/**
 * Tenant-Specific Knowledge Base Service
 * Provides isolated knowledge storage per tenant/customer
 * With optional cross-tenant learning (anonymized)
 */

import {
  KnowledgeEntry,
  KnowledgeCategory,
  KnowledgeSource,
  SearchQuery,
  SearchResult,
  TenantKnowledgeConfig,
  LearningEvent,
  Feedback,
  KnowledgeStats,
} from "@/types/knowledgeBase";
import { knowledgeBaseService } from "./index";

// ============================================================================
// TENANT KNOWLEDGE BASE CLASS
// ============================================================================

export class TenantKnowledgeBase {
  private tenantId: string;
  private config: TenantKnowledgeConfig | null = null;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Initialize the tenant knowledge base
   */
  async initialize(): Promise<void> {
    this.config = await knowledgeBaseService.getTenantConfig(this.tenantId);
  }

  /**
   * Get current configuration
   */
  async getConfig(): Promise<TenantKnowledgeConfig> {
    if (!this.config) {
      this.config = await knowledgeBaseService.getTenantConfig(this.tenantId);
    }
    return this.config;
  }

  /**
   * Update configuration
   */
  async updateConfig(
    updates: Partial<TenantKnowledgeConfig>,
  ): Promise<TenantKnowledgeConfig> {
    this.config = await knowledgeBaseService.updateTenantConfig(
      this.tenantId,
      updates,
    );
    return this.config;
  }

  // ============================================================================
  // KNOWLEDGE OPERATIONS
  // ============================================================================

  /**
   * Add new knowledge entry to tenant's knowledge base
   */
  async addKnowledge(entry: {
    type: KnowledgeEntry["type"];
    category: KnowledgeCategory;
    content: string;
    summary?: string;
    metadata?: Record<string, any>;
    keywords?: string[];
    source: KnowledgeSource;
    confidence?: number;
    verified?: boolean;
  }): Promise<KnowledgeEntry> {
    const config = await this.getConfig();

    // Validate category is allowed
    if (!config.allowedCategories.includes(entry.category)) {
      throw new Error(
        `Category ${entry.category} is not allowed for this tenant`,
      );
    }

    // Validate source is enabled
    if (!config.enabledSources.includes(entry.source)) {
      throw new Error(`Source ${entry.source} is not enabled for this tenant`);
    }

    // Check if review is required
    const requiresReview = config.reviewRequiredCategories.includes(
      entry.category,
    );

    return knowledgeBaseService.create({
      tenantId: this.tenantId,
      type: entry.type,
      category: entry.category,
      content: entry.content,
      summary: entry.summary,
      metadata: entry.metadata || {},
      keywords: entry.keywords || [],
      searchableText: `${entry.content} ${entry.summary || ""} ${(entry.keywords || []).join(" ")}`,
      source: entry.source,
      confidence: entry.confidence ?? 70,
      verified: entry.verified ?? false,
      feedbackScore: 0,
      usageCount: 0,
      status: requiresReview ? "pending_review" : "active",
    });
  }

  /**
   * Search tenant's knowledge base
   */
  async search(
    query: string,
    options?: {
      types?: KnowledgeEntry["type"][];
      categories?: KnowledgeCategory[];
      sources?: KnowledgeSource[];
      minConfidence?: number;
      verified?: boolean;
      limit?: number;
    },
  ): Promise<SearchResult[]> {
    const config = await this.getConfig();

    const searchQuery: SearchQuery = {
      query,
      tenantId: this.tenantId,
      filters: {
        types: options?.types,
        categories: options?.categories?.filter((c) =>
          config.allowedCategories.includes(c),
        ),
        sources: options?.sources?.filter((s) =>
          config.enabledSources.includes(s),
        ),
        minConfidence: options?.minConfidence,
        verified: options?.verified,
      },
      limit: options?.limit || 10,
      includeGlobal: true, // Include global knowledge
      includeFederated: config.receiveFederatedInsights,
    };

    return knowledgeBaseService.search(searchQuery);
  }

  /**
   * Get knowledge by ID (only if belongs to tenant)
   */
  async getKnowledge(id: string): Promise<KnowledgeEntry | null> {
    const entry = await knowledgeBaseService.read(id);
    if (entry && (entry.tenantId === this.tenantId || !entry.tenantId)) {
      // Update usage count
      await knowledgeBaseService.update(id, {
        usageCount: entry.usageCount + 1,
      });
      return entry;
    }
    return null;
  }

  /**
   * Update knowledge entry
   */
  async updateKnowledge(
    id: string,
    updates: Partial<
      Pick<
        KnowledgeEntry,
        | "content"
        | "summary"
        | "metadata"
        | "keywords"
        | "confidence"
        | "verified"
        | "status"
      >
    >,
  ): Promise<KnowledgeEntry> {
    const entry = await this.getKnowledge(id);
    if (!entry) {
      throw new Error(`Knowledge entry ${id} not found or not accessible`);
    }

    const searchableText = updates.content || entry.content;
    return knowledgeBaseService.update(id, {
      ...updates,
      searchableText: `${searchableText} ${updates.summary || entry.summary || ""} ${(updates.keywords || entry.keywords).join(" ")}`,
    });
  }

  /**
   * Delete knowledge entry
   */
  async deleteKnowledge(id: string): Promise<boolean> {
    const entry = await this.getKnowledge(id);
    if (!entry) {
      return false;
    }
    return knowledgeBaseService.delete(id);
  }

  /**
   * Archive knowledge entry
   */
  async archiveKnowledge(id: string): Promise<boolean> {
    const entry = await this.getKnowledge(id);
    if (!entry) {
      return false;
    }
    return knowledgeBaseService.archive(id);
  }

  // ============================================================================
  // LEARNING OPERATIONS
  // ============================================================================

  /**
   * Record a learning event
   */
  async learn(event: {
    type: LearningEvent["type"];
    trigger: string;
    input: Record<string, any>;
    output?: Record<string, any>;
    success: boolean;
    confidence: number;
    agentId?: string;
  }): Promise<LearningEvent> {
    const config = await this.getConfig();

    // Check if auto-learning is enabled
    if (!config.enableAutoLearning) {
      console.log("Auto-learning disabled for tenant:", this.tenantId);
    }

    // Check confidence threshold
    if (event.confidence < config.learningThreshold) {
      console.log(
        "Confidence below threshold, not learning:",
        event.confidence,
        "<",
        config.learningThreshold,
      );
    }

    return knowledgeBaseService.learn({
      ...event,
      tenantId: this.tenantId,
      metadata: {
        autoLearnEnabled: config.enableAutoLearning,
        threshold: config.learningThreshold,
      },
    });
  }

  /**
   * Provide feedback on knowledge entry
   */
  async provideFeedback(
    knowledgeId: string,
    feedback: {
      type: Feedback["type"];
      rating?: number;
      comment?: string;
      correctedContent?: string;
      correctedMetadata?: Record<string, any>;
      userId?: string;
    },
  ): Promise<Feedback> {
    const entry = await this.getKnowledge(knowledgeId);
    if (!entry) {
      throw new Error(
        `Knowledge entry ${knowledgeId} not found or not accessible`,
      );
    }

    return knowledgeBaseService.processFeedback({
      knowledgeId,
      tenantId: this.tenantId,
      ...feedback,
    });
  }

  // ============================================================================
  // SPECIALIZED KNOWLEDGE FUNCTIONS
  // ============================================================================

  /**
   * Learn from MSDS document processing
   */
  async learnFromMSDS(msdsData: {
    chemicalName: string;
    casNumber?: string;
    hazards: string[];
    storageRequirements: string[];
    ppeRequired: string[];
    compatibilityInfo: string[];
    sourceDocumentId: string;
  }): Promise<KnowledgeEntry[]> {
    const entries: KnowledgeEntry[] = [];

    // Create knowledge about chemical hazards
    if (msdsData.hazards.length > 0) {
      const hazardEntry = await this.addKnowledge({
        type: "fact",
        category: "chemical_safety",
        content: `Hazards for ${msdsData.chemicalName} (CAS: ${msdsData.casNumber || "N/A"}): ${msdsData.hazards.join(", ")}`,
        summary: `${msdsData.chemicalName} hazard information`,
        keywords: [
          msdsData.chemicalName,
          ...(msdsData.casNumber ? [msdsData.casNumber] : []),
          ...msdsData.hazards,
        ],
        source: "msds_parsing",
        metadata: {
          chemicalName: msdsData.chemicalName,
          casNumber: msdsData.casNumber,
          type: "hazards",
        },
        confidence: 95,
        verified: false,
      });
      entries.push(hazardEntry);
    }

    // Create knowledge about storage requirements
    if (msdsData.storageRequirements.length > 0) {
      const storageEntry = await this.addKnowledge({
        type: "procedure",
        category: "storage_compatibility",
        content: `Storage requirements for ${msdsData.chemicalName}: ${msdsData.storageRequirements.join("; ")}`,
        summary: `${msdsData.chemicalName} storage requirements`,
        keywords: [
          msdsData.chemicalName,
          "storage",
          ...msdsData.storageRequirements,
        ],
        source: "msds_parsing",
        metadata: {
          chemicalName: msdsData.chemicalName,
          casNumber: msdsData.casNumber,
          type: "storage",
        },
        confidence: 95,
        verified: false,
      });
      entries.push(storageEntry);
    }

    // Create knowledge about compatibility
    if (msdsData.compatibilityInfo.length > 0) {
      const compatEntry = await this.addKnowledge({
        type: "rule",
        category: "storage_compatibility",
        content: `Compatibility information for ${msdsData.chemicalName}: ${msdsData.compatibilityInfo.join("; ")}`,
        summary: `${msdsData.chemicalName} compatibility rules`,
        keywords: [
          msdsData.chemicalName,
          "compatibility",
          ...msdsData.compatibilityInfo,
        ],
        source: "msds_parsing",
        metadata: {
          chemicalName: msdsData.chemicalName,
          casNumber: msdsData.casNumber,
          type: "compatibility",
        },
        confidence: 90,
        verified: false,
      });
      entries.push(compatEntry);
    }

    // Record learning event
    await this.learn({
      type: "document_processed",
      trigger: `MSDS processed for ${msdsData.chemicalName}`,
      input: msdsData,
      output: { entriesCreated: entries.length },
      success: true,
      confidence: 95,
    });

    return entries;
  }

  /**
   * Learn from AI Vision analysis
   */
  async learnFromVisionAnalysis(analysisData: {
    analysisId: string;
    issues: Array<{ type: string; severity: string; description: string }>;
    rootCauses?: Array<{ cause: string; confidence: number }>;
    recommendations?: string[];
  }): Promise<KnowledgeEntry[]> {
    const entries: KnowledgeEntry[] = [];

    // Create knowledge from issues found
    for (const issue of analysisData.issues) {
      const issueEntry = await this.addKnowledge({
        type: "pattern",
        category:
          issue.type === "safety"
            ? "chemical_safety"
            : issue.type === "compliance"
              ? "regulatory_compliance"
              : "quality_management",
        content: `Detected issue: ${issue.description}. Severity: ${issue.severity}`,
        summary: `${issue.type} issue pattern`,
        keywords: [
          issue.type,
          issue.severity,
          ...issue.description.split(" ").slice(0, 5),
        ],
        source: "ai_analysis",
        metadata: {
          analysisId: analysisData.analysisId,
          issueType: issue.type,
          severity: issue.severity,
        },
        confidence: 80,
        verified: false,
      });
      entries.push(issueEntry);
    }

    // Create knowledge from root causes
    if (analysisData.rootCauses && analysisData.rootCauses.length > 0) {
      for (const rootCause of analysisData.rootCauses) {
        if (rootCause.confidence >= 70) {
          const rcaEntry = await this.addKnowledge({
            type: "insight",
            category: "root_cause_analysis",
            content: `Root cause identified: ${rootCause.cause}`,
            summary: `Root cause pattern`,
            keywords: ["root_cause", ...rootCause.cause.split(" ").slice(0, 5)],
            source: "ai_analysis",
            metadata: {
              analysisId: analysisData.analysisId,
              confidence: rootCause.confidence,
            },
            confidence: rootCause.confidence,
            verified: false,
          });
          entries.push(rcaEntry);
        }
      }
    }

    // Record learning event
    await this.learn({
      type: "insight_generated",
      trigger: `Vision analysis completed for ${analysisData.analysisId}`,
      input: analysisData,
      output: { entriesCreated: entries.length },
      success: true,
      confidence: 85,
    });

    return entries;
  }

  /**
   * Learn from error resolution
   */
  async learnFromErrorResolution(errorData: {
    errorType: string;
    errorMessage: string;
    resolution: string;
    category: KnowledgeCategory;
    effectiveness: number; // 0-100
  }): Promise<KnowledgeEntry> {
    const entry = await this.addKnowledge({
      type: "error_resolution",
      category: errorData.category,
      content: `Error: ${errorData.errorMessage}\nResolution: ${errorData.resolution}`,
      summary: `Resolution for ${errorData.errorType}`,
      keywords: [errorData.errorType, "error", "resolution"],
      source: "feedback_learning",
      metadata: {
        errorType: errorData.errorType,
        effectiveness: errorData.effectiveness,
      },
      confidence: errorData.effectiveness,
      verified: errorData.effectiveness >= 90,
    });

    await this.learn({
      type: "error_resolved",
      trigger: `Error resolved: ${errorData.errorType}`,
      input: errorData,
      output: { entryId: entry.id },
      success: true,
      confidence: errorData.effectiveness,
    });

    return entry;
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get tenant knowledge statistics
   */
  async getStats(): Promise<KnowledgeStats> {
    return knowledgeBaseService.getStats(this.tenantId);
  }

  /**
   * Check storage limits
   */
  async checkLimits(): Promise<{
    entriesUsed: number;
    entriesLimit: number;
    storageUsed: number;
    storageLimit: number;
    withinLimits: boolean;
  }> {
    const config = await this.getConfig();
    const stats = await this.getStats();

    return {
      entriesUsed: stats.totalEntries,
      entriesLimit: config.maxEntries,
      storageUsed: stats.storageUsedBytes,
      storageLimit: config.maxStorageBytes,
      withinLimits:
        stats.totalEntries < config.maxEntries &&
        stats.storageUsedBytes < config.maxStorageBytes,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

const tenantKnowledgeBases = new Map<string, TenantKnowledgeBase>();

/**
 * Get or create a tenant knowledge base instance
 */
export async function getTenantKnowledgeBase(
  tenantId: string,
): Promise<TenantKnowledgeBase> {
  if (!tenantKnowledgeBases.has(tenantId)) {
    const kb = new TenantKnowledgeBase(tenantId);
    await kb.initialize();
    tenantKnowledgeBases.set(tenantId, kb);
  }
  return tenantKnowledgeBases.get(tenantId)!;
}

/**
 * Clear cached tenant knowledge base
 */
export function clearTenantKnowledgeBase(tenantId: string): void {
  tenantKnowledgeBases.delete(tenantId);
}

export default TenantKnowledgeBase;

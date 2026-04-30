/**
 * Knowledge Base Service
 * Self-learning system with vector embeddings, semantic search, and RAG
 * Supports tenant isolation and federated learning
 */

import {
  KnowledgeEntry,
  KnowledgeType,
  KnowledgeCategory,
  KnowledgeSource,
  SearchQuery,
  SearchResult,
  TenantKnowledgeConfig,
  AgentKnowledgeConfig,
  LearningEvent,
  Feedback,
  FederatedInsight,
  KnowledgeStats,
  KnowledgeBaseService,
  EmbeddingConfig,
} from "@/types/knowledgeBase";

// ============================================================================
// STORAGE - PostgreSQL with pgvector (Production) with In-Memory Fallback
// ============================================================================

import { postgresKnowledgeStore } from "./postgresStore";
import { prisma } from "@/lib/services/database/prismaClient";

// In-memory fallback for when database is unavailable
class InMemoryKnowledgeStore {
  private entries: Map<string, KnowledgeEntry> = new Map();
  private tenantConfigs: Map<string, TenantKnowledgeConfig> = new Map();
  private agentConfigs: Map<string, AgentKnowledgeConfig> = new Map();
  private learningEvents: LearningEvent[] = [];
  private feedbacks: Feedback[] = [];
  private federatedInsights: FederatedInsight[] = [];

  getEntry(id: string): KnowledgeEntry | undefined {
    return this.entries.get(id);
  }

  setEntry(entry: KnowledgeEntry): void {
    this.entries.set(entry.id, entry);
  }

  deleteEntry(id: string): boolean {
    return this.entries.delete(id);
  }

  getAllEntries(): KnowledgeEntry[] {
    return Array.from(this.entries.values());
  }

  getEntriesByTenant(tenantId: string): KnowledgeEntry[] {
    return this.getAllEntries().filter(
      (e) => e.tenantId === tenantId || !e.tenantId,
    );
  }

  getEntriesByAgent(agentId: string): KnowledgeEntry[] {
    return this.getAllEntries().filter(
      (e) => e.agentId === agentId || !e.agentId,
    );
  }

  getTenantConfig(tenantId: string): TenantKnowledgeConfig | undefined {
    return this.tenantConfigs.get(tenantId);
  }

  setTenantConfig(config: TenantKnowledgeConfig): void {
    this.tenantConfigs.set(config.tenantId, config);
  }

  getAgentConfig(agentId: string): AgentKnowledgeConfig | undefined {
    return this.agentConfigs.get(agentId);
  }

  setAgentConfig(config: AgentKnowledgeConfig): void {
    this.agentConfigs.set(config.agentId, config);
  }

  addLearningEvent(event: LearningEvent): void {
    this.learningEvents.push(event);
  }

  getLearningEvents(): LearningEvent[] {
    return this.learningEvents;
  }

  addFeedback(feedback: Feedback): void {
    this.feedbacks.push(feedback);
  }

  getFeedbacks(): Feedback[] {
    return this.feedbacks;
  }

  addFederatedInsight(insight: FederatedInsight): void {
    this.federatedInsights.push(insight);
  }

  getFederatedInsights(): FederatedInsight[] {
    return this.federatedInsights;
  }
}

// Use PostgreSQL store, fallback to in-memory if database unavailable
let usePostgres = true;
const fallbackStore = new InMemoryKnowledgeStore();

// Try to use PostgreSQL store, fallback to in-memory on error
async function getStore() {
  if (usePostgres) {
    try {
      // Test PostgreSQL connection by checking if prisma is available
      if (prisma) {
        // Try a simple query to verify connection
        await prisma.$queryRaw`SELECT 1`;
        return postgresKnowledgeStore;
      } else {
        throw new Error("Prisma client not available");
      }
    } catch (error) {
      console.warn(
        "⚠️ Knowledge Base: PostgreSQL unavailable, using in-memory fallback",
        error,
      );
      usePostgres = false;
      return fallbackStore;
    }
  }
  return fallbackStore;
}

// Store reference (will be set to PostgreSQL or fallback)
const store = fallbackStore; // Default to fallback, will switch to PostgreSQL if available

// ============================================================================
// EMBEDDING GENERATION
// ============================================================================

const defaultEmbeddingConfig: EmbeddingConfig = {
  model: "openai-3-small",
  dimensions: 1536,
  maxTokens: 8191,
};

/**
 * Generate embeddings using OpenAI or fallback to simple hash-based
 */
async function generateEmbedding(
  text: string,
  config: EmbeddingConfig = defaultEmbeddingConfig,
): Promise<number[]> {
  const apiKey =
    process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: text.slice(0, config.maxTokens * 4), // Rough char limit
          model:
            config.model === "openai-3-small"
              ? "text-embedding-3-small"
              : config.model === "openai-3-large"
                ? "text-embedding-3-large"
                : "text-embedding-ada-002",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.data[0].embedding;
      }
    } catch (error) {
      console.warn("OpenAI embedding failed, using fallback:", error);
    }
  }

  // Fallback: Simple hash-based pseudo-embedding
  return generatePseudoEmbedding(text, config.dimensions);
}

/**
 * Generate pseudo-embedding for offline/fallback mode
 */
function generatePseudoEmbedding(text: string, dimensions: number): number[] {
  const embedding: number[] = new Array(dimensions).fill(0);
  const words = text.toLowerCase().split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const charCode = word.charCodeAt(j);
      const index = (charCode * (i + 1) * (j + 1)) % dimensions;
      embedding[index] += 1 / (words.length * word.length);
    }
  }

  // Normalize
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0),
  );
  if (magnitude > 0) {
    for (let i = 0; i < dimensions; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

/**
 * Calculate cosine similarity between two embeddings
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude > 0 ? dotProduct / magnitude : 0;
}

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

async function semanticSearch(query: SearchQuery): Promise<SearchResult[]> {
  const queryEmbedding = await generateEmbedding(query.query);

  // Use PostgreSQL store for vector search if available
  const currentStore = await getStore();

  if (usePostgres && currentStore === postgresKnowledgeStore) {
    // Use PostgreSQL vector search
    return postgresKnowledgeStore.search({
      ...query,
      embedding: queryEmbedding,
    });
  }

  // Fallback to in-memory search
  let entries = (currentStore as InMemoryKnowledgeStore).getAllEntries();

  // Apply filters
  if (query.tenantId) {
    entries = entries.filter(
      (e) =>
        e.tenantId === query.tenantId ||
        (!e.tenantId && query.includeGlobal !== false),
    );
  }
  if (query.agentId) {
    entries = entries.filter((e) => e.agentId === query.agentId || !e.agentId);
  }
  if (query.filters?.types?.length) {
    entries = entries.filter((e) => query.filters!.types!.includes(e.type));
  }
  if (query.filters?.categories?.length) {
    entries = entries.filter((e) =>
      query.filters!.categories!.includes(e.category),
    );
  }
  if (query.filters?.sources?.length) {
    entries = entries.filter((e) => query.filters!.sources!.includes(e.source));
  }
  if (query.filters?.minConfidence !== undefined) {
    entries = entries.filter(
      (e) => e.confidence >= query.filters!.minConfidence!,
    );
  }
  if (query.filters?.verified !== undefined) {
    entries = entries.filter((e) => e.verified === query.filters!.verified);
  }
  if (query.filters?.dateRange) {
    const start = new Date(query.filters.dateRange.start).getTime();
    const end = new Date(query.filters.dateRange.end).getTime();
    entries = entries.filter((e) => {
      const created = new Date(e.createdAt).getTime();
      return created >= start && created <= end;
    });
  }

  // Calculate similarity scores
  const results: SearchResult[] = entries
    .filter((e) => e.embedding && e.status === "active")
    .map((entry) => ({
      entry,
      score: cosineSimilarity(queryEmbedding, entry.embedding!),
      highlights: extractHighlights(entry.content, query.query),
    }))
    .filter((r) => r.score >= (query.threshold || 0.5))
    .sort((a, b) => b.score - a.score)
    .slice(0, query.limit || 10);

  return results;
}

function extractHighlights(content: string, query: string): string[] {
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

// ============================================================================
// LEARNING FUNCTIONS
// ============================================================================

async function processLearningEvent(
  eventData: Omit<LearningEvent, "id" | "timestamp">,
): Promise<LearningEvent> {
  const event: LearningEvent = {
    ...eventData,
    id: `learn-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    timestamp: new Date().toISOString(),
  };

  // Create knowledge entries based on event type
  if (event.success && event.confidence >= 70) {
    if (
      event.type === "pattern_discovered" ||
      event.type === "insight_generated"
    ) {
      const newKnowledge = await createKnowledgeFromEvent(event);
      if (newKnowledge) {
        event.createdKnowledge = [newKnowledge.id];
      }
    }
  }

  store.addLearningEvent(event);
  return event;
}

async function createKnowledgeFromEvent(
  event: LearningEvent,
): Promise<KnowledgeEntry | null> {
  try {
    const content = JSON.stringify(event.output || event.input);
    const entry = await createKnowledgeEntry({
      tenantId: event.tenantId,
      agentId: event.agentId,
      type: event.type === "pattern_discovered" ? "pattern" : "insight",
      category: "general",
      content,
      summary: event.trigger,
      metadata: { sourceEvent: event.id },
      keywords: extractKeywords(content),
      searchableText: content,
      source: "ai_analysis",
      confidence: event.confidence,
      verified: false,
      feedbackScore: 0,
      usageCount: 0,
      status: "active",
    });
    return entry;
  } catch (error) {
    console.error("Error creating knowledge from event:", error);
    return null;
  }
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  // Count frequency
  const freq: Record<string, number> = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }

  // Return top keywords
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

async function processFeedback(
  feedbackData: Omit<Feedback, "id" | "createdAt" | "processed">,
): Promise<Feedback> {
  const feedback: Feedback = {
    ...feedbackData,
    id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    createdAt: new Date().toISOString(),
    processed: false,
  };

  // Update knowledge entry based on feedback
  const entry = store.getEntry(feedback.knowledgeId);
  if (entry) {
    const scoreChange =
      feedback.type === "positive" ? 1 : feedback.type === "negative" ? -1 : 0;

    store.setEntry({
      ...entry,
      feedbackScore: entry.feedbackScore + scoreChange,
      usageCount: entry.usageCount + 1,
      updatedAt: new Date().toISOString(),
      // Apply correction if provided
      ...(feedback.correctedContent && { content: feedback.correctedContent }),
      ...(feedback.correctedMetadata && {
        metadata: { ...entry.metadata, ...feedback.correctedMetadata },
      }),
    });

    feedback.processed = true;
    feedback.processedAt = new Date().toISOString();
  }

  store.addFeedback(feedback);
  return feedback;
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

async function createKnowledgeEntry(
  data: Omit<
    KnowledgeEntry,
    "id" | "createdAt" | "updatedAt" | "version" | "embedding"
  >,
): Promise<KnowledgeEntry> {
  const id = `kb-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const embedding = await generateEmbedding(
    data.searchableText || data.content,
  );

  const entry: KnowledgeEntry = {
    ...data,
    id,
    embedding,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  // Try PostgreSQL first, fallback to in-memory
  const currentStore = await getStore();
  if (usePostgres && currentStore === postgresKnowledgeStore) {
    await postgresKnowledgeStore.setEntry(entry);
  } else {
    (currentStore as InMemoryKnowledgeStore).setEntry(entry);
  }

  return entry;
}

async function updateKnowledgeEntry(
  id: string,
  updates: Partial<KnowledgeEntry>,
): Promise<KnowledgeEntry> {
  const currentStore = await getStore();
  const existing =
    usePostgres && currentStore === postgresKnowledgeStore
      ? await postgresKnowledgeStore.getEntry(id)
      : (currentStore as InMemoryKnowledgeStore).getEntry(id);

  if (!existing) {
    throw new Error(`Knowledge entry ${id} not found`);
  }

  // Regenerate embedding if content changed
  let newEmbedding = existing.embedding;
  if (updates.content || updates.searchableText) {
    newEmbedding = await generateEmbedding(
      updates.searchableText || updates.content || existing.searchableText,
    );
  }

  const updated: KnowledgeEntry = {
    ...existing,
    ...updates,
    id, // Prevent ID change
    embedding: newEmbedding,
    updatedAt: new Date().toISOString(),
    version: existing.version + 1,
  };

  // Save to appropriate store
  if (usePostgres && currentStore === postgresKnowledgeStore) {
    await postgresKnowledgeStore.setEntry(updated);
  } else {
    (currentStore as InMemoryKnowledgeStore).setEntry(updated);
  }

  return updated;
}

// ============================================================================
// TENANT & AGENT CONFIG
// ============================================================================

function getDefaultTenantConfig(tenantId: string): TenantKnowledgeConfig {
  return {
    tenantId,
    allowedCategories: Object.values([
      "chemical_safety",
      "storage_compatibility",
      "regulatory_compliance",
      "warehouse_operations",
      "transportation",
      "quality_management",
      "risk_assessment",
      "root_cause_analysis",
      "general",
    ]) as KnowledgeCategory[],
    enabledSources: Object.values([
      "msds_parsing",
      "ai_analysis",
      "user_input",
      "feedback_learning",
      "pattern_mining",
      "system_event",
    ]) as KnowledgeSource[],
    shareAnonymizedInsights: false,
    receiveFederatedInsights: true,
    dataRetentionDays: 365,
    enableAutoLearning: true,
    learningThreshold: 70,
    reviewRequiredCategories: ["regulatory_compliance"],
    maxEntries: 10000,
    maxStorageBytes: 100 * 1024 * 1024, // 100MB
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getDefaultAgentConfig(
  agentId: string,
  agentType: string,
): AgentKnowledgeConfig {
  return {
    agentId,
    agentType,
    specializations: ["general"],
    accessibleCategories: ["general"],
    enableContinuousLearning: true,
    learningRate: 0.1,
    forgetRate: 0.01,
    shortTermMemorySize: 100,
    longTermMemorySize: 1000,
    successfulRetrievals: 0,
    failedRetrievals: 0,
    feedbackScoreAvg: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// STATISTICS
// ============================================================================

function getKnowledgeStats(tenantId?: string): KnowledgeStats {
  let entries = store.getAllEntries();
  if (tenantId) {
    entries = entries.filter((e) => e.tenantId === tenantId);
  }

  const entriesByType: Record<string, number> = {};
  const entriesByCategory: Record<string, number> = {};
  const entriesBySource: Record<string, number> = {};
  let totalConfidence = 0;
  let verifiedCount = 0;

  for (const entry of entries) {
    entriesByType[entry.type] = (entriesByType[entry.type] || 0) + 1;
    entriesByCategory[entry.category] =
      (entriesByCategory[entry.category] || 0) + 1;
    entriesBySource[entry.source] = (entriesBySource[entry.source] || 0) + 1;
    totalConfidence += entry.confidence;
    if (entry.verified) verifiedCount++;
  }

  const feedbacks = store.getFeedbacks();
  const learningEvents = store.getLearningEvents();

  return {
    totalEntries: entries.length,
    entriesByType: entriesByType as Record<KnowledgeType, number>,
    entriesByCategory: entriesByCategory as Record<KnowledgeCategory, number>,
    entriesBySource: entriesBySource as Record<KnowledgeSource, number>,
    averageConfidence:
      entries.length > 0 ? totalConfidence / entries.length : 0,
    verifiedPercentage:
      entries.length > 0 ? (verifiedCount / entries.length) * 100 : 0,
    totalSearches: 0, // Would track in real implementation
    totalLearningEvents: learningEvents.length,
    feedbackStats: {
      positive: feedbacks.filter((f) => f.type === "positive").length,
      negative: feedbacks.filter((f) => f.type === "negative").length,
      corrections: feedbacks.filter((f) => f.type === "correction").length,
    },
    storageUsedBytes: JSON.stringify(entries).length,
    lastSyncAt: new Date().toISOString(),
  };
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const knowledgeBaseService: KnowledgeBaseService = {
  // CRUD
  create: createKnowledgeEntry,
  read: async (id) => {
    const currentStore = await getStore();
    if (usePostgres && currentStore === postgresKnowledgeStore) {
      return await postgresKnowledgeStore.getEntry(id);
    }
    return (currentStore as InMemoryKnowledgeStore).getEntry(id) || null;
  },
  update: updateKnowledgeEntry,
  delete: async (id) => {
    const currentStore = await getStore();
    if (usePostgres && currentStore === postgresKnowledgeStore) {
      return await postgresKnowledgeStore.deleteEntry(id);
    }
    return (currentStore as InMemoryKnowledgeStore).deleteEntry(id);
  },
  archive: async (id) => {
    const currentStore = await getStore();
    const entry =
      usePostgres && currentStore === postgresKnowledgeStore
        ? await postgresKnowledgeStore.getEntry(id)
        : (currentStore as InMemoryKnowledgeStore).getEntry(id);

    if (entry) {
      const archived = {
        ...entry,
        status: "archived" as const,
        updatedAt: new Date().toISOString(),
      };
      if (usePostgres && currentStore === postgresKnowledgeStore) {
        await postgresKnowledgeStore.setEntry(archived);
      } else {
        (currentStore as InMemoryKnowledgeStore).setEntry(archived);
      }
      return true;
    }
    return false;
  },

  // Search
  search: semanticSearch,
  semanticSearch: async (text, options) =>
    semanticSearch({ query: text, ...options }),
  findSimilar: async (knowledgeId, limit = 5) => {
    const currentStore = await getStore();
    const entry =
      usePostgres && currentStore === postgresKnowledgeStore
        ? await postgresKnowledgeStore.getEntry(knowledgeId)
        : (currentStore as InMemoryKnowledgeStore).getEntry(knowledgeId);

    if (!entry?.embedding) return [];

    // Use PostgreSQL vector search if available
    if (usePostgres && currentStore === postgresKnowledgeStore) {
      const results = await postgresKnowledgeStore.search({
        embedding: entry.embedding,
        limit,
        threshold: 0.5,
        query: "", // Not used for similarity search
      });
      return results.map((r) => ({ entry: r.entry, score: r.score }));
    }

    // Fallback to in-memory
    return (currentStore as InMemoryKnowledgeStore)
      .getAllEntries()
      .filter(
        (e) => e.id !== knowledgeId && e.embedding && e.status === "active",
      )
      .map((e) => ({
        entry: e,
        score: cosineSimilarity(entry.embedding!, e.embedding!),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },

  // Embedding
  generateEmbedding,
  batchGenerateEmbeddings: async (texts) =>
    Promise.all(texts.map((t) => generateEmbedding(t))),

  // Learning
  learn: processLearningEvent,
  processFeedback,

  // Tenant Management
  getTenantConfig: async (tenantId) =>
    store.getTenantConfig(tenantId) || getDefaultTenantConfig(tenantId),
  updateTenantConfig: async (tenantId, updates) => {
    const existing =
      store.getTenantConfig(tenantId) || getDefaultTenantConfig(tenantId);
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    store.setTenantConfig(updated);
    return updated;
  },

  // Agent Management
  getAgentConfig: async (agentId) =>
    store.getAgentConfig(agentId) || getDefaultAgentConfig(agentId, "general"),
  updateAgentConfig: async (agentId, updates) => {
    const existing =
      store.getAgentConfig(agentId) ||
      getDefaultAgentConfig(agentId, "general");
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    store.setAgentConfig(updated);
    return updated;
  },

  // Federation
  syncFederatedInsights: async () => store.getFederatedInsights(),
  contributeFederatedInsight: async (knowledgeId) => {
    const entry = store.getEntry(knowledgeId);
    if (!entry || entry.confidence < 80 || !entry.verified) return false;

    // Create anonymized insight
    const insight: FederatedInsight = {
      id: `fed-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      content: entry.content,
      summary: entry.summary || entry.content.substring(0, 100),
      category: entry.category,
      type: entry.type,
      contributingTenants: 1,
      totalUsageCount: entry.usageCount,
      averageConfidence: entry.confidence,
      averageFeedbackScore: entry.feedbackScore,
      verified: false,
      availableTo: "all",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.addFederatedInsight(insight);
    return true;
  },

  // Statistics
  getStats: async (tenantId) => getKnowledgeStats(tenantId),
};

export default knowledgeBaseService;
export * from "./domain-kbs";

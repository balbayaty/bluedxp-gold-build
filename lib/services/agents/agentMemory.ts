/**
 * Agent Memory System
 * Persistent memory per agent type with context management
 * Supports short-term and long-term memory, learning from feedback
 */

import { knowledgeBaseService } from "../knowledge-base";
import { KnowledgeEntry, SearchResult } from "@/types/knowledgeBase";

// ============================================================================
// TYPES
// ============================================================================

export interface MemoryEntry {
  id: string;
  agentId: string;
  agentType: string;
  tenantId?: string;

  // Content
  type: "context" | "fact" | "preference" | "skill" | "interaction" | "error";
  content: string;
  summary?: string;

  // Importance & Relevance
  importance: number; // 0-1, higher = more important
  relevanceDecay: number; // How quickly this memory becomes less relevant
  lastAccessedAt: Date | string;
  accessCount: number;

  // Association
  relatedMemories: string[]; // IDs of related memories
  tags: string[];
  context?: Record<string, any>;

  // Lifecycle
  isActive: boolean;
  expiresAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ConversationContext {
  id: string;
  agentId: string;
  tenantId?: string;
  userId?: string;

  // Current session
  messages: ConversationMessage[];
  currentTopic?: string;
  entities: Record<string, any>; // Extracted entities

  // Summary
  summary?: string;
  keyPoints: string[];

  // State
  status: "active" | "paused" | "completed";
  startedAt: Date | string;
  lastActivityAt: Date | string;

  // Metadata
  metadata: Record<string, any>;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date | string;
  metadata?: Record<string, any>;
}

export interface AgentPerformanceMetrics {
  agentId: string;
  agentType: string;

  // Task Metrics
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  averageTaskDuration: number; // ms

  // Learning Metrics
  totalLearningEvents: number;
  knowledgeEntriesCreated: number;
  feedbackReceived: {
    positive: number;
    negative: number;
    neutral: number;
  };

  // Memory Metrics
  shortTermMemorySize: number;
  longTermMemorySize: number;
  memoryHitRate: number; // % of queries that found relevant memory

  // Quality Metrics
  confidenceAverage: number;
  userSatisfactionScore: number; // 0-100

  // Time Period
  periodStart: Date | string;
  periodEnd: Date | string;
}

// ============================================================================
// IN-MEMORY STORAGE (Will be replaced with persistent storage)
// ============================================================================

class AgentMemoryStore {
  private memories: Map<string, MemoryEntry> = new Map();
  private contexts: Map<string, ConversationContext> = new Map();
  private metrics: Map<string, AgentPerformanceMetrics> = new Map();

  // Memory operations
  getMemory(id: string): MemoryEntry | undefined {
    return this.memories.get(id);
  }

  setMemory(memory: MemoryEntry): void {
    this.memories.set(memory.id, memory);
  }

  deleteMemory(id: string): boolean {
    return this.memories.delete(id);
  }

  getAgentMemories(agentId: string): MemoryEntry[] {
    return Array.from(this.memories.values()).filter(
      (m) => m.agentId === agentId,
    );
  }

  // Context operations
  getContext(id: string): ConversationContext | undefined {
    return this.contexts.get(id);
  }

  setContext(context: ConversationContext): void {
    this.contexts.set(context.id, context);
  }

  deleteContext(id: string): boolean {
    return this.contexts.delete(id);
  }

  getAgentContexts(agentId: string): ConversationContext[] {
    return Array.from(this.contexts.values()).filter(
      (c) => c.agentId === agentId,
    );
  }

  // Metrics operations
  getMetrics(agentId: string): AgentPerformanceMetrics | undefined {
    return this.metrics.get(agentId);
  }

  setMetrics(metrics: AgentPerformanceMetrics): void {
    this.metrics.set(metrics.agentId, metrics);
  }
}

const store = new AgentMemoryStore();

// ============================================================================
// AGENT MEMORY CLASS
// ============================================================================

export class AgentMemory {
  private agentId: string;
  private agentType: string;
  private tenantId?: string;
  private shortTermLimit: number;
  private longTermLimit: number;

  constructor(
    agentId: string,
    agentType: string,
    options?: {
      tenantId?: string;
      shortTermLimit?: number;
      longTermLimit?: number;
    },
  ) {
    this.agentId = agentId;
    this.agentType = agentType;
    this.tenantId = options?.tenantId;
    this.shortTermLimit = options?.shortTermLimit || 100;
    this.longTermLimit = options?.longTermLimit || 1000;
  }

  // ============================================================================
  // MEMORY OPERATIONS
  // ============================================================================

  /**
   * Store a new memory
   */
  async remember(memory: {
    type: MemoryEntry["type"];
    content: string;
    summary?: string;
    importance?: number;
    tags?: string[];
    context?: Record<string, any>;
    expiresAt?: Date | string;
  }): Promise<MemoryEntry> {
    const entry: MemoryEntry = {
      id: `mem-${this.agentId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      agentId: this.agentId,
      agentType: this.agentType,
      tenantId: this.tenantId,
      type: memory.type,
      content: memory.content,
      summary: memory.summary,
      importance: memory.importance ?? 0.5,
      relevanceDecay: memory.type === "context" ? 0.9 : 0.1, // Context decays faster
      lastAccessedAt: new Date().toISOString(),
      accessCount: 0,
      relatedMemories: [],
      tags: memory.tags || [],
      context: memory.context,
      isActive: true,
      expiresAt: memory.expiresAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.setMemory(entry);

    // Also store in knowledge base for semantic search
    if (memory.importance && memory.importance >= 0.7) {
      await knowledgeBaseService.create({
        agentId: this.agentId,
        tenantId: this.tenantId,
        type:
          memory.type === "skill"
            ? "procedure"
            : memory.type === "fact"
              ? "fact"
              : memory.type === "error"
                ? "error_resolution"
                : "insight",
        category: "general",
        content: memory.content,
        summary: memory.summary,
        metadata: { memoryId: entry.id, agentType: this.agentType },
        keywords: memory.tags || [],
        searchableText: `${memory.content} ${memory.summary || ""} ${(memory.tags || []).join(" ")}`,
        source: "ai_analysis",
        confidence: Math.round(memory.importance * 100),
        verified: false,
        feedbackScore: 0,
        usageCount: 0,
        status: "active",
      });
    }

    // Cleanup old memories if over limit
    await this.consolidateMemories();

    return entry;
  }

  /**
   * Recall memories based on query
   */
  async recall(
    query: string,
    options?: {
      types?: MemoryEntry["type"][];
      tags?: string[];
      limit?: number;
      minImportance?: number;
    },
  ): Promise<MemoryEntry[]> {
    // Get agent's memories
    let memories = store
      .getAgentMemories(this.agentId)
      .filter((m) => m.isActive);

    // Filter by type
    if (options?.types?.length) {
      memories = memories.filter((m) => options.types!.includes(m.type));
    }

    // Filter by tags
    if (options?.tags?.length) {
      memories = memories.filter((m) =>
        options.tags!.some((tag) => m.tags.includes(tag)),
      );
    }

    // Filter by importance
    if (options?.minImportance !== undefined) {
      memories = memories.filter((m) => m.importance >= options.minImportance!);
    }

    // Also search knowledge base
    const kbResults = await knowledgeBaseService.semanticSearch(query, {
      agentId: this.agentId,
      limit: options?.limit || 10,
    });

    // Merge and rank results
    const queryLower = query.toLowerCase();
    const scoredMemories = memories.map((m) => {
      // Simple relevance scoring
      const contentMatch = m.content.toLowerCase().includes(queryLower)
        ? 0.5
        : 0;
      const tagMatch = m.tags.some((t) => queryLower.includes(t.toLowerCase()))
        ? 0.3
        : 0;
      const recencyBonus =
        Math.max(
          0,
          1 -
            (Date.now() - new Date(m.lastAccessedAt).getTime()) /
              (7 * 24 * 60 * 60 * 1000),
        ) * 0.2; // Last 7 days

      return {
        memory: m,
        score: contentMatch + tagMatch + recencyBonus + m.importance * 0.3,
      };
    });

    // Sort by score and apply limit
    const topMemories = scoredMemories
      .sort((a, b) => b.score - a.score)
      .slice(0, options?.limit || 10)
      .map((s) => {
        // Update access count
        s.memory.lastAccessedAt = new Date().toISOString();
        s.memory.accessCount++;
        store.setMemory(s.memory);
        return s.memory;
      });

    return topMemories;
  }

  /**
   * Forget a specific memory
   */
  async forget(memoryId: string): Promise<boolean> {
    const memory = store.getMemory(memoryId);
    if (memory && memory.agentId === this.agentId) {
      memory.isActive = false;
      memory.updatedAt = new Date().toISOString();
      store.setMemory(memory);
      return true;
    }
    return false;
  }

  /**
   * Strengthen a memory (increase importance)
   */
  async reinforce(
    memoryId: string,
    amount: number = 0.1,
  ): Promise<MemoryEntry | null> {
    const memory = store.getMemory(memoryId);
    if (memory && memory.agentId === this.agentId) {
      memory.importance = Math.min(1, memory.importance + amount);
      memory.accessCount++;
      memory.lastAccessedAt = new Date().toISOString();
      memory.updatedAt = new Date().toISOString();
      store.setMemory(memory);
      return memory;
    }
    return null;
  }

  /**
   * Weaken a memory (decrease importance)
   */
  async diminish(
    memoryId: string,
    amount: number = 0.1,
  ): Promise<MemoryEntry | null> {
    const memory = store.getMemory(memoryId);
    if (memory && memory.agentId === this.agentId) {
      memory.importance = Math.max(0, memory.importance - amount);
      memory.updatedAt = new Date().toISOString();
      store.setMemory(memory);

      // Auto-forget if importance drops too low
      if (memory.importance <= 0.1) {
        await this.forget(memoryId);
      }

      return memory;
    }
    return null;
  }

  /**
   * Consolidate memories to stay within limits
   */
  async consolidateMemories(): Promise<void> {
    const memories = store
      .getAgentMemories(this.agentId)
      .filter((m) => m.isActive);

    if (memories.length > this.shortTermLimit + this.longTermLimit) {
      // Sort by importance and recency
      const sorted = memories.sort((a, b) => {
        const importanceWeight = 0.6;
        const recencyWeight = 0.4;
        const aScore =
          a.importance * importanceWeight +
          (new Date(a.lastAccessedAt).getTime() / Date.now()) * recencyWeight;
        const bScore =
          b.importance * importanceWeight +
          (new Date(b.lastAccessedAt).getTime() / Date.now()) * recencyWeight;
        return bScore - aScore;
      });

      // Keep top memories, forget the rest
      const toKeep = sorted.slice(0, this.shortTermLimit + this.longTermLimit);
      const toForget = sorted.slice(this.shortTermLimit + this.longTermLimit);

      for (const memory of toForget) {
        await this.forget(memory.id);
      }

      console.log(
        `Consolidated memories for agent ${this.agentId}: kept ${toKeep.length}, forgot ${toForget.length}`,
      );
    }
  }

  // ============================================================================
  // CONVERSATION CONTEXT
  // ============================================================================

  /**
   * Start a new conversation context
   */
  startConversation(
    userId?: string,
    metadata?: Record<string, any>,
  ): ConversationContext {
    const context: ConversationContext = {
      id: `ctx-${this.agentId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      agentId: this.agentId,
      tenantId: this.tenantId,
      userId,
      messages: [],
      entities: {},
      keyPoints: [],
      status: "active",
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      metadata: metadata || {},
    };

    store.setContext(context);
    return context;
  }

  /**
   * Add message to conversation
   */
  addMessage(
    contextId: string,
    message: Omit<ConversationMessage, "id" | "timestamp">,
  ): ConversationMessage | null {
    const context = store.getContext(contextId);
    if (!context || context.agentId !== this.agentId) {
      return null;
    }

    const newMessage: ConversationMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
    };

    context.messages.push(newMessage);
    context.lastActivityAt = new Date().toISOString();
    store.setContext(context);

    return newMessage;
  }

  /**
   * Get conversation context
   */
  getConversation(contextId: string): ConversationContext | null {
    const context = store.getContext(contextId);
    return context && context.agentId === this.agentId ? context : null;
  }

  /**
   * Update conversation summary
   */
  async summarizeConversation(contextId: string): Promise<string> {
    const context = store.getContext(contextId);
    if (!context || context.agentId !== this.agentId) {
      return "";
    }

    // Simple summarization (would use AI in production)
    const userMessages = context.messages.filter((m) => m.role === "user");
    const topics = userMessages
      .map((m) => m.content.split(" ").slice(0, 5).join(" "))
      .join("; ");

    const summary = `Conversation with ${context.messages.length} messages. Topics: ${topics}`;

    context.summary = summary;
    store.setContext(context);

    // Store as memory if conversation is meaningful
    if (context.messages.length >= 3) {
      await this.remember({
        type: "interaction",
        content: summary,
        importance: Math.min(0.5 + context.messages.length * 0.05, 0.9),
        tags: ["conversation", ...context.keyPoints.slice(0, 5)],
        context: {
          userId: context.userId,
          messageCount: context.messages.length,
        },
      });
    }

    return summary;
  }

  /**
   * End conversation
   */
  async endConversation(contextId: string): Promise<void> {
    const context = store.getContext(contextId);
    if (context && context.agentId === this.agentId) {
      await this.summarizeConversation(contextId);
      context.status = "completed";
      store.setContext(context);
    }
  }

  /**
   * Get or create a conversation context for a user
   */
  async getOrCreateConversation(
    tenantId: string,
    userId: string,
  ): Promise<ConversationContext> {
    const contexts = store.getAgentContexts(this.agentId);
    const existing = contexts.find(
      (c) =>
        c.userId === userId &&
        (c.tenantId === tenantId || (!c.tenantId && !tenantId)) &&
        c.status === "active",
    );

    if (existing) {
      return existing;
    }

    // Create new
    const context = this.startConversation(userId);
    context.tenantId = tenantId;
    store.setContext(context);
    return context;
  }

  // ============================================================================
  // LEARNING FROM FEEDBACK
  // ============================================================================

  /**
   * Learn from positive feedback
   */
  async learnFromSuccess(
    taskDescription: string,
    context: Record<string, any>,
  ): Promise<void> {
    await this.remember({
      type: "skill",
      content: `Successfully completed: ${taskDescription}`,
      summary: taskDescription,
      importance: 0.7,
      tags: ["success", "learned"],
      context,
    });

    await this.updateMetrics("success");
  }

  /**
   * Learn from failure
   */
  async learnFromFailure(
    taskDescription: string,
    error: string,
    context: Record<string, any>,
  ): Promise<void> {
    await this.remember({
      type: "error",
      content: `Failed task: ${taskDescription}. Error: ${error}`,
      summary: `Error: ${taskDescription}`,
      importance: 0.8, // Errors are important to remember
      tags: ["failure", "error", "learned"],
      context: { ...context, error },
    });

    await this.updateMetrics("failure");
  }

  /**
   * Process user feedback
   */
  async processFeedback(feedback: {
    type: "positive" | "negative" | "neutral";
    relatedMemoryId?: string;
    comment?: string;
  }): Promise<void> {
    if (feedback.relatedMemoryId) {
      if (feedback.type === "positive") {
        await this.reinforce(feedback.relatedMemoryId, 0.15);
      } else if (feedback.type === "negative") {
        await this.diminish(feedback.relatedMemoryId, 0.2);
      }
    }

    if (feedback.comment) {
      await this.remember({
        type: "preference",
        content: `User feedback: ${feedback.comment}`,
        importance: feedback.type === "negative" ? 0.8 : 0.5,
        tags: ["feedback", feedback.type],
      });
    }

    await this.updateMetrics(`feedback_${feedback.type}`);
  }

  // ============================================================================
  // METRICS
  // ============================================================================

  /**
   * Get agent performance metrics
   */
  getMetrics(): AgentPerformanceMetrics {
    const existing = store.getMetrics(this.agentId);
    if (existing) {
      return existing;
    }

    const metrics: AgentPerformanceMetrics = {
      agentId: this.agentId,
      agentType: this.agentType,
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      averageTaskDuration: 0,
      totalLearningEvents: 0,
      knowledgeEntriesCreated: 0,
      feedbackReceived: { positive: 0, negative: 0, neutral: 0 },
      shortTermMemorySize: 0,
      longTermMemorySize: 0,
      memoryHitRate: 0,
      confidenceAverage: 0,
      userSatisfactionScore: 0,
      periodStart: new Date().toISOString(),
      periodEnd: new Date().toISOString(),
    };

    store.setMetrics(metrics);
    return metrics;
  }

  /**
   * Update metrics
   */
  private async updateMetrics(event: string): Promise<void> {
    const metrics = this.getMetrics();

    switch (event) {
      case "success":
        metrics.totalTasks++;
        metrics.successfulTasks++;
        break;
      case "failure":
        metrics.totalTasks++;
        metrics.failedTasks++;
        break;
      case "feedback_positive":
        metrics.feedbackReceived.positive++;
        break;
      case "feedback_negative":
        metrics.feedbackReceived.negative++;
        break;
      case "feedback_neutral":
        metrics.feedbackReceived.neutral++;
        break;
    }

    // Update memory counts
    const memories = store
      .getAgentMemories(this.agentId)
      .filter((m) => m.isActive);
    const shortTerm = memories.filter(
      (m) => m.type === "context" || m.type === "interaction",
    );
    const longTerm = memories.filter(
      (m) => m.type !== "context" && m.type !== "interaction",
    );

    metrics.shortTermMemorySize = shortTerm.length;
    metrics.longTermMemorySize = longTerm.length;
    metrics.periodEnd = new Date().toISOString();

    // Calculate satisfaction score
    const totalFeedback =
      metrics.feedbackReceived.positive +
      metrics.feedbackReceived.negative +
      metrics.feedbackReceived.neutral;
    if (totalFeedback > 0) {
      metrics.userSatisfactionScore = Math.round(
        ((metrics.feedbackReceived.positive +
          metrics.feedbackReceived.neutral * 0.5) /
          totalFeedback) *
          100,
      );
    }

    store.setMetrics(metrics);
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

const agentMemories = new Map<string, AgentMemory>();

/**
 * Get or create an agent memory instance
 */
export function getAgentMemory(
  agentId: string,
  agentType: string,
  options?: {
    tenantId?: string;
    shortTermLimit?: number;
    longTermLimit?: number;
  },
): AgentMemory {
  const key = `${agentId}-${options?.tenantId || "global"}`;

  if (!agentMemories.has(key)) {
    agentMemories.set(key, new AgentMemory(agentId, agentType, options));
  }

  return agentMemories.get(key)!;
}

/**
 * Clear agent memory cache
 */
export function clearAgentMemory(agentId: string, tenantId?: string): void {
  const key = `${agentId}-${tenantId || "global"}`;
  agentMemories.delete(key);
}

export default AgentMemory;

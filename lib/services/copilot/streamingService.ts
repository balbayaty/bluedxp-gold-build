/**
 * Copilot Streaming Service
 * Handles real-time streaming of AI responses
 */

import { streamAI } from "@/utils/aiClient";
import type { AIMessage } from "@/utils/aiClient";
import { knowledgeBaseService } from "../knowledge-base";
import { getAgentMemory } from "../agents/agentMemory";
import type { CopilotRequest } from "./copilotService";

export interface StreamingChunk {
  type: "chunk" | "metadata" | "error" | "tool-call";
  content?: string;
  done?: boolean;
  conversationId?: string; // Added for memory continuity
  metadata?: {
    confidence?: number;
    knowledgeUsed?: number;
    memoriesUsed?: number;
    tokensUsed?: number;
    processingTime?: number;
  };
  error?: string;
  toolCall?: {
    id: string;
    toolId: string;
    name: string;
    input: any;
  };
}

/**
 * Stream copilot response with RAG and memory
 */
export async function* streamCopilotResponse(
  tenantId: string,
  userId: string,
  request: CopilotRequest,
): AsyncGenerator<StreamingChunk> {
  const startTime = Date.now();
  let tokensUsed = 0;
  let knowledgeCount = 0;
  let memoriesCount = 0;

  // Generate or use existing conversationId for memory continuity
  const conversationId =
    request.conversationId ||
    `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // 1. Get RAG context
    let knowledgeContext: any[] = [];
    if (request.options?.useRAG !== false) {
      try {
        const searchResults = await knowledgeBaseService.semanticSearch(
          request.message,
          {
            tenantId,
            filters: { minConfidence: 0.6, verified: true },
            limit: request.options?.maxKnowledgeResults || 5,
          },
        );
        knowledgeContext = searchResults;
        knowledgeCount = searchResults.length;
      } catch (error) {
        console.warn("[Copilot Streaming] RAG search failed:", error);
      }
    }

    // 2. Get memory context
    let memories: any[] = [];
    if (request.options?.useMemory !== false) {
      try {
        const agentMemory = getAgentMemory("copilot-agent", "copilot");
        const relevantMemories = await agentMemory.recall(request.message, {
          limit: 10,
        });
        memories = relevantMemories;
        memoriesCount = relevantMemories.length;
      } catch (error) {
        console.warn("[Copilot Streaming] Memory retrieval failed:", error);
      }
    }

    // 3. Build system prompt with enhanced conversation memory
    let systemPrompt = `You are HazalyzeCopilot, an ADVANCED AUTONOMOUS AI AGENT integrated into the BlueDXP Platform.
You help users with warehouse management, transportation, compliance, and all platform operations.
You have access to real-time knowledge, memory, and tools to provide accurate, contextual assistance.

⚡ CRITICAL: CONVERSATION MEMORY ⚡
You MUST remember and reference previous messages in this conversation! If the user says "do what you just said", "yes go ahead", or references something from earlier, LOOK AT THE CONVERSATION HISTORY and execute what was discussed!

Platform Context:
- BlueDXP is an enterprise intelligence operating system
- Multi-module platform: WMS, TMS, ISO-IMS, MSDS, QHSE, Trade Compliance, Proposals/RFQ, MaaS
- 4IR & 5IR aligned with IoT, AI/ML, automation, and human-centric collaboration
`;

    if (request.context?.moduleId) {
      systemPrompt += `\nCurrent Module: ${request.context.moduleId}\n`;
    }

    if (knowledgeContext.length > 0) {
      systemPrompt += `\nRelevant Knowledge Base Information:\n`;
      knowledgeContext.slice(0, 5).forEach((k, i) => {
        systemPrompt += `${i + 1}. ${k.entry.summary || k.entry.content.substring(0, 200)}\n`;
      });
    }

    if (memories.length > 0) {
      systemPrompt += `\nRelevant Context from Previous Interactions:\n`;
      memories.slice(0, 5).forEach((m, i) => {
        systemPrompt += `${i + 1}. ${m.content.substring(0, 200)}\n`;
      });
    }

    systemPrompt += `\nGuidelines:
- CONVERSATION MEMORY: Always check conversation history! When user says "yes" or "go ahead" - EXECUTE immediately!
- AUTOPILOT MODE: When asked to do something, DO IT - don't just explain!
- Be concise but thorough
- Use the knowledge base information when relevant
- Reference previous context when appropriate
- If you don't know something, say so rather than guessing
- Always consider multi-tenant isolation and security
- Provide actionable insights aligned with 4IR/5IR principles
`;

    // 4. Build messages
    const messages: AIMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: request.message },
    ];

    // 5. Stream AI response
    let fullContent = "";
    for await (const chunk of streamAI(messages, {
      provider: "auto",
      model: "gpt-4o-mini",
      temperature: request.options?.temperature || 0.7,
      maxTokens: request.options?.maxTokens || 2000,
      stream: true,
    })) {
      if (chunk.content) {
        fullContent += chunk.content;
        yield {
          type: "chunk",
          content: chunk.content,
          done: chunk.done,
        };
      }

      if (chunk.done) {
        // Estimate tokens (rough: 1 token ≈ 4 characters)
        tokensUsed = Math.ceil(fullContent.length / 4);
        break;
      }
    }

    // 6. Send final metadata with conversationId for memory continuity
    const processingTime = Date.now() - startTime;
    const confidence =
      fullContent.length > 50 ? 0.85 : fullContent.length > 20 ? 0.75 : 0.65;

    yield {
      type: "metadata",
      done: true,
      conversationId, // CRITICAL: Return conversationId for frontend to maintain memory
      metadata: {
        confidence,
        knowledgeUsed: knowledgeCount,
        memoriesUsed: memoriesCount,
        tokensUsed,
        processingTime,
      },
    };
  } catch (error: any) {
    console.error("[Copilot Streaming] Error:", error);
    yield {
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      done: true,
    };
  }
}

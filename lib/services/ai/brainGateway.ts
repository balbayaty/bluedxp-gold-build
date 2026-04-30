/**
 * 🧠 BRAIN GATEWAY
 * Central AI routing with fallback handling
 * Deep layer architecture with full functionality
 * Source: Adapted from chemcheck-analysis/lib/ai/brain-gateway.ts
 *
 * Features:
 * - Central AI routing
 * - Fallback handling
 * - Translation support
 * - Integration with Agent Orchestrator
 */

import { agentOrchestrator } from "@/lib/services/agents/agentOrchestrator";
import { callAI } from "@/utils/aiClient";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// INTERFACES
// ============================================================================

export interface BrainRequest {
  type: string;
  data: any;
  requirements?: {
    consensus?: boolean;
    [key: string]: any;
  };
  fallbackPrompt?: string;
}

export interface TranslationRequest {
  language: string;
  segments: Array<{
    id?: string;
    text?: string;
    content?: string;
  }>;
}

export interface TranslationResult {
  id?: string;
  translatedText: string;
}

// ============================================================================
// BRAIN GATEWAY FUNCTIONS
// ============================================================================

/**
 * Route request through AI brain (Agent Orchestrator with fallback)
 */
export async function brainRoute<T = any>(
  request: BrainRequest,
): Promise<T | null> {
  try {
    // Try routing through agent orchestrator first
    const routed = await agentOrchestrator.routeRequest({
      type: request.type,
      data: request.data,
      requirements: request.requirements || { consensus: true },
    });

    const consensus: any =
      (routed as any)?.consensus?.consensus ||
      (routed as any)?.consensus ||
      routed;

    // Publish successful routing event
    await eventBus.publish({
      type: "ai.brain.routed",
      data: { type: request.type, success: true },
    });

    return consensus as T;
  } catch (err) {
    console.warn("Agent orchestrator routing failed, trying fallback:", err);

    // Fallback to direct AI call if fallback prompt provided
    if (request.fallbackPrompt) {
      try {
        const text = await callAI({
          messages: [{ role: "user", content: request.fallbackPrompt }],
          model: "gpt-4",
        });

        try {
          const parsed = JSON.parse(text) as T;
          await eventBus.publish({
            type: "ai.brain.fallback",
            data: { type: request.type, success: true },
          });
          return parsed;
        } catch {
          await eventBus.publish({
            type: "ai.brain.fallback",
            data: { type: request.type, success: true },
          });
          return text as unknown as T;
        }
      } catch (fallbackError) {
        console.error("Fallback AI call also failed:", fallbackError);
        await eventBus.publish({
          type: "ai.brain.failed",
          data: { type: request.type, error: String(fallbackError) },
        });
        return null;
      }
    }

    await eventBus.publish({
      type: "ai.brain.failed",
      data: { type: request.type, error: String(err) },
    });

    return null;
  }
}

/**
 * Translate segments using AI brain
 */
export async function brainTranslateSegments(
  payload: TranslationRequest,
): Promise<TranslationResult[]> {
  const { language, segments } = payload;
  const data = { language, segments };

  const fallbackPrompt = `Translate the following segments into ${language}. Return JSON array with objects { id?, translatedText } matching the order. Segments: ${JSON.stringify(segments)}`;

  const res = await brainRoute<any>({
    type: "translation",
    data,
    fallbackPrompt,
  });

  if (Array.isArray(res)) {
    return res;
  }

  // Fallback simple mapping
  return segments.map((s, i) => ({
    id: s.id || `seg_${i}`,
    translatedText: `[${language}] ${s.text || s.content || ""}`,
  }));
}

/**
 * Brain gateway singleton instance
 */
export const brainGateway = {
  route: brainRoute,
  translate: brainTranslateSegments,
};

export default brainGateway;

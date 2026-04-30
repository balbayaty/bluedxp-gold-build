/**
 * Real-Time Claim Extraction Service
 * Extracts and validates claims from text, documents, and events in real-time
 */

import { TruthEvent } from "@/types/truth-engine";
import { eventBus } from "@/lib/services/event-store";

export interface ExtractedClaim {
  id: string;
  text: string;
  type:
    | "factual"
    | "numerical"
    | "temporal"
    | "causal"
    | "comparative"
    | "predictive";
  confidence: number;
  sourceEventId?: string;
  sourceText?: string;
  entities?: Array<{
    text: string;
    type: string;
    start: number;
    end: number;
  }>;
  verifiable: boolean;
  verificationStatus?: "unverified" | "verified" | "disputed" | "false";
  evidenceLinks?: string[];
  metadata?: Record<string, any>;
}

export interface ClaimValidationResult {
  claimId: string;
  validated: boolean;
  confidence: number;
  evidenceCount: number;
  conflictingClaims?: string[];
  verificationMethod?: string;
}

export class ClaimExtractionService {
  private claimCache = new Map<string, ExtractedClaim>();
  private validationCache = new Map<string, ClaimValidationResult>();

  /**
   * Extract claims from text
   */
  async extractFromText(
    text: string,
    sourceEventId?: string,
  ): Promise<ExtractedClaim[]> {
    const claims: ExtractedClaim[] = [];

    // Pattern-based extraction (in production, use NLP/LLM)
    const patterns = [
      {
        regex: /(\d+)\s*(percent|%|units?|items?|kg|tons?|liters?)/gi,
        type: "numerical" as const,
      },
      {
        regex: /(on|at|in|during)\s+(\d{4}|\w+\s+\d{1,2},?\s+\d{4})/gi,
        type: "temporal" as const,
      },
      {
        regex: /(because|due to|as a result of|caused by)/gi,
        type: "causal" as const,
      },
      {
        regex: /(more than|less than|greater than|compared to|vs\.?)/gi,
        type: "comparative" as const,
      },
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern.regex);
      for (const match of matches) {
        if (match.index !== undefined) {
          const claim: ExtractedClaim = {
            id: `claim:${Date.now()}:${Math.random().toString(36).substring(2, 11)}`,
            text: match[0],
            type: pattern.type,
            confidence: 0.7,
            sourceEventId,
            sourceText: text,
            verifiable: true,
            verificationStatus: "unverified",
          };
          claims.push(claim);
        }
      }
    }

    // Extract entities (simplified - in production use NER)
    for (const claim of claims) {
      claim.entities = this.extractEntities(claim.text);
    }

    // Cache claims
    for (const claim of claims) {
      this.claimCache.set(claim.id, claim);
    }

    return claims;
  }

  /**
   * Extract claims from Truth Event
   */
  async extractFromEvent(event: TruthEvent): Promise<ExtractedClaim[]> {
    const claims: ExtractedClaim[] = [];

    // Extract from event metadata
    if (event.metadata?.description) {
      const textClaims = await this.extractFromText(
        event.metadata.description,
        event.id,
      );
      claims.push(...textClaims);
    }

    // Extract from event type
    if (event.eventType) {
      const eventClaim: ExtractedClaim = {
        id: `claim:event:${event.id}`,
        text: `Event ${event.eventType} occurred`,
        type: "factual",
        confidence: event.confidenceScore,
        sourceEventId: event.id,
        verifiable: true,
        verificationStatus:
          event.status === "active" ? "verified" : "unverified",
        evidenceLinks: event.evidenceLinks,
      };
      claims.push(eventClaim);
    }

    return claims;
  }

  /**
   * Extract entities from text (simplified NER)
   */
  private extractEntities(text: string): Array<{
    text: string;
    type: string;
    start: number;
    end: number;
  }> {
    const entities: Array<{
      text: string;
      type: string;
      start: number;
      end: number;
    }> = [];

    // Simple patterns (in production, use proper NER)
    const patterns = [
      { regex: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, type: "PERSON" },
      { regex: /\b\d{4}\b/g, type: "DATE" },
      { regex: /\$\d+(?:,\d{3})*(?:\.\d{2})?/g, type: "MONEY" },
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern.regex);
      for (const match of matches) {
        if (match.index !== undefined) {
          entities.push({
            text: match[0],
            type: pattern.type,
            start: match.index,
            end: match.index + match[0].length,
          });
        }
      }
    }

    return entities;
  }

  /**
   * Validate claim against evidence
   */
  async validateClaim(
    claimId: string,
    evidenceIds: string[],
  ): Promise<ClaimValidationResult> {
    const claim = this.claimCache.get(claimId);
    if (!claim) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    // Check cache
    const cacheKey = `${claimId}:${evidenceIds.join(",")}`;
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }

    // Validate claim (simplified - in production, use evidence verification)
    const result: ClaimValidationResult = {
      claimId,
      validated: evidenceIds.length > 0,
      confidence: evidenceIds.length > 0 ? 0.8 : 0.3,
      evidenceCount: evidenceIds.length,
      verificationMethod: "evidence_matching",
    };

    // Check for conflicting claims
    const conflicting = await this.findConflictingClaims(claim);
    if (conflicting.length > 0) {
      result.conflictingClaims = conflicting;
      result.confidence = Math.max(0.3, result.confidence - 0.2);
    }

    // Cache result
    this.validationCache.set(cacheKey, result);

    // Update claim status
    claim.verificationStatus = result.validated ? "verified" : "unverified";
    claim.evidenceLinks = evidenceIds;

    return result;
  }

  /**
   * Find conflicting claims
   */
  private async findConflictingClaims(
    claim: ExtractedClaim,
  ): Promise<string[]> {
    const conflicting: string[] = [];

    // Check against cached claims
    for (const [id, cachedClaim] of this.claimCache.entries()) {
      if (id === claim.id) continue;

      // Simple conflict detection (in production, use semantic similarity)
      if (
        cachedClaim.text.toLowerCase() !== claim.text.toLowerCase() &&
        cachedClaim.entities &&
        claim.entities
      ) {
        const sharedEntities = cachedClaim.entities.filter((e1) =>
          claim.entities!.some(
            (e2) => e1.text === e2.text && e1.type === e2.type,
          ),
        );

        if (sharedEntities.length > 0 && cachedClaim.type === claim.type) {
          conflicting.push(id);
        }
      }
    }

    return conflicting;
  }

  /**
   * Real-time claim extraction from events
   */
  initializeRealTimeExtraction(tenantId: string): () => void {
    console.log("🔍 Initializing real-time claim extraction...");

    const subscription = eventBus.subscribe("truth.*", async (event: any) => {
      try {
        if (event.type === "truth.event.recorded") {
          const truthEvent = event.payload as TruthEvent;
          const claims = await this.extractFromEvent(truthEvent);

          // Publish claims extracted event
          for (const claim of claims) {
            await eventBus.publish({
              type: "truth.claim.extracted",
              id: `claim-${claim.id}`,
              aggregateId: claim.id,
              aggregateType: "claim",
              payload: claim,
              version: 1,
              metadata: {
                correlationId: `claim-${claim.id}`,
                tenantId,
                schemaVersion: 1,
                tags: {
                  sourceEventId: truthEvent.id,
                },
              },
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error("Error in real-time claim extraction:", error);
      }
    });

    console.log("✅ Real-time claim extraction initialized");

    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Get all claims for an entity
   */
  async getClaimsForEntity(
    entityType: string,
    entityId: string,
  ): Promise<ExtractedClaim[]> {
    const claims: ExtractedClaim[] = [];

    for (const claim of this.claimCache.values()) {
      if (
        claim.metadata?.entityType === entityType &&
        claim.metadata?.entityId === entityId
      ) {
        claims.push(claim);
      }
    }

    return claims;
  }

  /**
   * Get claim statistics
   */
  getClaimStatistics(): {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    averageConfidence: number;
  } {
    const claims = Array.from(this.claimCache.values());
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    let totalConfidence = 0;

    for (const claim of claims) {
      byType[claim.type] = (byType[claim.type] || 0) + 1;
      byStatus[claim.verificationStatus || "unverified"] =
        (byStatus[claim.verificationStatus || "unverified"] || 0) + 1;
      totalConfidence += claim.confidence;
    }

    return {
      total: claims.length,
      byType,
      byStatus,
      averageConfidence:
        claims.length > 0 ? totalConfidence / claims.length : 0,
    };
  }
}

export const claimExtractionService = new ClaimExtractionService();

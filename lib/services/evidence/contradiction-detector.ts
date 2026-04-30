/**
 * Contradiction Detector
 *
 * Detects contradictions in evidence packets
 * Three methods: timeline, signature, content
 *
 * @module evidence
 */

import { arabicNLPService } from "@/lib/services/nlp/arabic-nlp";
import type { Evidence } from "@/types/evidence";

// ============================================================================
// CONTRADICTION TYPES
// ============================================================================

/**
 * Contradiction severity
 */
export type ContradictionSeverity = "low" | "medium" | "high" | "critical";

/**
 * Contradiction analysis method
 */
export type ContradictionMethod =
  | "timeline"
  | "signature"
  | "content"
  | "metadata";

/**
 * Contradiction result
 */
export interface Contradiction {
  id: string;
  description: string;
  severity: ContradictionSeverity;

  // The conflicting items
  item1: {
    type: "event" | "document" | "evidence";
    id: string;
    claim: string;
    timestamp?: Date;
  };
  item2: {
    type: "event" | "document" | "evidence";
    id: string;
    claim: string;
    timestamp?: Date;
  };

  // Analysis
  analysisMethod: ContradictionMethod;
  explanation: string;
  confidence: number; // 0-1
  resolution?: string;
  detectedAt: Date;
}

/**
 * Contradiction analysis result
 */
export interface ContradictionAnalysis {
  contradictions: Contradiction[];
  contradictionIndex: number; // 0-1, higher = more contradictions
  summary: {
    total: number;
    bySeverity: Record<ContradictionSeverity, number>;
    byMethod: Record<ContradictionMethod, number>;
  };
  recommendations: string[];
}

// ============================================================================
// CONTRADICTION DETECTOR
// ============================================================================

export class ContradictionDetector {
  /**
   * Detect all contradictions in evidence
   */
  async detectContradictions(
    events: Array<{
      id: string;
      eventType: string;
      timestamp: Date;
      payload?: any;
    }>,
    documents: Evidence[],
    signatures: Array<{
      id: string;
      signedAt: Date;
      signerId: string;
      location?: { lat: number; lng: number };
    }>,
  ): Promise<ContradictionAnalysis> {
    const contradictions: Contradiction[] = [];

    // 1. Timeline contradictions
    const timelineContradictions = this.detectTimelineContradictions(events);
    contradictions.push(...timelineContradictions);

    // 2. Signature contradictions
    const signatureContradictions = this.detectSignatureContradictions(
      events,
      signatures,
    );
    contradictions.push(...signatureContradictions);

    // 3. Content contradictions
    const contentContradictions =
      await this.detectContentContradictions(documents);
    contradictions.push(...contentContradictions);

    // 4. Metadata contradictions
    const metadataContradictions = this.detectMetadataContradictions(
      events,
      documents,
      signatures,
    );
    contradictions.push(...metadataContradictions);

    // Calculate contradiction index
    const contradictionIndex = this.calculateContradictionIndex(contradictions);

    // Generate summary
    const summary = this.generateSummary(contradictions);

    // Generate recommendations
    const recommendations = this.generateRecommendations(contradictions);

    return {
      contradictions,
      contradictionIndex,
      summary,
      recommendations,
    };
  }

  /**
   * Detect timeline contradictions
   */
  private detectTimelineContradictions(
    events: Array<{
      id: string;
      eventType: string;
      timestamp: Date;
      payload?: any;
    }>,
  ): Contradiction[] {
    const contradictions: Contradiction[] = [];

    // Sort events by timestamp
    const sortedEvents = [...events].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    // Check for impossible sequences
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const current = sortedEvents[i];
      const next = sortedEvents[i + 1];

      // Delivery before pickup
      if (
        current.eventType === "shipment.delivered" &&
        next.eventType === "shipment.picked_up"
      ) {
        contradictions.push({
          id: `contradiction-${Date.now()}-${i}`,
          description: "Delivery recorded before pickup",
          severity: "critical",
          item1: {
            type: "event",
            id: current.id,
            claim: `Delivered at ${current.timestamp.toISOString()}`,
            timestamp: current.timestamp,
          },
          item2: {
            type: "event",
            id: next.id,
            claim: `Picked up at ${next.timestamp.toISOString()}`,
            timestamp: next.timestamp,
          },
          analysisMethod: "timeline",
          explanation:
            "Chronological impossibility: delivery cannot occur before pickup",
          confidence: 1.0,
          detectedAt: new Date(),
        });
      }

      // Arrival before departure
      if (
        current.eventType === "shipment.arrived" &&
        next.eventType === "shipment.departed" &&
        current.timestamp.getTime() > next.timestamp.getTime()
      ) {
        contradictions.push({
          id: `contradiction-${Date.now()}-${i}-arrival`,
          description: "Arrival recorded after departure",
          severity: "high",
          item1: {
            type: "event",
            id: current.id,
            claim: `Arrived at ${current.timestamp.toISOString()}`,
            timestamp: current.timestamp,
          },
          item2: {
            type: "event",
            id: next.id,
            claim: `Departed at ${next.timestamp.toISOString()}`,
            timestamp: next.timestamp,
          },
          analysisMethod: "timeline",
          explanation: "Arrival timestamp is after departure timestamp",
          confidence: 0.95,
          detectedAt: new Date(),
        });
      }

      // Payment after delivery (might be valid, but flag for review)
      if (
        current.eventType === "shipment.delivered" &&
        next.eventType === "payment.received" &&
        next.timestamp.getTime() - current.timestamp.getTime() >
          30 * 24 * 60 * 60 * 1000 // More than 30 days
      ) {
        contradictions.push({
          id: `contradiction-${Date.now()}-${i}-payment`,
          description: "Payment received more than 30 days after delivery",
          severity: "medium",
          item1: {
            type: "event",
            id: current.id,
            claim: `Delivered at ${current.timestamp.toISOString()}`,
            timestamp: current.timestamp,
          },
          item2: {
            type: "event",
            id: next.id,
            claim: `Payment received at ${next.timestamp.toISOString()}`,
            timestamp: next.timestamp,
          },
          analysisMethod: "timeline",
          explanation: "Unusual delay between delivery and payment",
          confidence: 0.7,
          detectedAt: new Date(),
        });
      }
    }

    return contradictions;
  }

  /**
   * Detect signature contradictions
   */
  private detectSignatureContradictions(
    events: Array<{
      id: string;
      eventType: string;
      timestamp: Date;
      payload?: any;
    }>,
    signatures: Array<{
      id: string;
      signedAt: Date;
      signerId: string;
      location?: { lat: number; lng: number };
    }>,
  ): Contradiction[] {
    const contradictions: Contradiction[] = [];

    for (const signature of signatures) {
      // Find related delivery event
      const deliveryEvent = events.find(
        (e) =>
          e.eventType === "shipment.delivered" &&
          Math.abs(e.timestamp.getTime() - signature.signedAt.getTime()) <
            3600000, // Within 1 hour
      );

      if (deliveryEvent) {
        const timeDiff =
          Math.abs(
            deliveryEvent.timestamp.getTime() - signature.signedAt.getTime(),
          ) / 60000; // minutes

        // Flag significant time differences
        if (timeDiff > 30) {
          contradictions.push({
            id: `contradiction-${Date.now()}-sig-${signature.id}`,
            description:
              "Signature timestamp differs significantly from GPS arrival",
            severity: timeDiff > 60 ? "high" : "medium",
            item1: {
              type: "document",
              id: signature.id,
              claim: `Signed at ${signature.signedAt.toISOString()}`,
              timestamp: signature.signedAt,
            },
            item2: {
              type: "event",
              id: deliveryEvent.id,
              claim: `GPS arrival at ${deliveryEvent.timestamp.toISOString()}`,
              timestamp: deliveryEvent.timestamp,
            },
            analysisMethod: "signature",
            explanation: `${Math.round(timeDiff)} minute discrepancy between signature and GPS`,
            confidence: 0.85,
            detectedAt: new Date(),
          });
        }

        // Check location if available
        if (signature.location && deliveryEvent.payload?.location) {
          const distance = this.calculateDistance(
            signature.location.lat,
            signature.location.lng,
            deliveryEvent.payload.location.lat,
            deliveryEvent.payload.location.lng,
          );

          if (distance > 1000) {
            // More than 1km difference
            contradictions.push({
              id: `contradiction-${Date.now()}-loc-${signature.id}`,
              description:
                "Signature location differs significantly from GPS location",
              severity: distance > 5000 ? "high" : "medium",
              item1: {
                type: "document",
                id: signature.id,
                claim: `Signed at location (${signature.location.lat}, ${signature.location.lng})`,
                timestamp: signature.signedAt,
              },
              item2: {
                type: "event",
                id: deliveryEvent.id,
                claim: `GPS location (${deliveryEvent.payload.location.lat}, ${deliveryEvent.payload.location.lng})`,
                timestamp: deliveryEvent.timestamp,
              },
              analysisMethod: "signature",
              explanation: `${Math.round(distance)}m distance between signature and GPS locations`,
              confidence: 0.9,
              detectedAt: new Date(),
            });
          }
        }
      }
    }

    return contradictions;
  }

  /**
   * Detect content contradictions
   */
  private async detectContentContradictions(
    documents: Evidence[],
  ): Promise<Contradiction[]> {
    const contradictions: Contradiction[] = [];

    // Compare document pairs
    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        const doc1 = documents[i];
        const doc2 = documents[j];

        // Extract text content
        const text1 =
          doc1.content || doc1.metadata?.extractedText || doc1.title || "";
        const text2 =
          doc2.content || doc2.metadata?.extractedText || doc2.title || "";

        if (!text1 || !text2) continue;

        // Use Arabic NLP to detect conflicts
        try {
          const analysis1 = await arabicNLPService.analyze(text1, {
            includeIntent: true,
          });
          const analysis2 = await arabicNLPService.analyze(text2, {
            includeIntent: true,
          });

          // Check for conflicting intents
          if (
            (analysis1.intent.intent === "CONFIRMATION" &&
              analysis2.intent.intent === "CANCELLATION") ||
            (analysis1.intent.intent === "CANCELLATION" &&
              analysis2.intent.intent === "CONFIRMATION")
          ) {
            contradictions.push({
              id: `contradiction-${Date.now()}-content-${i}-${j}`,
              description: "Conflicting intents detected in documents",
              severity: "high",
              item1: {
                type: "document",
                id: doc1.id,
                claim: `Document 1 intent: ${analysis1.intent.intent}`,
              },
              item2: {
                type: "document",
                id: doc2.id,
                claim: `Document 2 intent: ${analysis2.intent.intent}`,
              },
              analysisMethod: "content",
              explanation: "One document confirms while the other cancels",
              confidence: 0.8,
              detectedAt: new Date(),
            });
          }

          // Check for conflicting sentiments
          if (
            (analysis1.sentiment.sentiment === "positive" &&
              analysis2.sentiment.sentiment === "negative") ||
            (analysis1.sentiment.sentiment === "negative" &&
              analysis2.sentiment.sentiment === "positive")
          ) {
            contradictions.push({
              id: `contradiction-${Date.now()}-sentiment-${i}-${j}`,
              description: "Conflicting sentiments detected in documents",
              severity: "medium",
              item1: {
                type: "document",
                id: doc1.id,
                claim: `Document 1 sentiment: ${analysis1.sentiment.sentiment}`,
              },
              item2: {
                type: "document",
                id: doc2.id,
                claim: `Document 2 sentiment: ${analysis2.sentiment.sentiment}`,
              },
              analysisMethod: "content",
              explanation: "Documents express opposite sentiments",
              confidence: 0.7,
              detectedAt: new Date(),
            });
          }
        } catch (error) {
          console.warn(
            "Error analyzing document content for contradictions:",
            error,
          );
        }

        // Simple text-based conflict detection
        const conflicts = this.detectTextConflicts(text1, text2);
        for (const conflict of conflicts) {
          contradictions.push({
            id: `contradiction-${Date.now()}-text-${i}-${j}-${conflicts.indexOf(conflict)}`,
            description: conflict.description,
            severity: conflict.severity,
            item1: {
              type: "document",
              id: doc1.id,
              claim: conflict.claim1,
            },
            item2: {
              type: "document",
              id: doc2.id,
              claim: conflict.claim2,
            },
            analysisMethod: "content",
            explanation: conflict.explanation,
            confidence: conflict.confidence,
            detectedAt: new Date(),
          });
        }
      }
    }

    return contradictions;
  }

  /**
   * Detect metadata contradictions
   */
  private detectMetadataContradictions(
    events: Array<{
      id: string;
      eventType: string;
      timestamp: Date;
      payload?: any;
    }>,
    documents: Evidence[],
    signatures: Array<{
      id: string;
      signedAt: Date;
      signerId: string;
      location?: { lat: number; lng: number };
    }>,
  ): Contradiction[] {
    const contradictions: Contradiction[] = [];

    // Check for duplicate signers at same time
    const signerGroups = new Map<
      string,
      Array<{ id: string; signedAt: Date }>
    >();
    for (const sig of signatures) {
      if (!signerGroups.has(sig.signerId)) {
        signerGroups.set(sig.signerId, []);
      }
      signerGroups.get(sig.signerId)!.push(sig);
    }

    for (const [signerId, sigs] of signerGroups.entries()) {
      if (sigs.length > 1) {
        // Check if signed at same time (impossible)
        for (let i = 0; i < sigs.length; i++) {
          for (let j = i + 1; j < sigs.length; j++) {
            const timeDiff = Math.abs(
              sigs[i].signedAt.getTime() - sigs[j].signedAt.getTime(),
            );
            if (timeDiff < 1000) {
              // Less than 1 second
              contradictions.push({
                id: `contradiction-${Date.now()}-duplicate-${signerId}`,
                description:
                  "Same signer signed multiple documents at identical time",
                severity: "high",
                item1: {
                  type: "document",
                  id: sigs[i].id,
                  claim: `Signed by ${signerId} at ${sigs[i].signedAt.toISOString()}`,
                  timestamp: sigs[i].signedAt,
                },
                item2: {
                  type: "document",
                  id: sigs[j].id,
                  claim: `Signed by ${signerId} at ${sigs[j].signedAt.toISOString()}`,
                  timestamp: sigs[j].signedAt,
                },
                analysisMethod: "metadata",
                explanation:
                  "Physically impossible to sign multiple documents at exact same time",
                confidence: 0.95,
                detectedAt: new Date(),
              });
            }
          }
        }
      }
    }

    return contradictions;
  }

  /**
   * Detect text conflicts (simple pattern matching)
   */
  private detectTextConflicts(
    text1: string,
    text2: string,
  ): Array<{
    description: string;
    severity: ContradictionSeverity;
    claim1: string;
    claim2: string;
    explanation: string;
    confidence: number;
  }> {
    const conflicts: Array<{
      description: string;
      severity: ContradictionSeverity;
      claim1: string;
      claim2: string;
      explanation: string;
      confidence: number;
    }> = [];

    const t1 = text1.toLowerCase();
    const t2 = text2.toLowerCase();

    // Check for yes/no conflicts
    if (
      (t1.includes("yes") || t1.includes("نعم") || t1.includes("موافق")) &&
      (t2.includes("no") || t2.includes("لا") || t2.includes("رفض"))
    ) {
      conflicts.push({
        description: "Conflicting yes/no statements",
        severity: "high",
        claim1: "Document 1 indicates yes/approval",
        claim2: "Document 2 indicates no/rejection",
        explanation: "One document confirms while the other denies",
        confidence: 0.8,
      });
    }

    // Check for date conflicts
    const date1 = this.extractDate(text1);
    const date2 = this.extractDate(text2);
    if (
      date1 &&
      date2 &&
      Math.abs(date1.getTime() - date2.getTime()) > 7 * 24 * 60 * 60 * 1000
    ) {
      conflicts.push({
        description: "Conflicting dates (more than 7 days difference)",
        severity: "medium",
        claim1: `Document 1 date: ${date1.toISOString()}`,
        claim2: `Document 2 date: ${date2.toISOString()}`,
        explanation: "Significant date discrepancy between documents",
        confidence: 0.7,
      });
    }

    return conflicts;
  }

  /**
   * Extract date from text
   */
  private extractDate(text: string): Date | null {
    // Try various date formats
    const datePatterns = [
      /\d{4}-\d{2}-\d{2}/,
      /\d{2}\/\d{2}\/\d{4}/,
      /\d{1,2}\/\d{1,2}\/\d{4}/,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const date = new Date(match[0]);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    return null;
  }

  /**
   * Calculate contradiction index (0-1)
   */
  private calculateContradictionIndex(contradictions: Contradiction[]): number {
    if (contradictions.length === 0) return 0;

    const weights: Record<ContradictionSeverity, number> = {
      low: 0.1,
      medium: 0.3,
      high: 0.6,
      critical: 1.0,
    };

    const totalWeight = contradictions.reduce(
      (sum, c) => sum + weights[c.severity] * c.confidence,
      0,
    );

    // Normalize to 0-1 range (max weight per contradiction is 1.0)
    return Math.min(1.0, totalWeight / Math.max(1, contradictions.length));
  }

  /**
   * Generate summary
   */
  private generateSummary(
    contradictions: Contradiction[],
  ): ContradictionAnalysis["summary"] {
    const bySeverity: Record<ContradictionSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    const byMethod: Record<ContradictionMethod, number> = {
      timeline: 0,
      signature: 0,
      content: 0,
      metadata: 0,
    };

    for (const c of contradictions) {
      bySeverity[c.severity]++;
      byMethod[c.analysisMethod]++;
    }

    return {
      total: contradictions.length,
      bySeverity,
      byMethod,
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(contradictions: Contradiction[]): string[] {
    const recommendations: string[] = [];

    if (contradictions.length === 0) {
      recommendations.push(
        "No contradictions detected - evidence is consistent",
      );
      return recommendations;
    }

    const criticalCount = contradictions.filter(
      (c) => c.severity === "critical",
    ).length;
    if (criticalCount > 0) {
      recommendations.push(
        `URGENT: ${criticalCount} critical contradiction(s) require immediate review`,
      );
    }

    const timelineCount = contradictions.filter(
      (c) => c.analysisMethod === "timeline",
    ).length;
    if (timelineCount > 0) {
      recommendations.push(
        `Review ${timelineCount} timeline contradiction(s) - verify event timestamps`,
      );
    }

    const signatureCount = contradictions.filter(
      (c) => c.analysisMethod === "signature",
    ).length;
    if (signatureCount > 0) {
      recommendations.push(
        `Review ${signatureCount} signature contradiction(s) - verify signature timestamps and locations`,
      );
    }

    const contentCount = contradictions.filter(
      (c) => c.analysisMethod === "content",
    ).length;
    if (contentCount > 0) {
      recommendations.push(
        `Review ${contentCount} content contradiction(s) - verify document contents for conflicting claims`,
      );
    }

    return recommendations;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Earth radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Export singleton
export const contradictionDetector = new ContradictionDetector();

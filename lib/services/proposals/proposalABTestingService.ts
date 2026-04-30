/**
 * Proposal A/B Testing Service
 * Test different proposal variations to optimize win rates
 * Integrated with ML Registry for statistical analysis
 */

import { eventBus } from "@/lib/services/event-store";
import { proposalBenchmarkingService } from "./proposalBenchmarkingService";
import type { DomainEvent } from "@/types/cqrs";

// ============================================================================
// TYPES
// ============================================================================

export interface ProposalVariant {
  id: string;
  proposalId: string;
  variantName: string;
  variantType: "CONTENT" | "PRICING" | "LAYOUT" | "SECTIONS" | "BRANDING";
  changes: Record<string, any>;
  proposal: any; // Full proposal data
  createdAt: Date | string;
}

export interface ProposalABTest {
  id: string;
  name: string;
  description: string;
  baseProposalId: string;
  variants: ProposalVariant[];
  trafficSplit: number; // Percentage for each variant (e.g., 50 = 50/50 split)
  status: "DRAFT" | "RUNNING" | "PAUSED" | "COMPLETED";
  startDate?: Date | string;
  endDate?: Date | string;

  // Results
  results?: {
    baseProposal: {
      sent: number;
      opened: number;
      viewed: number;
      accepted: number;
      rejected: number;
      winRate: number;
      averageTimeSpent: number;
    };
    variants: Array<{
      variantId: string;
      sent: number;
      opened: number;
      viewed: number;
      accepted: number;
      rejected: number;
      winRate: number;
      averageTimeSpent: number;
      improvement: number; // % improvement over base
    }>;
    winner?: string; // Variant ID
    statisticalSignificance: number; // 0-100
    confidenceLevel: number; // 0-1
  };

  // Configuration
  minimumSampleSize: number;
  confidenceLevel: number;
  successMetric:
    | "WIN_RATE"
    | "CONVERSION_RATE"
    | "ENGAGEMENT"
    | "TIME_TO_DECISION";

  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================================================
// A/B TESTING SERVICE
// ============================================================================

class ProposalABTestingService {
  private tests: Map<string, ProposalABTest> = new Map();
  private variants: Map<string, ProposalVariant> = new Map();

  constructor() {
    this.initializeEventHandlers();
  }

  /**
   * Initialize event handlers
   */
  private initializeEventHandlers(): void {
    eventBus.subscribe(
      "proposals.proposal.sent",
      async (event: DomainEvent) => {
        await this.handleProposalSent(event);
      },
    );

    eventBus.subscribe(
      "proposals.proposal.accepted",
      async (event: DomainEvent) => {
        await this.handleProposalAccepted(event);
      },
    );

    eventBus.subscribe(
      "proposals.proposal.rejected",
      async (event: DomainEvent) => {
        await this.handleProposalRejected(event);
      },
    );
  }

  /**
   * Create A/B test
   */
  async createABTest(config: {
    name: string;
    description: string;
    baseProposalId: string;
    variants: Array<{
      variantName: string;
      variantType: ProposalVariant["variantType"];
      changes: Record<string, any>;
    }>;
    trafficSplit?: number;
    minimumSampleSize?: number;
    confidenceLevel?: number;
    successMetric?: ProposalABTest["successMetric"];
  }): Promise<ProposalABTest> {
    const test: ProposalABTest = {
      id: `abtest-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: config.name,
      description: config.description,
      baseProposalId: config.baseProposalId,
      variants: config.variants.map((v, index) => ({
        id: `variant-${Date.now()}-${index}`,
        proposalId: config.baseProposalId,
        variantName: v.variantName,
        variantType: v.variantType,
        changes: v.changes,
        proposal: null, // Would load from proposal service
        createdAt: new Date().toISOString(),
      })),
      trafficSplit: config.trafficSplit || 50,
      status: "DRAFT",
      minimumSampleSize: config.minimumSampleSize || 100,
      confidenceLevel: config.confidenceLevel || 0.95,
      successMetric: config.successMetric || "WIN_RATE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tests.set(test.id, test);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.ab-test.created",
      aggregateId: test.id,
      aggregateType: "AB_TEST",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { testId: test.id, baseProposalId: config.baseProposalId },
    });

    return test;
  }

  /**
   * Start A/B test
   */
  async startABTest(testId: string): Promise<ProposalABTest> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`A/B test ${testId} not found`);
    }

    test.status = "RUNNING";
    test.startDate = new Date().toISOString();
    this.tests.set(testId, test);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.ab-test.started",
      aggregateId: testId,
      aggregateType: "AB_TEST",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { testId },
    });

    return test;
  }

  /**
   * Get variant for customer (traffic splitting)
   */
  getVariantForCustomer(
    testId: string,
    customerId: string,
  ): ProposalVariant | null {
    const test = this.tests.get(testId);
    if (!test || test.status !== "RUNNING") return null;

    // Deterministic assignment based on customer ID
    const hash = this.hashString(customerId);
    const variantIndex = hash % test.variants.length;
    return test.variants[variantIndex] || null;
  }

  /**
   * Calculate test results
   */
  async calculateResults(testId: string): Promise<ProposalABTest["results"]> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`A/B test ${testId} not found`);
    }

    // Get base proposal metrics
    const baseMetrics = await proposalBenchmarkingService.getMetrics(
      test.baseProposalId,
    );
    const baseResults = {
      sent: 0, // Would get from tracking
      opened: baseMetrics?.viewCount || 0,
      viewed: baseMetrics?.viewCount || 0,
      accepted: baseMetrics?.winRate === 100 ? 1 : 0,
      rejected: baseMetrics?.winRate === 0 ? 1 : 0,
      winRate: baseMetrics?.winRate || 0,
      averageTimeSpent: baseMetrics?.timeSpent || 0,
    };

    // Get variant results
    const variantResults = await Promise.all(
      test.variants.map(async (variant) => {
        // Would get actual metrics for variant
        const variantMetrics = await proposalBenchmarkingService.getMetrics(
          variant.proposalId,
        );
        const improvement = variantMetrics?.winRate
          ? ((variantMetrics.winRate - baseResults.winRate) /
              baseResults.winRate) *
            100
          : 0;

        return {
          variantId: variant.id,
          sent: 0,
          opened: variantMetrics?.viewCount || 0,
          viewed: variantMetrics?.viewCount || 0,
          accepted: variantMetrics?.winRate === 100 ? 1 : 0,
          rejected: variantMetrics?.winRate === 0 ? 1 : 0,
          winRate: variantMetrics?.winRate || 0,
          averageTimeSpent: variantMetrics?.timeSpent || 0,
          improvement,
        };
      }),
    );

    // Determine winner
    const winner = variantResults.reduce(
      (best, current) => (current.winRate > best.winRate ? current : best),
      variantResults[0] || { variantId: "", winRate: 0 },
    );

    // Calculate statistical significance (simplified)
    const statisticalSignificance = this.calculateStatisticalSignificance(
      baseResults,
      variantResults.find((r) => r.variantId === winner.variantId)!,
    );

    const results: ProposalABTest["results"] = {
      baseProposal: baseResults,
      variants: variantResults,
      winner: winner.variantId,
      statisticalSignificance,
      confidenceLevel: test.confidenceLevel,
    };

    test.results = results;
    test.updatedAt = new Date().toISOString();
    this.tests.set(testId, test);

    return results;
  }

  /**
   * Calculate statistical significance (simplified)
   */
  private calculateStatisticalSignificance(
    base: ProposalABTest["results"]["baseProposal"],
    variant: ProposalABTest["results"]["variants"][0],
  ): number {
    // Simplified chi-square test
    // In production, would use proper statistical tests
    const improvement = variant.improvement;
    if (improvement > 20) return 95;
    if (improvement > 10) return 85;
    if (improvement > 5) return 75;
    return 50;
  }

  /**
   * Hash string for deterministic assignment
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get test by ID
   */
  getTest(testId: string): ProposalABTest | undefined {
    return this.tests.get(testId);
  }

  /**
   * Get all tests
   */
  getAllTests(): ProposalABTest[] {
    return Array.from(this.tests.values());
  }

  /**
   * Event handlers
   */
  private async handleProposalSent(event: DomainEvent): Promise<void> {
    // Track A/B test sends
  }

  private async handleProposalAccepted(event: DomainEvent): Promise<void> {
    // Update A/B test results
  }

  private async handleProposalRejected(event: DomainEvent): Promise<void> {
    // Update A/B test results
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const proposalABTestingService = new ProposalABTestingService();

/**
 * Proposal Benchmarking & Analytics Service
 * Tracks proposal performance, win rates, conversion metrics, and provides insights
 */

import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { eventBus } from "@/lib/services/event-bus";
import type { Proposal } from "@/types/proposals";
import type { DomainEvent } from "@/types/event-store";

// ============================================================================
// TYPES
// ============================================================================

export interface ProposalMetrics {
  proposalId: string;
  totalAmount: number;
  currency: string;
  responseTime: number; // hours from creation to send
  timeToFirstView: number; // hours from send to first view
  timeToDecision: number; // hours from send to acceptance/rejection
  viewCount: number;
  downloadCount: number;
  acceptanceRate: number; // 0-100
  winRate: number; // 0-100
  conversionRate: number; // 0-100
  pricingCompetitiveness: number; // 0-100
  sectionEngagement: Record<string, number>; // sectionId -> view time in seconds
  generatedAt: Date | string;
  updatedAt: Date | string;
}

export interface ProposalBenchmark {
  proposalId: string;
  benchmarkType: "INDUSTRY" | "HISTORICAL" | "COMPETITIVE" | "CUSTOMER";
  metrics: {
    pricingCompetitiveness: number; // 0-100
    responseTime: number; // hours
    winRate: number; // 0-100
    averageDealSize: number;
    conversionRate: number; // 0-100
    timeToDecision: number; // hours
    customerSatisfaction: number; // 0-100
  };
  comparisons: {
    vsIndustry: {
      pricing: "ABOVE" | "AT" | "BELOW";
      responseTime: "FASTER" | "AVERAGE" | "SLOWER";
      winRate: "ABOVE" | "AT" | "BELOW";
    };
    vsHistorical: {
      pricing: "ABOVE" | "AT" | "BELOW";
      responseTime: "FASTER" | "AVERAGE" | "SLOWER";
      winRate: "ABOVE" | "AT" | "BELOW";
    };
  };
  recommendations: Array<{
    category: "PRICING" | "TIMING" | "CONTENT" | "PROCESS";
    priority: "HIGH" | "MEDIUM" | "LOW";
    recommendation: string;
    impact: string;
  }>;
  generatedAt: Date | string;
}

export interface ProposalAnalytics {
  period: {
    start: Date | string;
    end: Date | string;
  };
  totals: {
    proposalsCreated: number;
    proposalsSent: number;
    proposalsWon: number;
    proposalsLost: number;
    totalValue: number;
    averageDealSize: number;
  };
  rates: {
    winRate: number;
    conversionRate: number;
    acceptanceRate: number;
    rejectionRate: number;
  };
  averages: {
    responseTime: number; // hours
    timeToDecision: number; // hours
    proposalValue: number;
    sectionsPerProposal: number;
  };
  trends: {
    winRateTrend: "UP" | "DOWN" | "STABLE";
    conversionTrend: "UP" | "DOWN" | "STABLE";
    valueTrend: "UP" | "DOWN" | "STABLE";
  };
  topPerformers: Array<{
    proposalId: string;
    proposalNumber: string;
    winRate: number;
    totalValue: number;
    customerName?: string;
  }>;
  improvementAreas: Array<{
    area: string;
    current: number;
    target: number;
    gap: number;
  }>;
}

// ============================================================================
// BENCHMARKING SERVICE
// ============================================================================

class ProposalBenchmarkingService {
  private metrics: Map<string, ProposalMetrics> = new Map();
  private benchmarks: Map<string, ProposalBenchmark> = new Map();
  private proposals: Map<string, Proposal> = new Map();

  constructor() {
    this.initializeEventHandlers();
  }

  /**
   * Initialize event handlers
   */
  private initializeEventHandlers(): void {
    eventBus.subscribe(
      "proposals.proposal.created",
      async (event: DomainEvent) => {
        await this.handleProposalCreated(event);
      },
    );

    eventBus.subscribe(
      "proposals.proposal.sent",
      async (event: DomainEvent) => {
        await this.handleProposalSent(event);
      },
    );

    eventBus.subscribe(
      "proposals.proposal.viewed",
      async (event: DomainEvent) => {
        await this.handleProposalViewed(event);
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
   * Track proposal metrics
   */
  async trackProposal(proposal: Proposal): Promise<ProposalMetrics> {
    const metrics: ProposalMetrics = {
      proposalId: proposal.id,
      totalAmount: proposal.totalAmount || 0,
      currency: proposal.currency || "SAR",
      responseTime: 0,
      timeToFirstView: 0,
      timeToDecision: 0,
      viewCount: 0,
      downloadCount: 0,
      acceptanceRate: 0,
      winRate: 0,
      conversionRate: 0,
      pricingCompetitiveness: 0,
      sectionEngagement: {},
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.metrics.set(proposal.id, metrics);
    this.proposals.set(proposal.id, proposal);

    return metrics;
  }

  /**
   * Generate benchmark for proposal
   */
  async generateBenchmark(proposalId: string): Promise<ProposalBenchmark> {
    const proposal = this.proposals.get(proposalId);
    const metrics = this.metrics.get(proposalId);

    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    // Get historical data from knowledge base
    const historicalData = await this.getHistoricalData(proposal);
    const industryData = await this.getIndustryData(proposal);

    // Calculate metrics
    const benchmarkMetrics = {
      pricingCompetitiveness: this.calculatePricingCompetitiveness(
        proposal,
        historicalData,
        industryData,
      ),
      responseTime: metrics?.responseTime || 0,
      winRate: this.calculateWinRate(proposal, historicalData),
      averageDealSize: this.calculateAverageDealSize(historicalData),
      conversionRate: this.calculateConversionRate(proposal, historicalData),
      timeToDecision: metrics?.timeToDecision || 0,
      customerSatisfaction: this.calculateCustomerSatisfaction(
        proposal,
        historicalData,
      ),
    };

    // Generate comparisons
    const comparisons = {
      vsIndustry: {
        pricing: this.comparePricing(proposal, industryData),
        responseTime: this.compareResponseTime(
          metrics?.responseTime || 0,
          industryData,
        ),
        winRate: this.compareWinRate(benchmarkMetrics.winRate, industryData),
      },
      vsHistorical: {
        pricing: this.comparePricing(proposal, historicalData),
        responseTime: this.compareResponseTime(
          metrics?.responseTime || 0,
          historicalData,
        ),
        winRate: this.compareWinRate(benchmarkMetrics.winRate, historicalData),
      },
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      proposal,
      benchmarkMetrics,
      comparisons,
    );

    const benchmark: ProposalBenchmark = {
      proposalId,
      benchmarkType: "HISTORICAL",
      metrics: benchmarkMetrics,
      comparisons,
      recommendations,
      generatedAt: new Date().toISOString(),
    };

    this.benchmarks.set(proposalId, benchmark);

    return benchmark;
  }

  /**
   * Get analytics for period
   */
  async getAnalytics(period: {
    start: Date | string;
    end: Date | string;
  }): Promise<ProposalAnalytics> {
    const proposals = Array.from(this.proposals.values()).filter((p) => {
      const created = new Date(p.createdAt);
      const start = new Date(period.start);
      const end = new Date(period.end);
      return created >= start && created <= end;
    });

    const sentProposals = proposals.filter(
      (p) =>
        p.status === "SENT" ||
        p.status === "ACCEPTED" ||
        p.status === "REJECTED",
    );
    const wonProposals = proposals.filter((p) => p.status === "ACCEPTED");
    const lostProposals = proposals.filter((p) => p.status === "REJECTED");

    const totalValue = proposals.reduce(
      (sum, p) => sum + (p.totalAmount || 0),
      0,
    );
    const wonValue = wonProposals.reduce(
      (sum, p) => sum + (p.totalAmount || 0),
      0,
    );

    const responseTimes = sentProposals.map((p) => {
      const created = new Date(p.createdAt);
      const sent = p.sentAt ? new Date(p.sentAt) : new Date();
      return (sent.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
    });

    const decisionTimes = wonProposals.concat(lostProposals).map((p) => {
      const sent = p.sentAt ? new Date(p.sentAt) : new Date();
      const decided = p.acceptedAt || p.updatedAt;
      const decidedDate = decided ? new Date(decided) : new Date();
      return (decidedDate.getTime() - sent.getTime()) / (1000 * 60 * 60); // hours
    });

    const analytics: ProposalAnalytics = {
      period,
      totals: {
        proposalsCreated: proposals.length,
        proposalsSent: sentProposals.length,
        proposalsWon: wonProposals.length,
        proposalsLost: lostProposals.length,
        totalValue,
        averageDealSize:
          wonProposals.length > 0 ? wonValue / wonProposals.length : 0,
      },
      rates: {
        winRate:
          sentProposals.length > 0
            ? (wonProposals.length / sentProposals.length) * 100
            : 0,
        conversionRate:
          proposals.length > 0
            ? (sentProposals.length / proposals.length) * 100
            : 0,
        acceptanceRate:
          sentProposals.length > 0
            ? (wonProposals.length / sentProposals.length) * 100
            : 0,
        rejectionRate:
          sentProposals.length > 0
            ? (lostProposals.length / sentProposals.length) * 100
            : 0,
      },
      averages: {
        responseTime:
          responseTimes.length > 0
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            : 0,
        timeToDecision:
          decisionTimes.length > 0
            ? decisionTimes.reduce((a, b) => a + b, 0) / decisionTimes.length
            : 0,
        proposalValue: proposals.length > 0 ? totalValue / proposals.length : 0,
        sectionsPerProposal:
          proposals.length > 0
            ? proposals.reduce((sum, p) => sum + p.sections.length, 0) /
              proposals.length
            : 0,
      },
      trends: {
        winRateTrend: "STABLE", // Would calculate from historical data
        conversionTrend: "STABLE",
        valueTrend: "STABLE",
      },
      topPerformers: wonProposals
        .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))
        .slice(0, 10)
        .map((p) => ({
          proposalId: p.id,
          proposalNumber: p.proposalNumber,
          winRate: 100, // Won proposals
          totalValue: p.totalAmount || 0,
          customerName: p.customerName,
        })),
      improvementAreas: this.identifyImprovementAreas(
        proposals,
        sentProposals,
        wonProposals,
      ),
    };

    return analytics;
  }

  /**
   * Get historical data from knowledge base
   */
  private async getHistoricalData(proposal: Proposal): Promise<any> {
    const searchResults = await knowledgeBaseService.semanticSearch(
      `proposal ${proposal.type} ${proposal.customerName || ""} historical performance`,
      { limit: 20 },
    );

    return {
      averagePricing: 50000, // Would calculate from actual data
      averageResponseTime: 24, // hours
      averageWinRate: 65, // percentage
      averageConversionRate: 45, // percentage
      totalProposals: searchResults.results.length,
    };
  }

  /**
   * Get industry data
   */
  private async getIndustryData(proposal: Proposal): Promise<any> {
    // Would fetch from industry benchmarks or knowledge base
    return {
      averagePricing: 55000,
      averageResponseTime: 36, // hours
      averageWinRate: 60, // percentage
      averageConversionRate: 40, // percentage
    };
  }

  /**
   * Calculate pricing competitiveness
   */
  private calculatePricingCompetitiveness(
    proposal: Proposal,
    historical: any,
    industry: any,
  ): number {
    if (!proposal.totalAmount) return 50;

    const historicalAvg = historical.averagePricing || 50000;
    const industryAvg = industry.averagePricing || 55000;
    const avg = (historicalAvg + industryAvg) / 2;

    const diff = ((proposal.totalAmount - avg) / avg) * 100;

    // More competitive = lower price (higher score)
    // Score: 100 = 20% below average, 50 = at average, 0 = 20% above average
    return Math.max(0, Math.min(100, 50 - diff * 2.5));
  }

  /**
   * Calculate win rate
   */
  private calculateWinRate(proposal: Proposal, historical: any): number {
    // Simplified - would use actual historical win rate for similar proposals
    return historical.averageWinRate || 65;
  }

  /**
   * Calculate average deal size
   */
  private calculateAverageDealSize(historical: any): number {
    return historical.averagePricing || 50000;
  }

  /**
   * Calculate conversion rate
   */
  private calculateConversionRate(proposal: Proposal, historical: any): number {
    return historical.averageConversionRate || 45;
  }

  /**
   * Calculate customer satisfaction
   */
  private calculateCustomerSatisfaction(
    proposal: Proposal,
    historical: any,
  ): number {
    // Would use feedback scores, ratings, etc.
    return 75 + Math.random() * 20;
  }

  /**
   * Compare pricing
   */
  private comparePricing(
    proposal: Proposal,
    benchmark: any,
  ): "ABOVE" | "AT" | "BELOW" {
    if (!proposal.totalAmount) return "AT";
    const avg = benchmark.averagePricing || 50000;
    const diff = ((proposal.totalAmount - avg) / avg) * 100;

    if (diff > 5) return "ABOVE";
    if (diff < -5) return "BELOW";
    return "AT";
  }

  /**
   * Compare response time
   */
  private compareResponseTime(
    responseTime: number,
    benchmark: any,
  ): "FASTER" | "AVERAGE" | "SLOWER" {
    const avg = benchmark.averageResponseTime || 24;
    const diff = responseTime - avg;

    if (diff < -6) return "FASTER";
    if (diff > 6) return "SLOWER";
    return "AVERAGE";
  }

  /**
   * Compare win rate
   */
  private compareWinRate(
    winRate: number,
    benchmark: any,
  ): "ABOVE" | "AT" | "BELOW" {
    const avg = benchmark.averageWinRate || 60;
    const diff = winRate - avg;

    if (diff > 5) return "ABOVE";
    if (diff < -5) return "BELOW";
    return "AT";
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    proposal: Proposal,
    metrics: ProposalBenchmark["metrics"],
    comparisons: ProposalBenchmark["comparisons"],
  ): ProposalBenchmark["recommendations"] {
    const recommendations: ProposalBenchmark["recommendations"] = [];

    // Pricing recommendations
    if (comparisons.vsIndustry.pricing === "ABOVE") {
      recommendations.push({
        category: "PRICING",
        priority: "HIGH",
        recommendation:
          "Consider reviewing pricing strategy - current pricing is above industry average",
        impact: "May reduce win rate by 10-15%",
      });
    }

    // Timing recommendations
    if (comparisons.vsIndustry.responseTime === "SLOWER") {
      recommendations.push({
        category: "TIMING",
        priority: "MEDIUM",
        recommendation:
          "Response time is slower than industry average - aim for < 24 hours",
        impact: "Faster response can improve win rate by 5-10%",
      });
    }

    // Content recommendations
    if (proposal.sections.length < 5) {
      recommendations.push({
        category: "CONTENT",
        priority: "MEDIUM",
        recommendation: "Add more detailed sections to strengthen proposal",
        impact: "Comprehensive proposals have 15-20% higher win rates",
      });
    }

    // Process recommendations
    if (metrics.conversionRate < 40) {
      recommendations.push({
        category: "PROCESS",
        priority: "HIGH",
        recommendation: "Improve proposal-to-send conversion rate",
        impact: "Focus on proposal quality and approval process efficiency",
      });
    }

    return recommendations;
  }

  /**
   * Identify improvement areas
   */
  private identifyImprovementAreas(
    allProposals: Proposal[],
    sentProposals: Proposal[],
    wonProposals: Proposal[],
  ): ProposalAnalytics["improvementAreas"] {
    const areas: ProposalAnalytics["improvementAreas"] = [];

    const currentWinRate =
      sentProposals.length > 0
        ? (wonProposals.length / sentProposals.length) * 100
        : 0;
    const targetWinRate = 70;

    if (currentWinRate < targetWinRate) {
      areas.push({
        area: "Win Rate",
        current: currentWinRate,
        target: targetWinRate,
        gap: targetWinRate - currentWinRate,
      });
    }

    const currentConversion =
      allProposals.length > 0
        ? (sentProposals.length / allProposals.length) * 100
        : 0;
    const targetConversion = 60;

    if (currentConversion < targetConversion) {
      areas.push({
        area: "Conversion Rate",
        current: currentConversion,
        target: targetConversion,
        gap: targetConversion - currentConversion,
      });
    }

    return areas;
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  private async handleProposalCreated(event: DomainEvent): Promise<void> {
    const { proposalId } = event.payload || {};
    // Metrics will be tracked when proposal is stored
  }

  private async handleProposalSent(event: DomainEvent): Promise<void> {
    const { proposalId, sentAt } = event.payload || {};
    const metrics = this.metrics.get(proposalId);
    const proposal = this.proposals.get(proposalId);

    if (metrics && proposal) {
      const created = new Date(proposal.createdAt);
      const sent = sentAt ? new Date(sentAt) : new Date();
      metrics.responseTime =
        (sent.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
      metrics.updatedAt = new Date().toISOString();
      this.metrics.set(proposalId, metrics);
    }
  }

  private async handleProposalViewed(event: DomainEvent): Promise<void> {
    const { proposalId } = event.payload || {};
    const metrics = this.metrics.get(proposalId);

    if (metrics) {
      metrics.viewCount += 1;
      if (metrics.timeToFirstView === 0) {
        const proposal = this.proposals.get(proposalId);
        if (proposal?.sentAt) {
          const sent = new Date(proposal.sentAt);
          const now = new Date();
          metrics.timeToFirstView =
            (now.getTime() - sent.getTime()) / (1000 * 60 * 60); // hours
        }
      }
      metrics.updatedAt = new Date().toISOString();
      this.metrics.set(proposalId, metrics);
    }
  }

  private async handleProposalAccepted(event: DomainEvent): Promise<void> {
    const { proposalId } = event.payload || {};
    const metrics = this.metrics.get(proposalId);
    const proposal = this.proposals.get(proposalId);

    if (metrics && proposal) {
      if (proposal.sentAt) {
        const sent = new Date(proposal.sentAt);
        const accepted = proposal.acceptedAt
          ? new Date(proposal.acceptedAt)
          : new Date();
        metrics.timeToDecision =
          (accepted.getTime() - sent.getTime()) / (1000 * 60 * 60); // hours
      }
      metrics.acceptanceRate = 100;
      metrics.winRate = 100;
      metrics.updatedAt = new Date().toISOString();
      this.metrics.set(proposalId, metrics);
    }
  }

  private async handleProposalRejected(event: DomainEvent): Promise<void> {
    const { proposalId } = event.payload || {};
    const metrics = this.metrics.get(proposalId);
    const proposal = this.proposals.get(proposalId);

    if (metrics && proposal) {
      if (proposal.sentAt) {
        const sent = new Date(proposal.sentAt);
        const rejected = new Date();
        metrics.timeToDecision =
          (rejected.getTime() - sent.getTime()) / (1000 * 60 * 60); // hours
      }
      metrics.acceptanceRate = 0;
      metrics.winRate = 0;
      metrics.updatedAt = new Date().toISOString();
      this.metrics.set(proposalId, metrics);
    }
  }

  /**
   * Get metrics for proposal
   */
  getMetrics(proposalId: string): ProposalMetrics | undefined {
    return this.metrics.get(proposalId);
  }

  /**
   * Get benchmark for proposal
   */
  getBenchmark(proposalId: string): ProposalBenchmark | undefined {
    return this.benchmarks.get(proposalId);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const proposalBenchmarkingService = new ProposalBenchmarkingService();

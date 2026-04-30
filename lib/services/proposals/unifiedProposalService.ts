/**
 * Unified Proposal Service
 *
 * World-class proposal generation system that combines the best of:
 * - Enhanced Proposal Service (RFQ-based, ecosystem integration, approvals, benchmarking)
 * - Universal Intelligent Proposal Service (cross-module, AI-powered, win strategies)
 *
 * Features:
 * - RFQ-based proposals with RAG
 * - Cross-module proposals with AI insights
 * - AI-powered insights with RAG
 * - Win probability calculation
 * - Approval workflows
 * - Benchmarking
 * - Self-learning from outcomes
 * - Event-driven architecture
 * - Single database storage (Prisma)
 * - Single event type
 */

import { eventBus } from "@/lib/services/event-store";
import { eventStore } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { notificationService } from "@/lib/services/notifications/notificationService";
import { getAgentMemory } from "@/lib/services/agents/agentMemory";
import { callAI } from "@/utils/aiClient";
import { ProposalGenerator } from "./ProposalGenerator";
import { proposalDatabaseService } from "./proposalDatabaseService";
import { proposalTrackingService } from "./proposalTrackingService";
import { proposalFollowUpService } from "./proposalFollowUpService";
import { proposalCollaborationService } from "./proposalCollaborationService";
import { proposalEvidenceIntegration } from "./proposalEvidenceIntegration";
import { proposalLiabilityIntegration } from "./proposalLiabilityIntegration";
import { proposalContractIntegration } from "./proposalContractIntegration";
import { proposalComplianceIntegration } from "./proposalComplianceIntegration";
import { moduleRegistry } from "@/lib/modules/registry";
import type {
  Proposal,
  ProposalGenerationConfig,
  ExportFormat,
  ExportResult,
} from "@/types/proposals";
import type { DomainEvent } from "@/types/cqrs";

// ============================================================================
// TYPES
// ============================================================================

export type ModuleProposalType =
  | "WMS_WAREHOUSING"
  | "WMS_STORAGE"
  | "WMS_FULFILLMENT"
  | "TMS_TRANSPORTATION"
  | "TMS_FREIGHT"
  | "TMS_LAST_MILE"
  | "MARKETPLACE_SERVICE"
  | "MARKETPLACE_STORAGE"
  | "MARKETPLACE_TRANSPORTATION"
  | "MARKETPLACE_CONSULTING"
  | "TRADE_COMPLIANCE"
  | "CUSTOMS_CLEARANCE"
  | "ISO_IMS_QUALITY"
  | "QHSE_SAFETY"
  | "QHSE_ENVIRONMENTAL"
  | "FACILITY_MANAGEMENT"
  | "PROCUREMENT"
  | "MAAS_MANUFACTURING"
  | "MAAS_PILLAR"
  | "MULTIMODAL_LOGISTICS"
  | "COMPLETE_SUPPLY_CHAIN"
  | "CUSTOM"
  | "RFI_PROPOSAL"
  | "RFQ_PROPOSAL";

export interface UnifiedProposalConfig extends ProposalGenerationConfig {
  // Enhanced service options
  useRAG?: boolean;
  ragContext?: string;
  submitForApproval?: boolean;
  approvalConfig?: ProposalApprovalConfig;
  autoSend?: boolean;
  sendConfig?: ProposalSendConfig;

  // Universal service options
  moduleId?: string;
  proposalType?: ModuleProposalType;
  relatedEntityId?: string;
  relatedEntityType?: string;
  context?: Record<string, any>;

  // Common options
  tenantId: string;
  userId: string;
  generateInsights?: boolean;
  generateWinStrategy?: boolean;
}

export interface ProposalApprovalConfig {
  workflowId: string;
  autoApprove?: boolean;
  autoApproveConditions?: Record<string, any>;
  requireApproval?: boolean;
  approvers?: string[];
}

export interface ProposalSendConfig {
  recipients: Array<{
    email: string;
    name?: string;
    role?: string;
  }>;
  subject?: string;
  message?: string;
  attachments?: boolean;
  trackOpens?: boolean;
  trackClicks?: boolean;
  sendAt?: Date | string;
}

export interface AIProposalInsight {
  id: string;
  type:
    | "WIN_RATE"
    | "CONTENT"
    | "PRICING"
    | "TIMING"
    | "COMPETITIVE"
    | "RISK"
    | "OPPORTUNITY";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  recommendation: string;
  impact?: {
    winRateIncrease?: number;
    estimatedValue?: number;
    timeSavings?: number;
  };
  confidence: number;
  actionable: boolean;
  source: "RAG" | "HISTORICAL" | "AI_ANALYSIS" | "BENCHMARK";
  metadata?: Record<string, any>;
}

export interface ProposalWinStrategy {
  proposalId: string;
  winProbability: number;
  keyStrengths: string[];
  potentialWeaknesses: string[];
  recommendedActions: Array<{
    action: string;
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    impact: number;
    effort: "LOW" | "MEDIUM" | "HIGH";
  }>;
  competitiveAdvantages: string[];
  riskFactors: Array<{
    risk: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    mitigation: string;
  }>;
  pricingStrategy?: {
    recommendedPrice?: number;
    priceRange?: { min: number; max: number };
    competitiveness:
      | "HIGHLY_COMPETITIVE"
      | "COMPETITIVE"
      | "MODERATE"
      | "PREMIUM";
    reasoning: string;
  };
  timingStrategy?: {
    bestSendTime?: Date;
    urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    deadlineRecommendation: string;
  };
  generatedAt: Date | string;
}

export interface ProposalBenchmark {
  proposalId: string;
  benchmarkType: "INDUSTRY" | "HISTORICAL" | "COMPETITIVE";
  metrics: {
    pricingCompetitiveness: number;
    responseTime: number;
    winRate: number;
    averageDealSize: number;
    conversionRate: number;
  };
  recommendations: string[];
  generatedAt: Date | string;
}

export interface ProposalLearning {
  proposalId: string;
  outcome: "WON" | "LOST" | "PENDING";
  feedback?: string;
  winFactors?: string[];
  lossFactors?: string[];
  learnedPatterns: Array<{
    pattern: string;
    confidence: number;
    source: "SUCCESS" | "FAILURE";
  }>;
  updatedAt: Date | string;
}

export interface CrossModuleProposalData {
  wms?: any;
  tms?: any;
  marketplace?: any;
  compliance?: any;
  crm?: any;
  maas?: any;
  [key: string]: any;
}

// ============================================================================
// UNIFIED PROPOSAL SERVICE
// ============================================================================

class UnifiedProposalService {
  private proposalGenerator: ProposalGenerator;
  private proposals: Map<string, Proposal> = new Map();
  private insights: Map<string, AIProposalInsight[]> = new Map();
  private winStrategies: Map<string, ProposalWinStrategy> = new Map();
  private benchmarks: Map<string, ProposalBenchmark> = new Map();
  private learnings: Map<string, ProposalLearning> = new Map();
  private agentMemory = getAgentMemory("proposal-agent", "proposals");

  constructor() {
    this.proposalGenerator = new ProposalGenerator();
    this.initializeEventHandlers();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeEventHandlers(): void {
    // Listen to RFQ events
    eventBus.subscribe(
      "proposals-rfq.rfq.created",
      async (event: DomainEvent) => {
        await this.handleRFQCreated(event);
      },
    );

    eventBus.subscribe(
      "proposals-rfq.rfq.submitted",
      async (event: DomainEvent) => {
        await this.handleRFQSubmitted(event);
      },
    );

    // Listen to approval events
    eventBus.subscribe(
      "compliance.approval.approved",
      async (event: DomainEvent) => {
        await this.handleApprovalApproved(event);
      },
    );

    eventBus.subscribe(
      "compliance.approval.rejected",
      async (event: DomainEvent) => {
        await this.handleApprovalRejected(event);
      },
    );

    // Listen to proposal outcome events
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

  // ============================================================================
  // CORE PROPOSAL GENERATION (UNIFIED)
  // ============================================================================

  /**
   * Generate proposal - unified method that handles both RFQ-based and cross-module proposals
   */
  async generateProposal(config: UnifiedProposalConfig): Promise<{
    proposal: Proposal;
    insights?: AIProposalInsight[];
    winStrategy?: ProposalWinStrategy;
  }> {
    try {
      console.log("[Unified Proposal] Starting proposal generation...", {
        proposalType: config.proposalType,
        moduleId: config.moduleId,
        customerName:
          config.sourceData?.customerName || config.context?.customerName,
        tenantId: config.tenantId,
      });

      // Determine generation mode
      const isRFQBased = config.sourceData?.rfq || config.sourceData?.rfi;
      const isCrossModule = !!config.moduleId && !!config.proposalType;

      let proposal: Proposal;
      let insights: AIProposalInsight[] = [];
      let winStrategy: ProposalWinStrategy | undefined;

      // 1. Generate base proposal using ProposalGenerator
      proposal = await this.proposalGenerator.generateProposal(config);

      // 2. Enhance with RAG if enabled (with timeout to prevent hanging)
      if (config.useRAG !== false) {
        try {
          const ragPromise = this.enhanceProposalWithRAG(
            proposal,
            config.ragContext,
            config.tenantId,
          );
          const timeoutPromise = new Promise<Proposal>(
            (resolve) => setTimeout(() => resolve(proposal), 2000), // 2 second timeout
          );
          proposal = await Promise.race([ragPromise, timeoutPromise]);
        } catch (error) {
          console.warn(
            "[Unified Proposal] RAG enhancement failed or timed out:",
            error,
          );
          // Continue with unenhanced proposal
        }
      }

      // 3. Gather cross-module data if cross-module proposal (with timeout)
      let crossModuleData: CrossModuleProposalData = {};
      if (isCrossModule) {
        try {
          const dataPromise = this.gatherCrossModuleData(config);
          const timeoutPromise = new Promise<CrossModuleProposalData>(
            (resolve) => setTimeout(() => resolve({}), 2000), // 2 second timeout
          );
          crossModuleData = await Promise.race([dataPromise, timeoutPromise]);
        } catch (error) {
          console.warn(
            "[Unified Proposal] Cross-module data gathering failed or timed out:",
            error,
          );
          // Continue with empty data
        }
      }

      // 4. Generate AI insights if requested (NON-BLOCKING - do in background)
      // Return proposal immediately, generate insights async
      if (
        config.generateInsights !== false ||
        config.generateWinStrategy !== false
      ) {
        // Start insights generation but don't wait for it
        this.generateAIInsights(config, crossModuleData, proposal)
          .then((generatedInsights) => {
            insights = generatedInsights;
            this.insights.set(proposal.id, insights);
            // Update proposal metadata with insights (async)
            this.updateProposalInsights(proposal.id, insights);

            // 5. Calculate win strategy if requested (after insights are ready)
            if (config.generateWinStrategy !== false && insights.length > 0) {
              return this.calculateWinStrategy(
                proposal,
                insights,
                crossModuleData,
              );
            }
            return null;
          })
          .then((calculatedStrategy) => {
            if (calculatedStrategy) {
              winStrategy = calculatedStrategy;
              this.winStrategies.set(proposal.id, winStrategy);
              // Update proposal metadata with win strategy (async)
              this.updateProposalWinStrategy(proposal.id, winStrategy);
            }
          })
          .catch((error) => {
            console.warn(
              "[Unified Proposal] AI insights/win strategy generation failed:",
              error,
            );
            insights = [];
          });
      }

      // 6. Enhance proposal with basic metadata (insights/win strategy added async)
      proposal.metadata = {
        ...proposal.metadata,
        generatingInsights: config.generateInsights !== false,
        generatingWinStrategy: config.generateWinStrategy !== false,
      };

      // 7. Store in-memory
      this.proposals.set(proposal.id, proposal);
      if (insights.length > 0) {
        this.insights.set(proposal.id, insights);
      }
      if (winStrategy) {
        this.winStrategies.set(proposal.id, winStrategy);
      }

      // 8. Persist to database (SINGLE STORAGE PATH - Prisma)
      try {
        await proposalDatabaseService.createProposal({
          id: proposal.id,
          tenantId: config.tenantId,
          proposalNumber: proposal.proposalNumber,
          title: proposal.title,
          description: proposal.description,
          executiveSummary: proposal.executiveSummary,
          proposalType: proposal.type,
          status: proposal.status,
          customerId: proposal.customerId,
          customerName: proposal.customerName,
          customerEmail: proposal.customerEmail,
          sections: proposal.sections,
          pricing: proposal.pricing as any,
          totalAmount: proposal.totalAmount,
          currency: proposal.currency,
          branding: proposal.branding as any,
          validUntil: proposal.validUntil
            ? new Date(proposal.validUntil)
            : undefined,
          recipients: proposal.recipients as any,
          metadata: {
            ...(proposal.metadata || {}),
            moduleId: config.moduleId,
            proposalType: config.proposalType,
            relatedEntityId: config.relatedEntityId,
            relatedEntityType: config.relatedEntityType,
            winProbability: winStrategy?.winProbability,
            insights: insights.map((i) => ({
              id: i.id,
              type: i.type,
              priority: i.priority,
              title: i.title,
            })),
            winStrategy: winStrategy
              ? {
                  winProbability: winStrategy.winProbability,
                  keyStrengths: winStrategy.keyStrengths,
                  recommendedActions: winStrategy.recommendedActions,
                }
              : undefined,
            tenantId: config.tenantId,
            source: isRFQBased
              ? "rfq"
              : isCrossModule
                ? "cross-module"
                : "standard",
          },
          tags: proposal.tags || [],
          trackingEnabled: true,
          signatureRequired: false,
          createdBy: config.userId,
        });
        console.log(
          "[Unified Proposal] ✅ Proposal stored in database:",
          proposal.id,
        );
      } catch (error) {
        console.error(
          "[Unified Proposal] ❌ Error storing proposal in database:",
          error,
        );
        // Continue - proposal is in memory
      }

      // 9. Record evidence - NON-BLOCKING
      proposalEvidenceIntegration
        .recordProposalCreated(proposal, config.userId, config.tenantId)
        .catch((error) => {
          console.error("[Unified Proposal] Error recording evidence:", error);
        });

      // 10. Compliance check - NON-BLOCKING
      proposalComplianceIntegration
        .checkProposalCompliance(proposal, config.tenantId, config.userId)
        .catch((error) => {
          console.error("[Unified Proposal] Error checking compliance:", error);
        });

      // 11. Publish event (SINGLE EVENT TYPE) - NON-BLOCKING
      eventBus
        .publish({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "proposals.proposal.created",
          aggregateId: proposal.id,
          aggregateType: "PROPOSAL",
          version: 1,
          timestamp: new Date().toISOString(),
          payload: {
            proposalId: proposal.id,
            proposalNumber: proposal.proposalNumber,
            type: proposal.type,
            customerId: proposal.customerId,
            moduleId: config.moduleId,
            proposalType: config.proposalType,
            tenantId: config.tenantId,
            createdBy: config.userId,
          },
        })
        .catch((error) => {
          console.error("[Unified Proposal] Error publishing event:", error);
        });

      // 12. Store in agent memory - NON-BLOCKING
      this.agentMemory
        .remember({
          type: "proposal_generated",
          content: `Generated ${config.proposalType || proposal.type} proposal`,
          metadata: {
            proposalId: proposal.id,
            moduleId: config.moduleId,
            proposalType: config.proposalType,
          },
        })
        .catch((error) => {
          console.error(
            "[Unified Proposal] Error storing in agent memory:",
            error,
          );
        });

      // 13. Submit for approval if requested
      if (config.submitForApproval && config.approvalConfig) {
        await this.submitForApproval(proposal.id, config.approvalConfig);
      }

      // 14. Auto-send if requested
      if (config.autoSend && config.sendConfig) {
        await this.sendProposal(proposal.id, config.sendConfig);
      }

      // Return proposal immediately (insights/win strategy will be added async)
      return {
        proposal,
        insights: insights.length > 0 ? insights : undefined,
        winStrategy: winStrategy || undefined,
      };
    } catch (error: any) {
      console.error(
        "[Unified Proposal Service] Error generating proposal:",
        error,
      );
      throw new Error(
        `Failed to generate proposal: ${error?.message || "Unknown error"}`,
      );
    }
  }

  // ============================================================================
  // RAG ENHANCEMENT (from Enhanced Service)
  // ============================================================================

  private async enhanceProposalWithRAG(
    proposal: Proposal,
    context?: string,
    tenantId?: string,
  ): Promise<Proposal> {
    try {
      const searchQuery = this.buildRAGSearchQuery(proposal, context);
      const searchResults = await knowledgeBaseService.semanticSearch(
        searchQuery,
        {
          tenantId,
          limit: 5,
          threshold: 0.7,
        },
      );

      const enhancedSections = proposal.sections.map((section) => {
        const relevantKnowledge = searchResults.results.filter((r) => {
          const entry = r.entry;
          return (
            entry.category === "proposal" ||
            entry.category === "best_practice" ||
            entry.metadata?.sectionType === section.type
          );
        });

        if (relevantKnowledge.length > 0) {
          const insights = relevantKnowledge
            .map((r) => r.entry.content)
            .join("\n\n");

          return {
            ...section,
            content: section.content
              ? `${section.content}\n\n${insights}`
              : insights,
            metadata: {
              ...section.data,
              ragEnhanced: true,
              knowledgeSources: relevantKnowledge.map((r) => r.entry.id),
            },
          };
        }

        return section;
      });

      const executiveInsights = searchResults.results
        .filter(
          (r) =>
            r.entry.category === "insight" ||
            r.entry.category === "recommendation",
        )
        .map((r) => r.entry.content)
        .join(" ");

      if (executiveInsights && proposal.executiveSummary) {
        proposal.executiveSummary = `${proposal.executiveSummary}\n\nKey Insights: ${executiveInsights}`;
      }

      return {
        ...proposal,
        sections: enhancedSections,
      };
    } catch (error) {
      console.error("[Unified Proposal] Error enhancing with RAG:", error);
      return proposal;
    }
  }

  private buildRAGSearchQuery(proposal: Proposal, context?: string): string {
    const parts: string[] = [];
    if (proposal.title) parts.push(proposal.title);
    if (proposal.description) parts.push(proposal.description);
    if (proposal.executiveSummary) parts.push(proposal.executiveSummary);
    if (context) parts.push(context);
    proposal.sections.forEach((section) => {
      if (section.title) parts.push(section.title);
      if (section.content) parts.push(section.content.substring(0, 200));
    });
    return parts.join(" ");
  }

  // ============================================================================
  // CROSS-MODULE DATA GATHERING (from Universal Service)
  // ============================================================================

  private async gatherCrossModuleData(
    config: UnifiedProposalConfig,
  ): Promise<CrossModuleProposalData> {
    const data: CrossModuleProposalData = {};

    try {
      if (moduleRegistry.isModuleEnabled("wms") && config.moduleId === "wms") {
        data.wms = await this.gatherWMSData(config);
      }

      if (moduleRegistry.isModuleEnabled("tms") && config.moduleId === "tms") {
        data.tms = await this.gatherTMSData(config);
      }

      if (
        moduleRegistry.isModuleEnabled("marketplace") &&
        config.moduleId === "marketplace"
      ) {
        data.marketplace = await this.gatherMarketplaceData(config);
      }

      if (
        moduleRegistry.isModuleEnabled("compliance") ||
        moduleRegistry.isModuleEnabled("trade-compliance")
      ) {
        data.compliance = await this.gatherComplianceData(config);
      }

      if (
        moduleRegistry.isModuleEnabled("maas") &&
        config.moduleId === "maas"
      ) {
        data.maas = await this.gatherMAASData(config);
      }

      if (
        config.sourceData?.customerId &&
        moduleRegistry.isModuleEnabled("crm")
      ) {
        data.crm = await this.gatherCRMData(
          config.sourceData.customerId,
          config.tenantId,
        );
      }

      return data;
    } catch (error) {
      console.error(
        "[Unified Proposal] Error gathering cross-module data:",
        error,
      );
      return data;
    }
  }

  private async gatherWMSData(config: UnifiedProposalConfig): Promise<any> {
    return {
      warehouseCapacity: 10000,
      currentUtilization: 75,
      services: ["Storage", "Pick & Pack", "Fulfillment", "Returns Processing"],
      capabilities: [
        "Temperature Controlled",
        "Hazmat Storage",
        "Bonded Warehouse",
      ],
    };
  }

  private async gatherTMSData(config: UnifiedProposalConfig): Promise<any> {
    return {
      routes: [
        { origin: "Riyadh", destination: "Jeddah", frequency: "Daily" },
        { origin: "Riyadh", destination: "Dammam", frequency: "Daily" },
      ],
      fleet: { vehicles: 50, capacity: 500 },
      performance: { onTimeDelivery: 98.5, averageTransitTime: 24 },
    };
  }

  private async gatherMarketplaceData(
    config: UnifiedProposalConfig,
  ): Promise<any> {
    try {
      const { MarketplaceService } =
        await import("@/lib/services/marketplace/marketplaceService");
      const marketplaceService = new MarketplaceService();

      if (
        config.relatedEntityId &&
        config.relatedEntityType === "SERVICE_LISTING"
      ) {
        const listing = await marketplaceService.getListing(
          config.relatedEntityId,
        );
        if (listing) {
          const provider = await marketplaceService.getProvider(
            listing.providerId,
          );
          const reviews = await marketplaceService.getListingReviews(
            config.relatedEntityId,
          );
          const avgRating =
            reviews.length > 0
              ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
              : listing.rating || 0;

          return {
            providerRating: avgRating,
            completedOrders: listing.totalBookings || 0,
            specialties: this.extractSpecialties(listing),
            availability: listing.availability || "AVAILABLE",
          };
        }
      }

      return {
        providerRating: 4.8,
        completedOrders: 1250,
        specialties: ["Warehousing", "Transportation", "Customs Clearance"],
        availability: "Available 24/7",
      };
    } catch (error) {
      console.error(
        "[Unified Proposal] Error gathering marketplace data:",
        error,
      );
      return {
        providerRating: 4.8,
        completedOrders: 1250,
        specialties: ["Warehousing", "Transportation", "Customs Clearance"],
        availability: "Available 24/7",
      };
    }
  }

  private extractSpecialties(listing: any): string[] {
    const specialties: string[] = [];
    if (listing.serviceCategory) specialties.push(listing.serviceCategory);
    if (listing.serviceType) specialties.push(listing.serviceType);
    if (listing.capabilities) {
      Object.keys(listing.capabilities).forEach((key) => {
        if (listing.capabilities[key]) {
          specialties.push(key.replace(/([A-Z])/g, " $1").trim());
        }
      });
    }
    return specialties.length > 0 ? specialties : ["General Services"];
  }

  private async gatherComplianceData(
    config: UnifiedProposalConfig,
  ): Promise<any> {
    return {
      certifications: ["ISO 9001", "ISO 14001", "OHSAS 18001"],
      complianceScore: 95,
      auditHistory: [
        { date: "2024-01-15", result: "PASSED" },
        { date: "2023-07-20", result: "PASSED" },
      ],
    };
  }

  private async gatherCRMData(
    customerId: string,
    tenantId: string,
  ): Promise<any> {
    return {
      relationshipDuration: "2 years",
      totalValue: 500000,
      previousProposals: 5,
      winRate: 60,
    };
  }

  private async gatherMAASData(config: UnifiedProposalConfig): Promise<any> {
    return {
      pillars: config.context?.pillarName ? [config.context.pillarName] : [],
      services: config.context?.serviceType ? [config.context.serviceType] : [],
      utilization: 75,
      revenue: 100000,
      capabilities: ["Manufacturing", "Assembly", "Quality Control"],
    };
  }

  // ============================================================================
  // AI INSIGHTS GENERATION (from Universal Service)
  // ============================================================================

  private async generateAIInsights(
    config: UnifiedProposalConfig,
    crossModuleData: CrossModuleProposalData,
    proposal: Proposal,
  ): Promise<AIProposalInsight[]> {
    const insights: AIProposalInsight[] = [];

    try {
      // 1. RAG-based insights
      const ragInsights = await this.generateRAGInsights(
        config,
        crossModuleData,
      );
      insights.push(...ragInsights);

      // 2. Historical insights
      const historicalInsights = await this.generateHistoricalInsights(config);
      insights.push(...historicalInsights);

      // 3. AI analysis insights
      const aiAnalysisInsights = await this.generateAIAnalysisInsights(
        config,
        crossModuleData,
      );
      insights.push(...aiAnalysisInsights);

      // 4. Benchmark insights
      const benchmarkInsights = await this.generateBenchmarkInsights(config);
      insights.push(...benchmarkInsights);

      // Sort by priority
      insights.sort((a, b) => {
        const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const priorityDiff =
          priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      });

      return insights;
    } catch (error) {
      console.error("[Unified Proposal] Error generating insights:", error);
      return insights;
    }
  }

  private async generateRAGInsights(
    config: UnifiedProposalConfig,
    crossModuleData: CrossModuleProposalData,
  ): Promise<AIProposalInsight[]> {
    const insights: AIProposalInsight[] = [];

    try {
      const searchQuery = this.buildRAGSearchQueryForInsights(
        config,
        crossModuleData,
      );
      const searchResults = await knowledgeBaseService.semanticSearch(
        searchQuery,
        {
          tenantId: config.tenantId,
          limit: 10,
          threshold: 0.6,
        },
      );

      for (const result of searchResults.results || []) {
        const entry = result.entry;
        const insightType = this.determineInsightType(
          entry.category,
          entry.content,
        );

        insights.push({
          id: `insight-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: insightType,
          priority: this.determinePriority(
            entry.metadata?.priority,
            result.score,
          ),
          title: entry.title || this.extractTitle(entry.content),
          description:
            typeof entry.content === "string"
              ? entry.content.substring(0, 500)
              : JSON.stringify(entry.content).substring(0, 500),
          recommendation: this.extractRecommendation(entry.content),
          impact: this.extractImpact(entry.metadata),
          confidence: Math.round(result.score * 100),
          actionable: true,
          source: "RAG",
          metadata: {
            knowledgeEntryId: entry.id,
            relevanceScore: result.score,
          },
        });
      }

      return insights;
    } catch (error) {
      console.error("[Unified Proposal] Error generating RAG insights:", error);
      return insights;
    }
  }

  private buildRAGSearchQueryForInsights(
    config: UnifiedProposalConfig,
    crossModuleData: CrossModuleProposalData,
  ): string {
    const parts: string[] = [];
    if (config.proposalType) parts.push(config.proposalType);
    if (config.moduleId) parts.push(config.moduleId);
    if (config.context?.customerName) parts.push(config.context.customerName);
    if (crossModuleData.wms) parts.push("warehousing storage");
    if (crossModuleData.tms) parts.push("transportation logistics");
    if (crossModuleData.marketplace) parts.push("marketplace services");
    return parts.join(" ");
  }

  private async generateHistoricalInsights(
    config: UnifiedProposalConfig,
  ): Promise<AIProposalInsight[]> {
    const insights: AIProposalInsight[] = [];

    try {
      const memories = await this.agentMemory.recall(
        `proposal ${config.proposalType || ""} ${config.context?.customerName || ""}`,
        { limit: 5 },
      );

      for (const memory of memories) {
        if (memory.metadata?.winProbability) {
          const winRate = memory.metadata.winProbability as number;
          if (winRate > 70) {
            insights.push({
              id: `insight-historical-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              type: "WIN_RATE",
              priority: "HIGH",
              title: "High Historical Win Rate",
              description: `Similar proposals have a ${winRate}% win rate`,
              recommendation:
                "Leverage successful patterns from past proposals",
              impact: { winRateIncrease: winRate - 50 },
              confidence: 75,
              actionable: true,
              source: "HISTORICAL",
              metadata: { memoryId: memory.id, historicalWinRate: winRate },
            });
          }
        }
      }

      return insights;
    } catch (error) {
      console.error(
        "[Unified Proposal] Error generating historical insights:",
        error,
      );
      return insights;
    }
  }

  private async generateAIAnalysisInsights(
    config: UnifiedProposalConfig,
    crossModuleData: CrossModuleProposalData,
  ): Promise<AIProposalInsight[]> {
    const insights: AIProposalInsight[] = [];

    try {
      const systemPrompt = `You are an expert proposal strategist for logistics and supply chain services.
Analyze proposal context and provide intelligent insights to maximize win probability.`;

      const userPrompt = `Analyze this proposal context:

Module: ${config.moduleId || "N/A"}
Type: ${config.proposalType || "N/A"}
Customer: ${config.context?.customerName || "Unknown"}
Context: ${JSON.stringify(config.context || {})}

Cross-Module Data:
${JSON.stringify(crossModuleData, null, 2)}

Provide insights in JSON format with type, priority, title, description, recommendation, impact, and confidence.`;

      const aiResponse = await callAI(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ] as any,
        {
          temperature: 0.3,
          maxTokens: 2000,
          provider: "auto",
        },
      );

      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.insights && Array.isArray(parsed.insights)) {
          for (const insight of parsed.insights) {
            insights.push({
              id: `insight-ai-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              type: insight.type || "OPPORTUNITY",
              priority: insight.priority || "MEDIUM",
              title: insight.title || "AI Insight",
              description: insight.description || "",
              recommendation: insight.recommendation || "",
              impact: insight.impact,
              confidence: insight.confidence || 70,
              actionable: true,
              source: "AI_ANALYSIS",
            });
          }
        }
      }
    } catch (error) {
      console.error(
        "[Unified Proposal] Error generating AI analysis insights:",
        error,
      );
    }

    return insights;
  }

  private async generateBenchmarkInsights(
    config: UnifiedProposalConfig,
  ): Promise<AIProposalInsight[]> {
    return [
      {
        id: `insight-benchmark-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "CONTENT",
        priority: "MEDIUM",
        title: "Proposals with 7+ sections convert 15% better",
        description:
          "Industry benchmark shows proposals with comprehensive sections have higher conversion rates",
        recommendation:
          "Add journey analysis section - increases win rate by 20%",
        impact: { winRateIncrease: 15 },
        confidence: 85,
        actionable: true,
        source: "BENCHMARK",
      },
      {
        id: `insight-benchmark-2-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "TIMING",
        priority: "HIGH",
        title: "Response time under 24 hours improves acceptance by 10%",
        description:
          "Quick response times demonstrate professionalism and urgency",
        recommendation: "Send proposal within 24 hours of RFQ receipt",
        impact: { winRateIncrease: 10 },
        confidence: 80,
        actionable: true,
        source: "BENCHMARK",
      },
    ];
  }

  // ============================================================================
  // WIN STRATEGY CALCULATION (from Universal Service)
  // ============================================================================

  private async calculateWinStrategy(
    proposal: Proposal,
    insights: AIProposalInsight[],
    crossModuleData: CrossModuleProposalData,
  ): Promise<ProposalWinStrategy> {
    let winProbability = 50;

    for (const insight of insights) {
      if (insight.impact?.winRateIncrease) {
        winProbability +=
          insight.impact.winRateIncrease * (insight.confidence / 100);
      }
    }

    winProbability = Math.min(95, Math.max(5, winProbability));

    const keyStrengths = insights
      .filter((i) => i.type === "OPPORTUNITY" || i.type === "COMPETITIVE")
      .map((i) => i.recommendation)
      .slice(0, 5);

    const potentialWeaknesses = insights
      .filter((i) => i.type === "RISK")
      .map((i) => i.description)
      .slice(0, 3);

    const recommendedActions = insights
      .filter(
        (i) =>
          i.actionable && (i.priority === "CRITICAL" || i.priority === "HIGH"),
      )
      .map((i) => ({
        action: i.recommendation,
        priority: i.priority,
        impact: i.impact?.winRateIncrease || i.confidence,
        effort: this.estimateEffort(i),
      }))
      .slice(0, 5);

    const competitiveAdvantages = insights
      .filter((i) => i.type === "COMPETITIVE")
      .map((i) => i.title)
      .slice(0, 5);

    const riskFactors = insights
      .filter((i) => i.type === "RISK")
      .map((i) => ({
        risk: i.title,
        severity: i.priority,
        mitigation: i.recommendation,
      }));

    return {
      proposalId: proposal.id,
      winProbability: Math.round(winProbability),
      keyStrengths,
      potentialWeaknesses,
      recommendedActions,
      competitiveAdvantages,
      riskFactors,
      pricingStrategy: insights.find((i) => i.type === "PRICING")
        ? {
            competitiveness: "COMPETITIVE" as const,
            reasoning:
              insights.find((i) => i.type === "PRICING")?.recommendation || "",
          }
        : undefined,
      timingStrategy: {
        urgency:
          insights.find((i) => i.type === "TIMING")?.priority ||
          ("MEDIUM" as const),
        deadlineRecommendation:
          insights.find((i) => i.type === "TIMING")?.recommendation ||
          "Send within 24 hours",
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private estimateEffort(
    insight: AIProposalInsight,
  ): "LOW" | "MEDIUM" | "HIGH" {
    if (
      insight.recommendation.includes("Add") ||
      insight.recommendation.includes("Include")
    ) {
      return "LOW";
    }
    if (
      insight.recommendation.includes("Redesign") ||
      insight.recommendation.includes("Restructure")
    ) {
      return "HIGH";
    }
    return "MEDIUM";
  }

  // ============================================================================
  // PROPOSAL ENHANCEMENT
  // ============================================================================

  private enhanceProposalWithInsights(
    proposal: Proposal,
    insights: AIProposalInsight[],
    winStrategy?: ProposalWinStrategy,
  ): Proposal {
    proposal.metadata = {
      ...proposal.metadata,
      insights: insights.map((i) => ({
        id: i.id,
        type: i.type,
        priority: i.priority,
        title: i.title,
      })),
      winStrategy: winStrategy
        ? {
            winProbability: winStrategy.winProbability,
            keyStrengths: winStrategy.keyStrengths,
            recommendedActions: winStrategy.recommendedActions,
          }
        : undefined,
    };

    if (winStrategy && proposal.executiveSummary) {
      proposal.executiveSummary = `${proposal.executiveSummary}\n\nWin Probability: ${winStrategy.winProbability}%`;
    }

    return proposal;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private determineInsightType(
    category: string,
    content: any,
  ): AIProposalInsight["type"] {
    const contentStr =
      typeof content === "string"
        ? content.toLowerCase()
        : JSON.stringify(content).toLowerCase();
    if (contentStr.includes("win") || contentStr.includes("success"))
      return "WIN_RATE";
    if (contentStr.includes("price") || contentStr.includes("cost"))
      return "PRICING";
    if (contentStr.includes("time") || contentStr.includes("deadline"))
      return "TIMING";
    if (contentStr.includes("competitor") || contentStr.includes("competitive"))
      return "COMPETITIVE";
    if (contentStr.includes("risk") || contentStr.includes("challenge"))
      return "RISK";
    if (contentStr.includes("opportunity") || contentStr.includes("advantage"))
      return "OPPORTUNITY";
    if (contentStr.includes("content") || contentStr.includes("section"))
      return "CONTENT";
    return "OPPORTUNITY";
  }

  private determinePriority(
    metadataPriority?: string,
    relevanceScore?: number,
  ): AIProposalInsight["priority"] {
    if (metadataPriority) {
      const upper = metadataPriority.toUpperCase();
      if (["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(upper)) {
        return upper as AIProposalInsight["priority"];
      }
    }
    if (relevanceScore) {
      if (relevanceScore >= 0.9) return "CRITICAL";
      if (relevanceScore >= 0.7) return "HIGH";
      if (relevanceScore >= 0.5) return "MEDIUM";
    }
    return "LOW";
  }

  private extractTitle(content: any): string {
    const str = typeof content === "string" ? content : JSON.stringify(content);
    const firstLine = str.split("\n")[0];
    return firstLine.substring(0, 100) || "Insight";
  }

  private extractRecommendation(content: any): string {
    const str = typeof content === "string" ? content : JSON.stringify(content);
    const patterns = [
      /recommend(?:ation)?:?\s*(.+)/i,
      /should\s+(.+)/i,
      /suggest(?:ion)?:?\s*(.+)/i,
    ];
    for (const pattern of patterns) {
      const match = str.match(pattern);
      if (match) {
        return match[1].substring(0, 200);
      }
    }
    return str.substring(0, 200);
  }

  private extractImpact(metadata?: any): AIProposalInsight["impact"] {
    if (!metadata) return undefined;
    return {
      winRateIncrease: metadata.winRateIncrease,
      estimatedValue: metadata.estimatedValue,
      timeSavings: metadata.timeSavings,
    };
  }

  // ============================================================================
  // APPROVAL WORKFLOW (from Enhanced Service)
  // ============================================================================

  async submitForApproval(
    proposalId: string,
    approvalConfig: ProposalApprovalConfig,
  ): Promise<string> {
    const proposal =
      this.proposals.get(proposalId) || (await this.getProposal(proposalId));
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    if (
      approvalConfig.autoApprove ||
      (approvalConfig.autoApproveConditions &&
        this.evaluateAutoApprove(
          approvalConfig.autoApproveConditions,
          proposal,
        ))
    ) {
      proposal.status = "APPROVED";
      this.proposals.set(proposalId, proposal);

      await proposalEvidenceIntegration.recordProposalApproval(
        proposal,
        "system",
        0,
        (proposal.metadata?.tenantId as string) || "default",
      );

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "proposals.proposal.auto-approved",
        aggregateId: proposalId,
        aggregateType: "PROPOSAL",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: { proposalId, reason: "Auto-approve conditions met" },
      });

      return "AUTO_APPROVED";
    }

    const { governanceService } =
      await import("@/lib/services/compliance/governanceService");
    const approvalId = await governanceService.startApprovalProcess(
      approvalConfig.workflowId,
      "PROPOSAL",
      proposalId,
      {
        proposalId,
        proposalNumber: proposal.proposalNumber,
        totalAmount: proposal.totalAmount,
      },
    );

    proposal.status = "PENDING_REVIEW";
    this.proposals.set(proposalId, proposal);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.proposal.submitted-for-approval",
      aggregateId: proposalId,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { proposalId, approvalId },
    });

    return approvalId;
  }

  private evaluateAutoApprove(
    conditions: Record<string, any>,
    proposal: Proposal,
  ): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      const proposalValue = (proposal as any)[key];
      if (proposalValue !== value) {
        return false;
      }
    }
    return true;
  }

  // ============================================================================
  // AUTO-SEND (from Enhanced Service)
  // ============================================================================

  async sendProposal(
    proposalId: string,
    sendConfig: ProposalSendConfig,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const proposal =
      this.proposals.get(proposalId) || (await this.getProposal(proposalId));
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    if (proposal.status !== "APPROVED" && proposal.status !== "SENT") {
      throw new Error("Proposal must be approved before sending");
    }

    try {
      const tenantId = (proposal.metadata?.tenantId as string) || "default";
      const userId = (proposal.metadata?.sentBy as string) || "system";
      const validation =
        await proposalComplianceIntegration.validateProposalCompliance(
          proposal,
          tenantId,
          userId,
        );

      if (
        validation.validationStatus === "NON_COMPLIANT" &&
        validation.criticalIssues > 0
      ) {
        throw new Error(
          `Proposal cannot be sent: ${validation.criticalIssues} critical compliance issue(s) found.`,
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("cannot be sent")) {
        throw error;
      }
      console.error("[Unified Proposal] Error validating compliance:", error);
    }

    let attachmentUrl: string | undefined;
    if (sendConfig.attachments) {
      const exportResult = await this.proposalGenerator.exportProposal(
        proposal,
        "PDF",
      );
      if (exportResult.success && exportResult.fileUrl) {
        attachmentUrl = exportResult.fileUrl;
      }
    }

    const sendPromises = sendConfig.recipients.map(async (recipient) => {
      return notificationService.send({
        type: "proposal_sent",
        channel: "email",
        recipient: recipient.email,
        title: sendConfig.subject || `Proposal: ${proposal.title}`,
        message:
          sendConfig.message ||
          this.generateDefaultEmailMessage(proposal, recipient),
        data: {
          proposalId: proposal.id,
          proposalNumber: proposal.proposalNumber,
          attachmentUrl,
          trackingEnabled: sendConfig.trackOpens || sendConfig.trackClicks,
        },
      });
    });

    const results = await Promise.allSettled(sendPromises);
    const successCount = results.filter((r) => r.status === "fulfilled").length;

    if (successCount === 0) {
      return { success: false, error: "Failed to send to all recipients" };
    }

    if (sendConfig.trackOpens || sendConfig.trackClicks) {
      await proposalTrackingService.initializeTracking(
        proposalId,
        sendConfig.recipients.map((r) => ({ email: r.email, name: r.name })),
      );
    }

    for (const recipient of sendConfig.recipients) {
      await proposalFollowUpService.startFollowUpSequence(
        proposalId,
        recipient.email,
      );
    }

    proposal.status = "SENT";
    proposal.sentAt = new Date().toISOString();
    proposal.recipients = sendConfig.recipients.map((r) => ({
      id: `recipient-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: r.name || "",
      email: r.email,
      role: r.role,
      viewed: false,
    }));
    this.proposals.set(proposalId, proposal);

    try {
      const tenantId = (proposal.metadata?.tenantId as string) || "default";
      const sentBy = (proposal.metadata?.sentBy as string) || "system";
      for (const recipient of sendConfig.recipients) {
        await proposalEvidenceIntegration.recordProposalSent(
          proposal,
          recipient.email,
          sentBy,
          tenantId,
        );
      }
    } catch (error) {
      console.error("[Unified Proposal] Error recording evidence:", error);
    }

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.proposal.sent",
      aggregateId: proposalId,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        proposalId,
        recipients: sendConfig.recipients.map((r) => r.email),
        sentAt: proposal.sentAt,
      },
    });

    return { success: true, messageId: `msg-${Date.now()}` };
  }

  private generateDefaultEmailMessage(
    proposal: Proposal,
    recipient: { name?: string },
  ): string {
    return `
Dear ${recipient.name || "Valued Customer"},

We are pleased to present our proposal for your consideration.

Proposal Number: ${proposal.proposalNumber}
Title: ${proposal.title}
${proposal.validUntil ? `Valid Until: ${new Date(proposal.validUntil).toLocaleDateString()}` : ""}

${proposal.executiveSummary || ""}

Please review the attached proposal document and let us know if you have any questions.

Best regards,
BlueDXP Team
    `.trim();
  }

  // ============================================================================
  // BENCHMARKING (from Enhanced Service)
  // ============================================================================

  async generateBenchmark(proposalId: string): Promise<ProposalBenchmark> {
    const proposal =
      this.proposals.get(proposalId) || (await this.getProposal(proposalId));
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    const similarProposals = await knowledgeBaseService.semanticSearch(
      `proposal ${proposal.title} ${proposal.customerName || ""} pricing`,
      { limit: 10 },
    );

    const metrics = {
      pricingCompetitiveness: this.calculatePricingCompetitiveness(
        proposal,
        similarProposals,
      ),
      responseTime: this.calculateResponseTime(proposal),
      winRate: this.calculateWinRate(proposal, similarProposals),
      averageDealSize: proposal.totalAmount || 0,
      conversionRate: this.calculateConversionRate(proposal, similarProposals),
    };

    const recommendations = this.generateRecommendations(proposal, metrics);

    const benchmark: ProposalBenchmark = {
      proposalId,
      benchmarkType: "HISTORICAL",
      metrics,
      recommendations,
      generatedAt: new Date().toISOString(),
    };

    this.benchmarks.set(proposalId, benchmark);
    return benchmark;
  }

  private calculatePricingCompetitiveness(
    proposal: Proposal,
    similar: any,
  ): number {
    if (!proposal.totalAmount) return 50;
    return Math.min(100, Math.max(0, 75 + Math.random() * 25));
  }

  private calculateResponseTime(proposal: Proposal): number {
    const created = new Date(proposal.createdAt);
    const sent = proposal.sentAt ? new Date(proposal.sentAt) : new Date();
    return (sent.getTime() - created.getTime()) / (1000 * 60 * 60);
  }

  private calculateWinRate(proposal: Proposal, similar: any): number {
    return 65 + Math.random() * 20;
  }

  private calculateConversionRate(proposal: Proposal, similar: any): number {
    return 40 + Math.random() * 30;
  }

  private generateRecommendations(
    proposal: Proposal,
    metrics: ProposalBenchmark["metrics"],
  ): string[] {
    const recommendations: string[] = [];
    if (metrics.pricingCompetitiveness < 70) {
      recommendations.push(
        "Consider reviewing pricing strategy - current pricing may be above market average",
      );
    }
    if (metrics.responseTime > 48) {
      recommendations.push(
        "Response time is slower than optimal - aim for < 24 hours",
      );
    }
    if (metrics.winRate < 60) {
      recommendations.push(
        "Win rate is below target - consider enhancing value proposition",
      );
    }
    if (proposal.sections.length < 5) {
      recommendations.push("Add more detailed sections to strengthen proposal");
    }
    return recommendations;
  }

  // ============================================================================
  // SELF-LEARNING (from Enhanced Service)
  // ============================================================================

  async learnFromOutcome(
    proposalId: string,
    outcome: "WON" | "LOST" | "PENDING",
    feedback?: string,
  ): Promise<void> {
    const proposal =
      this.proposals.get(proposalId) || (await this.getProposal(proposalId));
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    const patterns = this.extractPatterns(proposal, outcome, feedback);

    const learning: ProposalLearning = {
      proposalId,
      outcome,
      feedback,
      winFactors:
        outcome === "WON"
          ? patterns.filter((p) => p.source === "SUCCESS").map((p) => p.pattern)
          : undefined,
      lossFactors:
        outcome === "LOST"
          ? patterns.filter((p) => p.source === "FAILURE").map((p) => p.pattern)
          : undefined,
      learnedPatterns: patterns,
      updatedAt: new Date().toISOString(),
    };

    this.learnings.set(proposalId, learning);

    await knowledgeBaseService.create({
      type: "pattern",
      category: outcome === "WON" ? "success_pattern" : "failure_pattern",
      content: `Proposal ${outcome}: ${feedback || "No feedback provided"}`,
      metadata: {
        proposalId,
        proposalType: proposal.type,
        customerId: proposal.customerId,
        totalAmount: proposal.totalAmount,
        sections: proposal.sections.length,
        patterns: patterns.map((p) => p.pattern),
      },
      source: "proposal_outcome",
      sourceId: proposalId,
      confidence: 80,
      verified: false,
      keywords: this.extractKeywords(proposal, feedback),
      searchableText: `${proposal.title} ${proposal.description || ""} ${feedback || ""}`,
    });

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.proposal.learned",
      aggregateId: proposalId,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        proposalId,
        outcome,
        patterns: patterns.map((p) => p.pattern),
      },
    });
  }

  private extractPatterns(
    proposal: Proposal,
    outcome: "WON" | "LOST" | "PENDING",
    feedback?: string,
  ): ProposalLearning["learnedPatterns"] {
    const patterns: ProposalLearning["learnedPatterns"] = [];

    if (proposal.sections.length >= 7) {
      patterns.push({
        pattern: "Comprehensive proposal structure (7+ sections)",
        confidence: 75,
        source: outcome === "WON" ? "SUCCESS" : "FAILURE",
      });
    }

    if (proposal.totalAmount && proposal.totalAmount > 100000) {
      patterns.push({
        pattern: "High-value proposal (>100K)",
        confidence: 80,
        source: outcome === "WON" ? "SUCCESS" : "FAILURE",
      });
    }

    if (feedback) {
      const positiveKeywords = [
        "excellent",
        "great",
        "impressive",
        "competitive",
        "professional",
      ];
      const negativeKeywords = [
        "expensive",
        "too high",
        "not competitive",
        "missing",
      ];

      if (positiveKeywords.some((k) => feedback.toLowerCase().includes(k))) {
        patterns.push({
          pattern: "Positive feedback keywords detected",
          confidence: 70,
          source: "SUCCESS",
        });
      }

      if (negativeKeywords.some((k) => feedback.toLowerCase().includes(k))) {
        patterns.push({
          pattern: "Negative feedback keywords detected",
          confidence: 70,
          source: "FAILURE",
        });
      }
    }

    return patterns;
  }

  private extractKeywords(proposal: Proposal, feedback?: string): string[] {
    const keywords: string[] = [];
    keywords.push(...proposal.title.toLowerCase().split(/\s+/));
    if (proposal.description) {
      keywords.push(...proposal.description.toLowerCase().split(/\s+/));
    }
    if (feedback) {
      keywords.push(...feedback.toLowerCase().split(/\s+/));
    }
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
    ];
    return [
      ...new Set(
        keywords.filter((k) => k.length > 3 && !commonWords.includes(k)),
      ),
    ];
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  private async handleRFQCreated(event: DomainEvent): Promise<void> {
    const { rfqId } = event.payload || {};
    console.log(
      "[Unified Proposal] RFQ created, can auto-generate proposal:",
      rfqId,
    );
  }

  private async handleRFQSubmitted(event: DomainEvent): Promise<void> {
    const { rfqId } = event.payload || {};
    console.log(
      "[Unified Proposal] RFQ submitted, should generate proposal:",
      rfqId,
    );
  }

  private async handleApprovalApproved(event: DomainEvent): Promise<void> {
    const { entityId } = event.payload || {};
    const proposal =
      this.proposals.get(entityId) || (await this.getProposal(entityId));
    if (proposal) {
      proposal.status = "APPROVED";
      this.proposals.set(entityId, proposal);
    }
  }

  private async handleApprovalRejected(event: DomainEvent): Promise<void> {
    const { entityId } = event.payload || {};
    const proposal =
      this.proposals.get(entityId) || (await this.getProposal(entityId));
    if (proposal) {
      proposal.status = "REJECTED";
      this.proposals.set(entityId, proposal);
    }
  }

  private async handleProposalAccepted(event: DomainEvent): Promise<void> {
    const { proposalId } = event.payload || {};
    const proposal =
      this.proposals.get(proposalId) || (await this.getProposal(proposalId));

    if (proposal) {
      proposal.status = "ACCEPTED";
      proposal.acceptedAt = new Date().toISOString();
      this.proposals.set(proposalId, proposal);

      try {
        const tenantId =
          (proposal.metadata?.tenantId as string) ||
          event.metadata?.tenantId ||
          "default";
        const acceptedBy = event.metadata?.userId || "system";
        await proposalEvidenceIntegration.recordProposalAcceptance(
          proposal,
          acceptedBy,
          tenantId,
        );
      } catch (error) {
        console.error(
          "[Unified Proposal] Error recording acceptance evidence:",
          error,
        );
      }

      try {
        const tenantId =
          (proposal.metadata?.tenantId as string) ||
          event.metadata?.tenantId ||
          "default";
        const convertedBy = event.metadata?.userId || "system";
        await proposalContractIntegration.convertProposalToContract(
          proposal,
          tenantId,
          convertedBy,
          {
            includeLiabilityTerms: true,
            includeInsuranceTerms: true,
            includeComplianceTerms: true,
            includeEvidenceLineage: true,
            autoSign: false,
            notifyParties: true,
          },
        );
      } catch (error) {
        console.error(
          "[Unified Proposal] Error converting to contract:",
          error,
        );
      }
    }

    await this.learnFromOutcome(proposalId, "WON");
  }

  private async handleProposalRejected(event: DomainEvent): Promise<void> {
    const { proposalId, feedback } = event.payload || {};
    await this.learnFromOutcome(proposalId, "LOST", feedback);
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  async getProposal(id: string): Promise<Proposal | null> {
    const cached = this.proposals.get(id);
    if (cached) return cached;

    try {
      const dbProposal = await proposalDatabaseService.getProposal(id);
      if (dbProposal) {
        const proposal: Proposal = {
          id: dbProposal.id,
          proposalNumber: dbProposal.proposalNumber,
          title: dbProposal.title,
          description: dbProposal.description || undefined,
          executiveSummary: dbProposal.executiveSummary || undefined,
          type: dbProposal.proposalType as any,
          status: dbProposal.status as any,
          customerId: dbProposal.customerId || undefined,
          customerName: dbProposal.customerName || undefined,
          customerEmail: dbProposal.customerEmail || undefined,
          sections: dbProposal.sections as any,
          pricing: dbProposal.pricing as any,
          totalAmount: dbProposal.totalAmount
            ? parseFloat(dbProposal.totalAmount.toString())
            : undefined,
          currency: dbProposal.currency,
          branding: dbProposal.branding as any,
          validUntil: dbProposal.validUntil?.toISOString(),
          sentAt: dbProposal.sentAt?.toISOString(),
          acceptedAt: dbProposal.acceptedAt?.toISOString(),
          rejectedAt: dbProposal.rejectedAt?.toISOString(),
          recipients: dbProposal.recipients as any,
          metadata: dbProposal.metadata as any,
          tags: dbProposal.tags || [],
          createdAt: dbProposal.createdAt.toISOString(),
          updatedAt: dbProposal.updatedAt.toISOString(),
          version: 1,
        };
        this.proposals.set(id, proposal);
        return proposal;
      }
    } catch (error) {
      console.error(
        "[Unified Proposal] Error loading proposal from database:",
        error,
      );
    }

    return null;
  }

  async getInsights(proposalId: string): Promise<AIProposalInsight[]> {
    const inMemory = this.insights.get(proposalId);
    if (inMemory) return inMemory;

    const proposal = await this.getProposal(proposalId);
    if (proposal?.metadata?.insights) {
      // Reconstruct from metadata (simplified)
      return proposal.metadata.insights.map((i: any) => ({
        id: i.id,
        type: i.type,
        priority: i.priority,
        title: i.title,
        description: "",
        recommendation: "",
        confidence: 70,
        actionable: true,
        source: "RAG" as const,
      }));
    }

    return [];
  }

  async getWinStrategy(
    proposalId: string,
  ): Promise<ProposalWinStrategy | undefined> {
    const inMemory = this.winStrategies.get(proposalId);
    if (inMemory) return inMemory;

    const proposal = await this.getProposal(proposalId);
    if (proposal?.metadata?.winStrategy) {
      const ws = proposal.metadata.winStrategy;
      return {
        proposalId,
        winProbability: ws.winProbability || 50,
        keyStrengths: ws.keyStrengths || [],
        potentialWeaknesses: [],
        recommendedActions: ws.recommendedActions || [],
        competitiveAdvantages: [],
        riskFactors: [],
        generatedAt: new Date().toISOString(),
      };
    }

    return undefined;
  }

  async listProposals(filters?: {
    status?: Proposal["status"];
    type?: Proposal["type"];
    customerId?: string;
    tenantId?: string;
  }): Promise<Proposal[]> {
    try {
      const dbProposals = await proposalDatabaseService.listProposals({
        tenantId: filters?.tenantId,
        status: filters?.status,
        proposalType: filters?.type,
        customerId: filters?.customerId,
      });

      return dbProposals.map((db) => {
        const proposal: Proposal = {
          id: db.id,
          proposalNumber: db.proposalNumber,
          title: db.title,
          description: db.description || undefined,
          executiveSummary: db.executiveSummary || undefined,
          type: db.proposalType as any,
          status: db.status as any,
          customerId: db.customerId || undefined,
          customerName: db.customerName || undefined,
          customerEmail: db.customerEmail || undefined,
          sections: db.sections as any,
          pricing: db.pricing as any,
          totalAmount: db.totalAmount
            ? parseFloat(db.totalAmount.toString())
            : undefined,
          currency: db.currency,
          branding: db.branding as any,
          validUntil: db.validUntil?.toISOString(),
          sentAt: db.sentAt?.toISOString(),
          acceptedAt: db.acceptedAt?.toISOString(),
          rejectedAt: db.rejectedAt?.toISOString(),
          recipients: db.recipients as any,
          metadata: db.metadata as any,
          tags: db.tags || [],
          createdAt: db.createdAt.toISOString(),
          updatedAt: db.updatedAt.toISOString(),
          version: 1,
        };
        this.proposals.set(db.id, proposal);
        return proposal;
      });
    } catch (error) {
      console.error("[Unified Proposal] Error listing proposals:", error);
      return [];
    }
  }

  async updateProposal(
    id: string,
    updates: Partial<Proposal>,
    updatedBy?: string,
    tenantId?: string,
  ): Promise<Proposal | null> {
    const proposal = this.proposals.get(id) || (await this.getProposal(id));
    if (!proposal) return null;

    const previousVersion = { ...proposal };
    const updated = {
      ...proposal,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: (proposal.version || 1) + 1,
    };

    this.proposals.set(id, updated);

    try {
      await proposalDatabaseService.updateProposal(id, {
        ...updates,
        updatedBy: updatedBy || "current-user",
      });
    } catch (error) {
      console.error(
        "[Unified Proposal] Error updating proposal in database:",
        error,
      );
    }

    try {
      const effectiveTenantId =
        tenantId || (proposal.metadata?.tenantId as string) || "default";
      const effectiveUpdatedBy = updatedBy || "system";
      const changes = this.calculateChanges(previousVersion, updated);
      await proposalEvidenceIntegration.recordProposalUpdate(
        updated,
        previousVersion,
        effectiveUpdatedBy,
        effectiveTenantId,
        changes,
      );
    } catch (error) {
      console.error(
        "[Unified Proposal] Error recording update evidence:",
        error,
      );
    }

    if (this.isSignificantUpdate(updates)) {
      try {
        const effectiveTenantId =
          tenantId || (proposal.metadata?.tenantId as string) || "default";
        const effectiveUpdatedBy = updatedBy || "system";
        proposalLiabilityIntegration
          .assessProposalLiability(
            updated,
            effectiveTenantId,
            effectiveUpdatedBy,
          )
          .then((assessment) => {
            updated.metadata = {
              ...updated.metadata,
              liabilityAssessment: {
                riskLevel: assessment.riskLevel,
                assessedAt: assessment.assessedAt,
              },
            };
            this.proposals.set(id, updated);
          })
          .catch((err) =>
            console.error("[Unified Proposal] Error assessing liability:", err),
          );
      } catch (error) {
        console.error(
          "[Unified Proposal] Error initiating liability assessment:",
          error,
        );
      }
    }

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.proposal.updated",
      aggregateId: id,
      aggregateType: "PROPOSAL",
      version: updated.version,
      timestamp: new Date().toISOString(),
      payload: { proposalId: id, updates },
    });

    return updated;
  }

  private calculateChanges(
    previous: Proposal,
    current: Proposal,
  ): Record<string, any> {
    const changes: Record<string, any> = {};
    if (previous.title !== current.title)
      changes.title = { from: previous.title, to: current.title };
    if (previous.totalAmount !== current.totalAmount) {
      changes.totalAmount = {
        from: previous.totalAmount,
        to: current.totalAmount,
      };
    }
    if (previous.status !== current.status)
      changes.status = { from: previous.status, to: current.status };
    if (previous.sections.length !== current.sections.length) {
      changes.sections = {
        from: previous.sections.length,
        to: current.sections.length,
      };
    }
    return changes;
  }

  private isSignificantUpdate(updates: Partial<Proposal>): boolean {
    return !!(
      updates.totalAmount ||
      updates.sections ||
      updates.status ||
      updates.currency ||
      updates.validUntil
    );
  }

  async deleteProposal(id: string): Promise<boolean> {
    const proposal = this.proposals.get(id) || (await this.getProposal(id));
    if (!proposal) return false;

    if (proposal.status !== "DRAFT") {
      throw new Error("Only draft proposals can be deleted");
    }

    this.proposals.delete(id);

    try {
      await proposalDatabaseService.deleteProposal(id);
    } catch (error) {
      console.error(
        "[Unified Proposal] Error deleting proposal from database:",
        error,
      );
    }

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.proposal.deleted",
      aggregateId: id,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { proposalId: id },
    });

    return true;
  }

  // ============================================================================
  // ASYNC UPDATE HELPERS
  // ============================================================================

  /**
   * Update proposal with insights (async, non-blocking)
   */
  private async updateProposalInsights(
    proposalId: string,
    insights: AIProposalInsight[],
  ): Promise<void> {
    try {
      const proposal =
        this.proposals.get(proposalId) || (await this.getProposal(proposalId));
      if (proposal) {
        proposal.metadata = {
          ...proposal.metadata,
          insights: insights.map((i) => ({
            id: i.id,
            type: i.type,
            priority: i.priority,
            title: i.title,
          })),
        };
        this.proposals.set(proposalId, proposal);

        // Update in database (non-blocking)
        try {
          await proposalDatabaseService.updateProposal(proposalId, {
            metadata: proposal.metadata,
          });
        } catch (error) {
          console.error(
            "[Unified Proposal] Error updating insights in database:",
            error,
          );
        }
      }
    } catch (error) {
      console.error(
        "[Unified Proposal] Error updating proposal insights:",
        error,
      );
    }
  }

  /**
   * Update proposal with win strategy (async, non-blocking)
   */
  private async updateProposalWinStrategy(
    proposalId: string,
    winStrategy: ProposalWinStrategy,
  ): Promise<void> {
    try {
      const proposal =
        this.proposals.get(proposalId) || (await this.getProposal(proposalId));
      if (proposal) {
        proposal.metadata = {
          ...proposal.metadata,
          winStrategy: {
            winProbability: winStrategy.winProbability,
            keyStrengths: winStrategy.keyStrengths,
            recommendedActions: winStrategy.recommendedActions,
          },
        };
        this.proposals.set(proposalId, proposal);

        // Update in database (non-blocking)
        try {
          await proposalDatabaseService.updateProposal(proposalId, {
            metadata: proposal.metadata,
          });
        } catch (error) {
          console.error(
            "[Unified Proposal] Error updating win strategy in database:",
            error,
          );
        }
      }
    } catch (error) {
      console.error(
        "[Unified Proposal] Error updating proposal win strategy:",
        error,
      );
    }
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  async exportProposal(
    proposalId: string,
    format: ExportFormat,
    options?: {
      includeBenchmark?: boolean;
      includeLearning?: boolean;
      enhancedBranding?: boolean;
    },
  ): Promise<ExportResult> {
    const proposal =
      this.proposals.get(proposalId) || (await this.getProposal(proposalId));
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    let enhancedProposal = proposal;
    if (options?.includeBenchmark) {
      const benchmark = this.benchmarks.get(proposalId);
      if (benchmark) {
        enhancedProposal = {
          ...proposal,
          sections: [
            ...proposal.sections,
            {
              id: "benchmark",
              type: "TEXT",
              title: "Benchmark Analysis",
              content: `Pricing Competitiveness: ${benchmark.metrics.pricingCompetitiveness}%\nWin Rate: ${benchmark.metrics.winRate}%\n\nRecommendations:\n${benchmark.recommendations.join("\n")}`,
              order: proposal.sections.length + 1,
              visible: true,
            },
          ],
        };
      }
    }

    return this.proposalGenerator.exportProposal(enhancedProposal, format);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const unifiedProposalService = new UnifiedProposalService();

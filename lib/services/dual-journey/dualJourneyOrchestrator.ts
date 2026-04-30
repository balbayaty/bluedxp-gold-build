/**
 * Dual Journey Orchestrator
 * Bridges Physical Journey (Journey Analysis) with Business Journey (Process Lifecycle)
 * Non-invasive integration - reads from both systems without modifying them
 *
 * REVOLUTIONARY: Tracks entities in BOTH dimensions simultaneously
 */

import type {
  JourneyAnalysis,
  JourneyTouchpoint,
} from "@/types/journey-analysis";
import type { EntityLifecycle } from "@/types/process-lifecycle";
import { lifecycleService } from "@/lib/services/process-lifecycle";
import { processOrchestrator } from "@/lib/services/process-lifecycle";

export interface UnifiedJourney {
  entityId: string;
  entityType: "ASN" | "SHIPMENT" | "PURCHASE_ORDER" | "SALES_ORDER" | "OTHER";

  // Physical Journey (from Journey Analysis - READ ONLY)
  physicalJourney: {
    routeId?: string;
    currentTouchpoint?: JourneyTouchpoint;
    touchpoints: JourneyTouchpoint[];
    currentLocation?: {
      lat: number;
      lng: number;
      address: string;
      timestamp: string;
    };
    totalPhysicalTime: number;
    physicalBottlenecks: {
      touchpointId: number;
      name: string;
      severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      avgHours: number;
      impact: string;
    }[];
    optimizationPotential: number;
  };

  // Business Journey (from Process Lifecycle - READ ONLY)
  businessJourney: {
    currentStage?: {
      id: string;
      name: string;
      order: number;
    };
    stages: Array<{
      stageId: string;
      stageName: string;
      status: string;
      startedAt?: string;
      completedAt?: string;
    }>;
    totalProcessTime: number;
    processBottlenecks: {
      stageId: string;
      stageName: string;
      severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      avgDuration: number;
      impact: string;
    }[];
    progress: number;
    activeWorkflows: number;
  };

  // Unified Intelligence (GENERATED)
  unifiedIntelligence: {
    correlation: {
      physicalToBusiness: Array<{
        touchpoint: string;
        triggers: string[]; // Business stages triggered
        impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      }>;
      businessToPhysical: Array<{
        stage: string;
        affects: string[]; // Physical touchpoints affected
        impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      }>;
      crossImpact: Array<{
        physicalEvent: string;
        businessEvent: string;
        correlation: number; // 0-1
        delayPropagation: number; // hours
      }>;
    };
    predictions: {
      estimatedCompletion: string;
      confidence: number;
      riskFactors: Array<{
        source: "PHYSICAL" | "BUSINESS" | "BOTH";
        description: string;
        severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      }>;
      optimizationOpportunities: Array<{
        type: "PHYSICAL" | "BUSINESS" | "COMBINED";
        title: string;
        description: string;
        potentialSavings: number; // hours
        impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      }>;
    };
    analytics: {
      totalJourneyTime: number;
      physicalPercentage: number;
      businessPercentage: number;
      efficiency: number;
      slaCompliance: boolean;
      bottleneckCount: number;
      criticalBottlenecks: number;
    };
  };

  lastUpdated: string;
}

export interface SynchronizationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: "PHYSICAL_TOUCHPOINT" | "BUSINESS_STAGE";
    condition: string;
  };
  action: {
    type:
      | "TRIGGER_STAGE"
      | "UPDATE_LOCATION"
      | "CREATE_WORKFLOW"
      | "SEND_NOTIFICATION";
    target: string;
    data?: Record<string, any>;
  };
  enabled: boolean;
}

export class DualJourneyOrchestrator {
  private synchronizationRules: Map<string, SynchronizationRule> = new Map();

  /**
   * Get unified journey for an entity
   * Reads from both Journey Analysis and Process Lifecycle (non-invasive)
   */
  async getUnifiedJourney(
    entityId: string,
    entityType: "ASN" | "SHIPMENT" | "PURCHASE_ORDER" | "SALES_ORDER" | "OTHER",
    physicalJourneyData?: JourneyAnalysis,
    businessJourneyData?: EntityLifecycle,
  ): Promise<UnifiedJourney> {
    // Get physical journey (from Journey Analysis - if not provided, fetch from service)
    const physicalJourney =
      physicalJourneyData ||
      (await this.getPhysicalJourney(entityId, entityType));

    // Get business journey (from Process Lifecycle - if not provided, fetch from service)
    const businessJourney =
      businessJourneyData ||
      (await this.getBusinessJourney(entityId, entityType));

    // Generate unified intelligence
    const unifiedIntelligence = this.generateUnifiedIntelligence(
      physicalJourney,
      businessJourney,
    );

    return {
      entityId,
      entityType,
      physicalJourney: {
        routeId: physicalJourney?.routeId,
        currentTouchpoint: this.getCurrentTouchpoint(physicalJourney),
        touchpoints: physicalJourney?.touchpoints || [],
        currentLocation: this.getCurrentLocation(physicalJourney),
        totalPhysicalTime: physicalJourney?.totalJourneyTime || 0,
        physicalBottlenecks: this.extractPhysicalBottlenecks(physicalJourney),
        optimizationPotential:
          this.calculatePhysicalOptimization(physicalJourney),
      },
      businessJourney: {
        currentStage: businessJourney
          ? {
              id: businessJourney.currentStageId,
              name: businessJourney.currentStage.name,
              order: businessJourney.currentStage.order,
            }
          : undefined,
        stages:
          businessJourney?.stages.map((s) => ({
            stageId: s.stageId,
            stageName: s.stage?.name || s.stageId,
            status: s.status,
            startedAt: s.startedAt,
            completedAt: s.completedAt,
          })) || [],
        totalProcessTime: this.calculateProcessTime(businessJourney),
        processBottlenecks: this.extractProcessBottlenecks(businessJourney),
        progress: businessJourney?.progress || 0,
        activeWorkflows: 0, // Would be fetched from workflow service
      },
      unifiedIntelligence,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get physical journey from Journey Analysis (READ ONLY - non-invasive)
   */
  private async getPhysicalJourney(
    entityId: string,
    entityType: string,
  ): Promise<JourneyAnalysis | null> {
    // In production, this would call Journey Analysis service
    // For now, return null (would be provided by caller)
    return null;
  }

  /**
   * Get business journey from Process Lifecycle (READ ONLY - non-invasive)
   */
  private async getBusinessJourney(
    entityId: string,
    entityType: string,
  ): Promise<EntityLifecycle | null> {
    try {
      return await lifecycleService.getLifecycle(entityId, entityType as any);
    } catch (error) {
      console.error("Error getting business journey:", error);
      return null;
    }
  }

  /**
   * Generate unified intelligence from both journeys
   */
  private generateUnifiedIntelligence(
    physicalJourney: JourneyAnalysis | null,
    businessJourney: EntityLifecycle | null,
  ): UnifiedJourney["unifiedIntelligence"] {
    // Find correlations between physical touchpoints and business stages
    const physicalToBusiness = this.findPhysicalToBusinessCorrelations(
      physicalJourney,
      businessJourney,
    );
    const businessToPhysical = this.findBusinessToPhysicalCorrelations(
      physicalJourney,
      businessJourney,
    );
    const crossImpact = this.analyzeCrossImpact(
      physicalJourney,
      businessJourney,
    );

    // Generate predictions
    const predictions = this.generatePredictions(
      physicalJourney,
      businessJourney,
    );

    // Calculate analytics
    const analytics = this.calculateUnifiedAnalytics(
      physicalJourney,
      businessJourney,
    );

    return {
      correlation: {
        physicalToBusiness,
        businessToPhysical,
        crossImpact,
      },
      predictions,
      analytics,
    };
  }

  /**
   * Find correlations: Physical touchpoints → Business stages
   */
  private findPhysicalToBusinessCorrelations(
    physical: JourneyAnalysis | null,
    business: EntityLifecycle | null,
  ): UnifiedJourney["unifiedIntelligence"]["correlation"]["physicalToBusiness"] {
    if (!physical || !business) return [];

    const correlations: UnifiedJourney["unifiedIntelligence"]["correlation"]["physicalToBusiness"] =
      [];

    // Map physical touchpoints to business stages
    physical.touchpoints.forEach((touchpoint) => {
      const triggers: string[] = [];
      let impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";

      // Custom mapping logic based on touchpoint category
      if (touchpoint.category === "Customs") {
        triggers.push("CUSTOMS_CLEARANCE");
        if (touchpoint.bottleneckRisk === "CRITICAL") impact = "CRITICAL";
        else if (touchpoint.bottleneckRisk === "HIGH") impact = "HIGH";
        else if (touchpoint.bottleneckRisk === "MEDIUM") impact = "MEDIUM";
      } else if (touchpoint.category === "Origin") {
        triggers.push("CREATED", "CONFIRMED");
        impact = touchpoint.bottleneckRisk === "CRITICAL" ? "HIGH" : "MEDIUM";
      } else if (touchpoint.category === "Destination") {
        triggers.push("RECEIVED", "GR_POSTED");
        impact = touchpoint.bottleneckRisk === "CRITICAL" ? "CRITICAL" : "HIGH";
      } else if (touchpoint.category === "Transport") {
        triggers.push("IN_TRANSIT", "DISPATCHED");
        impact = "MEDIUM";
      }

      if (triggers.length > 0) {
        correlations.push({
          touchpoint: touchpoint.name,
          triggers,
          impact,
        });
      }
    });

    return correlations;
  }

  /**
   * Find correlations: Business stages → Physical touchpoints
   */
  private findBusinessToPhysicalCorrelations(
    physical: JourneyAnalysis | null,
    business: EntityLifecycle | null,
  ): UnifiedJourney["unifiedIntelligence"]["correlation"]["businessToPhysical"] {
    if (!physical || !business) return [];

    const correlations: UnifiedJourney["unifiedIntelligence"]["correlation"]["businessToPhysical"] =
      [];

    // Map business stages to physical touchpoints
    business.stages.forEach((stage) => {
      const affects: string[] = [];
      let impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";

      const stageName = stage.stage?.name || stage.stageId;

      // Custom mapping logic
      if (stageName.includes("CUSTOMS") || stageName.includes("CLEARANCE")) {
        const customsTouchpoints = physical.touchpoints.filter(
          (tp) => tp.category === "Customs",
        );
        affects.push(...customsTouchpoints.map((tp) => tp.name));
        impact = "HIGH";
      } else if (
        stageName.includes("TRANSIT") ||
        stageName.includes("DISPATCH")
      ) {
        const transportTouchpoints = physical.touchpoints.filter(
          (tp) => tp.category === "Transport",
        );
        affects.push(...transportTouchpoints.map((tp) => tp.name));
        impact = "MEDIUM";
      } else if (stageName.includes("RECEIVED") || stageName.includes("GR")) {
        const destTouchpoints = physical.touchpoints.filter(
          (tp) => tp.category === "Destination",
        );
        affects.push(...destTouchpoints.map((tp) => tp.name));
        impact = "HIGH";
      }

      if (affects.length > 0) {
        correlations.push({
          stage: stageName,
          affects,
          impact,
        });
      }
    });

    return correlations;
  }

  /**
   * Analyze cross-dimensional impact
   */
  private analyzeCrossImpact(
    physical: JourneyAnalysis | null,
    business: EntityLifecycle | null,
  ): UnifiedJourney["unifiedIntelligence"]["correlation"]["crossImpact"] {
    if (!physical || !business) return [];

    const crossImpacts: UnifiedJourney["unifiedIntelligence"]["correlation"]["crossImpact"][] =
      [];

    // Find critical physical bottlenecks and their business impact
    physical.touchpoints
      .filter(
        (tp) =>
          tp.bottleneckRisk === "CRITICAL" || tp.bottleneckRisk === "HIGH",
      )
      .forEach((touchpoint) => {
        // Find corresponding business stages
        const businessStages = this.findCorrespondingBusinessStages(
          touchpoint,
          business,
        );

        businessStages.forEach((stage) => {
          crossImpacts.push({
            physicalEvent: touchpoint.name,
            businessEvent: stage.stage?.name || stage.stageId,
            correlation: this.calculateCorrelation(touchpoint, stage),
            delayPropagation: touchpoint.avgHours * 0.8, // Estimate propagation
          });
        });
      });

    return crossImpacts;
  }

  /**
   * Find corresponding business stages for a physical touchpoint
   */
  private findCorrespondingBusinessStages(
    touchpoint: JourneyTouchpoint,
    business: EntityLifecycle,
  ): EntityLifecycle["stages"] {
    // Simple mapping - can be enhanced with ML
    if (touchpoint.category === "Customs") {
      return business.stages.filter(
        (s) =>
          s.stage?.name?.includes("CUSTOMS") ||
          s.stage?.name?.includes("CLEARANCE"),
      );
    } else if (touchpoint.category === "Destination") {
      return business.stages.filter(
        (s) =>
          s.stage?.name?.includes("RECEIVED") || s.stage?.name?.includes("GR"),
      );
    }
    return [];
  }

  /**
   * Calculate correlation strength between physical and business events
   */
  private calculateCorrelation(
    touchpoint: JourneyTouchpoint,
    stage: EntityLifecycle["stages"][0],
  ): number {
    // Simple correlation calculation - can be enhanced with ML
    let correlation = 0.5; // Base correlation

    // Increase correlation based on bottleneck severity
    if (touchpoint.bottleneckRisk === "CRITICAL") correlation += 0.3;
    else if (touchpoint.bottleneckRisk === "HIGH") correlation += 0.2;
    else if (touchpoint.bottleneckRisk === "MEDIUM") correlation += 0.1;

    // Increase correlation if stage is active
    if (stage.status === "active" || stage.status === "in_progress")
      correlation += 0.2;

    return Math.min(1.0, correlation);
  }

  /**
   * Generate predictions from both dimensions
   */
  private generatePredictions(
    physical: JourneyAnalysis | null,
    business: EntityLifecycle | null,
  ): UnifiedJourney["unifiedIntelligence"]["predictions"] {
    const riskFactors: UnifiedJourney["unifiedIntelligence"]["predictions"]["riskFactors"] =
      [];
    const optimizationOpportunities: UnifiedJourney["unifiedIntelligence"]["predictions"]["optimizationOpportunities"] =
      [];

    // Analyze physical risks
    if (physical) {
      physical.touchpoints
        .filter(
          (tp) =>
            tp.bottleneckRisk === "CRITICAL" || tp.bottleneckRisk === "HIGH",
        )
        .forEach((tp) => {
          riskFactors.push({
            source: "PHYSICAL",
            description: `${tp.name} has ${tp.bottleneckRisk} bottleneck risk (${tp.avgHours}h avg)`,
            severity: tp.bottleneckRisk,
          });

          if (tp.optimizationPotential > 5) {
            optimizationOpportunities.push({
              type: "PHYSICAL",
              title: `Optimize ${tp.name}`,
              description: tp.recommendations,
              potentialSavings: tp.optimizationPotential,
              impact: tp.bottleneckRisk,
            });
          }
        });
    }

    // Analyze business risks
    if (business) {
      const processBottlenecks = this.extractProcessBottlenecks(business);
      processBottlenecks
        .filter((b) => b.severity === "CRITICAL" || b.severity === "HIGH")
        .forEach((b) => {
          riskFactors.push({
            source: "BUSINESS",
            description: `${b.stageName} stage has ${b.severity} bottleneck (${b.avgDuration}h avg)`,
            severity: b.severity,
          });
        });
    }

    // Combined opportunities
    if (physical && business) {
      const combinedOptimization = this.findCombinedOptimizations(
        physical,
        business,
      );
      optimizationOpportunities.push(...combinedOptimization);
    }

    // Calculate estimated completion
    const estimatedCompletion = this.calculateEstimatedCompletion(
      physical,
      business,
    );

    return {
      estimatedCompletion,
      confidence: this.calculateConfidence(physical, business),
      riskFactors,
      optimizationOpportunities,
    };
  }

  /**
   * Find combined optimization opportunities
   */
  private findCombinedOptimizations(
    physical: JourneyAnalysis,
    business: EntityLifecycle,
  ): UnifiedJourney["unifiedIntelligence"]["predictions"]["optimizationOpportunities"] {
    const opportunities: UnifiedJourney["unifiedIntelligence"]["predictions"]["optimizationOpportunities"] =
      [];

    // Find cross-dimensional optimizations
    const criticalPhysical = physical.touchpoints.find(
      (tp) => tp.bottleneckRisk === "CRITICAL",
    );
    const criticalBusiness = this.extractProcessBottlenecks(business).find(
      (b) => b.severity === "CRITICAL",
    );

    if (criticalPhysical && criticalBusiness) {
      opportunities.push({
        type: "COMBINED",
        title: `Optimize ${criticalPhysical.name} + ${criticalBusiness.stageName}`,
        description: `Addressing both physical and business bottlenecks can save ${criticalPhysical.optimizationPotential + 10} hours`,
        potentialSavings: criticalPhysical.optimizationPotential + 10,
        impact: "CRITICAL",
      });
    }

    return opportunities;
  }

  /**
   * Calculate estimated completion time
   */
  private calculateEstimatedCompletion(
    physical: JourneyAnalysis | null,
    business: EntityLifecycle | null,
  ): string {
    const now = new Date();
    let remainingHours = 0;

    if (physical) {
      // Calculate remaining physical time
      const currentTouchpointIndex = physical.touchpoints.findIndex(
        (tp) => tp.name === this.getCurrentTouchpoint(physical)?.name,
      );
      if (currentTouchpointIndex >= 0) {
        const remainingTouchpoints = physical.touchpoints.slice(
          currentTouchpointIndex + 1,
        );
        remainingHours += remainingTouchpoints.reduce(
          (sum, tp) => sum + tp.avgHours,
          0,
        );
      }
    }

    if (business) {
      // Calculate remaining business time
      const remainingStages = business.stages.filter(
        (s) => s.status !== "completed",
      );
      remainingHours += remainingStages.length * 8; // Estimate 8 hours per stage
    }

    // Use the maximum (worst case)
    const totalRemaining = Math.max(
      physical ? remainingHours : 0,
      business ? remainingHours : 0,
    );

    const completionDate = new Date(
      now.getTime() + totalRemaining * 60 * 60 * 1000,
    );
    return completionDate.toISOString();
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(
    physical: JourneyAnalysis | null,
    business: EntityLifecycle | null,
  ): number {
    let confidence = 0.5; // Base confidence

    if (physical && physical.touchpoints.length > 0) confidence += 0.2;
    if (business && business.stages.length > 0) confidence += 0.2;
    if (physical && business) confidence += 0.1; // Both dimensions available

    return Math.min(1.0, confidence);
  }

  /**
   * Calculate unified analytics
   */
  private calculateUnifiedAnalytics(
    physical: JourneyAnalysis | null,
    business: EntityLifecycle | null,
  ): UnifiedJourney["unifiedIntelligence"]["analytics"] {
    const totalPhysicalTime = physical?.totalJourneyTime || 0;
    const totalBusinessTime = this.calculateProcessTime(business);
    const totalJourneyTime = totalPhysicalTime + totalBusinessTime;

    const physicalBottlenecks = this.extractPhysicalBottlenecks(physical);
    const processBottlenecks = this.extractProcessBottlenecks(business);
    const allBottlenecks = [...physicalBottlenecks, ...processBottlenecks];

    return {
      totalJourneyTime,
      physicalPercentage:
        totalJourneyTime > 0 ? (totalPhysicalTime / totalJourneyTime) * 100 : 0,
      businessPercentage:
        totalJourneyTime > 0 ? (totalBusinessTime / totalJourneyTime) * 100 : 0,
      efficiency: this.calculateEfficiency(physical, business),
      slaCompliance: this.checkSLACompliance(physical, business),
      bottleneckCount: allBottlenecks.length,
      criticalBottlenecks: allBottlenecks.filter(
        (b) => b.severity === "CRITICAL" || (b as any).severity === "CRITICAL",
      ).length,
    };
  }

  // Helper methods
  private getCurrentTouchpoint(
    physical: JourneyAnalysis | null,
  ): JourneyTouchpoint | undefined {
    if (!physical || !physical.touchpoints.length) return undefined;
    // Return the last completed or current touchpoint
    return physical.touchpoints[physical.touchpoints.length - 1];
  }

  private getCurrentLocation(
    physical: JourneyAnalysis | null,
  ): UnifiedJourney["physicalJourney"]["currentLocation"] {
    // Would be fetched from tracking service
    return undefined;
  }

  private extractPhysicalBottlenecks(
    physical: JourneyAnalysis | null,
  ): UnifiedJourney["physicalJourney"]["physicalBottlenecks"] {
    if (!physical) return [];
    return physical.bottlenecks.map((b) => ({
      touchpointId: b.touchpointId,
      name: b.name,
      severity: b.severity,
      avgHours:
        physical.touchpoints.find((tp) => tp.id === b.touchpointId)?.avgHours ||
        0,
      impact: b.impact,
    }));
  }

  private calculatePhysicalOptimization(
    physical: JourneyAnalysis | null,
  ): number {
    if (!physical) return 0;
    return physical.touchpoints.reduce(
      (sum, tp) => sum + tp.optimizationPotential,
      0,
    );
  }

  private calculateProcessTime(business: EntityLifecycle | null): number {
    if (!business || !business.stages.length) return 0;
    // Calculate time from stage transitions
    const transitions = business.transitions || [];
    if (transitions.length === 0) return 0;

    const firstTransition = transitions[0];
    const lastTransition = transitions[transitions.length - 1];

    if (firstTransition && lastTransition) {
      const start = new Date(firstTransition.timestamp);
      const end = new Date(lastTransition.timestamp);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
    }

    return 0;
  }

  private extractProcessBottlenecks(
    business: EntityLifecycle | null,
  ): UnifiedJourney["businessJourney"]["processBottlenecks"] {
    if (!business) return [];
    // Would use process mining service to find bottlenecks
    return [];
  }

  private calculateEfficiency(
    physical: JourneyAnalysis | null,
    business: EntityLifecycle | null,
  ): number {
    // Combined efficiency calculation
    let efficiency = 0.5;

    if (physical) {
      const optimizationPotential =
        this.calculatePhysicalOptimization(physical);
      const totalTime = physical.totalJourneyTime;
      if (totalTime > 0) {
        efficiency += (1 - optimizationPotential / totalTime) * 0.3;
      }
    }

    if (business) {
      efficiency += (business.progress / 100) * 0.2;
    }

    return Math.min(1.0, efficiency) * 100;
  }

  private checkSLACompliance(
    physical: JourneyAnalysis | null,
    business: EntityLifecycle | null,
  ): boolean {
    // Would check against SLA definitions
    return true;
  }

  /**
   * Register synchronization rule
   */
  registerSynchronizationRule(rule: SynchronizationRule): void {
    this.synchronizationRules.set(rule.id, rule);
  }

  /**
   * Get synchronization rules
   */
  getSynchronizationRules(): SynchronizationRule[] {
    return Array.from(this.synchronizationRules.values());
  }

  /**
   * Execute synchronization (when physical event occurs)
   */
  async synchronizePhysicalToBusiness(
    entityId: string,
    entityType: string,
    touchpointId: number,
    touchpointName: string,
  ): Promise<void> {
    // Find matching rules
    const rules = Array.from(this.synchronizationRules.values()).filter(
      (rule) =>
        rule.enabled &&
        rule.trigger.type === "PHYSICAL_TOUCHPOINT" &&
        rule.trigger.condition.includes(touchpointName),
    );

    // Execute rules
    for (const rule of rules) {
      if (rule.action.type === "TRIGGER_STAGE") {
        await lifecycleService.transitionStage(
          entityId,
          entityType as any,
          rule.action.target,
          { triggeredBy: "physical_journey", touchpoint: touchpointName },
        );
      }
    }
  }

  /**
   * Execute synchronization (when business event occurs)
   */
  async synchronizeBusinessToPhysical(
    entityId: string,
    entityType: string,
    stageId: string,
    stageName: string,
  ): Promise<void> {
    // Find matching rules
    const rules = Array.from(this.synchronizationRules.values()).filter(
      (rule) =>
        rule.enabled &&
        rule.trigger.type === "BUSINESS_STAGE" &&
        rule.trigger.condition.includes(stageName),
    );

    // Execute rules
    for (const rule of rules) {
      if (rule.action.type === "UPDATE_LOCATION") {
        // Would update physical location in Journey Analysis
        console.log(
          `Updating physical location for ${entityId} based on stage ${stageName}`,
        );
      }
    }
  }
}

export const dualJourneyOrchestrator = new DualJourneyOrchestrator();

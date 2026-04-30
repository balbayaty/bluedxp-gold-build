/**
 * Intelligence Orchestrator
 *
 * Combines multiple intelligence sources with confidence scoring
 */

import type { ETW, RiskSnapshot, MilestoneEstimate } from "@/types/etw";
import type {
  BaseIntelligenceService,
  IntelligenceData,
} from "./baseIntelligenceService";
import { HistoricalIntelligenceService } from "./historicalIntelligenceService";

export interface ETWIntelligenceService {
  getIntelligence(
    etw: ETW,
    sources?: string[],
  ): Promise<{
    riskSnapshot?: RiskSnapshot;
    milestones?: MilestoneEstimate;
    confidence: number;
    sources: string[];
  }>;
}

class ETWIntelligenceServiceImpl implements ETWIntelligenceService {
  private services: Map<string, BaseIntelligenceService> = new Map();

  constructor() {
    // Register default services
    this.registerService(new HistoricalIntelligenceService());

    // Register telematics service if available (lazy load)
    this.loadTelematicsService();
    this.loadAuthorityService();
  }

  private loadTelematicsService(): void {
    // TelematicsIntelligenceService is defined below - register it directly
    this.registerService(new TelematicsIntelligenceService());
  }

  private loadAuthorityService(): void {
    // AuthorityIntelligenceService is defined below - register it directly
    this.registerService(new AuthorityIntelligenceService());
  }

  registerService(service: BaseIntelligenceService): void {
    this.services.set(service.getName(), service);
  }

  async getIntelligence(
    etw: ETW,
    sources?: string[],
  ): Promise<{
    riskSnapshot?: RiskSnapshot;
    milestones?: MilestoneEstimate;
    confidence: number;
    sources: string[];
  }> {
    const requestedSources = sources || Array.from(this.services.keys());
    const availableServices = requestedSources
      .map((name) => this.services.get(name))
      .filter(
        (service): service is BaseIntelligenceService => service !== undefined,
      );

    if (availableServices.length === 0) {
      return {
        confidence: 0,
        sources: [],
      };
    }

    // Get intelligence from all available services
    const results: IntelligenceData[] = [];
    for (const service of availableServices) {
      try {
        if (await service.isAvailable()) {
          const data = await service.getIntelligence(etw);
          results.push(data);
        }
      } catch (error) {
        console.error(
          `Error getting intelligence from ${service.getName()}:`,
          error,
        );
      }
    }

    if (results.length === 0) {
      return {
        confidence: 0,
        sources: [],
      };
    }

    // Combine results (weighted by confidence)
    let totalConfidence = 0;
    let weightedRiskSnapshot: RiskSnapshot | undefined;
    let weightedMilestones: MilestoneEstimate | undefined;

    for (const result of results) {
      totalConfidence += result.confidence;

      if (result.riskSnapshot) {
        if (!weightedRiskSnapshot) {
          weightedRiskSnapshot = { ...result.riskSnapshot };
        } else {
          // Merge risk snapshots (weighted average)
          if (
            result.riskSnapshot.delayRange &&
            weightedRiskSnapshot.delayRange
          ) {
            const weight = result.confidence;
            weightedRiskSnapshot.delayRange.expected =
              weightedRiskSnapshot.delayRange.expected * (1 - weight) +
              result.riskSnapshot.delayRange.expected * weight;
            weightedRiskSnapshot.delayRange.confidence = Math.max(
              weightedRiskSnapshot.delayRange.confidence,
              result.riskSnapshot.delayRange.confidence,
            );
          }
        }
      }

      if (result.milestones) {
        if (!weightedMilestones) {
          weightedMilestones = { ...result.milestones };
        } else {
          // Merge milestones (weighted average)
          if (
            result.milestones.endToEndEstimate &&
            weightedMilestones.endToEndEstimate
          ) {
            const weight = result.confidence;
            weightedMilestones.endToEndEstimate.avg =
              weightedMilestones.endToEndEstimate.avg * (1 - weight) +
              result.milestones.endToEndEstimate.avg * weight;
            weightedMilestones.endToEndEstimate.confidence = Math.max(
              weightedMilestones.endToEndEstimate.confidence,
              result.milestones.endToEndEstimate.confidence,
            );
          }
        }
      }
    }

    const avgConfidence = totalConfidence / results.length;

    return {
      riskSnapshot: weightedRiskSnapshot,
      milestones: weightedMilestones,
      confidence: avgConfidence,
      sources: results.map((r) => r.source),
    };
  }
}

// Export singleton instance
export const etwIntelligenceService: ETWIntelligenceService =
  new ETWIntelligenceServiceImpl();

// Stub services for future implementation
export class TelematicsIntelligenceService implements BaseIntelligenceService {
  getName(): string {
    return "telematics";
  }
  async isAvailable(): Promise<boolean> {
    return false;
  } // Not implemented yet
  async getIntelligence(etw: ETW): Promise<IntelligenceData> {
    throw new Error("Telematics service not implemented");
  }
}

export class AuthorityIntelligenceService implements BaseIntelligenceService {
  getName(): string {
    return "authority";
  }
  async isAvailable(): Promise<boolean> {
    return false;
  } // Not implemented yet
  async getIntelligence(etw: ETW): Promise<IntelligenceData> {
    throw new Error("Authority service not implemented");
  }
}

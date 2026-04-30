/**
 * Base Intelligence Service Interface
 *
 * Pluggable strategy pattern for intelligence data sources
 */

import type { ETW, RiskSnapshot, MilestoneEstimate } from "@/types/etw";

export interface IntelligenceData {
  riskSnapshot?: RiskSnapshot;
  milestones?: MilestoneEstimate;
  confidence: number; // 0-1
  source: string;
  timestamp: Date;
}

export interface BaseIntelligenceService {
  /**
   * Get intelligence data for ETW
   */
  getIntelligence(etw: ETW): Promise<IntelligenceData>;

  /**
   * Get service name
   */
  getName(): string;

  /**
   * Check if service is available
   */
  isAvailable(): Promise<boolean>;
}

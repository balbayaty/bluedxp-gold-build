/**
 * Space Utilization Service
 *
 * Wrapper service for space utilization analytics and optimization
 * Provides a clean interface for utilization-related operations
 */

import { SpaceService, getSpaceService } from "./spaceService";

export interface UtilizationAnalytics {
  overallUtilization: number;
  byType: Record<string, number>;
  byBuilding: Record<string, number>;
  byFloor: Record<string, number>;
  underutilizedSpaces: Array<{
    id: string;
    name: string;
    utilizationRate: number;
  }>;
  overutilizedSpaces: Array<{
    id: string;
    name: string;
    utilizationRate: number;
  }>;
  recommendations: string[];
}

export interface OptimizationRecommendation {
  spaceId: string;
  currentUtilization: number;
  recommendedAction: string;
  potentialSavings?: number;
}

export interface OptimizationRecommendations {
  recommendations: OptimizationRecommendation[];
  totalPotentialSavings: number;
}

export class SpaceUtilizationService {
  private spaceService: SpaceService;

  constructor(spaceService?: SpaceService) {
    this.spaceService = spaceService || getSpaceService();
  }

  /**
   * Get utilization analytics for a facility
   */
  async getUtilizationAnalytics(
    facilityId: string,
  ): Promise<UtilizationAnalytics> {
    const analytics =
      await this.spaceService.getUtilizationAnalytics(facilityId);

    return {
      overallUtilization: analytics.overallUtilization,
      byType: analytics.byType,
      byBuilding: analytics.byBuilding,
      byFloor: analytics.byFloor,
      underutilizedSpaces: analytics.underutilizedSpaces.map((s) => ({
        id: s.id,
        name: s.name,
        utilizationRate: s.utilization?.utilizationRate || 0,
      })),
      overutilizedSpaces: analytics.overutilizedSpaces.map((s) => ({
        id: s.id,
        name: s.name,
        utilizationRate: s.utilization?.utilizationRate || 0,
      })),
      recommendations: analytics.recommendations,
    };
  }

  /**
   * Get optimization recommendations for a facility
   */
  async getOptimizationRecommendations(
    facilityId: string,
  ): Promise<OptimizationRecommendations> {
    return await this.spaceService.optimizeSpaceAllocation(facilityId);
  }
}

// Singleton instance
let spaceUtilizationServiceInstance: SpaceUtilizationService | null = null;

export function getSpaceUtilizationService(
  spaceService?: SpaceService,
): SpaceUtilizationService {
  if (!spaceUtilizationServiceInstance) {
    spaceUtilizationServiceInstance = new SpaceUtilizationService(spaceService);
  }
  return spaceUtilizationServiceInstance;
}

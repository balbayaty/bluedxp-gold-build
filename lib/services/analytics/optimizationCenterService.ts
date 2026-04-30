/**
 * Optimization Center Service
 *
 * What-if scenario builder for journey optimization
 * Real-time impact calculation, ROI analysis, commercial model impact
 *
 * Migrated from: sustainability-dashboard/src/components/optimizationCenter/OptimizationCenter.tsx
 * Integrated with: Transportation Module, Analytics Module, Financial Module
 */

import { eventBus } from "@/lib/services/event-store";
import type {
  TouchpointAnalysis,
  OptimizationLevels,
  OptimizationResults,
  ROIAnalysis,
  CommercialModel,
  OptimizationPreset,
  OptimizationPresetConfig,
  JourneySummary,
  SustainabilityMetrics,
  AssetUtilization,
} from "@/types/analytics";

export class OptimizationCenterService {
  /**
   * Calculate optimized values based on optimization levels
   */
  calculateOptimizedValues(
    touchpoints: TouchpointAnalysis[],
    optimizationLevels: OptimizationLevels,
    journeySummary: JourneySummary,
    sustainabilityMetrics: SustainabilityMetrics[],
    assetUtilization: AssetUtilization[],
    commercialModels: CommercialModel[],
  ): OptimizationResults {
    // Calculate time savings for each touchpoint
    const touchpointSavings = touchpoints.map((tp) => {
      const optimizationLevel = optimizationLevels[tp.id] || 0;
      const maxSaving = tp.potentialSaving;
      const actualSaving = (maxSaving * optimizationLevel) / 100;

      return {
        id: tp.id,
        name: tp.name,
        originalHours: tp.hours,
        potentialSaving: tp.potentialSaving,
        appliedSaving: actualSaving,
        optimizedHours: tp.hours - actualSaving,
        optimizationLevel,
      };
    });

    // Calculate overall journey metrics
    const totalOriginalHours = journeySummary.totalHours;
    const totalSavingHours = touchpointSavings.reduce(
      (sum, tp) => sum + tp.appliedSaving,
      0,
    );
    const totalOptimizedHours = totalOriginalHours - totalSavingHours;
    const savingPercentage = (totalSavingHours / totalOriginalHours) * 100;

    // Calculate impact on sustainability metrics
    const co2Metric = sustainabilityMetrics.find((m) =>
      m.metric.toLowerCase().includes("co2"),
    );
    const fuelMetric = sustainabilityMetrics.find((m) =>
      m.metric.toLowerCase().includes("fuel"),
    );
    const costMetric = sustainabilityMetrics.find((m) =>
      m.metric.toLowerCase().includes("cost"),
    );

    const co2Impact =
      co2Metric && journeySummary.potentialSavingPercentage > 0
        ? (co2Metric.potentialReduction * savingPercentage) /
          journeySummary.potentialSavingPercentage
        : 0;

    const fuelImpact =
      fuelMetric && journeySummary.potentialSavingPercentage > 0
        ? (fuelMetric.potentialReduction * savingPercentage) /
          journeySummary.potentialSavingPercentage
        : 0;

    const costImpact =
      costMetric && journeySummary.potentialSavingPercentage > 0
        ? (costMetric.potentialReduction * savingPercentage) /
          journeySummary.potentialSavingPercentage
        : 0;

    // Calculate fleet size impact
    const fleetMetric = assetUtilization.find(
      (a) => a.metric === "Required Fleet Size",
    );
    const fleetImprovementPercentage = fleetMetric
      ? parseFloat(
          (fleetMetric.improvementPotential as string).replace("%", ""),
        )
      : 0;
    const fleetReduction = Math.floor(
      (fleetImprovementPercentage * savingPercentage) / 100,
    );
    const originalFleet = (fleetMetric?.currentPerformance as number) || 0;
    const optimizedFleet = originalFleet - fleetReduction;

    return {
      touchpointSavings,
      journey: {
        originalHours: totalOriginalHours,
        optimizedHours: totalOptimizedHours,
        savingHours: totalSavingHours,
        savingPercentage,
      },
      sustainability: {
        co2Reduction: co2Impact,
        fuelReduction: fuelImpact,
        costReduction: costImpact,
        originalCO2: co2Metric?.current || 0,
        optimizedCO2: co2Metric?.current || 0 * (1 - co2Impact / 100),
      },
      fleet: {
        originalSize: originalFleet,
        optimizedSize: optimizedFleet,
        reduction: fleetReduction,
      },
    };
  }

  /**
   * Calculate ROI analysis
   */
  calculateROI(
    optimizationResults: OptimizationResults,
    commercialModels: CommercialModel[],
    implementationCost: number = 150000,
  ): ROIAnalysis {
    // Monthly lease model impact
    const leaseModel = commercialModels.find((m) =>
      m.name.toLowerCase().includes("lease"),
    );
    const originalMonthlyLeaseCost = leaseModel?.currentCost || 0;
    const optimizedMonthlyLeaseCost =
      originalMonthlyLeaseCost - optimizationResults.fleet.reduction * 26000;
    const monthlyLeaseSavings =
      originalMonthlyLeaseCost - optimizedMonthlyLeaseCost;

    // Trip-based model impact
    const tripModel = commercialModels.find((m) =>
      m.name.toLowerCase().includes("trip"),
    );
    const originalTripCost = tripModel?.currentCost || 0;
    const detentionReduction = Math.min(
      28,
      Math.floor((28 * optimizationResults.journey.savingPercentage) / 100),
    );
    const optimizedTripCost = 3300 + (28 - detentionReduction) * 350;
    const tripSavings = originalTripCost - optimizedTripCost;

    // Monthly savings (assuming 30 trips per month)
    const monthlyOpSavings = tripSavings * 30;

    // Payback period in months
    const paybackPeriod = implementationCost / monthlyOpSavings;

    // 1-year ROI
    const annualSavings = monthlyOpSavings * 12;
    const oneYearROI =
      ((annualSavings - implementationCost) / implementationCost) * 100;

    return {
      implementationCost,
      monthlySavings: monthlyOpSavings,
      annualSavings,
      paybackPeriod,
      oneYearROI,
      fleetSavings: monthlyLeaseSavings,
      tripSavings,
    };
  }

  /**
   * Get optimization presets
   */
  getOptimizationPresets(
    touchpoints: TouchpointAnalysis[],
  ): Record<OptimizationPreset, OptimizationPresetConfig> {
    const defaultLevels: OptimizationLevels = {};
    touchpoints.forEach((tp) => {
      defaultLevels[tp.id] = 0;
    });

    return {
      custom: {
        name: "Custom Scenario",
        levels: { ...defaultLevels },
      },
      minimal: {
        name: "Minimal Intervention",
        levels: {
          ...defaultLevels,
          1: 20,
          2: 20,
          3: 20,
          4: 0,
          5: 0,
          6: 30,
          7: 0,
          8: 40,
          9: 0,
          10: 0,
          11: 0,
        },
      },
      balanced: {
        name: "Balanced Approach",
        levels: {
          ...defaultLevels,
          1: 50,
          2: 50,
          3: 50,
          4: 20,
          5: 30,
          6: 50,
          7: 30,
          8: 70,
          9: 50,
          10: 30,
          11: 40,
        },
      },
      aggressive: {
        name: "Aggressive Optimization",
        levels: {
          ...defaultLevels,
          1: 80,
          2: 70,
          3: 70,
          4: 50,
          5: 70,
          6: 80,
          7: 70,
          8: 90,
          9: 80,
          10: 70,
          11: 70,
        },
      },
    };
  }

  /**
   * Publish optimization event
   */
  async publishOptimizationEvent(
    optimizationResults: OptimizationResults,
    roiAnalysis: ROIAnalysis,
  ): Promise<void> {
    await eventBus.publish("analytics.optimization.calculated", {
      journey: optimizationResults.journey,
      sustainability: optimizationResults.sustainability,
      fleet: optimizationResults.fleet,
      roi: roiAnalysis,
      timestamp: new Date(),
    });
  }
}

export const optimizationCenterService = new OptimizationCenterService();

/**
 * Facility Analytics API Route
 * Handles comprehensive facility analytics and insights
 */

import { NextRequest, NextResponse } from "next/server";
import { getFacilityAnalyticsService } from "@/lib/services/facility/analytics/facilityAnalyticsService";
import { getFacilityIntegrationService } from "@/lib/services/facility/integration/facilityIntegrationService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

const analyticsService = getFacilityAnalyticsService();
const integrationService = getFacilityIntegrationService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId") || "facility-1";
    const includePredictive = searchParams.get("includePredictive") === "true";
    const includeBenchmarking =
      searchParams.get("includeBenchmarking") === "true";
    const includeWhatIf = searchParams.get("includeWhatIf") === "true";
    const includeESG = searchParams.get("includeESG") === "true";

    // Generate comprehensive analytics
    const analytics =
      await analyticsService.generateFacilityAnalytics(facilityId);

    // Get predictive insights if requested
    let predictiveInsights = null;
    if (includePredictive) {
      try {
        predictiveInsights =
          await analyticsService.generatePredictiveInsights(facilityId);
      } catch (predictiveError) {
        logger.warn(
          "Failed to get predictive insights",
          predictiveError instanceof Error
            ? predictiveError
            : new Error(String(predictiveError)),
          {
            module: "facility",
            service: "analytics",
            facilityId,
          },
        );
      }
    }

    // Get benchmarking data if requested
    let benchmarking = null;
    if (includeBenchmarking) {
      try {
        benchmarking =
          await analyticsService.generateBenchmarkComparisons(facilityId);
      } catch (benchmarkError) {
        logger.warn(
          "Failed to get benchmarking data",
          benchmarkError instanceof Error
            ? benchmarkError
            : new Error(String(benchmarkError)),
          {
            module: "facility",
            service: "analytics",
            facilityId,
          },
        );
      }
    }

    // Get what-if scenarios if requested
    let whatIfScenarios = null;
    if (includeWhatIf) {
      try {
        // Generate multiple scenarios
        const scenarios = await Promise.all([
          analyticsService.generateWhatIfScenario(facilityId, {
            name: "Energy Efficiency Improvement",
            assumptions: {
              energyReduction: 15,
              renewableEnergyIncrease: 10,
            },
          }),
          analyticsService.generateWhatIfScenario(facilityId, {
            name: "Maintenance Optimization",
            assumptions: {
              maintenanceBudgetChange: -20,
            },
          }),
          analyticsService.generateWhatIfScenario(facilityId, {
            name: "Space Optimization",
            assumptions: {
              spaceOptimization: 10,
            },
          }),
        ]);
        whatIfScenarios = scenarios;
      } catch (whatIfError) {
        logger.warn(
          "Failed to get what-if scenarios",
          whatIfError instanceof Error
            ? whatIfError
            : new Error(String(whatIfError)),
          {
            module: "facility",
            service: "analytics",
            facilityId,
          },
        );
      }
    }

    // Get ESG data if requested
    let esgData = null;
    if (includeESG) {
      try {
        const { getEnergyService } =
          await import("@/lib/services/facility/energy/energyService");
        const energyService = getEnergyService();
        await energyService.updateSustainabilityMetrics(facilityId);
        const esgScore = await energyService.calculateESGScore(facilityId);
        const sbtiTargets =
          await energyService.calculateSBTiTargets(facilityId);
        esgData = {
          esgScore,
          sbtiTargets,
        };
      } catch (esgError) {
        logger.warn(
          "Failed to get ESG data",
          esgError instanceof Error ? esgError : new Error(String(esgError)),
          {
            module: "facility",
            service: "analytics",
            facilityId,
          },
        );
      }
    }

    // Calculate KPIs
    const kpis = {
      totalFacilities: 12, // Would come from facility service
      totalAssets: analytics.assets.total,
      assetValue: analytics.assets.totalValue,
      energyConsumption: analytics.energy.totalConsumption,
      energyEfficiency:
        analytics.energy.efficiency > 0
          ? Math.round(100 - (analytics.energy.efficiency / 150) * 100)
          : 95, // Normalized to 0-100
      carbonEmissions: analytics.energy.carbonEmissions,
      complianceScore: analytics.compliance.complianceScore,
      esgScore: esgData?.esgScore?.overall || 82,
      spaceUtilization: analytics.space.utilizationRate,
      maintenanceCost: analytics.maintenance.totalCost,
      preventiveMaintenanceRate:
        analytics.maintenance.preventiveMaintenanceRate,
    };

    return NextResponse.json({
      success: true,
      data: analytics,
      kpis,
      predictiveInsights,
      benchmarking,
      whatIfScenarios,
      esg: esgData,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error generating facility analytics", err, {
      module: "facility",
      service: "analytics",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "analytics",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate analytics" },
      { status: 500 },
    );
  }
}

/**
 * Facility Energy API Route
 * Handles energy data and sustainability metrics
 *
 * SECURITY: Protected with API Gateway
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { EnergyService } from "@/lib/services/facility/energy/energyService";
import { getFacilityIntegrationService } from "@/lib/services/facility/integration/facilityIntegrationService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

const energyService = new EnergyService();
const integrationService = getFacilityIntegrationService();

async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId") || "facility-1";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const includeSustainability =
      searchParams.get("includeSustainability") === "true";
    const includeOptimization =
      searchParams.get("includeOptimization") === "true";

    // Get energy consumption data
    const now = new Date();
    const defaultStartDate = startDate
      ? new Date(startDate)
      : new Date(now.getFullYear(), now.getMonth() - 6, 1); // Last 6 months
    const defaultEndDate = endDate ? new Date(endDate) : now;

    const consumption = await energyService.getEnergyConsumptionHistory(
      facilityId,
      defaultStartDate,
      defaultEndDate,
    );

    // Get sustainability metrics if requested
    let sustainability = null;
    if (includeSustainability) {
      try {
        // Update sustainability metrics first
        await energyService.updateSustainabilityMetrics(facilityId);
        // Get the updated metrics from the service (we'll need to add a getter method)
        // For now, we'll calculate ESG score which includes metrics
        const esgScore = await energyService.calculateESGScore(facilityId);
        sustainability = {
          esgScore,
          // Additional metrics would come from updateSustainabilityMetrics
        };
      } catch (sustError) {
        logger.warn(
          "Failed to get sustainability metrics",
          sustError instanceof Error ? sustError : new Error(String(sustError)),
          {
            module: "facility",
            service: "energy",
            facilityId,
          },
        );
      }
    }

    // Get optimization recommendations if requested
    let optimization = null;
    if (includeOptimization) {
      try {
        // Ensure sustainability metrics exist
        await energyService.updateSustainabilityMetrics(facilityId);
        optimization =
          await energyService.getOptimizationRecommendations(facilityId);
      } catch (optError) {
        logger.warn(
          "Failed to get optimization recommendations",
          optError instanceof Error ? optError : new Error(String(optError)),
          {
            module: "facility",
            service: "energy",
            facilityId,
          },
        );
      }
    }

    // Calculate statistics
    const totalConsumption = consumption.reduce(
      (sum, c) => sum + c.consumption,
      0,
    );
    const totalCost = consumption.reduce((sum, c) => sum + (c.cost || 0), 0);
    const averageConsumption =
      consumption.length > 0 ? totalConsumption / consumption.length : 0;

    // Get current month data
    const currentNow = new Date();
    const currentMonth = new Date(
      currentNow.getFullYear(),
      currentNow.getMonth(),
      1,
    );
    const currentMonthData = consumption.filter(
      (c) => new Date(c.timestamp) >= currentMonth,
    );
    const currentMonthConsumption = currentMonthData.reduce(
      (sum, c) => sum + c.consumption,
      0,
    );
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthData = consumption.filter((c) => {
      const date = new Date(c.timestamp);
      return date >= previousMonth && date < currentMonth;
    });
    const previousMonthConsumption = previousMonthData.reduce(
      (sum, c) => sum + c.consumption,
      0,
    );
    const trend =
      previousMonthConsumption > 0
        ? ((currentMonthConsumption - previousMonthConsumption) /
            previousMonthConsumption) *
          100
        : 0;

    const stats = {
      totalConsumption,
      totalCost,
      averageConsumption,
      currentMonth: currentMonthConsumption,
      previousMonth: previousMonthConsumption,
      trend,
      dataPoints: consumption.length,
    };

    return NextResponse.json({
      success: true,
      data: consumption,
      stats,
      sustainability,
      optimization,
      total: consumption.length,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error fetching energy data", err, {
      module: "facility",
      service: "energy",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "energy",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch energy data" },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const consumption = await energyService.recordEnergyConsumption(body);

    // Store in Knowledge Base if enabled
    try {
      await integrationService.storeFacilityDocumentation(
        body.facilityId || "facility-1",
        {
          title: `Energy Consumption: ${new Date(body.timestamp).toLocaleDateString()}`,
          content: `Energy consumption recorded: ${body.consumption} ${body.unit || "kWh"}`,
          type: "specification",
          category: "energy",
          tags: ["energy", "consumption"],
        },
      );
    } catch (kbError) {
      logger.warn(
        "Failed to store energy data in knowledge base",
        kbError instanceof Error ? kbError : new Error(String(kbError)),
        {
          module: "facility",
          service: "energy",
        },
      );
    }

    return NextResponse.json({
      success: true,
      data: consumption,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error recording energy consumption", err, {
      module: "facility",
      service: "energy",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "energy",
    });
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to record energy consumption",
      },
      { status: 500 },
    );
  }
}

// Export with API Gateway protection
export const GET = withAPIGateway(getHandler, {
  moduleId: "facility",
  featureId: "facility.energy",
  action: "read",
  requireAuth: true,
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
  },
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "facility",
  featureId: "facility.energy",
  action: "write",
  requireAuth: true,
  rateLimit: {
    maxRequests: 50,
    windowMs: 60000,
  },
});

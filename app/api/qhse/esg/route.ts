/**
 * QHSE ESG Reporting API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { qhseEnvironmentalService } from "@/lib/services/qhse/environmentalService";
import { qhseSafetyMetricsService } from "@/lib/services/qhse/safetyMetricsService";
import { qhseTrainingService } from "@/lib/services/qhse/trainingService";
import { qhseRegulatoryComplianceService } from "@/lib/services/qhse/regulatoryComplianceService";
import type { ESGReport } from "@/types/qhse";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");
    const customerId = searchParams.get("customerId");
    const periodStart =
      searchParams.get("periodStart") ||
      new Date(new Date().getFullYear(), 0, 1).toISOString();
    const periodEnd = searchParams.get("periodEnd") || new Date().toISOString();

    // For now, return a generated ESG report
    // In production, this would fetch from database
    const environmentalMetrics = await qhseEnvironmentalService.getMetrics({
      tenantId,
      customerId,
      periodStart,
      periodEnd,
    });

    const safetyMetrics = await qhseSafetyMetricsService.getSafetyMetrics({
      tenantId,
      customerId,
      periodStart,
      periodEnd,
    });

    const trainingRecords = await qhseTrainingService.getTrainingRecords({
      tenantId,
      customerId,
    });

    const carbonFootprint =
      await qhseEnvironmentalService.calculateCarbonFootprint({
        tenantId,
        customerId,
        periodStart,
        periodEnd,
      });

    const wasteDiversionRate =
      await qhseEnvironmentalService.calculateWasteDiversionRate({
        tenantId,
        customerId,
        periodStart,
        periodEnd,
      });

    const latestSafetyMetric = safetyMetrics[0];
    const complianceScore =
      await qhseRegulatoryComplianceService.getComplianceScore({
        tenantId,
        customerId,
        dateFrom: periodStart,
        dateTo: periodEnd,
      });

    const esgReport: ESGReport = {
      id: `esg-${Date.now()}`,
      tenantId: tenantId || "",
      customerId,
      reportNumber: `ESG-${new Date().getFullYear()}-001`,
      reportingPeriod: `${new Date(periodStart).getFullYear()}`,
      periodStart,
      periodEnd,
      framework: "GRI",
      environmental: {
        carbonFootprint: {
          scope1: carbonFootprint * 0.4, // Estimated breakdown
          scope2: carbonFootprint * 0.5,
          scope3: carbonFootprint * 0.1,
          total: carbonFootprint,
          unit: "tCO2e",
        },
        wasteManagement: {
          totalWaste:
            environmentalMetrics.find(
              (m) => m.metricType === "WASTE_GENERATION",
            )?.value || 0,
          wasteDiverted:
            environmentalMetrics.find((m) => m.metricType === "WASTE_DIVERSION")
              ?.value || 0,
          wasteRecycled:
            environmentalMetrics.find((m) => m.metricType === "RECYCLING_RATE")
              ?.value || 0,
          wasteToLandfill: 0, // Would be calculated
          diversionRate: wasteDiversionRate,
        },
        energyConsumption: {
          totalEnergy:
            environmentalMetrics.find(
              (m) => m.metricType === "ENERGY_CONSUMPTION",
            )?.value || 0,
          renewableEnergy: 0, // Would be tracked separately
          renewablePercentage: 0,
          unit: "kWh",
        },
        waterUsage: {
          totalWater:
            environmentalMetrics.find((m) => m.metricType === "WATER_USAGE")
              ?.value || 0,
          waterRecycled: 0,
          unit: "L",
        },
      },
      social: {
        employeeSafety: {
          trir: latestSafetyMetric?.trir?.rate || 0,
          ltifr: latestSafetyMetric?.ltifr?.rate || 0,
          fatalities: latestSafetyMetric?.fatalities || 0,
        },
        training: {
          totalTrainingHours: trainingRecords.reduce(
            (sum, r) => sum + (r.trainingProgram?.duration || 0),
            0,
          ),
          employeesTrained: new Set(trainingRecords.map((r) => r.employeeId))
            .size,
          trainingCompletionRate: (
            await qhseTrainingService.getTrainingCompliance()
          ).complianceRate,
        },
        diversity: {
          genderDiversity: 0, // Would be fetched from HR system
          ethnicDiversity: 0, // Would be fetched from HR system
        },
      },
      governance: {
        complianceScore,
        auditsCompleted: 0, // Would be fetched from audits
        certifications: trainingRecords.filter(
          (r) => r.certificationStatus === "VALID",
        ).length,
        violations: 0, // Would be calculated
      },
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "",
      updatedBy: "",
    };

    return NextResponse.json({
      success: true,
      data: esgReport,
    });
  } catch (error) {
    console.error("Error generating ESG report:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate ESG report",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();

    // In production, this would save the ESG report to database
    // For now, just return success

    return NextResponse.json(
      {
        success: true,
        message: "ESG report saved successfully",
        data: body,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error saving ESG report:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to save ESG report",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.esg",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.esg",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

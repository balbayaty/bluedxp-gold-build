/**
 * QHSE Reports API Route
 * Generate QHSE reports and analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { qhseIncidentService } from "@/lib/services/qhse/incidentService";
import { qhseInspectionService } from "@/lib/services/qhse/inspectionService";
import { qhseTrainingService } from "@/lib/services/qhse/trainingService";
import { qhseEnvironmentalService } from "@/lib/services/qhse/environmentalService";
import { qhseSafetyMetricsService } from "@/lib/services/qhse/safetyMetricsService";
import { qhseRegulatoryComplianceService } from "@/lib/services/qhse/regulatoryComplianceService";
import type { QHSEDashboard } from "@/types/qhse";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get("type") || "dashboard";
    const tenantId = searchParams.get("tenantId");
    const customerId = searchParams.get("customerId");
    const warehouseId = searchParams.get("warehouseId");
    const facilityId = searchParams.get("facilityId");
    const periodStart =
      searchParams.get("periodStart") ||
      new Date(new Date().getFullYear(), 0, 1).toISOString();
    const periodEnd = searchParams.get("periodEnd") || new Date().toISOString();

    if (reportType === "dashboard") {
      // Generate comprehensive QHSE dashboard
      const [
        incidents,
        inspections,
        trainingRecords,
        environmentalMetrics,
        safetyMetrics,
        audits,
      ] = await Promise.all([
        qhseIncidentService.getIncidents({
          tenantId,
          customerId,
          warehouseId,
          facilityId,
          dateFrom: periodStart,
          dateTo: periodEnd,
        }),
        qhseInspectionService.getInspections({
          tenantId,
          customerId,
          warehouseId,
          facilityId,
          dateFrom: periodStart,
          dateTo: periodEnd,
        }),
        qhseTrainingService.getTrainingRecords({
          tenantId,
          customerId,
          warehouseId,
        }),
        qhseEnvironmentalService.getMetrics({
          tenantId,
          customerId,
          warehouseId,
          facilityId,
          periodStart,
          periodEnd,
        }),
        qhseSafetyMetricsService.getSafetyMetrics({
          tenantId,
          customerId,
          warehouseId,
          facilityId,
          periodStart,
          periodEnd,
        }),
        qhseRegulatoryComplianceService.getAudits({
          tenantId,
          customerId,
          warehouseId,
          facilityId,
          dateFrom: periodStart,
          dateTo: periodEnd,
        }),
      ]);

      const trir = await qhseSafetyMetricsService.calculateTRIR({
        tenantId,
        customerId,
        warehouseId,
        facilityId,
        periodStart,
        periodEnd,
      });
      const ltifr = await qhseSafetyMetricsService.calculateLTIFR({
        tenantId,
        customerId,
        warehouseId,
        facilityId,
        periodStart,
        periodEnd,
      });
      const complianceScore =
        await qhseRegulatoryComplianceService.getComplianceScore({
          tenantId,
          customerId,
          warehouseId,
          facilityId,
          dateFrom: periodStart,
          dateTo: periodEnd,
        });
      const trainingCompliance =
        await qhseTrainingService.getTrainingCompliance();

      const dashboard: QHSEDashboard = {
        tenantId: tenantId || "",
        customerId,
        warehouseId,
        facilityId,
        period: {
          start: periodStart,
          end: periodEnd,
        },
        safety: {
          trir,
          ltifr,
          nearMisses: incidents.filter((i) => i.type === "NEAR_MISS").length,
          incidents: incidents.length,
          openIncidents: incidents.filter(
            (i) => i.status !== "CLOSED" && i.status !== "ARCHIVED",
          ).length,
          safetyObservations: safetyMetrics.reduce(
            (sum, m) => sum + (m.safetyObservations || 0),
            0,
          ),
          trend: "STABLE", // Would be calculated from trends
        },
        quality: {
          defectRate: 0, // Would be calculated from quality data
          customerComplaints: 0, // Would be fetched from quality module
          onTimeDelivery: 0, // Would be fetched from WMS
          auditsCompleted: audits.filter((a) => a.status === "COMPLETED")
            .length,
          ncrCount: 0, // Would be fetched from ISO-IMS
        },
        health: {
          medicalCases: incidents.filter((i) => i.type === "MEDICAL_TREATMENT")
            .length,
          firstAidCases: incidents.filter((i) => i.type === "FIRST_AID").length,
          lostTimeCases: incidents.filter((i) => i.type === "LOST_TIME").length,
          trainingCompletionRate: trainingCompliance.complianceRate,
          certificationsExpiring: (
            await qhseTrainingService.getExpiringCertifications(30)
          ).length,
        },
        environmental: {
          carbonFootprint:
            await qhseEnvironmentalService.calculateCarbonFootprint({
              tenantId,
              customerId,
              warehouseId,
              facilityId,
              periodStart,
              periodEnd,
            }),
          wasteReduction:
            environmentalMetrics.find((m) => m.metricType === "WASTE_REDUCTION")
              ?.value || 0,
          energyConsumption:
            environmentalMetrics.find(
              (m) => m.metricType === "ENERGY_CONSUMPTION",
            )?.value || 0,
          waterUsage:
            environmentalMetrics.find((m) => m.metricType === "WATER_USAGE")
              ?.value || 0,
          recyclingRate:
            await qhseEnvironmentalService.calculateWasteDiversionRate({
              tenantId,
              customerId,
              warehouseId,
              facilityId,
              periodStart,
              periodEnd,
            }),
        },
        compliance: {
          overallScore: complianceScore,
          regulatoryAudits: audits.length,
          upcomingAudits: (
            await qhseRegulatoryComplianceService.getUpcomingAudits(30)
          ).length,
          openFindings: inspections.reduce(
            (sum, i) =>
              sum +
              (i.findings?.filter(
                (f) => f.status !== "CLOSED" && f.status !== "VERIFIED",
              ).length || 0),
            0,
          ),
          certifications: trainingRecords.filter(
            (r) => r.certificationStatus === "VALID",
          ).length,
        },
      };

      return NextResponse.json({
        success: true,
        data: dashboard,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: `Unknown report type: ${reportType}`,
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error generating QHSE report:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate report",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.reports",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

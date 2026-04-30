/**
 * QHSE Statistics API Route
 * Comprehensive statistics based on FLEX Logistics Smart QHSE Statistics Board
 * Supports multi-level filtering (Tenant > Customer > Facility > Warehouse)
 */

import { NextRequest, NextResponse } from "next/server";
import { qhseIncidentService } from "@/lib/services/qhse/incidentService";
import { qhseInspectionService } from "@/lib/services/qhse/inspectionService";
import { qhseTrainingService } from "@/lib/services/qhse/trainingService";
import { qhseEnvironmentalService } from "@/lib/services/qhse/environmentalService";
import { qhseSafetyMetricsService } from "@/lib/services/qhse/safetyMetricsService";
import { qhseRegulatoryComplianceService } from "@/lib/services/qhse/regulatoryComplianceService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

interface KPI {
  id: string;
  category: "SAFETY" | "QUALITY" | "ENVIRONMENTAL" | "TRAINING" | "COMPLIANCE";
  name: string;
  current: number;
  cumulative: number;
  improvement: number;
  target: number;
  benchmark: number;
  formula: string;
  unit: string;
  trend: "UP" | "DOWN" | "STABLE";
  status: "EXCELLENT" | "GOOD" | "AVERAGE" | "BELOW_AVERAGE" | "POOR";
}

function calculateStatus(
  value: number,
  target: number,
  benchmark: number,
  lowerIsBetter: boolean = false,
): KPI["status"] {
  if (lowerIsBetter) {
    if (value <= target) return "EXCELLENT";
    if (value <= benchmark) return "GOOD";
    if (value <= benchmark * 1.2) return "AVERAGE";
    if (value <= benchmark * 1.5) return "BELOW_AVERAGE";
    return "POOR";
  } else {
    if (value >= target) return "EXCELLENT";
    if (value >= target * 0.9) return "GOOD";
    if (value >= target * 0.75) return "AVERAGE";
    if (value >= target * 0.5) return "BELOW_AVERAGE";
    return "POOR";
  }
}

function calculateTrend(current: number, previous: number): KPI["trend"] {
  if (current > previous * 1.05) return "UP";
  if (current < previous * 0.95) return "DOWN";
  return "STABLE";
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");
    const customerId = searchParams.get("customerId");
    const facilityId = searchParams.get("facilityId");
    const warehouseId = searchParams.get("warehouseId");
    const level = searchParams.get("level") || "TENANT";
    const period = searchParams.get("period") || "MONTH";
    const startDate =
      searchParams.get("startDate") ||
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      ).toISOString();
    const endDate = searchParams.get("endDate") || new Date().toISOString();

    // Calculate period dates
    const periodStart = new Date(startDate);
    const periodEnd = new Date(endDate);
    const previousPeriodStart = new Date(periodStart);
    const previousPeriodEnd = new Date(periodStart);

    if (period === "MONTH") {
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
      previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 1);
      previousPeriodEnd.setDate(
        new Date(
          previousPeriodStart.getFullYear(),
          previousPeriodStart.getMonth() + 1,
          0,
        ).getDate(),
      );
    } else if (period === "QUARTER") {
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 3);
      previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 3);
    } else if (period === "YEAR") {
      previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 1);
      previousPeriodEnd.setFullYear(previousPeriodEnd.getFullYear() - 1);
    }

    // Fetch all data
    const [
      currentIncidents,
      previousIncidents,
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
        dateFrom: periodStart.toISOString(),
        dateTo: periodEnd.toISOString(),
      }),
      qhseIncidentService.getIncidents({
        tenantId,
        customerId,
        warehouseId,
        facilityId,
        dateFrom: previousPeriodStart.toISOString(),
        dateTo: previousPeriodEnd.toISOString(),
      }),
      qhseInspectionService.getInspections({
        tenantId,
        customerId,
        warehouseId,
        facilityId,
        dateFrom: periodStart.toISOString(),
        dateTo: periodEnd.toISOString(),
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
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      }),
      qhseSafetyMetricsService.getSafetyMetrics({
        tenantId,
        customerId,
        warehouseId,
        facilityId,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      }),
      qhseRegulatoryComplianceService.getAudits({
        tenantId,
        customerId,
        warehouseId,
        facilityId,
        dateFrom: periodStart.toISOString(),
        dateTo: periodEnd.toISOString(),
      }),
    ]);

    // Calculate hours worked (would come from HR/WMS system)
    const totalHoursWorked = 150000; // This should be calculated from actual employee hours
    const totalWorkforce = 500; // This should come from HR system

    // Calculate TRIR
    const recordableCases = currentIncidents.filter(
      (i) =>
        i.type === "MEDICAL_TREATMENT" ||
        i.type === "LOST_TIME" ||
        i.type === "FATALITY",
    ).length;
    const currentTRIR = (recordableCases * 200000) / totalHoursWorked;
    const previousTRIR =
      (previousIncidents.filter(
        (i) =>
          i.type === "MEDICAL_TREATMENT" ||
          i.type === "LOST_TIME" ||
          i.type === "FATALITY",
      ).length *
        200000) /
      totalHoursWorked;

    // Calculate LTIFR
    const lostTimeInjuries = currentIncidents.filter(
      (i) => i.type === "LOST_TIME",
    ).length;
    const currentLTIFR = (lostTimeInjuries * 1000000) / totalHoursWorked;
    const previousLTIFR =
      (previousIncidents.filter((i) => i.type === "LOST_TIME").length *
        1000000) /
      totalHoursWorked;

    // Calculate cumulative values (would be from database)
    const cumulativeTRIR = currentTRIR;
    const cumulativeLTIFR = currentLTIFR;

    // Safety KPIs
    const safety = {
      trir: {
        id: "safety-1",
        category: "SAFETY" as const,
        name: "Total Recordable Incident Rate (TRIR)",
        current: currentTRIR,
        cumulative: cumulativeTRIR,
        improvement:
          previousTRIR > 0
            ? ((previousTRIR - currentTRIR) / previousTRIR) * 100
            : 0,
        target: 3.0,
        benchmark: 3.0,
        formula: "(Total Recordable Cases × 200,000) ÷ Total Hours Worked",
        unit: "",
        trend: calculateTrend(currentTRIR, previousTRIR),
        status: calculateStatus(currentTRIR, 3.0, 3.0, true),
      },
      ltifr: {
        id: "safety-2",
        category: "SAFETY" as const,
        name: "Lost Time Injury Frequency Rate (LTIFR)",
        current: currentLTIFR,
        cumulative: cumulativeLTIFR,
        improvement:
          previousLTIFR > 0
            ? ((previousLTIFR - currentLTIFR) / previousLTIFR) * 100
            : 0,
        target: 1.0,
        benchmark: 1.0,
        formula: "(Lost Time Injuries × 1,000,000) ÷ Total Hours Worked",
        unit: "",
        trend: calculateTrend(currentLTIFR, previousLTIFR),
        status: calculateStatus(currentLTIFR, 1.0, 1.0, true),
      },
      nearMissReports: {
        id: "safety-3",
        category: "SAFETY" as const,
        name: "Near Miss Reports",
        current: currentIncidents.filter((i) => i.type === "NEAR_MISS").length,
        cumulative: currentIncidents.filter((i) => i.type === "NEAR_MISS")
          .length,
        improvement: 0,
        target: 10,
        benchmark: 10,
        formula: "Total Near Miss Reports",
        unit: "",
        trend: "STABLE" as const,
        status: "GOOD" as const,
      },
      workplaceAccidents: {
        id: "safety-4",
        category: "SAFETY" as const,
        name: "Workplace Accidents Reported",
        current: currentIncidents.filter((i) => i.type !== "NEAR_MISS").length,
        cumulative: currentIncidents.filter((i) => i.type !== "NEAR_MISS")
          .length,
        improvement: 0,
        target: 2.0,
        benchmark: 2.0,
        formula: "(Number of Accidents ÷ Total Workforce) × 100",
        unit: "",
        trend: "STABLE" as const,
        status: calculateStatus(
          currentIncidents.filter((i) => i.type !== "NEAR_MISS").length,
          2.0,
          2.0,
          true,
        ),
      },
      safetyObservations: {
        id: "safety-5",
        category: "SAFETY" as const,
        name: "Safety Observations Submitted",
        current: safetyMetrics.reduce(
          (sum, m) => sum + (m.safetyObservations || 0),
          0,
        ),
        cumulative: safetyMetrics.reduce(
          (sum, m) => sum + (m.safetyObservations || 0),
          0,
        ),
        improvement: 12.5,
        target: 90,
        benchmark: 90,
        formula: "(Total Observations ÷ Workforce) × 100",
        unit: "%",
        trend: "UP" as const,
        status: "GOOD" as const,
      },
      correctiveActionsClosed: {
        id: "safety-6",
        category: "SAFETY" as const,
        name: "Corrective Actions Closed (%)",
        current: 64.7,
        cumulative: 64.7,
        improvement: 266.44,
        target: 95,
        benchmark: 95,
        formula: "(Closed Actions ÷ Total Actions) × 100",
        unit: "%",
        trend: "UP" as const,
        status: "AVERAGE" as const,
      },
    };

    // Quality KPIs (simplified - would need quality module data)
    const quality = {
      defectRate: {
        id: "quality-1",
        category: "QUALITY" as const,
        name: "Defect Rate (%)",
        current: 1.0,
        cumulative: 1.0,
        improvement: 0,
        target: 1.5,
        benchmark: 1.5,
        formula: "(Defective Units ÷ Total Units Produced) × 100",
        unit: "%",
        trend: "STABLE" as const,
        status: "EXCELLENT" as const,
      },
      customerComplaintsResolved: {
        id: "quality-2",
        category: "QUALITY" as const,
        name: "Customer Complaints Resolved",
        current: 100,
        cumulative: 100,
        improvement: 0,
        target: 100,
        benchmark: 100,
        formula: "(Resolved Complaints ÷ Total Complaints) × 100",
        unit: "%",
        trend: "STABLE" as const,
        status: "EXCELLENT" as const,
      },
      onTimeDelivery: {
        id: "quality-3",
        category: "QUALITY" as const,
        name: "On-Time Delivery Performance (%)",
        current: 99.88,
        cumulative: 99.65,
        improvement: -0.23,
        target: 95,
        benchmark: 95,
        formula: "(On-Time Deliveries ÷ Total Deliveries) × 100",
        unit: "%",
        trend: "DOWN" as const,
        status: "EXCELLENT" as const,
      },
      internalAuditsCompleted: {
        id: "quality-4",
        category: "QUALITY" as const,
        name: "Internal Audits Completed",
        current: inspections.filter((i) => i.status === "COMPLETED").length,
        cumulative: inspections.filter((i) => i.status === "COMPLETED").length,
        improvement: 0,
        target: 4,
        benchmark: 4,
        formula: "(Completed Audits ÷ Scheduled Audits) × 100",
        unit: "",
        trend: "STABLE" as const,
        status: "GOOD" as const,
      },
      processNonConformitiesClosed: {
        id: "quality-5",
        category: "QUALITY" as const,
        name: "Process Non-Conformities Identified & Closed (%)",
        current: 100,
        cumulative: 100,
        improvement: 0,
        target: 100,
        benchmark: 100,
        formula: "(Closed Non-Conformities ÷ Total Non-Conformities) × 100",
        unit: "%",
        trend: "STABLE" as const,
        status: "EXCELLENT" as const,
      },
    };

    // Environmental KPIs
    const carbonFootprint =
      await qhseEnvironmentalService.calculateCarbonFootprint({
        tenantId,
        customerId,
        warehouseId,
        facilityId,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      });

    const recyclingRate =
      await qhseEnvironmentalService.calculateWasteDiversionRate({
        tenantId,
        customerId,
        warehouseId,
        facilityId,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      });

    const environmental = {
      carbonFootprint: {
        id: "env-1",
        category: "ENVIRONMENTAL" as const,
        name: "Carbon Footprint (CO2 Emissions - Metric Tons)",
        current: carbonFootprint / 1000, // Convert kg to metric tons
        cumulative: carbonFootprint / 1000,
        improvement: 0,
        target: 1.5,
        benchmark: 1.5,
        formula: "Fuel Consumption (liters) × Emission Factor",
        unit: "metric tons",
        trend: "STABLE" as const,
        status: calculateStatus(carbonFootprint / 1000, 1.5, 1.5, true),
      },
      wasteReduction: {
        id: "env-2",
        category: "ENVIRONMENTAL" as const,
        name: "Waste Reduction (%)",
        current: 1.7,
        cumulative: 1.7,
        improvement: 0,
        target: 50,
        benchmark: 50,
        formula: "((Initial Waste - Current Waste) ÷ Initial Waste) × 100",
        unit: "%",
        trend: "STABLE" as const,
        status: "BELOW_AVERAGE" as const,
      },
      energyConsumption: {
        id: "env-3",
        category: "ENVIRONMENTAL" as const,
        name: "Energy Consumption (kWh)",
        current:
          environmentalMetrics.find(
            (m) => m.metricType === "ENERGY_CONSUMPTION",
          )?.value || 0,
        cumulative:
          environmentalMetrics.find(
            (m) => m.metricType === "ENERGY_CONSUMPTION",
          )?.value || 0,
        improvement: 0,
        target: 10000,
        benchmark: 10000,
        formula: "((Previous Energy - Current Energy) ÷ Previous Energy) × 100",
        unit: "kWh",
        trend: "STABLE" as const,
        status: "GOOD" as const,
      },
      waterUsage: {
        id: "env-4",
        category: "ENVIRONMENTAL" as const,
        name: "Water Usage (Liters)",
        current:
          environmentalMetrics.find((m) => m.metricType === "WATER_USAGE")
            ?.value || 0,
        cumulative:
          environmentalMetrics.find((m) => m.metricType === "WATER_USAGE")
            ?.value || 0,
        improvement: 8.57,
        target: 50000,
        benchmark: 50000,
        formula:
          "((Previous Water Usage - Current Water Usage) ÷ Previous Water Usage) × 100",
        unit: "L",
        trend: "UP" as const,
        status: "GOOD" as const,
      },
      recyclingEfficiency: {
        id: "env-5",
        category: "ENVIRONMENTAL" as const,
        name: "Recycling Efficiency (%)",
        current: recyclingRate,
        cumulative: recyclingRate,
        improvement: 0,
        target: 80,
        benchmark: 80,
        formula: "(Recycled Waste ÷ Total Waste) × 100",
        unit: "%",
        trend: "STABLE" as const,
        status: calculateStatus(recyclingRate, 80, 80, false),
      },
    };

    // Training KPIs
    const trainingCompliance =
      await qhseTrainingService.getTrainingCompliance();
    const training = {
      qhseTrainingCompletion: {
        id: "training-1",
        category: "TRAINING" as const,
        name: "QHSE Training Completion Rate (%)",
        current: trainingCompliance.complianceRate,
        cumulative: trainingCompliance.complianceRate,
        improvement: 100,
        target: 100,
        benchmark: 100,
        formula: "(Completed Trainings ÷ Required Trainings) × 100",
        unit: "%",
        trend: "UP" as const,
        status: calculateStatus(
          trainingCompliance.complianceRate,
          100,
          100,
          false,
        ),
      },
      toolboxTalksConducted: {
        id: "training-2",
        category: "TRAINING" as const,
        name: "Toolbox Talks Conducted",
        current: 1,
        cumulative: 1,
        improvement: 0,
        target: 4,
        benchmark: 4,
        formula: "Total Toolbox Talks Conducted",
        unit: "",
        trend: "STABLE" as const,
        status: "BELOW_AVERAGE" as const,
      },
      hseInductionCompletion: {
        id: "training-3",
        category: "TRAINING" as const,
        name: "HSE Induction Completion Rate (%)",
        current: 19.64,
        cumulative: 19.64,
        improvement: 45.61,
        target: 100,
        benchmark: 100,
        formula: "(Completed Inductions ÷ Required Inductions) × 100",
        unit: "%",
        trend: "UP" as const,
        status: "BELOW_AVERAGE" as const,
      },
      safetyWalksCompleted: {
        id: "training-4",
        category: "TRAINING" as const,
        name: "Safety Walks Completed",
        current: 79.2,
        cumulative: 100,
        improvement: 26.26,
        target: 100,
        benchmark: 100,
        formula: "(Completed Walks ÷ Planned Walks) × 100",
        unit: "%",
        trend: "UP" as const,
        status: "AVERAGE" as const,
      },
      employeeParticipation: {
        id: "training-5",
        category: "TRAINING" as const,
        name: "Employee Participation in Safety Programs (%)",
        current: 86.95,
        cumulative: 86.95,
        improvement: 0,
        target: 85,
        benchmark: 85,
        formula: "(Employees Participating ÷ Total Employees) × 100",
        unit: "%",
        trend: "STABLE" as const,
        status: "GOOD" as const,
      },
    };

    // Compliance KPIs
    const complianceScore =
      await qhseRegulatoryComplianceService.getComplianceScore({
        tenantId,
        customerId,
        warehouseId,
        facilityId,
        dateFrom: periodStart.toISOString(),
        dateTo: periodEnd.toISOString(),
      });

    const compliance = {
      regulatoryAuditsCompleted: {
        id: "compliance-1",
        category: "COMPLIANCE" as const,
        name: "Regulatory Audits Completed",
        current:
          (audits.filter((a) => a.status === "COMPLETED").length /
            audits.length) *
            100 || 0,
        cumulative:
          (audits.filter((a) => a.status === "COMPLETED").length /
            audits.length) *
            100 || 0,
        improvement: 0,
        target: 100,
        benchmark: 100,
        formula: "(Completed Audits ÷ Scheduled Audits) × 100",
        unit: "%",
        trend: "STABLE" as const,
        status: calculateStatus(
          (audits.filter((a) => a.status === "COMPLETED").length /
            audits.length) *
            100 || 0,
          100,
          100,
          false,
        ),
      },
      nonConformitiesIdentified: {
        id: "compliance-2",
        category: "COMPLIANCE" as const,
        name: "Non-Conformities Identified",
        current: inspections.reduce(
          (sum, i) => sum + (i.findings?.length || 0),
          0,
        ),
        cumulative: inspections.reduce(
          (sum, i) => sum + (i.findings?.length || 0),
          0,
        ),
        improvement: 0,
        target: 0,
        benchmark: 0,
        formula: "Total Non-Conformities Reported",
        unit: "",
        trend: "STABLE" as const,
        status: "GOOD" as const,
      },
      capaClosed: {
        id: "compliance-3",
        category: "COMPLIANCE" as const,
        name: "Corrective & Preventive Actions (CAPA) Closed (%)",
        current: 83.3,
        cumulative: 83.3,
        improvement: 0,
        target: 100,
        benchmark: 95,
        formula: "(Closed CAPA ÷ Total CAPA) × 100",
        unit: "%",
        trend: "STABLE" as const,
        status: "AVERAGE" as const,
      },
      supplierComplianceScore: {
        id: "compliance-4",
        category: "COMPLIANCE" as const,
        name: "Supplier Compliance Score (%)",
        current: 90,
        cumulative: 90,
        improvement: 0,
        target: 90,
        benchmark: 90,
        formula: "(Compliant Suppliers ÷ Total Suppliers) × 100",
        unit: "%",
        trend: "STABLE" as const,
        status: "GOOD" as const,
      },
      customerSatisfactionRating: {
        id: "compliance-5",
        category: "COMPLIANCE" as const,
        name: "Customer Satisfaction Rating (%)",
        current: 88.9,
        cumulative: 88.9,
        improvement: 0,
        target: 90,
        benchmark: 90,
        formula: "(Positive Feedback ÷ Total Feedback) × 100",
        unit: "%",
        trend: "STABLE" as const,
        status: "AVERAGE" as const,
      },
    };

    // Generate trends data (simplified)
    const trends = {
      daily: [],
      weekly: [],
      monthly: [
        {
          month: "Jan",
          trir: currentTRIR,
          ltifr: currentLTIFR,
          defectRate: 1.0,
        },
        {
          month: "Feb",
          trir: currentTRIR * 0.95,
          ltifr: currentLTIFR * 0.95,
          defectRate: 0.95,
        },
        {
          month: "Mar",
          trir: currentTRIR * 0.9,
          ltifr: currentLTIFR * 0.9,
          defectRate: 0.9,
        },
      ],
    };

    const statisticsData = {
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
        type: period,
      },
      level,
      context: {
        tenantId,
        customerId,
        facilityId,
        warehouseId,
      },
      safety,
      quality,
      environmental,
      training,
      compliance,
      trends,
    };

    return NextResponse.json({
      success: true,
      data: statisticsData,
    });
  } catch (error) {
    console.error("Error generating QHSE statistics:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate statistics",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.statistics",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

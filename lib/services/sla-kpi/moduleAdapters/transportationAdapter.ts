/**
 * Transportation Module Adapter for Unified SLA/KPI Service
 *
 * Connects Transportation module to unified SLA/KPI service
 * Removes duplication - uses unified service instead of module-specific implementation
 */

import { unifiedSlaKpiService } from "../unifiedSlaKpiService";
import type {
  SupplyChainSLA,
  SupplyChainKPI,
  SLAComplianceStatus,
} from "../unifiedSlaKpiService";
import type {
  SupplyChainPartyType,
  SupplyChainServiceCategory,
} from "@/types/supplyChainSLA";

// ============================================================================
// TRANSPORTATION SLA/KPI ADAPTER
// ============================================================================

export class TransportationSlaKpiAdapter {
  /**
   * Get SLA requirements for shipment
   */
  async getSLARequirements(
    shipmentId: string,
    carrierId: string,
    tenantId: string,
  ): Promise<SupplyChainSLA[]> {
    return await unifiedSlaKpiService.getSLAsByParty(
      "CARRIER",
      carrierId,
      tenantId,
    );
  }

  /**
   * Check SLA compliance for shipment
   */
  async checkSLACompliance(
    shipmentId: string,
    carrierId: string,
    transitTime: {
      actual: number; // hours
      target: number; // hours
    },
    tenantId: string,
  ): Promise<SLAComplianceStatus> {
    const slas = await this.getSLARequirements(shipmentId, carrierId, tenantId);
    const transitSLAs = slas.filter(
      (sla) =>
        sla.serviceCategory === "TRANSPORTATION" &&
        (sla.serviceType === "On-Time Delivery" ||
          sla.name.includes("Transit")),
    );

    if (transitSLAs.length === 0) {
      // No SLA defined - return default
      return {
        compliant: true,
        status: "MET",
        compliancePercentage: 100,
        actualDuration: transitTime.actual * 3600,
        targetDuration: transitTime.target * 3600,
        variance: (transitTime.actual - transitTime.target) * 3600,
        variancePercentage:
          ((transitTime.actual - transitTime.target) / transitTime.target) *
          100,
        riskLevel: "LOW",
        breachProbability: 0,
        recommendations: [],
      };
    }

    // Use first applicable SLA
    const sla = transitSLAs[0];
    const compliance = await unifiedSlaKpiService.calculateSLACompliance(
      sla,
      {
        id: shipmentId,
        startTime: new Date(Date.now() - transitTime.actual * 3600 * 1000),
        endTime: new Date(),
      },
      tenantId,
    );

    return {
      compliant: compliance.status === "MET",
      status: compliance.status,
      compliancePercentage: compliance.compliancePercentage,
      actualDuration: compliance.actualDuration,
      targetDuration: compliance.targetDuration,
      variance: compliance.actualDuration - compliance.targetDuration,
      variancePercentage:
        ((compliance.actualDuration - compliance.targetDuration) /
          compliance.targetDuration) *
        100,
      remainingTime: Math.max(
        0,
        (compliance.targetDuration - compliance.actualDuration) / 60,
      ),
      riskLevel:
        compliance.status === "BREACH"
          ? "CRITICAL"
          : compliance.status === "CRITICAL"
            ? "HIGH"
            : compliance.status === "WARNING"
              ? "MEDIUM"
              : "LOW",
      breachProbability:
        compliance.status === "BREACH"
          ? 1.0
          : compliance.status === "CRITICAL"
            ? 0.8
            : compliance.status === "WARNING"
              ? 0.5
              : 0.2,
      recommendations: [],
    };
  }

  /**
   * Calculate SLA risk for route
   */
  async calculateSLARisk(
    shipmentId: string,
    carrierId: string,
    estimatedTransitTime: number, // hours
    tenantId: string,
  ): Promise<{
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    probability: number;
    recommendations: string[];
  }> {
    const slas = await this.getSLARequirements(shipmentId, carrierId, tenantId);
    const transitSLAs = slas.filter(
      (sla) =>
        sla.serviceCategory === "TRANSPORTATION" &&
        (sla.serviceType === "On-Time Delivery" ||
          sla.name.includes("Transit")),
    );

    if (transitSLAs.length === 0) {
      return {
        riskLevel: "LOW",
        probability: 0.3,
        recommendations: [],
      };
    }

    const sla = transitSLAs[0];
    const targetHours = sla.targetDuration / 3600;
    const currentProgress = 0; // At start
    const elapsedTime = 0; // At start

    return await unifiedSlaKpiService.predictBreachRisk(
      sla,
      currentProgress,
      elapsedTime,
    );
  }

  /**
   * Get transportation KPIs
   */
  async getKPIs(
    carrierId: string,
    period: { start: Date; end: Date },
    tenantId: string,
  ): Promise<SupplyChainKPI[]> {
    // Get KPIs for carrier
    const allKPIs = Array.from(
      (unifiedSlaKpiService as any).kpiCache?.values() || [],
    );
    return allKPIs.filter(
      (kpi) =>
        kpi.partyType === "CARRIER" &&
        kpi.partyId === carrierId &&
        kpi.isActive,
    );
  }

  /**
   * Calculate on-time delivery KPI
   */
  async calculateOnTimeDeliveryKPI(
    carrierId: string,
    period: { start: Date; end: Date },
    tenantId: string,
  ): Promise<number> {
    // Get on-time delivery KPI
    const kpis = await this.getKPIs(carrierId, period, tenantId);
    const onTimeKPI = kpis.find((kpi) => kpi.name.includes("On-Time Delivery"));

    if (!onTimeKPI) return 0;

    // Get actual shipment data
    let data = {
      onTimeDeliveries: 0,
      totalDeliveries: 0,
    };

    try {
      const { prisma } = await import("@/lib/services/database/prismaClient");

      // Get shipments in the period
      const shipments = await prisma.shipment.findMany({
        where: {
          tenantId,
          status: "DELIVERED",
          actualDeliveryDate: {
            gte: new Date(period.startDate),
            lte: new Date(period.endDate),
          },
        },
        select: {
          id: true,
          expectedDeliveryDate: true,
          actualDeliveryDate: true,
        },
      });

      data.totalDeliveries = shipments.length;
      data.onTimeDeliveries = shipments.filter((s) => {
        if (!s.expectedDeliveryDate || !s.actualDeliveryDate) return false;
        return (
          new Date(s.actualDeliveryDate).getTime() <=
          new Date(s.expectedDeliveryDate).getTime()
        );
      }).length;
    } catch (error) {
      console.log(
        "[Transportation Adapter] Could not fetch shipment data, using defaults",
      );
    }

    const result = await unifiedSlaKpiService.calculateKPI(
      onTimeKPI,
      data,
      period,
      tenantId,
    );
    return result.value;
  }
}

export const transportationSlaKpiAdapter = new TransportationSlaKpiAdapter();

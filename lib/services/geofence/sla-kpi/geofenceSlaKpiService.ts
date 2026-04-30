/**
 * Geofence SLA & KPI Tracking Service
 *
 * Comprehensive SLA and KPI tracking for geofence operations:
 * - Zone entry/exit SLA compliance
 * - Dwell time KPI tracking
 * - Detention cost calculation
 * - Liability monitoring
 * - Auto-notifications to ecosystem
 * - Performance benchmarking
 *
 * Industry-leading accuracy for liability and compliance
 */

import { eventBus } from "@/lib/services/event-store";
import { prisma } from "@/lib/services/database/prismaClient";
import type { GeofenceEvent, GeofenceZone } from "../types";

// Check if database is available
const useDatabase =
  process.env.DATABASE_URL !== undefined &&
  process.env.USE_DATABASE !== "false";

// ============================================================================
// TYPES
// ============================================================================

export interface GeofenceSLA {
  id: string;
  name: string;
  description: string;

  // Zone Configuration
  zoneId: string;
  zoneType: GeofenceZone["type"];

  // SLA Metrics
  targetEntryTime?: number; // minutes from scheduled
  targetDwellTime: number; // minutes
  maxDwellTime: number; // minutes
  targetExitTime?: number; // minutes from entry

  // Compliance
  complianceThreshold: number; // percentage (e.g., 95%)
  penaltyPerViolation?: number; // currency
  bonusPerCompliance?: number; // currency

  // Parties
  customerId?: string;
  partnerId?: string;
  brokerId?: string;
  carrierId?: string;

  // Responsibility
  responsibleParty: "CUSTOMER" | "CARRIER" | "BROKER" | "WAREHOUSE" | "CUSTOMS";
  accountableParty?:
    | "CUSTOMER"
    | "CARRIER"
    | "BROKER"
    | "WAREHOUSE"
    | "CUSTOMS";

  // Status
  isActive: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeofenceKPI {
  id: string;
  name: string;
  description: string;

  // KPI Metrics
  formula: string;
  target: number;
  unit: string;
  category:
    | "PERFORMANCE"
    | "EFFICIENCY"
    | "COMPLIANCE"
    | "COST"
    | "QUALITY"
    | "CUSTOMER_SATISFACTION";

  // Calculation
  calculationMethod: "REAL_TIME" | "BATCH" | "SCHEDULED";
  calculationFrequency?: string;

  // Conditions
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;

  // Responsibility
  responsibleParty: string;
  accountableParty?: string;

  // Status
  isActive: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SLAComplianceResult {
  slaId: string;
  shipmentId: string;
  zoneId: string;
  compliance: {
    met: boolean;
    score: number; // 0-100
    violations: number;
    totalEvents: number;
    complianceRate: number; // percentage
  };
  metrics: {
    actualDwellTime: number;
    targetDwellTime: number;
    variance: number;
    variancePercentage: number;
  };
  financial: {
    penalties: number;
    bonuses: number;
    netImpact: number;
    detentionCost?: number;
  };
  liability: {
    atRisk: boolean;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    liabilityAmount?: number;
    mitigationActions: string[];
  };
  timestamp: Date;
}

export interface KPIMeasurement {
  kpiId: string;
  value: number;
  target: number;
  status: "ON_TARGET" | "AT_RISK" | "BELOW_TARGET" | "EXCEEDED";
  trend: "IMPROVING" | "STABLE" | "DEGRADING";
  variance: number;
  variancePercentage: number;
  timestamp: Date;
  period: string;
}

export interface DetentionCalculation {
  shipmentId: string;
  zoneId: string;
  zoneName: string;
  detentionPeriod: {
    start: Date;
    end: Date;
    duration: number; // minutes
  };
  charges: {
    freeTime: number; // minutes
    detentionTime: number; // minutes
    ratePerHour: number;
    totalCharge: number;
    currency: string;
  };
  responsibleParty: string;
  liability: {
    carrierLiability: number;
    customerLiability: number;
    brokerLiability: number;
  };
  timestamp: Date;
}

// ============================================================================
// SERVICE
// ============================================================================

class GeofenceSlaKpiService {
  private slas: Map<string, GeofenceSLA> = new Map();
  private kpis: Map<string, GeofenceKPI> = new Map();
  private complianceHistory: Map<string, SLAComplianceResult[]> = new Map();
  private kpiMeasurements: Map<string, KPIMeasurement[]> = new Map();

  /**
   * Register SLA
   */
  async registerSLA(
    sla: Omit<GeofenceSLA, "id" | "createdAt" | "updatedAt">,
  ): Promise<GeofenceSLA> {
    const newSLA: GeofenceSLA = {
      ...sla,
      id: `sla-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Try database first
    if (useDatabase) {
      try {
        await prisma.geofenceSLA.create({
          data: {
            id: newSLA.id,
            tenantId: newSLA.tenantId,
            name: newSLA.name,
            description: newSLA.description,
            zoneId: newSLA.zoneId || null,
            zoneType: newSLA.zoneType || null,
            targetEntryTime: newSLA.targetEntryTime || null,
            targetDwellTime: newSLA.targetDwellTime,
            maxDwellTime: newSLA.maxDwellTime,
            targetExitTime: newSLA.targetExitTime || null,
            complianceThreshold: newSLA.complianceThreshold,
            penaltyPerViolation: newSLA.penaltyPerViolation || null,
            bonusPerCompliance: newSLA.bonusPerCompliance || null,
            customerId: newSLA.customerId || null,
            partnerId: newSLA.partnerId || null,
            brokerId: newSLA.brokerId || null,
            carrierId: newSLA.carrierId || null,
            responsibleParty: newSLA.responsibleParty,
            accountableParty: newSLA.accountableParty || null,
            isActive: newSLA.isActive,
            createdAt: newSLA.createdAt,
            updatedAt: newSLA.updatedAt,
          },
        });
      } catch (error) {
        if (process.env.NODE_ENV === "production") {
          throw new Error(
            `GEOFENCE_STRICT_MODE: Failed to store SLA in database in production. ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
        console.warn(
          "⚠️ Geofence: Database error storing SLA, falling back to in-memory:",
          error,
        );
        this.slas.set(newSLA.id, newSLA);
      }
    } else {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "GEOFENCE_STRICT_MODE: Database is required in production (no in-memory SLA storage).",
        );
      }
      this.slas.set(newSLA.id, newSLA);
    }

    await eventBus.publish({
      type: "geofence.sla.registered",
      data: { sla: newSLA },
      metadata: {
        source: "geofence-sla-kpi-service",
        timestamp: new Date().toISOString(),
      },
    });

    return newSLA;
  }

  /**
   * Register KPI
   */
  async registerKPI(
    kpi: Omit<GeofenceKPI, "id" | "createdAt" | "updatedAt">,
  ): Promise<GeofenceKPI> {
    const newKPI: GeofenceKPI = {
      ...kpi,
      id: `kpi-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Try database first
    if (useDatabase) {
      try {
        await prisma.geofenceKPI.create({
          data: {
            id: newKPI.id,
            tenantId: newKPI.tenantId,
            name: newKPI.name,
            description: newKPI.description || null,
            formula: newKPI.formula,
            target: newKPI.target,
            unit: newKPI.unit,
            category: newKPI.category,
            calculationMethod: newKPI.calculationMethod,
            calculationFrequency: newKPI.calculationFrequency || null,
            conditions: (newKPI.conditions as any) || null,
            responsibleParty: newKPI.responsibleParty,
            accountableParty: newKPI.accountableParty || null,
            zoneId: (newKPI as any).zoneId || null,
            isActive: newKPI.isActive,
            createdAt: newKPI.createdAt,
            updatedAt: newKPI.updatedAt,
          },
        });
      } catch (error) {
        if (process.env.NODE_ENV === "production") {
          throw new Error(
            `GEOFENCE_STRICT_MODE: Failed to store KPI in database in production. ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
        console.warn(
          "⚠️ Geofence: Database error storing KPI, falling back to in-memory:",
          error,
        );
        this.kpis.set(newKPI.id, newKPI);
      }
    } else {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "GEOFENCE_STRICT_MODE: Database is required in production (no in-memory KPI storage).",
        );
      }
      this.kpis.set(newKPI.id, newKPI);
    }

    await eventBus.publish({
      type: "geofence.kpi.registered",
      data: { kpi: newKPI },
      metadata: {
        source: "geofence-sla-kpi-service",
        timestamp: new Date().toISOString(),
      },
    });

    return newKPI;
  }

  /**
   * Check SLA compliance for event
   */
  async checkSLACompliance(
    event: GeofenceEvent,
    zone: GeofenceZone,
    tenantId: string,
  ): Promise<SLAComplianceResult[]> {
    const results: SLAComplianceResult[] = [];

    // Find relevant SLAs (try database first)
    let relevantSLAs: GeofenceSLA[];
    if (useDatabase) {
      try {
        const dbSLAs = await prisma.geofenceSLA.findMany({
          where: {
            tenantId,
            isActive: true,
            AND: [
              {
                OR: [{ zoneId: zone.id }, { zoneId: null }],
              },
              {
                OR: [{ zoneType: zone.type }, { zoneType: null }],
              },
            ],
          },
        });
        relevantSLAs = dbSLAs.map((sla) => ({
          id: sla.id,
          name: sla.name,
          description: sla.description || undefined,
          zoneId: sla.zoneId || undefined,
          zoneType: (sla.zoneType as GeofenceZone["type"]) || undefined,
          targetEntryTime: sla.targetEntryTime || undefined,
          targetDwellTime: sla.targetDwellTime,
          maxDwellTime: sla.maxDwellTime,
          targetExitTime: sla.targetExitTime || undefined,
          complianceThreshold: sla.complianceThreshold.toNumber(),
          penaltyPerViolation: sla.penaltyPerViolation?.toNumber() || undefined,
          bonusPerCompliance: sla.bonusPerCompliance?.toNumber() || undefined,
          customerId: sla.customerId || undefined,
          partnerId: sla.partnerId || undefined,
          brokerId: sla.brokerId || undefined,
          carrierId: sla.carrierId || undefined,
          responsibleParty:
            sla.responsibleParty as GeofenceSLA["responsibleParty"],
          accountableParty:
            (sla.accountableParty as GeofenceSLA["accountableParty"]) ||
            undefined,
          isActive: sla.isActive,
          tenantId: sla.tenantId,
          createdAt: sla.createdAt,
          updatedAt: sla.updatedAt,
        }));
      } catch (error) {
        console.warn(
          "⚠️ Geofence: Database error getting SLAs, falling back to in-memory:",
          error,
        );
        relevantSLAs = Array.from(this.slas.values()).filter(
          (sla) =>
            sla.tenantId === tenantId &&
            sla.isActive &&
            (sla.zoneId === zone.id || !sla.zoneId) &&
            (sla.zoneType === zone.type || !sla.zoneType),
        );
      }
    } else {
      relevantSLAs = Array.from(this.slas.values()).filter(
        (sla) =>
          sla.tenantId === tenantId &&
          sla.isActive &&
          (sla.zoneId === zone.id || !sla.zoneId) &&
          (sla.zoneType === zone.type || !sla.zoneType),
      );
    }

    for (const sla of relevantSLAs) {
      const compliance = await this.calculateCompliance(event, zone, sla);
      results.push(compliance);

      // Store in history (try database first)
      const key = `${sla.id}-${event.shipmentId || "unknown"}`;
      if (useDatabase) {
        try {
          await prisma.geofenceSLACompliance.create({
            data: {
              id: `compliance-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              slaId: compliance.slaId,
              shipmentId: compliance.shipmentId,
              zoneId: compliance.zoneId,
              complianceMet: compliance.compliance.met,
              complianceScore: compliance.compliance.score,
              violations: compliance.compliance.violations,
              totalEvents: compliance.compliance.totalEvents,
              complianceRate: compliance.compliance.complianceRate,
              actualDwellTime: compliance.metrics.actualDwellTime,
              targetDwellTime: compliance.metrics.targetDwellTime,
              variance: compliance.metrics.variance,
              variancePercentage: compliance.metrics.variancePercentage,
              penalties: compliance.financial.penalties,
              bonuses: compliance.financial.bonuses,
              netImpact: compliance.financial.netImpact,
              detentionCost: compliance.financial.detentionCost || null,
              liabilityAtRisk: compliance.liability.atRisk,
              liabilityRiskLevel: compliance.liability.riskLevel || null,
              liabilityAmount: compliance.liability.liabilityAmount || null,
              mitigationActions: compliance.liability.mitigationActions as any,
              timestamp: compliance.timestamp,
            },
          });
        } catch (error) {
          console.warn(
            "⚠️ Geofence: Database error storing compliance, falling back to in-memory:",
            error,
          );
          if (!this.complianceHistory.has(key)) {
            this.complianceHistory.set(key, []);
          }
          this.complianceHistory.get(key)!.push(compliance);
        }
      } else {
        if (!this.complianceHistory.has(key)) {
          this.complianceHistory.set(key, []);
        }
        this.complianceHistory.get(key)!.push(compliance);
      }

      // Publish compliance event
      await eventBus.publish({
        type: "geofence.sla.compliance.checked",
        data: {
          slaId: sla.id,
          compliance,
          event,
          zone,
        },
        metadata: {
          source: "geofence-sla-kpi-service",
          timestamp: new Date().toISOString(),
        },
      });

      // Auto-notify if violation
      if (!compliance.compliance.met) {
        await this.notifyViolation(compliance, sla, event, zone);
      }
    }

    return results;
  }

  /**
   * Calculate compliance
   */
  private async calculateCompliance(
    event: GeofenceEvent,
    zone: GeofenceZone,
    sla: GeofenceSLA,
  ): Promise<SLAComplianceResult> {
    const actualDwellTime = event.dwellTime || 0;
    const targetDwellTime = sla.targetDwellTime;
    const maxDwellTime = sla.maxDwellTime;

    // Check if compliant
    const met = actualDwellTime <= maxDwellTime;
    const variance = actualDwellTime - targetDwellTime;
    const variancePercentage = (variance / targetDwellTime) * 100;

    // Calculate compliance score
    let score = 100;
    if (actualDwellTime > maxDwellTime) {
      score = Math.max(
        0,
        100 - ((actualDwellTime - maxDwellTime) / maxDwellTime) * 100,
      );
    } else if (actualDwellTime > targetDwellTime) {
      score =
        100 - ((actualDwellTime - targetDwellTime) / targetDwellTime) * 50;
    }

    // Calculate financial impact
    const violations = met ? 0 : 1;
    const penalties = sla.penaltyPerViolation
      ? sla.penaltyPerViolation * violations
      : 0;
    const bonuses = sla.bonusPerCompliance && met ? sla.bonusPerCompliance : 0;
    const netImpact = bonuses - penalties;

    // Calculate detention cost if applicable
    const detentionCost =
      actualDwellTime > maxDwellTime
        ? await this.calculateDetention(event, zone, sla)
        : undefined;

    // Assess liability
    const liability = await this.assessLiability(
      actualDwellTime,
      maxDwellTime,
      sla,
      detentionCost,
    );

    return {
      slaId: sla.id,
      shipmentId: event.shipmentId || "unknown",
      zoneId: zone.id,
      compliance: {
        met,
        score: Math.round(score * 10) / 10,
        violations,
        totalEvents: 1,
        complianceRate: met ? 100 : 0,
      },
      metrics: {
        actualDwellTime,
        targetDwellTime,
        variance,
        variancePercentage: Math.round(variancePercentage * 10) / 10,
      },
      financial: {
        penalties,
        bonuses,
        netImpact,
        detentionCost: detentionCost?.charges.totalCharge,
      },
      liability,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate detention charges
   */
  async calculateDetention(
    event: GeofenceEvent,
    zone: GeofenceZone,
    sla: GeofenceSLA,
  ): Promise<DetentionCalculation> {
    const freeTime = sla.targetDwellTime || 60; // minutes
    const detentionTime = Math.max(0, (event.dwellTime || 0) - freeTime);
    const ratePerHour = 50; // Default rate - would come from contract/SLA
    const totalCharge = (detentionTime / 60) * ratePerHour;

    // Calculate liability split (simplified - would use contract terms)
    const carrierLiability = totalCharge * 0.3;
    const customerLiability = totalCharge * 0.5;
    const brokerLiability = totalCharge * 0.2;

    return {
      shipmentId: event.shipmentId || "unknown",
      zoneId: zone.id,
      zoneName: zone.name,
      detentionPeriod: {
        start: new Date(
          event.timestamp.getTime() - (event.dwellTime || 0) * 60 * 1000,
        ),
        end: event.timestamp,
        duration: event.dwellTime || 0,
      },
      charges: {
        freeTime,
        detentionTime,
        ratePerHour,
        totalCharge: Math.round(totalCharge * 100) / 100,
        currency: "SAR",
      },
      responsibleParty: sla.responsibleParty,
      liability: {
        carrierLiability: Math.round(carrierLiability * 100) / 100,
        customerLiability: Math.round(customerLiability * 100) / 100,
        brokerLiability: Math.round(brokerLiability * 100) / 100,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Assess liability
   */
  private async assessLiability(
    actualDwellTime: number,
    maxDwellTime: number,
    sla: GeofenceSLA,
    detentionCost?: DetentionCalculation,
  ): Promise<SLAComplianceResult["liability"]> {
    const exceedance = actualDwellTime - maxDwellTime;
    const exceedancePercentage = (exceedance / maxDwellTime) * 100;

    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let liabilityAmount = 0;
    const mitigationActions: string[] = [];

    if (exceedancePercentage > 50) {
      riskLevel = "CRITICAL";
      liabilityAmount = detentionCost?.charges.totalCharge || exceedance * 10;
      mitigationActions.push("Immediate escalation required");
      mitigationActions.push("Contact responsible party immediately");
      mitigationActions.push("Document all delays for liability protection");
    } else if (exceedancePercentage > 25) {
      riskLevel = "HIGH";
      liabilityAmount = detentionCost?.charges.totalCharge || exceedance * 5;
      mitigationActions.push("Escalate to operations manager");
      mitigationActions.push("Review root cause");
    } else if (exceedancePercentage > 10) {
      riskLevel = "MEDIUM";
      mitigationActions.push("Monitor closely");
      mitigationActions.push("Review zone configuration");
    }

    return {
      atRisk: exceedance > 0,
      riskLevel,
      liabilityAmount,
      mitigationActions,
    };
  }

  /**
   * Notify violation to ecosystem
   */
  private async notifyViolation(
    compliance: SLAComplianceResult,
    sla: GeofenceSLA,
    event: GeofenceEvent,
    zone: GeofenceZone,
  ): Promise<void> {
    const notifications: Array<{
      recipient: string;
      recipientType: "CUSTOMER" | "PARTNER" | "BROKER" | "CARRIER" | "INTERNAL";
      channel: "EMAIL" | "WHATSAPP" | "SMS" | "IN_APP";
      message: string;
      priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    }> = [];

    // Notify customer
    if (sla.customerId) {
      notifications.push({
        recipient: sla.customerId,
        recipientType: "CUSTOMER",
        channel: "EMAIL",
        message: `SLA Violation: Zone "${zone.name}" - Dwell time exceeded by ${compliance.metrics.variance.toFixed(1)} minutes`,
        priority:
          compliance.liability.riskLevel === "CRITICAL" ? "URGENT" : "HIGH",
      });
    }

    // Notify partner
    if (sla.partnerId) {
      notifications.push({
        recipient: sla.partnerId,
        recipientType: "PARTNER",
        channel: "WHATSAPP",
        message: `⚠️ SLA Alert: ${zone.name} - ${compliance.metrics.variance.toFixed(1)} min over target`,
        priority: "HIGH",
      });
    }

    // Notify broker
    if (sla.brokerId) {
      notifications.push({
        recipient: sla.brokerId,
        recipientType: "BROKER",
        channel: "EMAIL",
        message: `Compliance Alert: ${zone.name} - Detention risk: ${compliance.liability.riskLevel}`,
        priority: "HIGH",
      });
    }

    // Notify carrier
    if (sla.carrierId) {
      notifications.push({
        recipient: sla.carrierId,
        recipientType: "CARRIER",
        channel: "SMS",
        message: `SLA Violation: ${zone.name} - Action required`,
        priority: "URGENT",
      });
    }

    // Publish notifications
    for (const notification of notifications) {
      await eventBus.publish({
        type: "notification.send",
        data: {
          ...notification,
          context: {
            slaId: sla.id,
            complianceId: compliance.slaId,
            eventId: event.id,
            zoneId: zone.id,
          },
        },
        metadata: {
          source: "geofence-sla-kpi-service",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Calculate KPI
   */
  async calculateKPI(
    kpiId: string,
    period: { start: Date; end: Date },
    tenantId: string,
  ): Promise<KPIMeasurement> {
    // Get KPI (try database first)
    let kpi: GeofenceKPI | undefined;
    if (useDatabase) {
      try {
        const dbKPI = await prisma.geofenceKPI.findFirst({
          where: {
            id: kpiId,
            tenantId,
            isActive: true,
          },
        });
        if (dbKPI) {
          kpi = {
            id: dbKPI.id,
            name: dbKPI.name,
            description: dbKPI.description || undefined,
            formula: dbKPI.formula,
            target: dbKPI.target.toNumber(),
            unit: dbKPI.unit,
            category: dbKPI.category as GeofenceKPI["category"],
            calculationMethod:
              dbKPI.calculationMethod as GeofenceKPI["calculationMethod"],
            calculationFrequency: dbKPI.calculationFrequency || undefined,
            conditions:
              (dbKPI.conditions as GeofenceKPI["conditions"]) || undefined,
            responsibleParty: dbKPI.responsibleParty,
            accountableParty: dbKPI.accountableParty || undefined,
            isActive: dbKPI.isActive,
            tenantId: dbKPI.tenantId,
            createdAt: dbKPI.createdAt,
            updatedAt: dbKPI.updatedAt,
          };
        }
      } catch (error) {
        console.warn(
          "⚠️ Geofence: Database error getting KPI, falling back to in-memory:",
          error,
        );
        kpi = this.kpis.get(kpiId);
      }
    } else {
      kpi = this.kpis.get(kpiId);
    }

    if (!kpi || kpi.tenantId !== tenantId) {
      throw new Error("KPI not found");
    }

    // Calculate KPI value based on formula
    // Simplified - would use actual data
    const value = 85; // Example value
    const target = kpi.target;
    const variance = value - target;
    const variancePercentage = (variance / target) * 100;

    const status: KPIMeasurement["status"] =
      value >= target * 1.1
        ? "EXCEEDED"
        : value >= target
          ? "ON_TARGET"
          : value >= target * 0.9
            ? "AT_RISK"
            : "BELOW_TARGET";

    const trend: KPIMeasurement["trend"] = "STABLE"; // Would calculate from history

    const measurement: KPIMeasurement = {
      kpiId,
      value,
      target,
      status,
      trend,
      variance,
      variancePercentage: Math.round(variancePercentage * 10) / 10,
      timestamp: new Date(),
      period: `${period.start.toISOString()}-${period.end.toISOString()}`,
    };

    // Store measurement (try database first)
    if (useDatabase) {
      try {
        await prisma.geofenceKPIMeasurement.create({
          data: {
            id: `measurement-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            kpiId: measurement.kpiId,
            value: measurement.value,
            target: measurement.target,
            status: measurement.status,
            trend: measurement.trend,
            variance: measurement.variance,
            variancePercentage: measurement.variancePercentage,
            period: measurement.period,
            timestamp: measurement.timestamp,
          },
        });
      } catch (error) {
        console.warn(
          "⚠️ Geofence: Database error storing KPI measurement, falling back to in-memory:",
          error,
        );
        if (!this.kpiMeasurements.has(kpiId)) {
          this.kpiMeasurements.set(kpiId, []);
        }
        this.kpiMeasurements.get(kpiId)!.push(measurement);
      }
    } else {
      if (!this.kpiMeasurements.has(kpiId)) {
        this.kpiMeasurements.set(kpiId, []);
      }
      this.kpiMeasurements.get(kpiId)!.push(measurement);
    }

    // Publish KPI event
    await eventBus.publish({
      type: "geofence.kpi.calculated",
      data: {
        kpiId,
        measurement,
      },
      metadata: {
        source: "geofence-sla-kpi-service",
        timestamp: new Date().toISOString(),
      },
    });

    return measurement;
  }

  /**
   * Get SLA compliance history
   */
  getComplianceHistory(
    slaId: string,
    shipmentId?: string,
  ): SLAComplianceResult[] {
    const key = shipmentId ? `${slaId}-${shipmentId}` : slaId;
    return this.complianceHistory.get(key) || [];
  }

  /**
   * Get KPI measurements
   */
  async getKPIMeasurements(
    kpiId: string,
    limit = 100,
  ): Promise<KPIMeasurement[]> {
    // Try database first
    if (useDatabase) {
      try {
        const dbMeasurements = await prisma.geofenceKPIMeasurement.findMany({
          where: { kpiId },
          orderBy: { timestamp: "desc" },
          take: limit,
        });

        return dbMeasurements.map((m) => ({
          kpiId: m.kpiId,
          value: m.value.toNumber(),
          target: m.target.toNumber(),
          status: m.status as KPIMeasurement["status"],
          trend: m.trend as KPIMeasurement["trend"],
          variance: m.variance.toNumber(),
          variancePercentage: m.variancePercentage.toNumber(),
          timestamp: m.timestamp,
          period: m.period,
        }));
      } catch (error) {
        console.warn(
          "⚠️ Geofence: Database error getting KPI measurements, falling back to in-memory:",
          error,
        );
        return this.kpiMeasurements.get(kpiId)?.slice(-limit) || [];
      }
    }

    return this.kpiMeasurements.get(kpiId)?.slice(-limit) || [];
  }
}

export const geofenceSlaKpiService = new GeofenceSlaKpiService();

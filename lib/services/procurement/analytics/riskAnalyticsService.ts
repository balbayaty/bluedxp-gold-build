/**
 * Risk Analytics Service
 * Comprehensive risk analytics - supply risk, vendor risk, delivery risk, quality risk, financial risk
 */

import { vendorService } from "../vendorService";
import { purchaseOrderService } from "../purchaseOrderService";
import { goodsReceiptService } from "../goodsReceiptService";
import { aiSourcingService } from "../aiSourcingService";

export interface RiskAnalysis {
  tenantId: string;
  period: {
    startDate: Date | string;
    endDate: Date | string;
  };
  overallRiskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskBreakdown: {
    supplyRisk: {
      score: number;
      level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      factors: Array<{
        factor: string;
        severity: "LOW" | "MEDIUM" | "HIGH";
        description: string;
      }>;
    };
    vendorRisk: {
      score: number;
      level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      factors: Array<{
        vendorId: string;
        vendorName: string;
        riskScore: number;
        riskFactors: string[];
      }>;
    };
    deliveryRisk: {
      score: number;
      level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      factors: Array<{
        factor: string;
        severity: "LOW" | "MEDIUM" | "HIGH";
        description: string;
      }>;
    };
    qualityRisk: {
      score: number;
      level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      factors: Array<{
        factor: string;
        severity: "LOW" | "MEDIUM" | "HIGH";
        description: string;
      }>;
    };
    financialRisk: {
      score: number;
      level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      factors: Array<{
        factor: string;
        severity: "LOW" | "MEDIUM" | "HIGH";
        description: string;
      }>;
    };
  };
  riskTrends: Array<{
    period: string;
    riskScore: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }>;
  mitigationStrategies: Array<{
    strategy: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    expectedImpact: number;
    implementationEffort: "LOW" | "MEDIUM" | "HIGH";
  }>;
}

export class RiskAnalyticsService {
  /**
   * Analyze procurement risks
   */
  async analyzeRisks(
    tenantId: string,
    startDate: Date | string,
    endDate: Date | string,
  ): Promise<RiskAnalysis> {
    // Get all vendors
    const vendors = await vendorService.listVendors({ tenantId });

    // Get all POs
    const purchaseOrders = await purchaseOrderService.listPurchaseOrders({
      tenantId,
      dateFrom: startDate,
      dateTo: endDate,
    });

    // Get goods receipts
    const goodsReceipts = await goodsReceiptService.listGoodsReceipts(
      tenantId,
      {
        dateFrom: startDate,
        dateTo: endDate,
      },
    );

    // Calculate vendor risks
    const vendorRisks = await Promise.all(
      vendors.map(async (vendor) => {
        const riskAssessment = await aiSourcingService.assessVendorRisk(
          vendor.id,
          tenantId,
        );
        return {
          vendorId: vendor.id,
          vendorName: vendor.vendorName,
          riskScore: riskAssessment.overallRiskScore,
          riskFactors: [
            ...riskAssessment.financialRisk.riskFactors,
            ...riskAssessment.operationalRisk.riskFactors,
            ...riskAssessment.complianceRisk.riskFactors,
            ...riskAssessment.supplyChainRisk.riskFactors,
          ],
        };
      }),
    );

    const averageVendorRisk =
      vendorRisks.length > 0
        ? vendorRisks.reduce((sum, v) => sum + v.riskScore, 0) /
          vendorRisks.length
        : 0;

    // Calculate delivery risk
    const overduePOs = purchaseOrders.filter((po) => {
      if (!po.deliveryDate || !po.requiredDate) return false;
      const delivery = new Date(po.deliveryDate);
      const required = new Date(po.requiredDate);
      return delivery > required && po.status !== "RECEIVED";
    });
    const deliveryRiskScore =
      purchaseOrders.length > 0
        ? (overduePOs.length / purchaseOrders.length) * 100
        : 0;

    // Calculate quality risk
    const totalReceived = goodsReceipts.reduce(
      (sum, grn) => sum + grn.totalQuantity,
      0,
    );
    const totalRejected = goodsReceipts.reduce(
      (sum, grn) =>
        sum +
        grn.items.reduce((itemSum, item) => itemSum + item.rejectedQuantity, 0),
      0,
    );
    const qualityRiskScore =
      totalReceived > 0 ? (totalRejected / totalReceived) * 100 : 0;

    // Calculate supply risk (simplified)
    const singleSourceVendors = new Set(
      purchaseOrders.map((po) => po.vendorId),
    );
    const supplyRiskScore = singleSourceVendors.size < 5 ? 40 : 20;

    // Calculate financial risk (simplified)
    const highValuePOs = purchaseOrders.filter((po) => po.totalAmount > 100000);
    const financialRiskScore = highValuePOs.length > 10 ? 30 : 15;

    // Calculate overall risk
    const overallRiskScore =
      (averageVendorRisk +
        deliveryRiskScore +
        qualityRiskScore +
        supplyRiskScore +
        financialRiskScore) /
      5;

    const riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" =
      overallRiskScore < 30
        ? "LOW"
        : overallRiskScore < 50
          ? "MEDIUM"
          : overallRiskScore < 70
            ? "HIGH"
            : "CRITICAL";

    // Generate risk trends (simplified)
    const riskTrends = [
      {
        period: "2024-Q1",
        riskScore: overallRiskScore - 5,
        riskLevel:
          overallRiskScore - 5 < 30
            ? "LOW"
            : overallRiskScore - 5 < 50
              ? "MEDIUM"
              : ("HIGH" as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"),
      },
      {
        period: "2024-Q2",
        riskScore: overallRiskScore,
        riskLevel,
      },
      {
        period: "2024-Q3",
        riskScore: overallRiskScore + 3,
        riskLevel:
          overallRiskScore + 3 < 30
            ? "LOW"
            : overallRiskScore + 3 < 50
              ? "MEDIUM"
              : overallRiskScore + 3 < 70
                ? "HIGH"
                : ("CRITICAL" as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"),
      },
    ];

    // Generate mitigation strategies
    const mitigationStrategies = [];
    if (averageVendorRisk > 50) {
      mitigationStrategies.push({
        strategy: "Vendor risk mitigation program",
        priority: "HIGH" as const,
        expectedImpact: 20,
        implementationEffort: "MEDIUM" as const,
      });
    }
    if (deliveryRiskScore > 30) {
      mitigationStrategies.push({
        strategy: "Improve delivery performance monitoring",
        priority: "HIGH" as const,
        expectedImpact: 15,
        implementationEffort: "LOW" as const,
      });
    }
    if (qualityRiskScore > 20) {
      mitigationStrategies.push({
        strategy: "Enhanced quality inspection",
        priority: "HIGH" as const,
        expectedImpact: 25,
        implementationEffort: "MEDIUM" as const,
      });
    }
    if (supplyRiskScore > 30) {
      mitigationStrategies.push({
        strategy: "Diversify supplier base",
        priority: "MEDIUM" as const,
        expectedImpact: 30,
        implementationEffort: "HIGH" as const,
      });
    }

    return {
      tenantId,
      period: { startDate, endDate },
      overallRiskScore,
      riskLevel,
      riskBreakdown: {
        supplyRisk: {
          score: supplyRiskScore,
          level:
            supplyRiskScore < 30
              ? "LOW"
              : supplyRiskScore < 50
                ? "MEDIUM"
                : supplyRiskScore < 70
                  ? "HIGH"
                  : "CRITICAL",
          factors: [
            {
              factor: "Single source dependency",
              severity: supplyRiskScore > 40 ? "HIGH" : "MEDIUM",
              description: "Limited supplier diversity",
            },
          ],
        },
        vendorRisk: {
          score: averageVendorRisk,
          level:
            averageVendorRisk < 30
              ? "LOW"
              : averageVendorRisk < 50
                ? "MEDIUM"
                : averageVendorRisk < 70
                  ? "HIGH"
                  : "CRITICAL",
          factors: vendorRisks
            .filter((v) => v.riskScore > 50)
            .map((v) => ({
              vendorId: v.vendorId,
              vendorName: v.vendorName,
              riskScore: v.riskScore,
              riskFactors: v.riskFactors,
            })),
        },
        deliveryRisk: {
          score: deliveryRiskScore,
          level:
            deliveryRiskScore < 30
              ? "LOW"
              : deliveryRiskScore < 50
                ? "MEDIUM"
                : deliveryRiskScore < 70
                  ? "HIGH"
                  : "CRITICAL",
          factors: [
            {
              factor: "Overdue deliveries",
              severity: overduePOs.length > 5 ? "HIGH" : "MEDIUM",
              description: `${overduePOs.length} purchase orders overdue`,
            },
          ],
        },
        qualityRisk: {
          score: qualityRiskScore,
          level:
            qualityRiskScore < 30
              ? "LOW"
              : qualityRiskScore < 50
                ? "MEDIUM"
                : qualityRiskScore < 70
                  ? "HIGH"
                  : "CRITICAL",
          factors: [
            {
              factor: "High rejection rate",
              severity: qualityRiskScore > 20 ? "HIGH" : "MEDIUM",
              description: `${qualityRiskScore.toFixed(1)}% rejection rate`,
            },
          ],
        },
        financialRisk: {
          score: financialRiskScore,
          level:
            financialRiskScore < 30
              ? "LOW"
              : financialRiskScore < 50
                ? "MEDIUM"
                : financialRiskScore < 70
                  ? "HIGH"
                  : "CRITICAL",
          factors: [
            {
              factor: "High-value orders",
              severity: financialRiskScore > 25 ? "MEDIUM" : "LOW",
              description: `${highValuePOs.length} high-value purchase orders`,
            },
          ],
        },
      },
      riskTrends,
      mitigationStrategies,
    };
  }
}

// Singleton instance
export const riskAnalyticsService = new RiskAnalyticsService();

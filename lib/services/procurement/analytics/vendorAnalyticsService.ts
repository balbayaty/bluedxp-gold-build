/**
 * Vendor Analytics Service
 * Comprehensive vendor analytics - performance metrics, scorecards, trends
 */

import { vendorService } from "../vendorService";
import { purchaseOrderService } from "../purchaseOrderService";
import { invoiceService } from "../invoiceService";
import { goodsReceiptService } from "../goodsReceiptService";
import type { VendorPerformance } from "@/types/vendor";
import type { PurchaseOrder } from "@/types/purchaseOrder";

export interface VendorAnalytics {
  vendorId: string;
  vendorName: string;
  period: {
    startDate: Date | string;
    endDate: Date | string;
  };
  performance: {
    overallScore: number;
    deliveryScore: number;
    qualityScore: number;
    costScore: number;
    serviceScore: number;
    rating: 1 | 2 | 3 | 4 | 5;
  };
  metrics: {
    totalOrders: number;
    totalSpend: number;
    averageOrderValue: number;
    onTimeDeliveryRate: number;
    qualityAcceptanceRate: number;
    averageLeadTime: number;
    defectRate?: number;
    rejectionRate?: number;
  };
  trends: VendorTrend[];
  comparison: {
    rank: number;
    percentile: number;
    vsAverage: {
      delivery: number;
      quality: number;
      cost: number;
    };
  };
}

export interface VendorTrend {
  period: string;
  overallScore: number;
  deliveryScore: number;
  qualityScore: number;
  costScore: number;
  serviceScore: number;
}

export interface VendorScorecard {
  vendorId: string;
  vendorName: string;
  period: string;
  scores: {
    delivery: {
      score: number;
      onTimeRate: number;
      leadTime: number;
      rating: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
    };
    quality: {
      score: number;
      acceptanceRate: number;
      defectRate: number;
      rating: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
    };
    cost: {
      score: number;
      competitiveness: number;
      priceTrend: "INCREASING" | "STABLE" | "DECREASING";
      rating: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
    };
    service: {
      score: number;
      responsiveness: number;
      communication: number;
      rating: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
    };
  };
  overallRating: 1 | 2 | 3 | 4 | 5;
  recommendations: string[];
}

export class VendorAnalyticsService {
  /**
   * Analyze vendor performance
   */
  async analyzeVendor(
    vendorId: string,
    tenantId: string,
    startDate: Date | string,
    endDate: Date | string,
  ): Promise<VendorAnalytics> {
    // Get vendor
    const vendor = await vendorService.getVendor(vendorId, tenantId);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    // Get vendor performance history
    const performances = await vendorService.getVendorPerformance(
      vendorId,
      tenantId,
    );
    const periodPerformances = performances.filter((p) => {
      const perfDate = new Date(p.startDate);
      return perfDate >= new Date(startDate) && perfDate <= new Date(endDate);
    });

    // Get POs
    const purchaseOrders = await purchaseOrderService.listPurchaseOrders({
      tenantId,
      vendorId,
      dateFrom: startDate,
      dateTo: endDate,
    });

    // Get invoices
    const invoices = await invoiceService.listInvoices(tenantId, {
      vendorId,
      dateFrom: startDate,
      dateTo: endDate,
    });

    // Get goods receipts
    const goodsReceipts = await goodsReceiptService.listGoodsReceipts(
      tenantId,
      {
        vendorId,
        dateFrom: startDate,
        dateTo: endDate,
      },
    );

    // Calculate metrics
    const totalOrders = purchaseOrders.length;
    const totalSpend = purchaseOrders.reduce(
      (sum, po) => sum + po.totalAmount,
      0,
    );
    const averageOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0;

    // Calculate on-time delivery rate
    const onTimeDeliveries = purchaseOrders.filter((po) => {
      if (!po.deliveryDate) return false;
      const deliveryDate = new Date(po.deliveryDate);
      const requiredDate = po.requiredDate
        ? new Date(po.requiredDate)
        : deliveryDate;
      return deliveryDate <= requiredDate;
    }).length;
    const onTimeDeliveryRate =
      totalOrders > 0 ? onTimeDeliveries / totalOrders : 0;

    // Calculate quality acceptance rate
    const totalReceived = goodsReceipts.reduce(
      (sum, grn) => sum + grn.totalQuantity,
      0,
    );
    const totalAccepted = goodsReceipts.reduce(
      (sum, grn) =>
        sum +
        grn.items.reduce((itemSum, item) => itemSum + item.acceptedQuantity, 0),
      0,
    );
    const qualityAcceptanceRate =
      totalReceived > 0 ? totalAccepted / totalReceived : 0;

    // Calculate average lead time (simplified)
    const leadTimes = purchaseOrders
      .filter((po) => po.confirmedDate && po.deliveryDate)
      .map((po) => {
        const confirmed = new Date(po.confirmedDate!);
        const delivered = new Date(po.deliveryDate!);
        return (
          (delivered.getTime() - confirmed.getTime()) / (1000 * 60 * 60 * 24)
        ); // Days
      });
    const averageLeadTime =
      leadTimes.length > 0
        ? leadTimes.reduce((sum, lt) => sum + lt, 0) / leadTimes.length
        : 0;

    // Calculate defect/rejection rate
    const totalRejected = goodsReceipts.reduce(
      (sum, grn) =>
        sum +
        grn.items.reduce((itemSum, item) => itemSum + item.rejectedQuantity, 0),
      0,
    );
    const defectRate = totalReceived > 0 ? totalRejected / totalReceived : 0;
    const rejectionRate = defectRate;

    // Get latest performance scores
    const latestPerformance = periodPerformances[periodPerformances.length - 1];
    const overallScore =
      latestPerformance?.overallScore || vendor.performanceScore || 0;
    const deliveryScore = latestPerformance?.deliveryScore || 0;
    const qualityScore = latestPerformance?.qualityScore || 0;
    const costScore = latestPerformance?.costScore || 0;
    const serviceScore = latestPerformance?.serviceScore || 0;
    const rating =
      latestPerformance?.rating ||
      (vendor.performanceScore
        ? (Math.ceil(vendor.performanceScore / 20) as 1 | 2 | 3 | 4 | 5)
        : 3);

    // Calculate trends
    const trends: VendorTrend[] = periodPerformances.map((perf) => ({
      period: perf.period,
      overallScore: perf.overallScore,
      deliveryScore: perf.deliveryScore,
      qualityScore: perf.qualityScore,
      costScore: perf.costScore,
      serviceScore: perf.serviceScore,
    }));

    // Calculate comparison (simplified - would compare with all vendors)
    const rank = 1; // Mock - would calculate actual rank
    const percentile = 85; // Mock - would calculate actual percentile

    return {
      vendorId,
      vendorName: vendor.vendorName,
      period: { startDate, endDate },
      performance: {
        overallScore,
        deliveryScore,
        qualityScore,
        costScore,
        serviceScore,
        rating,
      },
      metrics: {
        totalOrders,
        totalSpend,
        averageOrderValue,
        onTimeDeliveryRate,
        qualityAcceptanceRate,
        averageLeadTime,
        defectRate,
        rejectionRate,
      },
      trends,
      comparison: {
        rank,
        percentile,
        vsAverage: {
          delivery: deliveryScore - 75, // Mock - would compare with average
          quality: qualityScore - 80,
          cost: costScore - 70,
        },
      },
    };
  }

  /**
   * Generate vendor scorecard
   */
  async generateScorecard(
    vendorId: string,
    tenantId: string,
    period: string,
  ): Promise<VendorScorecard> {
    const vendor = await vendorService.getVendor(vendorId, tenantId);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    const performances = await vendorService.getVendorPerformance(
      vendorId,
      tenantId,
    );
    const periodPerformance = performances.find((p) => p.period === period);

    if (!periodPerformance) {
      throw new Error(`Performance data not found for period: ${period}`);
    }

    // Calculate ratings
    const getRating = (
      score: number,
    ): "EXCELLENT" | "GOOD" | "FAIR" | "POOR" => {
      if (score >= 90) return "EXCELLENT";
      if (score >= 75) return "GOOD";
      if (score >= 60) return "FAIR";
      return "POOR";
    };

    const deliveryRating = getRating(periodPerformance.deliveryScore);
    const qualityRating = getRating(periodPerformance.qualityScore);
    const costRating = getRating(periodPerformance.costScore);
    const serviceRating = getRating(periodPerformance.serviceScore);

    // Generate recommendations
    const recommendations: string[] = [];
    if (periodPerformance.deliveryScore < 75) {
      recommendations.push("Improve on-time delivery performance");
    }
    if (periodPerformance.qualityScore < 80) {
      recommendations.push("Address quality issues and reduce defect rate");
    }
    if (periodPerformance.costScore < 70) {
      recommendations.push("Improve cost competitiveness");
    }
    if (periodPerformance.serviceScore < 75) {
      recommendations.push("Enhance service responsiveness and communication");
    }
    if (recommendations.length === 0) {
      recommendations.push("Maintain current performance levels");
    }

    return {
      vendorId,
      vendorName: vendor.vendorName,
      period,
      scores: {
        delivery: {
          score: periodPerformance.deliveryScore,
          onTimeRate: periodPerformance.onTimeDeliveryRate,
          leadTime: periodPerformance.averageLeadTime,
          rating: deliveryRating,
        },
        quality: {
          score: periodPerformance.qualityScore,
          acceptanceRate: periodPerformance.qualityAcceptanceRate,
          defectRate: periodPerformance.defectRate || 0,
          rating: qualityRating,
        },
        cost: {
          score: periodPerformance.costScore,
          competitiveness: 80, // Mock
          priceTrend: "STABLE", // Mock
          rating: costRating,
        },
        service: {
          score: periodPerformance.serviceScore,
          responsiveness: 85, // Mock
          communication: 80, // Mock
          rating: serviceRating,
        },
      },
      overallRating: periodPerformance.rating,
      recommendations,
    };
  }
}

// Singleton instance
export const vendorAnalyticsService = new VendorAnalyticsService();

/**
 * Spend Analytics Service
 * Comprehensive spend analytics - category spend, vendor spend, project spend, trend analysis
 */

import { requisitionService } from "../requisitionService";
import { purchaseOrderService } from "../purchaseOrderService";
import { invoiceService } from "../invoiceService";
import type { Requisition } from "@/types/requisition";
import type { PurchaseOrder } from "@/types/purchaseOrder";
import type { Invoice } from "../invoiceService";

export interface SpendAnalysis {
  tenantId: string;
  period: {
    startDate: Date | string;
    endDate: Date | string;
  };
  totalSpend: number;
  currency: string;
  byCategory: Array<{
    category: string;
    spend: number;
    percentage: number;
    requisitionCount: number;
    poCount: number;
  }>;
  byVendor: Array<{
    vendorId: string;
    vendorName: string;
    spend: number;
    percentage: number;
    poCount: number;
    averageOrderValue: number;
  }>;
  byProject: Array<{
    projectId: string;
    projectName: string;
    spend: number;
    percentage: number;
    poCount: number;
  }>;
  trends: SpendTrend[];
}

export interface SpendTrend {
  period: string; // e.g., "2024-01"
  spend: number;
  requisitionCount: number;
  poCount: number;
  averageOrderValue: number;
}

export interface SavingsAnalysis {
  tenantId: string;
  period: {
    startDate: Date | string;
    endDate: Date | string;
  };
  realizedSavings: number;
  potentialSavings: number;
  savingsByCategory: Array<{
    category: string;
    realizedSavings: number;
    potentialSavings: number;
  }>;
  savingsByVendor: Array<{
    vendorId: string;
    vendorName: string;
    realizedSavings: number;
    potentialSavings: number;
  }>;
  savingsSources: Array<{
    source:
      | "NEGOTIATION"
      | "VOLUME_DISCOUNT"
      | "EARLY_PAYMENT"
      | "VENDOR_RATIONALIZATION";
    amount: number;
    percentage: number;
  }>;
}

export class SpendAnalyticsService {
  /**
   * Analyze spend
   */
  async analyzeSpend(
    tenantId: string,
    startDate: Date | string,
    endDate: Date | string,
    currency: string = "SAR",
  ): Promise<SpendAnalysis> {
    // Get all requisitions in period
    const requisitions = await requisitionService.listRequisitions({
      tenantId,
      dateFrom: startDate,
      dateTo: endDate,
      currency,
    });

    // Get all POs in period
    const purchaseOrders = await purchaseOrderService.listPurchaseOrders({
      tenantId,
      dateFrom: startDate,
      dateTo: endDate,
      currency,
    });

    // Get all invoices in period
    const invoices = await invoiceService.listInvoices(tenantId, {
      dateFrom: startDate,
      dateTo: endDate,
    });

    // Calculate total spend (from invoices or POs)
    const totalSpend = invoices
      .filter((inv) => inv.status === "APPROVED" || inv.status === "PAID")
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Analyze by category
    const categorySpend = new Map<
      string,
      { spend: number; reqCount: number; poCount: number }
    >();
    purchaseOrders.forEach((po) => {
      po.items.forEach((item) => {
        const category = item.category || "UNCATEGORIZED";
        const current = categorySpend.get(category) || {
          spend: 0,
          reqCount: 0,
          poCount: 0,
        };
        current.spend += item.totalPrice;
        current.poCount += 1;
        categorySpend.set(category, current);
      });
    });

    const byCategory = Array.from(categorySpend.entries()).map(
      ([category, data]) => ({
        category,
        spend: data.spend,
        percentage: totalSpend > 0 ? (data.spend / totalSpend) * 100 : 0,
        requisitionCount: data.reqCount,
        poCount: data.poCount,
      }),
    );

    // Analyze by vendor
    const vendorSpend = new Map<
      string,
      { vendorName: string; spend: number; poCount: number }
    >();
    purchaseOrders.forEach((po) => {
      const current = vendorSpend.get(po.vendorId) || {
        vendorName: po.vendorName,
        spend: 0,
        poCount: 0,
      };
      current.spend += po.totalAmount;
      current.poCount += 1;
      vendorSpend.set(po.vendorId, current);
    });

    const byVendor = Array.from(vendorSpend.entries()).map(
      ([vendorId, data]) => ({
        vendorId,
        vendorName: data.vendorName,
        spend: data.spend,
        percentage: totalSpend > 0 ? (data.spend / totalSpend) * 100 : 0,
        poCount: data.poCount,
        averageOrderValue: data.poCount > 0 ? data.spend / data.poCount : 0,
      }),
    );

    // Analyze by project
    const projectSpend = new Map<
      string,
      { projectName: string; spend: number; poCount: number }
    >();
    purchaseOrders
      .filter((po) => po.projectId)
      .forEach((po) => {
        const current = projectSpend.get(po.projectId!) || {
          projectName: po.projectName || "Unknown",
          spend: 0,
          poCount: 0,
        };
        current.spend += po.totalAmount;
        current.poCount += 1;
        projectSpend.set(po.projectId!, current);
      });

    const byProject = Array.from(projectSpend.entries()).map(
      ([projectId, data]) => ({
        projectId,
        projectName: data.projectName,
        spend: data.spend,
        percentage: totalSpend > 0 ? (data.spend / totalSpend) * 100 : 0,
        poCount: data.poCount,
      }),
    );

    // Calculate trends (monthly)
    const trends: SpendTrend[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        0,
      );

      const monthPOs = purchaseOrders.filter((po) => {
        const poDate = new Date(po.poDate);
        return poDate >= monthStart && poDate <= monthEnd;
      });

      const monthSpend = monthPOs.reduce((sum, po) => sum + po.totalAmount, 0);
      const avgOrderValue =
        monthPOs.length > 0 ? monthSpend / monthPOs.length : 0;

      trends.push({
        period: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`,
        spend: monthSpend,
        requisitionCount: requisitions.filter((req) => {
          const reqDate = new Date(req.createdAt);
          return reqDate >= monthStart && reqDate <= monthEnd;
        }).length,
        poCount: monthPOs.length,
        averageOrderValue: avgOrderValue,
      });

      current.setMonth(current.getMonth() + 1);
    }

    return {
      tenantId,
      period: { startDate, endDate },
      totalSpend,
      currency,
      byCategory,
      byVendor,
      byProject,
      trends,
    };
  }

  /**
   * Analyze savings
   */
  async analyzeSavings(
    tenantId: string,
    startDate: Date | string,
    endDate: Date | string,
    currency: string = "SAR",
  ): Promise<SavingsAnalysis> {
    // Get all POs
    const purchaseOrders = await purchaseOrderService.listPurchaseOrders({
      tenantId,
      dateFrom: startDate,
      dateTo: endDate,
      currency,
    });

    // Calculate realized savings (from discounts, negotiations, etc.)
    const realizedSavings = purchaseOrders.reduce((sum, po) => {
      return sum + (po.discountAmount || 0);
    }, 0);

    // Calculate potential savings (simplified - would use AI/ML in production)
    const potentialSavings = realizedSavings * 0.2; // Mock - 20% additional potential

    // Analyze savings by category
    const categorySavings = new Map<
      string,
      { realized: number; potential: number }
    >();
    purchaseOrders.forEach((po) => {
      po.items.forEach((item) => {
        const category = item.category || "UNCATEGORIZED";
        const current = categorySavings.get(category) || {
          realized: 0,
          potential: 0,
        };
        current.realized += item.discountAmount || 0;
        current.potential += (item.discountAmount || 0) * 0.2;
        categorySavings.set(category, current);
      });
    });

    const savingsByCategory = Array.from(categorySavings.entries()).map(
      ([category, data]) => ({
        category,
        realizedSavings: data.realized,
        potentialSavings: data.potential,
      }),
    );

    // Analyze savings by vendor
    const vendorSavings = new Map<
      string,
      { vendorName: string; realized: number; potential: number }
    >();
    purchaseOrders.forEach((po) => {
      const current = vendorSavings.get(po.vendorId) || {
        vendorName: po.vendorName,
        realized: 0,
        potential: 0,
      };
      current.realized += po.discountAmount || 0;
      current.potential += (po.discountAmount || 0) * 0.2;
      vendorSavings.set(po.vendorId, current);
    });

    const savingsByVendor = Array.from(vendorSavings.entries()).map(
      ([vendorId, data]) => ({
        vendorId,
        vendorName: data.vendorName,
        realizedSavings: data.realized,
        potentialSavings: data.potential,
      }),
    );

    // Savings sources (simplified)
    const savingsSources = [
      {
        source: "NEGOTIATION" as const,
        amount: realizedSavings * 0.5,
        percentage: 50,
      },
      {
        source: "VOLUME_DISCOUNT" as const,
        amount: realizedSavings * 0.3,
        percentage: 30,
      },
      {
        source: "EARLY_PAYMENT" as const,
        amount: realizedSavings * 0.2,
        percentage: 20,
      },
    ];

    return {
      tenantId,
      period: { startDate, endDate },
      realizedSavings,
      potentialSavings,
      savingsByCategory,
      savingsByVendor,
      savingsSources,
    };
  }
}

// Singleton instance
export const spendAnalyticsService = new SpendAnalyticsService();

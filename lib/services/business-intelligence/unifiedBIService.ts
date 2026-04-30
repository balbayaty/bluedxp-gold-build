/**
 * Unified BI Service
 * CENTRAL HUB aggregating analytics from all modules (NO DUPLICATION)
 * Reuses existing analytics services, doesn't duplicate data
 */

import { hrAnalyticsService } from "@/lib/services/hr/analytics/hrAnalyticsService";
import { unifiedFinanceService } from "@/lib/services/finance/integration/unifiedFinanceService";
import { unifiedCRMService } from "@/lib/services/crm/integration/unifiedCRMService";
import { unifiedProjectService } from "@/lib/services/project-management/integration/unifiedProjectService";
import type {
  UnifiedBIData,
  BIDashboard,
  BIWidget,
} from "@/types/business-intelligence";

// ============================================================================
// SERVICE
// ============================================================================

class UnifiedBIService {
  private dashboards: Map<string, BIDashboard> = new Map();

  /**
   * Get unified BI data
   * AGGREGATES from all module analytics services (read-only, no duplication)
   */
  async getUnifiedBIData(tenantId: string): Promise<UnifiedBIData> {
    // Aggregate from all modules (reuse existing services, no duplication)
    const [hrMetrics, financeMetrics, crmMetrics] = await Promise.all([
      this.getHRMetrics(tenantId),
      this.getFinanceMetrics(tenantId),
      this.getCRMMetrics(tenantId),
    ]);

    return {
      wms: {
        inventoryMetrics: {}, // Would fetch from WMS analytics service
        orderMetrics: {}, // Would fetch from WMS analytics service
        warehouseMetrics: {}, // Would fetch from WMS analytics service
      },
      hr: hrMetrics,
      finance: financeMetrics,
      crm: crmMetrics,
      qhse: {
        complianceMetrics: {}, // Would fetch from QHSE analytics service
        safetyMetrics: {}, // Would fetch from QHSE analytics service
        qualityMetrics: {}, // Would fetch from QHSE analytics service
      },
      facility: {
        assetMetrics: {}, // Would fetch from Facility analytics service
        maintenanceMetrics: {}, // Would fetch from Facility analytics service
        spaceMetrics: {}, // Would fetch from Facility analytics service
      },
      tms: {
        transportationMetrics: {}, // Would fetch from TMS analytics service
        shipmentMetrics: {}, // Would fetch from TMS analytics service
        carrierMetrics: {}, // Would fetch from TMS analytics service
      },
      project: {
        projectMetrics: {}, // Would fetch from Project analytics service
        resourceMetrics: {}, // Would fetch from Project analytics service
        budgetMetrics: {}, // Would fetch from Project analytics service
      },
    };
  }

  /**
   * Get HR metrics (reuse HR analytics service, no duplication)
   */
  private async getHRMetrics(tenantId: string): Promise<any> {
    try {
      // Reuse HR analytics service (no duplication)
      const analytics = await hrAnalyticsService.getAnalytics(tenantId);
      return {
        employeeMetrics: analytics.employeeMetrics,
        attendanceMetrics: analytics.attendanceMetrics,
        performanceMetrics: analytics.performanceMetrics,
      };
    } catch (error) {
      console.error("Error fetching HR metrics:", error);
      return {
        employeeMetrics: {},
        attendanceMetrics: {},
        performanceMetrics: {},
      };
    }
  }

  /**
   * Get Finance metrics (reuse Finance service, no duplication)
   */
  private async getFinanceMetrics(tenantId: string): Promise<any> {
    try {
      // Reuse Finance unified service (no duplication)
      const dashboard =
        await unifiedFinanceService.getFinancialDashboardSummary(tenantId);
      return {
        financialMetrics: {
          totalRevenue: dashboard.totalRevenue,
          totalExpenses: dashboard.totalExpenses,
          netIncome: dashboard.netIncome,
          cashBalance: dashboard.cashBalance,
        },
        budgetMetrics: {
          totalBudget: dashboard.budgets.total,
          actual: dashboard.budgets.actual,
          variance: dashboard.budgets.variance,
        },
        costMetrics: {}, // Would fetch from cost accounting service
      };
    } catch (error) {
      console.error("Error fetching Finance metrics:", error);
      return {
        financialMetrics: {},
        budgetMetrics: {},
        costMetrics: {},
      };
    }
  }

  /**
   * Get CRM metrics (reuse CRM service, no duplication)
   */
  private async getCRMMetrics(tenantId: string): Promise<any> {
    try {
      // Reuse CRM unified service (no duplication)
      const crmData = await unifiedCRMService.getUnifiedCRMData(tenantId);
      return {
        salesMetrics: {
          totalLeads: crmData.leads.length,
          activeOpportunities: crmData.opportunities.filter(
            (o) => o.stage !== "CLOSED_WON" && o.stage !== "CLOSED_LOST",
          ).length,
          pipelineValue: crmData.opportunities
            .filter(
              (o) => o.stage !== "CLOSED_WON" && o.stage !== "CLOSED_LOST",
            )
            .reduce((sum, o) => sum + o.value, 0),
        },
        pipelineMetrics: {
          stages: crmData.opportunities.reduce(
            (acc, opp) => {
              acc[opp.stage] = (acc[opp.stage] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          ),
        },
        customerMetrics: {
          totalAccounts: crmData.accounts.length,
          totalContacts: crmData.contacts.length,
        },
      };
    } catch (error) {
      console.error("Error fetching CRM metrics:", error);
      return {
        salesMetrics: {},
        pipelineMetrics: {},
        customerMetrics: {},
      };
    }
  }

  /**
   * Create BI dashboard
   */
  async createDashboard(input: {
    tenantId: string;
    name: string;
    description?: string;
    widgets: BIWidget[];
    createdBy: string;
  }): Promise<BIDashboard> {
    const dashboard: BIDashboard = {
      id: `bi-dashboard-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId: input.tenantId,
      name: input.name,
      description: input.description,
      widgets: input.widgets,
      layout: "grid",
      filters: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: input.createdBy,
    };

    this.dashboards.set(dashboard.id, dashboard);
    return dashboard;
  }

  /**
   * Get dashboard
   */
  async getDashboard(dashboardId: string): Promise<BIDashboard | null> {
    return this.dashboards.get(dashboardId) || null;
  }

  /**
   * Get dashboards
   */
  async getDashboards(tenantId: string): Promise<BIDashboard[]> {
    return Array.from(this.dashboards.values()).filter(
      (d) => d.tenantId === tenantId,
    );
  }

  /**
   * Execute widget query (reuses module services, no duplication)
   */
  async executeWidgetQuery(widget: BIWidget, filters?: any): Promise<any> {
    // Reuse existing module services based on widget dataSource
    // This is a simplified version - would route to appropriate service
    switch (widget.dataSource.module) {
      case "hr":
        return await this.getHRMetrics(filters?.tenantId || "default");
      case "finance":
        return await this.getFinanceMetrics(filters?.tenantId || "default");
      case "crm":
        return await this.getCRMMetrics(filters?.tenantId || "default");
      default:
        return {};
    }
  }
}

export const unifiedBIService = new UnifiedBIService();

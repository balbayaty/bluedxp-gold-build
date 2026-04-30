/**
 * 🔗 CROSS-MODULE MARKET DATA INTEGRATION
 * Connects market data with WMS, TMS, ISO-IMS, QHSE, and other modules
 * 
 * Shows how market changes impact your operations:
 * - Currency fluctuations → WMS inventory costs
 * - Freight indices → TMS transportation costs
 * - Commodity prices → Procurement costs
 * - Compliance costs → ISO-IMS budgets
 */

import { eventBus } from '@/lib/services/event-store';

export interface ModuleImpact {
  moduleId: string;
  moduleName: string;
  impactType: 'cost_increase' | 'cost_decrease' | 'efficiency_change' | 'compliance_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  estimatedImpact: number; // Percentage or dollar amount
  affectedAreas: string[];
  recommendations: string[];
  confidence: number; // 0-100
}

export interface CrossModuleAlert {
  id: string;
  title: string;
  message: string;
  modules: string[];
  severity: 'info' | 'warning' | 'critical';
  actionRequired: boolean;
  timestamp: Date;
}

export class CrossModuleIntegrationService {
  private static instance: CrossModuleIntegrationService;

  private constructor() {
    this.initializeEventSubscriptions();
  }

  static getInstance(): CrossModuleIntegrationService {
    if (!CrossModuleIntegrationService.instance) {
      CrossModuleIntegrationService.instance = new CrossModuleIntegrationService();
    }
    return CrossModuleIntegrationService.instance;
  }

  /**
   * Initialize event subscriptions to market data changes
   */
  private initializeEventSubscriptions(): void {
    // Subscribe to market data events
    eventBus.subscribe('market_data.quotes.fetched', async (event) => {
      await this.analyzeStockImpact(event.data);
    });

    eventBus.subscribe('market_data.supply_chain_impact', async (event) => {
      await this.propagateImpactToModules(event.data);
    });
  }

  /**
   * Analyze how currency changes affect WMS inventory valuation
   */
  async analyzeCurrencyImpactOnWMS(exchangeRates: any[]): Promise<ModuleImpact[]> {
    const impacts: ModuleImpact[] = [];

    for (const rate of exchangeRates) {
      // If currency weakened significantly
      if (Math.abs(rate.changePercent) > 2) {
        const impactType = rate.changePercent > 0 ? 'cost_increase' : 'cost_decrease';
        const severity = Math.abs(rate.changePercent) > 5 ? 'high' : 'medium';

        impacts.push({
          moduleId: 'wms',
          moduleName: 'Warehouse Management',
          impactType,
          severity: severity as any,
          description: `${rate.toCurrency} exchange rate ${rate.changePercent > 0 ? 'increased' : 'decreased'} by ${Math.abs(rate.changePercent).toFixed(2)}%, affecting inventory valued in ${rate.toCurrency}`,
          estimatedImpact: Math.abs(rate.changePercent),
          affectedAreas: [
            'Inventory Valuation',
            'Import Costs',
            'SKU Pricing',
            'Stock Value Reporting'
          ],
          recommendations: [
            'Review inventory valuation for foreign-sourced products',
            'Update pricing strategies for affected SKUs',
            'Consider hedging currency exposure',
            'Revalue international supplier contracts'
          ],
          confidence: 85,
        });

        // Publish event for WMS module
        await this.publishModuleImpactEvent('wms', impacts[impacts.length - 1]);
      }
    }

    return impacts;
  }

  /**
   * Analyze how freight indices affect TMS costs
   */
  async analyzeFreightImpactOnTMS(freightIndices: any[]): Promise<ModuleImpact[]> {
    const impacts: ModuleImpact[] = [];

    for (const index of freightIndices) {
      if (index.changePercent && Math.abs(index.changePercent) > 3) {
        const impactType = index.changePercent > 0 ? 'cost_increase' : 'cost_decrease';
        const severity = Math.abs(index.changePercent) > 10 ? 'critical' : 
                        Math.abs(index.changePercent) > 5 ? 'high' : 'medium';

        impacts.push({
          moduleId: 'tms',
          moduleName: 'Transportation Management',
          impactType,
          severity: severity as any,
          description: `${index.name} ${index.changePercent > 0 ? 'increased' : 'decreased'} by ${Math.abs(index.changePercent).toFixed(2)}%, impacting ${index.category} transportation costs`,
          estimatedImpact: Math.abs(index.changePercent),
          affectedAreas: [
            'Freight Rates',
            'Carrier Pricing',
            'Route Planning',
            'Transportation Budget'
          ],
          recommendations: [
            'Review carrier contracts and rates',
            'Optimize routes to reduce mileage',
            'Consider alternative transportation modes',
            'Negotiate fuel surcharge adjustments',
            'Increase shipment consolidation'
          ],
          confidence: 90,
        });

        await this.publishModuleImpactEvent('tms', impacts[impacts.length - 1]);
      }
    }

    return impacts;
  }

  /**
   * Analyze commodity price impact on Procurement
   */
  async analyzeCommodityImpactOnProcurement(commodities: any[]): Promise<ModuleImpact[]> {
    const impacts: ModuleImpact[] = [];

    for (const commodity of commodities) {
      if (Math.abs(commodity.changePercent) > 5) {
        const impactType = commodity.changePercent > 0 ? 'cost_increase' : 'cost_decrease';
        const severity = Math.abs(commodity.changePercent) > 15 ? 'critical' :
                        Math.abs(commodity.changePercent) > 10 ? 'high' : 'medium';

        impacts.push({
          moduleId: 'procurement',
          moduleName: 'Procurement',
          impactType,
          severity: severity as any,
          description: `${commodity.commodity} prices ${commodity.changePercent > 0 ? 'surged' : 'dropped'} by ${Math.abs(commodity.changePercent).toFixed(2)}%, affecting raw material costs`,
          estimatedImpact: Math.abs(commodity.changePercent),
          affectedAreas: [
            'Raw Material Costs',
            'Supplier Pricing',
            'Purchase Orders',
            'Budget Planning'
          ],
          recommendations: [
            commodity.changePercent > 0 ? 
              'Lock in long-term contracts before further increases' : 
              'Opportunity to renegotiate supplier contracts',
            'Review and adjust procurement budgets',
            'Consider alternative materials or suppliers',
            'Implement strategic stockpiling if prices are favorable'
          ],
          confidence: 85,
        });

        await this.publishModuleImpactEvent('procurement', impacts[impacts.length - 1]);
      }
    }

    return impacts;
  }

  /**
   * Analyze compliance cost impact on ISO-IMS
   */
  async analyzeComplianceImpactOnISOIMS(marketData: any): Promise<ModuleImpact[]> {
    const impacts: ModuleImpact[] = [];

    // Check if inflation (CPI) is high
    if (marketData.cpi && marketData.cpi.changePercent > 2) {
      impacts.push({
        moduleId: 'iso-ims',
        moduleName: 'ISO-IMS',
        impactType: 'cost_increase',
        severity: marketData.cpi.changePercent > 5 ? 'high' : 'medium',
        description: `Inflation rate increased by ${marketData.cpi.changePercent.toFixed(2)}%, affecting compliance and audit costs`,
        estimatedImpact: marketData.cpi.changePercent,
        affectedAreas: [
          'Audit Costs',
          'Certification Fees',
          'Training Expenses',
          'Compliance Budget'
        ],
        recommendations: [
          'Review and adjust compliance budgets for inflation',
          'Negotiate multi-year audit contracts',
          'Optimize certification schedules',
          'Consider virtual training to reduce costs'
        ],
        confidence: 75,
      });

      await this.publishModuleImpactEvent('iso-ims', impacts[impacts.length - 1]);
    }

    return impacts;
  }

  /**
   * Get consolidated impact dashboard across all modules
   */
  async getConsolidatedImpactDashboard(): Promise<{
    totalImpacts: number;
    byModule: Record<string, ModuleImpact[]>;
    bySeverity: Record<string, number>;
    topRecommendations: string[];
  }> {
    // This would fetch actual impacts from database/cache
    // For now, returning structure
    return {
      totalImpacts: 0,
      byModule: {},
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      topRecommendations: [],
    };
  }

  /**
   * Create cross-module alert
   */
  async createCrossModuleAlert(
    title: string,
    message: string,
    modules: string[],
    severity: 'info' | 'warning' | 'critical'
  ): Promise<CrossModuleAlert> {
    const alert: CrossModuleAlert = {
      id: `alert-${Date.now()}`,
      title,
      message,
      modules,
      severity,
      actionRequired: severity === 'critical',
      timestamp: new Date(),
    };

    // Publish alert event
    await eventBus.publish({
      type: 'cross_module.alert.created',
      payload: alert,
    });

    return alert;
  }

  // ==================== PRIVATE METHODS ====================

  private async analyzeStockImpact(data: any): Promise<void> {
    // Analyze how stock price changes affect logistics costs
    // E.g., FedEx stock up = potential rate increases
  }

  private async propagateImpactToModules(impact: any): Promise<void> {
    // Propagate supply chain impacts to relevant modules
    const affectedModules = this.determineAffectedModules(impact);
    
    for (const moduleId of affectedModules) {
      await this.publishModuleImpactEvent(moduleId, {
        moduleId,
        moduleName: this.getModuleName(moduleId),
        impactType: impact.impactType,
        severity: impact.impactSeverity,
        description: impact.description,
        estimatedImpact: Math.abs(impact.marketChange),
        affectedAreas: [impact.impactedArea],
        recommendations: impact.recommendations,
        confidence: impact.confidence,
      });
    }
  }

  private determineAffectedModules(impact: any): string[] {
    const modules: string[] = [];

    switch (impact.impactedArea) {
      case 'transportation':
        modules.push('tms', 'wms');
        break;
      case 'warehousing':
        modules.push('wms');
        break;
      case 'procurement':
        modules.push('procurement', 'wms');
        break;
      case 'operations':
        modules.push('wms', 'tms', 'qhse');
        break;
    }

    return modules;
  }

  private getModuleName(moduleId: string): string {
    const names: Record<string, string> = {
      wms: 'Warehouse Management',
      tms: 'Transportation Management',
      'iso-ims': 'ISO-IMS',
      qhse: 'QHSE',
      procurement: 'Procurement',
      finance: 'Finance',
    };
    return names[moduleId] || moduleId;
  }

  private async publishModuleImpactEvent(moduleId: string, impact: ModuleImpact): Promise<void> {
    try {
      await eventBus.publish({
        type: `module.${moduleId}.market_impact`,
        payload: impact,
      });
    } catch (error) {
      console.error(`Error publishing impact event for ${moduleId}:`, error);
    }
  }
}

// Export singleton instance
export const crossModuleIntegration = CrossModuleIntegrationService.getInstance();

export default crossModuleIntegration;

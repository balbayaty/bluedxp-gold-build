/**
 * Unified CRM Integration Service
 * CENTRAL HUB that reuses WMS customers (NO DUPLICATION)
 * Aggregates CRM data from all modules
 */

import { accountService } from "../accountService";
import { leadService } from "../leadService";
import { opportunityService } from "../opportunityService";
import { contactService } from "../contactService";
import { activityService } from "../activityService";
import { salesForecastService } from "../salesForecastService";
import { eventBus } from "@/lib/services/event-bus";
import type { UnifiedCRMData, CRMAccount, CRMIntegration } from "@/types/crm";

// ============================================================================
// SERVICE
// ============================================================================

class UnifiedCRMService {
  // Reuse existing services (NO DUPLICATION)
  private accountServiceInstance = accountService;
  private leadServiceInstance = leadService;
  private opportunityServiceInstance = opportunityService;
  private contactServiceInstance = contactService;
  private activityServiceInstance = activityService;
  private forecastServiceInstance = salesForecastService;

  private integrations: Map<string, CRMIntegration> = new Map();

  /**
   * Get unified CRM data
   * AGGREGATES existing data (NO DUPLICATION)
   */
  async getUnifiedCRMData(tenantId: string): Promise<UnifiedCRMData> {
    // Get accounts (extends WMS customers - no duplication)
    const accounts = await this.accountServiceInstance.getAccounts(tenantId);

    // Get leads
    const leads = await this.leadServiceInstance.getLeads({ tenantId });

    // Get opportunities
    const opportunities =
      await this.opportunityServiceInstance.getOpportunities({ tenantId });

    // Get contacts
    const contacts = await this.contactServiceInstance.getContacts({
      tenantId,
    });

    // Get activities
    const activities = await this.activityServiceInstance.getActivities({
      tenantId,
    });

    // Get forecast
    const forecast = await this.forecastServiceInstance.generateForecast({
      tenantId,
      period: {
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString(),
        endDate: new Date().toISOString(),
      },
      forecastType: "PIPELINE",
    });

    return {
      accounts,
      leads,
      opportunities,
      contacts,
      activities,
      forecast,
    };
  }

  /**
   * Get unified customer view (account + opportunities + activities)
   */
  async getUnifiedCustomerView(
    accountId: string,
    customer: any,
  ): Promise<{
    account: CRMAccount;
    opportunities: any[];
    contacts: any[];
    activities: any[];
  }> {
    // Get account (extends customer - no duplication)
    const account = await this.accountServiceInstance.getAccount(
      accountId,
      customer,
    );

    // Get related opportunities
    const opportunities =
      await this.opportunityServiceInstance.getOpportunities({
        tenantId: customer.tenantId,
        accountId,
      });

    // Get contacts
    const contacts = await this.contactServiceInstance.getContacts({
      tenantId: customer.tenantId,
      accountId,
    });

    // Get activities
    const activities = await this.activityServiceInstance.getActivities({
      tenantId: customer.tenantId,
      relatedToType: "ACCOUNT",
      relatedToId: accountId,
    });

    return {
      account,
      opportunities,
      contacts,
      activities,
    };
  }

  /**
   * Get CRM integrations
   */
  async getCRMIntegrations(tenantId: string): Promise<CRMIntegration[]> {
    return Array.from(this.integrations.values()).filter((i) => {
      const key = `${tenantId}-${i.module}`;
      return this.integrations.has(key);
    });
  }
}

export const unifiedCRMService = new UnifiedCRMService();

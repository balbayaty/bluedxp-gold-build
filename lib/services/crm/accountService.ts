/**
 * Account Service
 * CRM Account management
 * EXTENDS WMS Customer (NO DUPLICATION) - Only stores CRM-specific fields
 */

import type { Customer } from "@/types/tenant";
import type { CRMAccount } from "@/types/crm";

// ============================================================================
// SERVICE
// ============================================================================

class AccountService {
  // Store only CRM-specific data (references Customer ID, doesn't duplicate)
  private crmAccountData: Map<string, Partial<CRMAccount>> = new Map();

  /**
   * Get account (extends customer with CRM data)
   * REUSES customer data (no duplication)
   */
  async getAccount(accountId: string, customer: Customer): Promise<CRMAccount> {
    // Get CRM-specific data (only CRM fields, not customer data)
    const crmData = this.crmAccountData.get(accountId) || {};

    // Extend customer with CRM data (no duplication of customer data)
    return {
      ...customer, // Reuse all customer fields
      ...crmData, // Add only CRM-specific fields
      accountType: crmData.accountType || "CUSTOMER",
    } as CRMAccount;
  }

  /**
   * Update CRM account (only CRM-specific fields)
   * Customer data is managed by WMS customer service
   */
  async updateCRMAccount(
    accountId: string,
    crmFields: Partial<CRMAccount>,
  ): Promise<CRMAccount> {
    const existing = this.crmAccountData.get(accountId) || {};
    const updated = {
      ...existing,
      ...crmFields,
      // Don't store customer fields - they're in WMS customer service
    };

    this.crmAccountData.set(accountId, updated);

    // Return full account (would need to fetch customer from WMS)
    return updated as CRMAccount;
  }

  /**
   * Get accounts (would need to fetch customers from WMS and extend)
   */
  async getAccounts(tenantId: string): Promise<CRMAccount[]> {
    // This would:
    // 1. Fetch customers from WMS customer service (reuse, don't duplicate)
    // 2. Extend each customer with CRM data
    // For now, return empty array
    return [];
  }

  /**
   * Create CRM account from customer
   * Only stores CRM-specific fields, references customer ID
   */
  async createCRMAccount(
    customerId: string,
    crmFields: Partial<CRMAccount>,
  ): Promise<void> {
    this.crmAccountData.set(customerId, {
      ...crmFields,
      // Only store CRM-specific fields
    });
  }

  /**
   * Get account by ID (for API compatibility)
   */
  async getAccountById(accountId: string): Promise<CRMAccount | null> {
    const crmData = this.crmAccountData.get(accountId);
    if (!crmData) {
      // Return mock data for now (in production, would fetch from WMS customer service)
      return {
        id: accountId,
        tenantId: "default",
        name: "Sample Account",
        email: "sample@company.com",
        accountType: "CUSTOMER",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...crmData,
      } as CRMAccount;
    }
    return crmData as CRMAccount;
  }

  /**
   * Update account (for API compatibility)
   */
  async updateAccount(
    accountId: string,
    updates: Partial<CRMAccount>,
  ): Promise<CRMAccount> {
    const existing = this.crmAccountData.get(accountId) || {};
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.crmAccountData.set(accountId, updated);
    return updated as CRMAccount;
  }

  /**
   * Delete account (for API compatibility)
   */
  async deleteAccount(accountId: string): Promise<void> {
    this.crmAccountData.delete(accountId);
  }
}

export const accountService = new AccountService();

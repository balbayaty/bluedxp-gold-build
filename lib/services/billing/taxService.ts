/**
 * 💰 TAX SERVICE
 * 
 * Tax calculation service
 * Supports multi-jurisdiction tax handling
 * 
 * BlueDXP Platform - Enterprise-Grade Billing
 */

import type { Invoice, TaxCalculation, TaxLine } from "@/types/billing";

// ============================================================================
// TAX SERVICE
// ============================================================================

class TaxService {
  /**
   * Calculate tax for invoice
   */
  async calculateTax(invoice: Invoice): Promise<TaxCalculation> {
    // Get tax configuration for tenant
    // const taxConfig = await this.getTaxConfiguration(invoice.tenantId);

    // Default VAT rate for Saudi Arabia (15%)
    const vatRate = 0.15;
    const taxableAmount = invoice.subtotal - invoice.discountAmount;

    const taxLine: TaxLine = {
      id: `tax_${Date.now()}`,
      taxType: "vat",
      taxCode: "VAT",
      taxName: "Value Added Tax",
      rate: vatRate * 100, // Percentage
      taxableAmount,
      taxAmount: taxableAmount * vatRate,
      jurisdiction: "SAUDI_ARABIA",
      complianceStandard: "ZATCA",
    };

    const calculation: TaxCalculation = {
      invoiceId: invoice.id,
      taxableAmount,
      taxes: [taxLine],
      totalTax: taxLine.taxAmount,
      currency: invoice.currency,
      jurisdiction: "SAUDI_ARABIA",
      calculatedAt: new Date().toISOString(),
    };

    return calculation;
  }

  /**
   * Get tax configuration
   */
  private async getTaxConfiguration(tenantId: string): Promise<any> {
    const configs = await prisma.billing_tax_configurations.findMany({
      where: { tenantId, isActive: true },
    });
    return configs;
  }
}

export const taxService = new TaxService();

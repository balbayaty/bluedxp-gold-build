/**
 * Tax Management Service
 * Comprehensive tax management - VAT, Income Tax, ZATCA compliance, tax calculations
 */

import { eventBus } from "@/lib/services/event-store";
import { generalLedgerService } from "./generalLedgerService";
import type { DomainEvent } from "@/types/cqrs";
import type {
  TaxConfiguration,
  TaxTransaction,
  TaxReturn,
} from "@/types/finance";

export class TaxManagementService {
  private taxConfigs: Map<string, TaxConfiguration> = new Map();
  private taxTransactions: Map<string, TaxTransaction> = new Map();
  private taxReturns: Map<string, TaxReturn> = new Map();

  /**
   * Configure tax
   */
  async configureTax(
    tenantId: string,
    config: Omit<TaxConfiguration, "id" | "createdAt" | "updatedAt">,
  ): Promise<TaxConfiguration> {
    const configId = `tax-config-${Date.now()}`;
    const taxConfig: TaxConfiguration = {
      ...config,
      id: configId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.taxConfigs.set(configId, taxConfig);

    await eventBus.publish({
      type: "finance.tax.configured",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        configId,
        taxType: config.taxType,
        rate: config.rate,
      },
    } as DomainEvent);

    return taxConfig;
  }

  /**
   * Calculate tax
   */
  async calculateTax(
    tenantId: string,
    taxableAmount: number,
    taxType: string,
    transactionType: TaxTransaction["transactionType"],
    date: Date | string,
  ): Promise<{
    taxAmount: number;
    taxCode: string;
    taxRate: number;
  }> {
    // Find applicable tax configuration
    const configs = Array.from(this.taxConfigs.values())
      .filter(
        (c) => c.tenantId === tenantId && c.taxType === taxType && c.isActive,
      )
      .filter((c) => {
        const effectiveDate = new Date(c.effectiveDate);
        const expiryDate = c.expiryDate ? new Date(c.expiryDate) : null;
        const transactionDate = new Date(date);
        return (
          transactionDate >= effectiveDate &&
          (!expiryDate || transactionDate <= expiryDate)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.effectiveDate).getTime() -
          new Date(a.effectiveDate).getTime(),
      );

    const config = configs[0];
    if (!config) {
      throw new Error(`No active tax configuration found for ${taxType}`);
    }

    const taxAmount = taxableAmount * (config.rate / 100);

    return {
      taxAmount,
      taxCode: config.taxCode,
      taxRate: config.rate,
    };
  }

  /**
   * Record tax transaction
   */
  async recordTaxTransaction(
    tenantId: string,
    transaction: Omit<TaxTransaction, "id" | "status" | "createdAt">,
  ): Promise<TaxTransaction> {
    const transactionId = `tax-txn-${Date.now()}`;
    const taxTransaction: TaxTransaction = {
      ...transaction,
      id: transactionId,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
    };

    this.taxTransactions.set(transactionId, taxTransaction);

    // Create GL entry for tax
    const taxAccountCode =
      transaction.transactionType === "SALE" ||
      transaction.transactionType === "INCOME"
        ? "OUTPUT_TAX_PAYABLE"
        : "INPUT_TAX_RECOVERABLE";

    await generalLedgerService.createJournalEntry({
      tenantId,
      entryDate: transaction.taxDate,
      description: `Tax Transaction: ${transaction.taxType}`,
      lines: [
        {
          accountCode: taxAccountCode,
          accountName: transaction.taxType,
          debit:
            transaction.transactionType === "PURCHASE" ||
            transaction.transactionType === "EXPENSE"
              ? transaction.taxAmount
              : 0,
          credit:
            transaction.transactionType === "SALE" ||
            transaction.transactionType === "INCOME"
              ? transaction.taxAmount
              : 0,
          description: `Tax ${transaction.taxType} - ${transaction.taxCode}`,
        },
        {
          accountCode:
            transaction.transactionType === "SALE" ||
            transaction.transactionType === "INCOME"
              ? "TAX_EXPENSE"
              : "TAX_RECOVERABLE",
          accountName: "Tax",
          debit:
            transaction.transactionType === "SALE" ||
            transaction.transactionType === "INCOME"
              ? transaction.taxAmount
              : 0,
          credit:
            transaction.transactionType === "PURCHASE" ||
            transaction.transactionType === "EXPENSE"
              ? transaction.taxAmount
              : 0,
        },
      ],
      currency: transaction.currency,
      createdBy: "system",
    });

    taxTransaction.status = "POSTED";
    taxTransaction.glEntryId = "gl-entry-id"; // Would be from GL service

    await eventBus.publish({
      type: "finance.tax.transaction.recorded",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        transactionId,
        taxType: transaction.taxType,
        taxAmount: transaction.taxAmount,
      },
    } as DomainEvent);

    return taxTransaction;
  }

  /**
   * Generate tax return
   */
  async generateTaxReturn(
    tenantId: string,
    returnType: TaxReturn["returnType"],
    period: { startDate: Date | string; endDate: Date | string },
  ): Promise<TaxReturn> {
    const transactions = Array.from(this.taxTransactions.values())
      .filter((t) => t.tenantId === tenantId && t.status === "POSTED")
      .filter((t) => {
        const taxDate = new Date(t.taxDate);
        const startDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);
        return taxDate >= startDate && taxDate <= endDate;
      });

    const salesTransactions = transactions.filter(
      (t) => t.transactionType === "SALE" || t.transactionType === "INCOME",
    );
    const purchaseTransactions = transactions.filter(
      (t) =>
        t.transactionType === "PURCHASE" || t.transactionType === "EXPENSE",
    );

    const totalSales = salesTransactions.reduce(
      (sum, t) => sum + t.taxableAmount,
      0,
    );
    const totalPurchases = purchaseTransactions.reduce(
      (sum, t) => sum + t.taxableAmount,
      0,
    );
    const outputTax = salesTransactions.reduce(
      (sum, t) => sum + t.taxAmount,
      0,
    );
    const inputTax = purchaseTransactions.reduce(
      (sum, t) => sum + t.taxAmount,
      0,
    );
    const netTaxPayable = outputTax - inputTax;

    const returnId = `tax-return-${Date.now()}`;
    const taxReturn: TaxReturn = {
      id: returnId,
      tenantId,
      returnType,
      period,
      totalSales,
      totalPurchases,
      outputTax,
      inputTax,
      netTaxPayable,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
    };

    this.taxReturns.set(returnId, taxReturn);

    await eventBus.publish({
      type: "finance.tax.return.generated",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        returnId,
        returnType,
        netTaxPayable,
      },
    } as DomainEvent);

    return taxReturn;
  }

  /**
   * Submit tax return (ZATCA compliance)
   */
  async submitTaxReturn(
    tenantId: string,
    returnId: string,
  ): Promise<TaxReturn> {
    const taxReturn = this.taxReturns.get(returnId);
    if (!taxReturn) {
      throw new Error("Tax return not found");
    }

    // Validate tax return before submission
    if (taxReturn.status !== "DRAFT") {
      throw new Error(`Cannot submit tax return in ${taxReturn.status} status`);
    }

    // Prepare ZATCA submission payload
    const zatcaPayload = {
      returnType: taxReturn.returnType,
      period: taxReturn.period,
      totalSales: taxReturn.totalSales,
      totalPurchases: taxReturn.totalPurchases,
      outputTax: taxReturn.outputTax,
      inputTax: taxReturn.inputTax,
      netTaxPayable: taxReturn.netTaxPayable,
      currency: "SAR",
      submissionDate: new Date().toISOString(),
    };

    try {
      // Check if ZATCA adapter is available (in production)
      const zatcaEnabled = process.env.ZATCA_API_ENABLED === "true";
      const zatcaApiUrl = process.env.ZATCA_API_URL;
      const zatcaApiKey = process.env.ZATCA_API_KEY;

      if (zatcaEnabled && zatcaApiUrl && zatcaApiKey) {
        // Submit to ZATCA API
        const response = await fetch(`${zatcaApiUrl}/tax-returns`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${zatcaApiKey}`,
          },
          body: JSON.stringify(zatcaPayload),
        });

        if (!response.ok) {
          throw new Error(`ZATCA API error: ${response.status}`);
        }

        const result = await response.json();
        taxReturn.zatcaReferenceNumber = result.referenceNumber;
        console.log(
          "✅ Tax return submitted to ZATCA:",
          result.referenceNumber,
        );
      } else {
        // Sandbox mode - simulate submission
        taxReturn.zatcaReferenceNumber = `ZATCA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        console.log(
          "📝 Tax return prepared for ZATCA (sandbox mode):",
          taxReturn.zatcaReferenceNumber,
        );
      }
    } catch (error) {
      console.error("ZATCA submission error:", error);
      // Don't fail - mark as pending review
      taxReturn.status = "PENDING_REVIEW";
      taxReturn.zatcaError =
        error instanceof Error ? error.message : "Unknown error";
      return taxReturn;
    }

    taxReturn.status = "SUBMITTED";
    taxReturn.submittedAt = new Date().toISOString();
    taxReturn.submittedBy = "system";

    await eventBus.publish({
      type: "finance.tax.return.submitted",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        returnId,
        returnType: taxReturn.returnType,
        zatcaReference: taxReturn.zatcaReferenceNumber,
      },
    } as DomainEvent);

    return taxReturn;
  }

  /**
   * Get tax transactions
   */
  async getTaxTransactions(
    tenantId: string,
    filters?: {
      taxType?: string;
      transactionType?: TaxTransaction["transactionType"];
      startDate?: Date | string;
      endDate?: Date | string;
    },
  ): Promise<TaxTransaction[]> {
    let transactions = Array.from(this.taxTransactions.values()).filter(
      (t) => t.tenantId === tenantId,
    );

    if (filters?.taxType) {
      transactions = transactions.filter((t) => t.taxType === filters.taxType);
    }
    if (filters?.transactionType) {
      transactions = transactions.filter(
        (t) => t.transactionType === filters.transactionType,
      );
    }
    if (filters?.startDate) {
      transactions = transactions.filter(
        (t) => new Date(t.taxDate) >= new Date(filters.startDate!),
      );
    }
    if (filters?.endDate) {
      transactions = transactions.filter(
        (t) => new Date(t.taxDate) <= new Date(filters.endDate!),
      );
    }

    return transactions;
  }
}

// Singleton instance
export const taxManagementService = new TaxManagementService();

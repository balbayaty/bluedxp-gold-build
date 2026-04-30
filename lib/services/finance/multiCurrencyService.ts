/**
 * Multi-Currency Accounting Service
 * Multi-currency GL, FX revaluation, currency translation, gain/loss calculation
 */

import { eventBus } from "@/lib/services/event-store";
import { generalLedgerService } from "./generalLedgerService";
import type { DomainEvent } from "@/types/cqrs";
import type {
  CurrencyConfiguration,
  ExchangeRate,
  CurrencyRevaluation,
} from "@/types/finance";

// TODO: Import Currency Management Service from Procurement (ZERO DUPLICATION)

export class MultiCurrencyService {
  private currencyConfigs: Map<string, CurrencyConfiguration> = new Map();
  private exchangeRates: Map<string, ExchangeRate> = new Map();
  private revaluations: Map<string, CurrencyRevaluation> = new Map();

  /**
   * Configure currency
   */
  async configureCurrency(
    tenantId: string,
    config: Omit<CurrencyConfiguration, "id" | "createdAt">,
  ): Promise<CurrencyConfiguration> {
    const configId = `currency-config-${Date.now()}`;
    const currencyConfig: CurrencyConfiguration = {
      ...config,
      id: configId,
      createdAt: new Date().toISOString(),
    };

    this.currencyConfigs.set(configId, currencyConfig);

    await eventBus.publish({
      type: "finance.currency.configured",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        configId,
        baseCurrency: config.baseCurrency,
        reportingCurrency: config.reportingCurrency,
      },
    } as DomainEvent);

    return currencyConfig;
  }

  /**
   * Get exchange rate
   * Reuses Procurement Currency Management Service (ZERO DUPLICATION)
   */
  async getExchangeRate(
    tenantId: string,
    fromCurrency: string,
    toCurrency: string,
    date: Date | string,
    rateType: ExchangeRate["rateType"] = "SPOT",
  ): Promise<ExchangeRate> {
    // TODO: Use Procurement Currency Management Service
    // const fxRate = await currencyManagementService.getFXRate(fromCurrency, toCurrency, rateType)

    const rateKey = `${fromCurrency}-${toCurrency}-${rateType}-${date}`;
    let rate = this.exchangeRates.get(rateKey);

    if (!rate) {
      // Mock rate
      rate = {
        id: `rate-${Date.now()}`,
        tenantId,
        fromCurrency,
        toCurrency,
        rate: fromCurrency === toCurrency ? 1 : 3.75, // Mock USD-SAR rate
        rateType,
        effectiveDate: date,
        source: "MANUAL",
        createdAt: new Date().toISOString(),
      };
      this.exchangeRates.set(rateKey, rate);
    }

    return rate;
  }

  /**
   * Revalue foreign currency balances
   */
  async revalueCurrencyBalances(
    tenantId: string,
    revaluationDate: Date | string,
    accountCode: string,
    currency: string,
  ): Promise<CurrencyRevaluation> {
    // TODO: Get account balance in foreign currency
    // const balance = await generalLedgerService.getAccountBalance(tenantId, accountCode, revaluationDate)

    const config = Array.from(this.currencyConfigs.values()).find(
      (c) => c.tenantId === tenantId && c.isActive,
    );

    if (!config) {
      throw new Error("Currency configuration not found");
    }

    const reportingCurrency = config.reportingCurrency;
    const originalAmount = 100000; // Mock
    const exchangeRate = await this.getExchangeRate(
      tenantId,
      currency,
      reportingCurrency,
      revaluationDate,
    );
    const revaluedAmount = originalAmount * exchangeRate.rate;
    const gainLoss = revaluedAmount - originalAmount;

    const revaluationId = `revaluation-${Date.now()}`;
    const revaluation: CurrencyRevaluation = {
      id: revaluationId,
      tenantId,
      revaluationDate,
      accountCode,
      currency,
      originalAmount,
      originalCurrency: currency,
      revaluedAmount,
      exchangeRate: exchangeRate.rate,
      gainLoss,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
    };

    // Create GL entry for revaluation
    if (gainLoss !== 0) {
      await generalLedgerService.createJournalEntry({
        tenantId,
        entryDate: revaluationDate,
        description: `Currency Revaluation: ${accountCode}`,
        lines: [
          {
            accountCode: accountCode,
            accountName: "Foreign Currency Account",
            debit: gainLoss > 0 ? gainLoss : 0,
            credit: gainLoss < 0 ? Math.abs(gainLoss) : 0,
            description: `FX revaluation ${currency}`,
          },
          {
            accountCode: gainLoss > 0 ? "FX_GAIN" : "FX_LOSS",
            accountName: gainLoss > 0 ? "FX Gain" : "FX Loss",
            debit: gainLoss < 0 ? Math.abs(gainLoss) : 0,
            credit: gainLoss > 0 ? gainLoss : 0,
            description: `FX revaluation ${currency}`,
          },
        ],
        currency: reportingCurrency,
        createdBy: "system",
      });

      revaluation.status = "POSTED";
      revaluation.glEntryId = "gl-entry-id";
    }

    this.revaluations.set(revaluationId, revaluation);

    await eventBus.publish({
      type: "finance.currency.revalued",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        revaluationId,
        accountCode,
        currency,
        gainLoss,
      },
    } as DomainEvent);

    return revaluation;
  }

  /**
   * Translate financial statements
   */
  async translateFinancialStatements(
    tenantId: string,
    fromCurrency: string,
    toCurrency: string,
    period: { startDate: Date | string; endDate: Date | string },
  ): Promise<{
    translatedRevenue: number;
    translatedExpenses: number;
    translatedNetIncome: number;
    exchangeRate: number;
  }> {
    // TODO: Get GL entries and translate
    // const glEntries = await generalLedgerService.getGLEntries({ tenantId, startDate: period.startDate, endDate: period.endDate })

    const exchangeRate = await this.getExchangeRate(
      tenantId,
      fromCurrency,
      toCurrency,
      period.endDate,
    );

    // Mock translation
    const revenue = 1000000;
    const expenses = 600000;
    const netIncome = revenue - expenses;

    return {
      translatedRevenue: revenue * exchangeRate.rate,
      translatedExpenses: expenses * exchangeRate.rate,
      translatedNetIncome: netIncome * exchangeRate.rate,
      exchangeRate: exchangeRate.rate,
    };
  }

  /**
   * Calculate FX gain/loss
   */
  async calculateFXGainLoss(
    tenantId: string,
    currency: string,
    baseCurrency: string,
    startDate: Date | string,
    endDate: Date | string,
  ): Promise<{
    realizedGainLoss: number;
    unrealizedGainLoss: number;
    totalGainLoss: number;
    transactions: Array<{
      transactionId: string;
      transactionDate: Date | string;
      amount: number;
      rate: number;
      gainLoss: number;
    }>;
  }> {
    // TODO: Calculate from actual transactions
    // Use Procurement Currency Management Service (ZERO DUPLICATION)
    // const fxGainLoss = await currencyManagementService.calculateFXGainLoss(tenantId, currency, baseCurrency, startDate, endDate)

    // Mock calculation
    return {
      realizedGainLoss: 5000,
      unrealizedGainLoss: 3000,
      totalGainLoss: 8000,
      transactions: [
        {
          transactionId: "txn-1",
          transactionDate: new Date().toISOString(),
          amount: 100000,
          rate: 3.75,
          gainLoss: 2000,
        },
      ],
    };
  }
}

// Singleton instance
export const multiCurrencyService = new MultiCurrencyService();

/**
 * Currency Management Service
 * Multi-currency support, FX rate management, currency conversion, hedging
 */

import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";

export type FXRateType = "SPOT" | "FORWARD" | "AVERAGE";

export interface FXRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  rateType: FXRateType;
  effectiveDate: Date | string;
  source: "REAL_TIME" | "MANUAL" | "HISTORICAL";
  updatedAt: Date | string;
}

export interface CurrencyConversion {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  rateType: FXRateType;
  conversionDate: Date | string;
}

export interface CurrencyHedge {
  hedgeId: string;
  currencyPair: string; // e.g., "USD/SAR"
  hedgedAmount: number;
  hedgeType: "FORWARD_CONTRACT" | "OPTION" | "SWAP";
  contractRate: number;
  contractDate: Date | string;
  maturityDate: Date | string;
  status: "ACTIVE" | "MATURED" | "CLOSED";
  effectiveness?: number; // Hedge effectiveness percentage
}

export interface CurrencyExposure {
  currency: string;
  totalExposure: number;
  committedExposure: number;
  actualExposure: number;
  hedgedExposure: number;
  unhedgedExposure: number;
  exposureByVendor: Record<string, number>;
  exposureByProject: Record<string, number>;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export class CurrencyManagementService {
  private fxRates: Map<string, FXRate> = new Map();
  private hedges: Map<string, CurrencyHedge> = new Map();

  /**
   * Get FX rate
   */
  async getFXRate(
    fromCurrency: string,
    toCurrency: string,
    rateType: FXRateType = "SPOT",
  ): Promise<FXRate> {
    const key = `${fromCurrency}-${toCurrency}-${rateType}`;
    let rate = this.fxRates.get(key);

    if (!rate) {
      // TODO: Fetch real-time rate from external API
      // For now, mock rate
      rate = {
        fromCurrency,
        toCurrency,
        rate: this.getMockRate(fromCurrency, toCurrency),
        rateType,
        effectiveDate: new Date().toISOString(),
        source: "MANUAL",
        updatedAt: new Date().toISOString(),
      };
      this.fxRates.set(key, rate);
    }

    return rate;
  }

  /**
   * Update FX rate
   */
  async updateFXRate(
    fromCurrency: string,
    toCurrency: string,
    rate: number,
    rateType: FXRateType = "SPOT",
    source: FXRate["source"] = "MANUAL",
  ): Promise<FXRate> {
    const key = `${fromCurrency}-${toCurrency}-${rateType}`;
    const fxRate: FXRate = {
      fromCurrency,
      toCurrency,
      rate,
      rateType,
      effectiveDate: new Date().toISOString(),
      source,
      updatedAt: new Date().toISOString(),
    };

    this.fxRates.set(key, fxRate);

    await eventBus.publish({
      type: "procurement.fx-rate.updated",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        fromCurrency,
        toCurrency,
        rate,
        rateType,
      },
    } as DomainEvent);

    return fxRate;
  }

  /**
   * Convert currency
   */
  async convertCurrency(
    fromCurrency: string,
    toCurrency: string,
    amount: number,
    rateType: FXRateType = "SPOT",
  ): Promise<CurrencyConversion> {
    if (fromCurrency === toCurrency) {
      return {
        fromCurrency,
        toCurrency,
        amount,
        convertedAmount: amount,
        rate: 1,
        rateType,
        conversionDate: new Date().toISOString(),
      };
    }

    const fxRate = await this.getFXRate(fromCurrency, toCurrency, rateType);
    const convertedAmount = amount * fxRate.rate;

    const conversion: CurrencyConversion = {
      fromCurrency,
      toCurrency,
      amount,
      convertedAmount,
      rate: fxRate.rate,
      rateType,
      conversionDate: new Date().toISOString(),
    };

    await eventBus.publish({
      type: "procurement.currency.converted",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        fromCurrency,
        toCurrency,
        amount,
        convertedAmount,
        rate: fxRate.rate,
      },
    } as DomainEvent);

    return conversion;
  }

  /**
   * Create currency hedge
   */
  async createHedge(
    tenantId: string,
    currencyPair: string,
    hedgedAmount: number,
    hedgeType: CurrencyHedge["hedgeType"],
    contractRate: number,
    maturityDate: Date | string,
  ): Promise<CurrencyHedge> {
    const hedgeId = `hedge-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const hedge: CurrencyHedge = {
      hedgeId,
      currencyPair,
      hedgedAmount,
      hedgeType,
      contractRate,
      contractDate: new Date().toISOString(),
      maturityDate:
        typeof maturityDate === "string"
          ? maturityDate
          : maturityDate.toISOString(),
      status: "ACTIVE",
    };

    this.hedges.set(hedgeId, hedge);

    return hedge;
  }

  /**
   * Calculate currency exposure
   */
  async calculateCurrencyExposure(
    tenantId: string,
    currency: string,
  ): Promise<CurrencyExposure> {
    // TODO: Aggregate from purchase orders, invoices, commitments
    // For now, mock calculation
    const totalExposure = 1000000;
    const committedExposure = 500000;
    const actualExposure = 300000;
    const hedgedExposure = 200000;
    const unhedgedExposure = totalExposure - hedgedExposure;

    const riskLevel: CurrencyExposure["riskLevel"] =
      unhedgedExposure > 500000
        ? "CRITICAL"
        : unhedgedExposure > 300000
          ? "HIGH"
          : unhedgedExposure > 100000
            ? "MEDIUM"
            : "LOW";

    return {
      currency,
      totalExposure,
      committedExposure,
      actualExposure,
      hedgedExposure,
      unhedgedExposure,
      exposureByVendor: {
        "vendor-1": 300000,
        "vendor-2": 200000,
      },
      exposureByProject: {
        "project-1": 400000,
        "project-2": 300000,
      },
      riskLevel,
    };
  }

  /**
   * Get FX gain/loss
   */
  async calculateFXGainLoss(
    tenantId: string,
    currency: string,
    baseCurrency: string = "SAR",
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
    // For now, mock calculation
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

  /**
   * Get mock FX rate (for testing)
   */
  private getMockRate(fromCurrency: string, toCurrency: string): number {
    // Mock rates (would fetch from external API in production)
    const rates: Record<string, number> = {
      "USD-SAR": 3.75,
      "EUR-SAR": 4.1,
      "GBP-SAR": 4.75,
      "SAR-USD": 1 / 3.75,
      "SAR-EUR": 1 / 4.1,
      "SAR-GBP": 1 / 4.75,
    };

    const key = `${fromCurrency}-${toCurrency}`;
    return rates[key] || 1.0;
  }

  /**
   * Initialize currency event subscriptions
   */
  initializeCurrencyEventSubscriptions(): void {
    // Subscribe to Finance FX rate updates
    eventBus.subscribe(
      "finance.fx-rate.updated",
      async (event: DomainEvent) => {
        console.log("Finance FX rate updated:", event.data);
        const { fromCurrency, toCurrency, rate, rateType } = event.data;
        await this.updateFXRate(
          fromCurrency,
          toCurrency,
          rate,
          rateType,
          "REAL_TIME",
        );
      },
    );
  }
}

// Singleton instance
export const currencyManagementService = new CurrencyManagementService();

// Initialize event subscriptions
currencyManagementService.initializeCurrencyEventSubscriptions();

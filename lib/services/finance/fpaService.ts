/**
 * Financial Planning & Analysis (FP&A) Service
 * Forecasting, planning, analysis, scenario planning, variance analysis
 */

import { eventBus } from "@/lib/services/event-store";
import { budgetService } from "./budgetService";
import { financialReportingService } from "./financialReportingService";
import { mlRegistry } from "@/lib/services/ml-registry";
import { MLModels } from "@/utils/mlModels";
import type { DomainEvent } from "@/types/cqrs";
import type {
  FinancialPlan,
  FinancialScenario,
  FinancialForecast,
  ForecastPeriod,
} from "@/types/finance";

export class FPAService {
  private plans: Map<string, FinancialPlan> = new Map();
  private forecasts: Map<string, FinancialForecast> = new Map();

  /**
   * Get all financial plans for a tenant
   */
  async getPlans(tenantId: string): Promise<FinancialPlan[]> {
    const plans = Array.from(this.plans.values()).filter(
      (plan) => plan.tenantId === tenantId,
    );
    return plans;
  }

  /**
   * Get financial plan by ID
   */
  async getPlan(planId: string): Promise<FinancialPlan | null> {
    return this.plans.get(planId) || null;
  }

  /**
   * Create financial plan
   */
  async createFinancialPlan(
    tenantId: string,
    planData: Omit<
      FinancialPlan,
      | "id"
      | "version"
      | "status"
      | "approvedBy"
      | "approvedAt"
      | "createdAt"
      | "createdBy"
    >,
  ): Promise<FinancialPlan> {
    const planId = `plan-${Date.now()}`;
    const plan: FinancialPlan = {
      ...planData,
      id: planId,
      version: 1,
      status: "DRAFT",
      scenarios: planData.scenarios || [],
      createdAt: new Date().toISOString(),
      createdBy: planData.createdBy,
    };

    this.plans.set(planId, plan);

    await eventBus.publish({
      type: "finance.plan.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        planId,
        planName: plan.planName,
        planType: plan.planType,
      },
    } as DomainEvent);

    return plan;
  }

  /**
   * Create financial scenario
   */
  async createScenario(
    tenantId: string,
    planId: string,
    scenarioData: Omit<FinancialScenario, "id" | "planId" | "createdAt">,
  ): Promise<FinancialScenario> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error("Financial plan not found");
    }

    const scenarioId = `scenario-${Date.now()}`;
    const scenario: FinancialScenario = {
      ...scenarioData,
      id: scenarioId,
      planId,
      createdAt: new Date().toISOString(),
    };

    plan.scenarios.push(scenario);

    await eventBus.publish({
      type: "finance.scenario.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        planId,
        scenarioId,
        scenarioName: scenario.scenarioName,
      },
    } as DomainEvent);

    return scenario;
  }

  /**
   * Generate financial forecast
   */
  async generateForecast(
    tenantId: string,
    forecastData: Omit<
      FinancialForecast,
      "id" | "periods" | "accuracy" | "createdAt" | "createdBy"
    >,
  ): Promise<FinancialForecast> {
    // Get historical financial data for ML forecasting
    const historicalData = await this.getHistoricalFinancialData(
      tenantId,
      forecastData.forecastType,
    );

    const periods: ForecastPeriod[] = [];
    const startDate = new Date(forecastData.startDate);
    const endDate = new Date(forecastData.endDate);
    let currentDate = new Date(startDate);
    let overallAccuracy = 0.85;

    // Try to use ML/AI for forecasting
    try {
      const forecastModel = await mlRegistry.getModel("financial-forecast");

      if (forecastModel && forecastModel.deployment?.isDeployed) {
        // Use deployed ML model
        const mlPrediction = await mlRegistry.predict("financial-forecast", {
          tenantId,
          forecastType: forecastData.forecastType,
          historicalData,
          method: forecastData.method,
        });

        if (mlPrediction.output?.periods) {
          return {
            ...forecastData,
            id: `forecast-${Date.now()}`,
            periods: mlPrediction.output.periods,
            accuracy: mlPrediction.confidence || 0.88,
            createdAt: new Date().toISOString(),
          } as FinancialForecast;
        }
      }

      // Fallback to MLModels utility
      if (historicalData.length >= 3) {
        const mlForecast =
          forecastData.method === "LINEAR_REGRESSION"
            ? MLModels.forecastLinearRegression(historicalData, 12)
            : forecastData.method === "EXPONENTIAL_SMOOTHING"
              ? MLModels.forecastExponentialSmoothing(historicalData, 0.3, 12)
              : MLModels.forecastSMA(historicalData, 12);

        overallAccuracy = mlForecast.confidence;

        // Map ML predictions to periods
        mlForecast.predictions.forEach((pred, index) => {
          const periodEnd = new Date(currentDate);
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          if (currentDate <= endDate) {
            periods.push({
              period: {
                startDate: currentDate.toISOString(),
                endDate: periodEnd.toISOString(),
              },
              forecastedValue: pred.value,
              confidence: pred.confidence,
            });
            currentDate = new Date(periodEnd);
          }
        });
      }
    } catch (error) {
      console.log(
        "[FPA Service] ML forecasting not available, using heuristic",
      );
    }

    // Fallback to heuristic if ML fails or no historical data
    if (periods.length === 0) {
      currentDate = new Date(startDate);
      const baseValue =
        historicalData.length > 0
          ? historicalData[historicalData.length - 1].value
          : 100000;

      while (currentDate <= endDate) {
        const periodEnd = new Date(currentDate);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        const growthFactor =
          forecastData.method === "LINEAR_REGRESSION" ? 1.02 : 1.0;
        const forecastedValue =
          baseValue * Math.pow(growthFactor, periods.length);
        const confidence = Math.max(0.6, 0.85 - periods.length * 0.02);

        periods.push({
          period: {
            startDate: currentDate.toISOString(),
            endDate: periodEnd.toISOString(),
          },
          forecastedValue,
          confidence,
        });

        currentDate = new Date(periodEnd);
      }
    }

    const forecastId = `forecast-${Date.now()}`;
    const forecast: FinancialForecast = {
      id: forecastId,
      tenantId,
      forecastName: forecastData.forecastName,
      forecastType: forecastData.forecastType,
      startDate: forecastData.startDate,
      endDate: forecastData.endDate,
      periods,
      method: forecastData.method,
      accuracy: 0.88, // Mock
      createdAt: new Date().toISOString(),
      createdBy: forecastData.createdBy,
    };

    this.forecasts.set(forecastId, forecast);

    await eventBus.publish({
      type: "finance.forecast.generated",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        forecastId,
        forecastName: forecast.forecastName,
        forecastType: forecast.forecastType,
      },
    } as DomainEvent);

    return forecast;
  }

  /**
   * Analyze variance
   */
  async analyzeVariance(
    tenantId: string,
    planId: string,
    actualPeriod: { startDate: Date | string; endDate: Date | string },
  ): Promise<{
    revenueVariance: number;
    expenseVariance: number;
    netIncomeVariance: number;
    varianceByAccount: Array<{
      accountCode: string;
      planned: number;
      actual: number;
      variance: number;
      variancePercentage: number;
    }>;
  }> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error("Financial plan not found");
    }

    // TODO: Get actuals from GL
    // const actuals = await generalLedgerService.getAccountBalances(tenantId, actualPeriod)

    // Mock variance analysis
    return {
      revenueVariance: -50000,
      expenseVariance: 20000,
      netIncomeVariance: -70000,
      varianceByAccount: [
        {
          accountCode: "REVENUE",
          planned: 1000000,
          actual: 950000,
          variance: -50000,
          variancePercentage: -5,
        },
        {
          accountCode: "EXPENSES",
          planned: 600000,
          actual: 620000,
          variance: 20000,
          variancePercentage: 3.33,
        },
      ],
    };
  }

  /**
   * Compare scenarios
   */
  async compareScenarios(
    tenantId: string,
    planId: string,
  ): Promise<{
    scenarios: Array<{
      scenarioName: string;
      scenarioType: FinancialScenario["scenarioType"];
      revenue: number;
      expenses: number;
      netIncome: number;
      cashFlow: number;
    }>;
    bestScenario: string;
    worstScenario: string;
  }> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error("Financial plan not found");
    }

    const scenarios = plan.scenarios.map((s) => ({
      scenarioName: s.scenarioName,
      scenarioType: s.scenarioType,
      revenue: s.revenue,
      expenses: s.expenses,
      netIncome: s.netIncome,
      cashFlow: s.cashFlow,
    }));

    const bestScenario = scenarios.reduce((best, current) =>
      current.netIncome > best.netIncome ? current : best,
    ).scenarioName;

    const worstScenario = scenarios.reduce((worst, current) =>
      current.netIncome < worst.netIncome ? current : worst,
    ).scenarioName;

    return {
      scenarios,
      bestScenario,
      worstScenario,
    };
  }

  /**
   * Get historical financial data for forecasting
   */
  private async getHistoricalFinancialData(
    tenantId: string,
    forecastType: string,
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    // Try to get actual historical data from existing forecasts or actuals
    const existingForecasts = Array.from(this.forecasts.values()).filter(
      (f) => f.tenantId === tenantId && f.forecastType === forecastType,
    );

    if (existingForecasts.length > 0) {
      // Aggregate historical data from existing forecasts
      const historicalData: Array<{ timestamp: Date; value: number }> = [];

      existingForecasts.forEach((forecast) => {
        forecast.periods.forEach((period) => {
          historicalData.push({
            timestamp: new Date(period.period.startDate),
            value: period.forecastedValue,
          });
        });
      });

      return historicalData.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );
    }

    // Generate synthetic historical data for demo purposes
    // In production, this would query actual financial data from GL
    const historicalData: Array<{ timestamp: Date; value: number }> = [];
    const now = new Date();
    const baseValue = 100000;

    for (let i = 12; i > 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);

      // Add some variance and trend
      const trendFactor = 1 + (12 - i) * 0.01; // Slight upward trend
      const variance = (Math.random() - 0.5) * 0.1; // ±5% variance
      const value = baseValue * trendFactor * (1 + variance);

      historicalData.push({
        timestamp: date,
        value,
      });
    }

    return historicalData;
  }
}

// Singleton instance
export const fpaService = new FPAService();

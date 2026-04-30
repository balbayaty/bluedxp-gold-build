/**
 * Pulse Benchmark Service
 * Aggregate tenant metrics, submit to index, compare percentiles
 */

import { PrismaClient } from "@prisma/client";
import { pulseScoreboardService } from "./pulseScoreboardService";
import crypto from "crypto";
import type {
  PulseBenchmarkIndex,
  PulseTenantBenchmarkSubmission,
  BenchmarkPercentile,
  IPulseBenchmarkService,
} from "@/types/pulse";

const prisma = new PrismaClient();

export class PulseBenchmarkService implements IPulseBenchmarkService {
  /**
   * Submit tenant metrics for benchmarking
   */
  async submitMetrics(
    tenantId: string,
    period: { start: Date; end: Date },
    benchmarkGroup: string,
    optInPublicLeague: boolean,
  ): Promise<PulseTenantBenchmarkSubmission> {
    // Calculate company-wide snapshot
    const snapshot = await pulseScoreboardService.calculateSnapshot(
      "COMPANY",
      tenantId,
      tenantId,
      period,
    );

    // Aggregate metrics
    const metrics = {
      SAFE_PARTICIPATION: snapshot.participationRate,
      EXECUTE_ONTIME: snapshot.pillarScoresJson.Execute,
      TRAINING_FRESHNESS: snapshot.pillarScoresJson.Grow,
      ENGAGEMENT_PARTICIPATION: snapshot.participationRate,
      COMPOSITE_SCORE: snapshot.compositeScore,
    };

    // Generate anonymized hash (rotate per period)
    const hashInput = `${tenantId}-${period.start.toISOString()}-${period.end.toISOString()}`;
    const anonymizedHash = crypto
      .createHash("sha256")
      .update(hashInput)
      .digest("hex")
      .substring(0, 16);

    // Check if already submitted
    const existing = await prisma.pulseTenantBenchmarkSubmission.findFirst({
      where: {
        tenantId,
        periodStart: period.start,
        periodEnd: period.end,
      },
    });

    if (existing) {
      // Update existing
      const updated = await prisma.pulseTenantBenchmarkSubmission.update({
        where: {
          tenantId_periodStart_periodEnd: {
            tenantId,
            periodStart: period.start,
            periodEnd: period.end,
          },
        },
        data: {
          benchmarkGroup,
          metricsJson: metrics,
          anonymizedHash,
          optInPublicLeague,
        },
      });

      return this.mapToSubmission(updated);
    }

    // Create new
    const created = await prisma.pulseTenantBenchmarkSubmission.create({
      data: {
        tenantId,
        periodStart: period.start,
        periodEnd: period.end,
        benchmarkGroup,
        metricsJson: metrics,
        anonymizedHash,
        optInPublicLeague,
      },
    });

    // Update benchmark index (async, can be done in background job)
    await this.updateBenchmarkIndex(
      benchmarkGroup,
      period,
      "SAFE_PARTICIPATION",
    ).catch(console.error);
    await this.updateBenchmarkIndex(
      benchmarkGroup,
      period,
      "EXECUTE_ONTIME",
    ).catch(console.error);
    await this.updateBenchmarkIndex(
      benchmarkGroup,
      period,
      "TRAINING_FRESHNESS",
    ).catch(console.error);
    await this.updateBenchmarkIndex(
      benchmarkGroup,
      period,
      "ENGAGEMENT_PARTICIPATION",
    ).catch(console.error);

    return this.mapToSubmission(created);
  }

  /**
   * Get percentiles for tenant
   */
  async getPercentiles(
    tenantId: string,
    metricKey: string,
    benchmarkGroup: string,
  ): Promise<BenchmarkPercentile> {
    // Get tenant's latest submission
    const submission = await prisma.pulseTenantBenchmarkSubmission.findFirst({
      where: {
        tenantId,
        benchmarkGroup,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!submission) {
      throw new Error("No benchmark submission found for tenant");
    }

    const tenantValue =
      (submission.metricsJson as Record<string, number>)[metricKey] || 0;

    // Get benchmark index
    const index = await prisma.pulseBenchmarkIndex.findFirst({
      where: {
        benchmarkGroup,
        metricKey,
        periodStart: { lte: submission.periodStart },
        periodEnd: { gte: submission.periodEnd },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!index) {
      // Return default if no index exists
      return {
        metricKey,
        tenantValue,
        percentile: 50,
        median: tenantValue,
        p75: tenantValue,
        p90: tenantValue,
      };
    }

    // Calculate percentile
    let percentile = 50;
    if (tenantValue >= index.p90Value) {
      percentile = 90;
    } else if (tenantValue >= index.p75Value) {
      percentile = 75;
    } else if (tenantValue >= index.medianValue) {
      percentile = 50;
    } else {
      percentile = 25;
    }

    return {
      metricKey,
      tenantValue,
      percentile,
      median: Number(index.medianValue),
      p75: Number(index.p75Value),
      p90: Number(index.p90Value),
    };
  }

  /**
   * Update benchmark index (aggregate from all submissions)
   */
  async updateBenchmarkIndex(
    benchmarkGroup: string,
    period: { start: Date; end: Date },
    metricKey: string,
  ): Promise<PulseBenchmarkIndex> {
    // Get all submissions for this group and period
    const submissions = await prisma.pulseTenantBenchmarkSubmission.findMany({
      where: {
        benchmarkGroup,
        periodStart: period.start,
        periodEnd: period.end,
      },
    });

    if (submissions.length === 0) {
      throw new Error("No submissions found for benchmark group");
    }

    // Extract metric values
    const values = submissions
      .map((s: any) => (s.metricsJson as Record<string, number>)[metricKey])
      .filter((v: any) => v !== undefined && v !== null)
      .sort((a: number, b: number) => a - b);

    if (values.length === 0) {
      throw new Error("No valid metric values found");
    }

    // Calculate percentiles
    const median = this.percentile(values, 50);
    const p75 = this.percentile(values, 75);
    const p90 = this.percentile(values, 90);

    // Check if index exists
    const existing = await prisma.pulseBenchmarkIndex.findFirst({
      where: {
        benchmarkGroup,
        periodStart: period.start,
        periodEnd: period.end,
        metricKey,
      },
    });

    if (existing) {
      // Update
      const updated = await prisma.pulseBenchmarkIndex.update({
        where: {
          benchmarkGroup_periodStart_periodEnd_metricKey: {
            benchmarkGroup,
            periodStart: period.start,
            periodEnd: period.end,
            metricKey,
          },
        },
        data: {
          medianValue: median,
          p75Value: p75,
          p90Value: p90,
        },
      });

      return this.mapToIndex(updated);
    }

    // Create
    const created = await prisma.pulseBenchmarkIndex.create({
      data: {
        benchmarkGroup,
        periodStart: period.start,
        periodEnd: period.end,
        metricKey,
        medianValue: median,
        p75Value: p75,
        p90Value: p90,
      },
    });

    return this.mapToIndex(created);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    const index = (p / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (upper >= sortedValues.length) {
      return sortedValues[sortedValues.length - 1];
    }

    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  private mapToSubmission(s: any): PulseTenantBenchmarkSubmission {
    // Fix any type issues
    return {
      id: s.id,
      tenantId: s.tenantId,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
      benchmarkGroup: s.benchmarkGroup,
      metricsJson: s.metricsJson as Record<string, number>,
      anonymizedHash: s.anonymizedHash,
      optInPublicLeague: s.optInPublicLeague,
      createdAt: s.createdAt,
    };
  }

  private mapToIndex(i: any): PulseBenchmarkIndex {
    return {
      id: i.id,
      benchmarkGroup: i.benchmarkGroup,
      periodStart: i.periodStart,
      periodEnd: i.periodEnd,
      metricKey: i.metricKey,
      medianValue: Number(i.medianValue),
      p75Value: Number(i.p75Value),
      p90Value: Number(i.p90Value),
      createdAt: i.createdAt,
    };
  }
}

export const pulseBenchmarkService = new PulseBenchmarkService();

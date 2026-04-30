/**
 * Monte Carlo Simulation Service
 *
 * Probabilistic analysis of journey time optimization
 * 10,000 iteration Monte Carlo simulation with statistical distributions
 *
 * Migrated from: flex-logistics-dashboard/src/MonteCarloSimulation.jsx
 * Integrated with: Transportation Module, Analytics Module
 */

import { eventBus } from "@/lib/services/event-store";
import type {
  MonteCarloConfig,
  MonteCarloResults,
  JourneyTimeDistribution,
  SuccessProbability,
  ConfidenceInterval,
  SensitivityAnalysis,
  CumulativeProbability,
  DistributionType,
} from "@/types/analytics";

export class MonteCarloSimulationService {
  private defaultConfig: MonteCarloConfig = {
    iterations: 10000,
    confidenceLevel: 0.9,
    distributionType: "TRIANGULAR",
  };

  /**
   * Run Monte Carlo simulation for journey time analysis
   */
  async runSimulation(
    touchpoints: Array<{
      name: string;
      baseline: number;
      best: number;
      worst: number;
      distribution?: DistributionType;
    }>,
    phases?: Array<{
      name: string;
      improvements: Record<string, number>; // touchpoint name -> improvement percentage
    }>,
    config?: Partial<MonteCarloConfig>,
  ): Promise<MonteCarloResults> {
    const startTime = Date.now();
    const finalConfig = { ...this.defaultConfig, ...config };

    // Publish simulation start event
    await eventBus.publish("analytics.monte-carlo.started", {
      touchpoints: touchpoints.length,
      iterations: finalConfig.iterations,
      timestamp: new Date(),
    });

    try {
      // Run simulation iterations
      const results = this.executeSimulation(touchpoints, phases, finalConfig);

      const executionTime = Date.now() - startTime;

      // Publish simulation complete event
      await eventBus.publish("analytics.monte-carlo.completed", {
        results: {
          ...results,
          metadata: {
            ...results.metadata,
            executionTime,
          },
        },
        timestamp: new Date(),
      });

      return {
        ...results,
        metadata: {
          ...results.metadata,
          executionTime,
        },
      };
    } catch (error) {
      await eventBus.publish("analytics.monte-carlo.error", {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Execute the actual Monte Carlo simulation
   */
  private executeSimulation(
    touchpoints: Array<{
      name: string;
      baseline: number;
      best: number;
      worst: number;
      distribution?: DistributionType;
    }>,
    phases?: Array<{
      name: string;
      improvements: Record<string, number>;
    }>,
    config: MonteCarloConfig = this.defaultConfig,
  ): Omit<MonteCarloResults, "metadata"> {
    // Generate journey time distributions
    const journeyTimeDistribution = this.generateJourneyTimeDistribution(
      touchpoints,
      phases,
      config,
    );

    // Calculate success probabilities
    const successProbabilities = this.calculateSuccessProbabilities(
      touchpoints,
      phases,
      config,
    );

    // Calculate confidence intervals
    const confidenceIntervals = this.calculateConfidenceIntervals(
      touchpoints,
      phases,
      config,
    );

    // Perform sensitivity analysis
    const sensitivityAnalysis = this.performSensitivityAnalysis(
      touchpoints,
      config,
    );

    // Calculate cumulative probability
    const cumulativeProbability = this.calculateCumulativeProbability(
      touchpoints,
      phases,
      config,
    );

    return {
      journeyTimeDistribution,
      successProbabilities,
      confidenceIntervals,
      sensitivityAnalysis,
      cumulativeProbability,
    };
  }

  /**
   * Generate journey time distribution by phase
   */
  private generateJourneyTimeDistribution(
    touchpoints: Array<{
      name: string;
      baseline: number;
      best: number;
      worst: number;
    }>,
    phases?: Array<{
      name: string;
      improvements: Record<string, number>;
    }>,
    config: MonteCarloConfig = this.defaultConfig,
  ): JourneyTimeDistribution[] {
    const ranges: JourneyTimeDistribution[] = [];
    const rangeSize = 5; // hours per range

    // Generate ranges from 70 to 160 hours
    for (let start = 70; start < 160; start += rangeSize) {
      const range = `${start}-${start + rangeSize}`;
      ranges.push({
        range,
        current: 0,
        phase1: 0,
        phase2: 0,
        phase3: 0,
      });
    }

    // Simulate iterations
    for (let i = 0; i < config.iterations; i++) {
      // Current state
      const currentTime = this.simulateJourneyTime(touchpoints, config);
      this.incrementRange(ranges, currentTime, "current");

      // Phase 1
      if (phases && phases[0]) {
        const phase1Time = this.simulateJourneyTime(
          touchpoints,
          config,
          phases[0].improvements,
        );
        this.incrementRange(ranges, phase1Time, "phase1");
      }

      // Phase 2
      if (phases && phases[1]) {
        const phase2Time = this.simulateJourneyTime(
          touchpoints,
          config,
          phases[1].improvements,
        );
        this.incrementRange(ranges, phase2Time, "phase2");
      }

      // Phase 3
      if (phases && phases[2]) {
        const phase3Time = this.simulateJourneyTime(
          touchpoints,
          config,
          phases[2].improvements,
        );
        this.incrementRange(ranges, phase3Time, "phase3");
      }
    }

    // Convert to percentages
    return ranges.map((r) => ({
      ...r,
      current: (r.current / config.iterations) * 100,
      phase1: (r.phase1 / config.iterations) * 100,
      phase2: (r.phase2 / config.iterations) * 100,
      phase3: (r.phase3 / config.iterations) * 100,
    }));
  }

  /**
   * Simulate journey time for one iteration
   */
  private simulateJourneyTime(
    touchpoints: Array<{
      name: string;
      baseline: number;
      best: number;
      worst: number;
      distribution?: DistributionType;
    }>,
    config: MonteCarloConfig,
    improvements?: Record<string, number>,
  ): number {
    let totalTime = 0;

    for (const tp of touchpoints) {
      let time = this.sampleDistribution(
        tp.baseline,
        tp.best,
        tp.worst,
        tp.distribution || config.distributionType,
      );

      // Apply improvements if provided
      if (improvements && improvements[tp.name]) {
        const improvement = improvements[tp.name] / 100;
        time = time * (1 - improvement);
      }

      totalTime += time;
    }

    return totalTime;
  }

  /**
   * Sample from a probability distribution
   */
  private sampleDistribution(
    baseline: number,
    best: number,
    worst: number,
    distribution: DistributionType,
  ): number {
    const random = Math.random();

    switch (distribution) {
      case "TRIANGULAR":
        // Triangular distribution
        if (random < (baseline - best) / (worst - best)) {
          return best + Math.sqrt(random * (baseline - best) * (worst - best));
        } else {
          return (
            worst -
            Math.sqrt((1 - random) * (worst - baseline) * (worst - best))
          );
        }

      case "NORMAL":
        // Normal distribution approximation
        const mean = baseline;
        const stdDev = (worst - best) / 4;
        return this.sampleNormal(mean, stdDev);

      case "LOGNORMAL":
        // Lognormal distribution
        const logMean = Math.log(baseline);
        const logStdDev = Math.log(worst / best) / 4;
        return Math.exp(this.sampleNormal(logMean, logStdDev));

      case "UNIFORM":
        // Uniform distribution
        return best + random * (worst - best);

      default:
        return baseline;
    }
  }

  /**
   * Sample from normal distribution (Box-Muller transform)
   */
  private sampleNormal(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z0 * stdDev;
  }

  /**
   * Increment range counter
   */
  private incrementRange(
    ranges: JourneyTimeDistribution[],
    time: number,
    phase: "current" | "phase1" | "phase2" | "phase3",
  ): void {
    const rangeSize = 5;
    const start = Math.floor(time / rangeSize) * rangeSize;
    const range = ranges.find((r) => r.range.startsWith(start.toString()));

    if (range) {
      range[phase]++;
    }
  }

  /**
   * Calculate success probabilities by key metrics
   */
  private calculateSuccessProbabilities(
    touchpoints: Array<{
      name: string;
      baseline: number;
      best: number;
      worst: number;
    }>,
    phases?: Array<{
      name: string;
      improvements: Record<string, number>;
    }>,
    config: MonteCarloConfig = this.defaultConfig,
  ): SuccessProbability[] {
    const metrics: SuccessProbability[] = [
      { metric: "Journey < 80 hrs", probability: 0 },
      { metric: "On-time > 90%", probability: 0 },
      { metric: "All SLAs met", probability: 0 },
      { metric: "Kuwait customs < 24 hrs", probability: 0 },
      { metric: "SA return < 8 hrs", probability: 0 },
      { metric: "Offloading < 8 hrs", probability: 0 },
    ];

    let successCounts = {
      journey80: 0,
      onTime90: 0,
      allSLAs: 0,
      kuwait24: 0,
      saReturn8: 0,
      offloading8: 0,
    };

    // Use final phase if available, otherwise current
    const finalImprovements =
      phases && phases[phases.length - 1]
        ? phases[phases.length - 1].improvements
        : undefined;

    for (let i = 0; i < config.iterations; i++) {
      const journeyTime = this.simulateJourneyTime(
        touchpoints,
        config,
        finalImprovements,
      );

      // Check metrics
      if (journeyTime < 80) successCounts.journey80++;
      if (journeyTime < 100) successCounts.onTime90++; // Approximate
      if (journeyTime < 90) successCounts.allSLAs++; // Approximate

      // Touchpoint-specific checks
      const kuwaitCustoms = touchpoints.find((tp) =>
        tp.name.toLowerCase().includes("kuwait"),
      );
      if (kuwaitCustoms) {
        const kuwaitTime = this.sampleDistribution(
          kuwaitCustoms.baseline,
          kuwaitCustoms.best,
          kuwaitCustoms.worst,
          config.distributionType,
        );
        if (kuwaitTime < 24) successCounts.kuwait24++;
      }

      const saReturn = touchpoints.find((tp) =>
        tp.name.toLowerCase().includes("sa return"),
      );
      if (saReturn) {
        const saTime = this.sampleDistribution(
          saReturn.baseline,
          saReturn.best,
          saReturn.worst,
          config.distributionType,
        );
        if (saTime < 8) successCounts.saReturn8++;
      }

      const offloading = touchpoints.find((tp) =>
        tp.name.toLowerCase().includes("offloading"),
      );
      if (offloading) {
        const offloadingTime = this.sampleDistribution(
          offloading.baseline,
          offloading.best,
          offloading.worst,
          config.distributionType,
        );
        if (offloadingTime < 8) successCounts.offloading8++;
      }
    }

    // Convert to percentages
    metrics[0].probability =
      (successCounts.journey80 / config.iterations) * 100;
    metrics[1].probability = (successCounts.onTime90 / config.iterations) * 100;
    metrics[2].probability = (successCounts.allSLAs / config.iterations) * 100;
    metrics[3].probability = (successCounts.kuwait24 / config.iterations) * 100;
    metrics[4].probability =
      (successCounts.saReturn8 / config.iterations) * 100;
    metrics[5].probability =
      (successCounts.offloading8 / config.iterations) * 100;

    return metrics;
  }

  /**
   * Calculate confidence intervals by phase
   */
  private calculateConfidenceIntervals(
    touchpoints: Array<{
      name: string;
      baseline: number;
      best: number;
      worst: number;
    }>,
    phases?: Array<{
      name: string;
      improvements: Record<string, number>;
    }>,
    config: MonteCarloConfig = this.defaultConfig,
  ): ConfidenceInterval[] {
    const intervals: ConfidenceInterval[] = [];

    // Current state
    const currentTimes = this.generateSampleTimes(
      touchpoints,
      config,
      undefined,
      config.iterations,
    );
    intervals.push(this.calculateInterval("Current", currentTimes));

    // Phase 1
    if (phases && phases[0]) {
      const phase1Times = this.generateSampleTimes(
        touchpoints,
        config,
        phases[0].improvements,
        config.iterations,
      );
      intervals.push(this.calculateInterval("Phase 1", phase1Times));
    }

    // Phase 2
    if (phases && phases[1]) {
      const phase2Times = this.generateSampleTimes(
        touchpoints,
        config,
        phases[1].improvements,
        config.iterations,
      );
      intervals.push(this.calculateInterval("Phase 2", phase2Times));
    }

    // Phase 3
    if (phases && phases[2]) {
      const phase3Times = this.generateSampleTimes(
        touchpoints,
        config,
        phases[2].improvements,
        config.iterations,
      );
      intervals.push(this.calculateInterval("Phase 3", phase3Times));
    }

    return intervals;
  }

  /**
   * Generate sample times for confidence interval calculation
   */
  private generateSampleTimes(
    touchpoints: Array<{
      name: string;
      baseline: number;
      best: number;
      worst: number;
    }>,
    config: MonteCarloConfig,
    improvements?: Record<string, number>,
    count: number = 1000,
  ): number[] {
    const times: number[] = [];
    for (let i = 0; i < count; i++) {
      times.push(this.simulateJourneyTime(touchpoints, config, improvements));
    }
    return times.sort((a, b) => a - b);
  }

  /**
   * Calculate confidence interval from sample times
   */
  private calculateInterval(
    phase: string,
    sortedTimes: number[],
  ): ConfidenceInterval {
    const n = sortedTimes.length;
    const mean = sortedTimes.reduce((a, b) => a + b, 0) / n;
    const median = sortedTimes[Math.floor(n / 2)];
    const p10Index = Math.floor(n * 0.1);
    const p90Index = Math.floor(n * 0.9);

    return {
      phase,
      mean,
      median,
      p10: sortedTimes[p10Index] || sortedTimes[0],
      p90: sortedTimes[p90Index] || sortedTimes[n - 1],
    };
  }

  /**
   * Perform sensitivity analysis on bottlenecks
   */
  private performSensitivityAnalysis(
    touchpoints: Array<{
      name: string;
      baseline: number;
      best: number;
      worst: number;
    }>,
    config: MonteCarloConfig = this.defaultConfig,
  ): SensitivityAnalysis[] {
    return touchpoints
      .filter((tp) => tp.baseline > 5) // Only significant touchpoints
      .map((tp) => ({
        name: tp.name,
        baseline: tp.baseline,
        worst: tp.worst,
        best: tp.best,
        target: tp.best * 1.2, // 20% above best as target
      }))
      .sort((a, b) => b.baseline - a.baseline)
      .slice(0, 5); // Top 5 bottlenecks
  }

  /**
   * Calculate cumulative probability curve
   */
  private calculateCumulativeProbability(
    touchpoints: Array<{
      name: string;
      baseline: number;
      best: number;
      worst: number;
    }>,
    phases?: Array<{
      name: string;
      improvements: Record<string, number>;
    }>,
    config: MonteCarloConfig = this.defaultConfig,
  ): CumulativeProbability[] {
    const finalImprovements =
      phases && phases[phases.length - 1]
        ? phases[phases.length - 1].improvements
        : undefined;

    const times: number[] = [];
    for (let i = 0; i < config.iterations; i++) {
      times.push(
        this.simulateJourneyTime(touchpoints, config, finalImprovements),
      );
    }

    const sortedTimes = times.sort((a, b) => a - b);
    const cumulative: CumulativeProbability[] = [];

    // Generate cumulative probability for each hour from 65 to 100
    for (let hours = 65; hours <= 100; hours += 1) {
      const count = sortedTimes.filter((t) => t <= hours).length;
      const probability = (count / config.iterations) * 100;
      cumulative.push({ hours, probability });
    }

    return cumulative;
  }
}

export const monteCarloSimulationService = new MonteCarloSimulationService();

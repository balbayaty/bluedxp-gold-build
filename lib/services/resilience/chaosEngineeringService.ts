/**
 * Chaos Engineering Service
 *
 * Proactive failure testing with:
 * - Failure injection
 * - Network partitioning
 * - Latency injection
 * - Resource exhaustion
 * - Service degradation
 */

export interface ChaosExperiment {
  id: string;
  name: string;
  type: "failure" | "latency" | "network" | "resource" | "degradation";
  enabled: boolean;
  probability: number; // 0-1
  duration?: number; // milliseconds
  target?: string; // Service/endpoint to target
  config: Record<string, any>;
}

export interface ChaosResult {
  experimentId: string;
  triggered: boolean;
  timestamp: Date;
  impact: "low" | "medium" | "high" | "critical";
  details?: Record<string, any>;
}

class ChaosEngineeringService {
  private experiments: Map<string, ChaosExperiment> = new Map();
  private activeExperiments: Map<string, NodeJS.Timeout> = new Map();
  private results: ChaosResult[] = [];

  /**
   * Register chaos experiment
   */
  registerExperiment(experiment: ChaosExperiment): void {
    this.experiments.set(experiment.id, experiment);

    if (experiment.enabled) {
      this.startExperiment(experiment);
    }
  }

  /**
   * Inject failure
   */
  async injectFailure(
    target: string,
    probability: number = 0.1,
    errorType: "timeout" | "error" | "crash" = "error",
  ): Promise<boolean> {
    if (Math.random() > probability) {
      return false;
    }

    switch (errorType) {
      case "timeout":
        await new Promise((resolve) => setTimeout(resolve, 30000));
        throw new Error(`Chaos: Timeout injected for ${target}`);

      case "error":
        throw new Error(`Chaos: Error injected for ${target}`);

      case "crash":
        process.exit(1); // In production, use graceful shutdown
    }

    return true;
  }

  /**
   * Inject latency
   */
  async injectLatency(
    target: string,
    minDelay: number = 100,
    maxDelay: number = 1000,
    probability: number = 0.1,
  ): Promise<void> {
    if (Math.random() > probability) {
      return;
    }

    const delay = Math.random() * (maxDelay - minDelay) + minDelay;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Simulate network partition
   */
  async simulateNetworkPartition(
    services: string[],
    duration: number = 60000,
  ): Promise<void> {
    // In production, this would block network calls to specified services
    console.log(
      `Chaos: Simulating network partition for ${services.join(", ")} for ${duration}ms`,
    );

    // Store partition state
    const partitionKey = `partition-${Date.now()}`;
    this.activeExperiments.set(
      partitionKey,
      setTimeout(() => {
        this.activeExperiments.delete(partitionKey);
        console.log(`Chaos: Network partition ended`);
      }, duration),
    );
  }

  /**
   * Exhaust resources
   */
  async exhaustResources(
    resourceType: "memory" | "cpu" | "connections",
    percentage: number = 50,
  ): Promise<void> {
    switch (resourceType) {
      case "memory":
        // Allocate memory
        const memoryMB =
          (process.memoryUsage().heapTotal / 1024 / 1024) * (percentage / 100);
        const buffer = Buffer.alloc(memoryMB * 1024 * 1024);
        console.log(`Chaos: Exhausted ${percentage}% memory`);
        break;

      case "cpu":
        // CPU intensive task
        const endTime = Date.now() + percentage * 100; // milliseconds
        while (Date.now() < endTime) {
          // Busy wait
        }
        console.log(`Chaos: Exhausted CPU for ${percentage}ms`);
        break;

      case "connections":
        // Simulate connection exhaustion
        console.log(`Chaos: Simulating ${percentage}% connection exhaustion`);
        break;
    }
  }

  /**
   * Degrade service
   */
  async degradeService(
    service: string,
    degradationLevel: "slow" | "partial" | "unavailable" = "slow",
  ): Promise<void> {
    switch (degradationLevel) {
      case "slow":
        await this.injectLatency(service, 1000, 5000, 1.0);
        break;

      case "partial":
        // Return partial responses
        console.log(`Chaos: Degrading ${service} to partial responses`);
        break;

      case "unavailable":
        // Return errors
        throw new Error(`Chaos: Service ${service} unavailable`);
    }
  }

  /**
   * Run chaos experiment
   */
  async runExperiment(experimentId: string): Promise<ChaosResult> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || !experiment.enabled) {
      return {
        experimentId,
        triggered: false,
        timestamp: new Date(),
        impact: "low",
      };
    }

    // Check probability
    if (Math.random() > experiment.probability) {
      return {
        experimentId,
        triggered: false,
        timestamp: new Date(),
        impact: "low",
      };
    }

    let triggered = false;
    let impact: "low" | "medium" | "high" | "critical" = "low";

    try {
      switch (experiment.type) {
        case "failure":
          triggered = await this.injectFailure(
            experiment.target || "default",
            experiment.config.probability || 0.1,
            experiment.config.errorType || "error",
          );
          impact = "high";
          break;

        case "latency":
          await this.injectLatency(
            experiment.target || "default",
            experiment.config.minDelay || 100,
            experiment.config.maxDelay || 1000,
            experiment.config.probability || 0.1,
          );
          triggered = true;
          impact = "medium";
          break;

        case "network":
          await this.simulateNetworkPartition(
            experiment.config.services || [],
            experiment.config.duration || 60000,
          );
          triggered = true;
          impact = "critical";
          break;

        case "resource":
          await this.exhaustResources(
            experiment.config.resourceType || "memory",
            experiment.config.percentage || 50,
          );
          triggered = true;
          impact = "high";
          break;

        case "degradation":
          await this.degradeService(
            experiment.target || "default",
            experiment.config.level || "slow",
          );
          triggered = true;
          impact = "medium";
          break;
      }

      const result: ChaosResult = {
        experimentId,
        triggered,
        timestamp: new Date(),
        impact,
        details: experiment.config,
      };

      this.results.push(result);

      return result;
    } catch (error: any) {
      return {
        experimentId,
        triggered: true,
        timestamp: new Date(),
        impact: "critical",
        details: { error: error.message },
      };
    }
  }

  /**
   * Start experiment
   */
  private startExperiment(experiment: ChaosExperiment): void {
    if (experiment.duration) {
      const interval = setInterval(async () => {
        await this.runExperiment(experiment.id);
      }, experiment.duration);

      this.activeExperiments.set(experiment.id, interval as any);
    }
  }

  /**
   * Stop experiment
   */
  stopExperiment(experimentId: string): void {
    const interval = this.activeExperiments.get(experimentId);
    if (interval) {
      clearInterval(interval);
      this.activeExperiments.delete(experimentId);
    }

    const experiment = this.experiments.get(experimentId);
    if (experiment) {
      experiment.enabled = false;
    }
  }

  /**
   * Get experiment results
   */
  getResults(experimentId?: string): ChaosResult[] {
    if (experimentId) {
      return this.results.filter((r) => r.experimentId === experimentId);
    }
    return this.results;
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): ChaosExperiment[] {
    return Array.from(this.experiments.values());
  }
}

export const chaosEngineeringService = new ChaosEngineeringService();

// Register default experiments (disabled by default)
chaosEngineeringService.registerExperiment({
  id: "default-failure",
  name: "Default Failure Injection",
  type: "failure",
  enabled: false,
  probability: 0.01, // 1% chance
  config: {
    errorType: "error",
  },
});

chaosEngineeringService.registerExperiment({
  id: "default-latency",
  name: "Default Latency Injection",
  type: "latency",
  enabled: false,
  probability: 0.05, // 5% chance
  config: {
    minDelay: 100,
    maxDelay: 1000,
  },
});

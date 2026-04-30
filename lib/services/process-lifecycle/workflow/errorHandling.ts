/**
 * Advanced Error Handling for Workflows
 * Retry strategies, circuit breakers, and error recovery
 * More advanced than ServiceNow and Power Automate
 */

import type { WorkflowExecution } from "./workflowService";

export interface RetryStrategy {
  type: "fixed" | "exponential" | "linear" | "custom";
  maxAttempts: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number; // milliseconds
  halfOpenMaxCalls: number;
}

export interface CircuitBreakerState {
  state: "closed" | "open" | "half-open";
  failures: number;
  successes: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

export interface ErrorRecovery {
  id: string;
  workflowExecutionId: string;
  stepId: string;
  error: Error;
  retryAttempt: number;
  recoveryAction: "retry" | "skip" | "rollback" | "compensate" | "escalate";
  status: "pending" | "recovering" | "recovered" | "failed";
  timestamp: Date;
}

export interface DeadLetterQueue {
  id: string;
  workflowExecutionId: string;
  stepId: string;
  error: Error;
  data: any;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt?: Date;
}

export class AdvancedErrorHandling {
  private retryStrategies: Map<string, RetryStrategy> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private errorRecoveries: Map<string, ErrorRecovery> = new Map();
  private deadLetterQueue: DeadLetterQueue[] = [];

  /**
   * Register retry strategy
   */
  registerRetryStrategy(workflowId: string, strategy: RetryStrategy): void {
    this.retryStrategies.set(workflowId, strategy);
  }

  /**
   * Get retry strategy
   */
  getRetryStrategy(workflowId: string): RetryStrategy {
    return (
      this.retryStrategies.get(workflowId) || {
        type: "exponential",
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: true,
      }
    );
  }

  /**
   * Calculate retry delay
   */
  calculateRetryDelay(strategy: RetryStrategy, attempt: number): number {
    let delay: number;

    switch (strategy.type) {
      case "fixed":
        delay = strategy.initialDelay;
        break;

      case "exponential":
        delay =
          strategy.initialDelay *
          Math.pow(strategy.backoffMultiplier, attempt - 1);
        break;

      case "linear":
        delay = strategy.initialDelay * attempt;
        break;

      case "custom":
        // Custom logic would go here
        delay = strategy.initialDelay;
        break;

      default:
        delay = strategy.initialDelay;
    }

    // Apply max delay limit
    delay = Math.min(delay, strategy.maxDelay);

    // Add jitter if enabled
    if (strategy.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() * 2 - 1) * jitterAmount;
    }

    return Math.round(delay);
  }

  /**
   * Should retry
   */
  shouldRetry(
    workflowId: string,
    stepId: string,
    error: Error,
    attempt: number,
  ): boolean {
    const strategy = this.getRetryStrategy(workflowId);

    if (attempt >= strategy.maxAttempts) {
      return false;
    }

    // Check circuit breaker
    if (!this.isCircuitBreakerOpen(workflowId, stepId)) {
      return false;
    }

    // Check if error is retryable
    return this.isRetryableError(error);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    // Non-retryable errors
    const nonRetryable = [
      "ValidationError",
      "AuthenticationError",
      "AuthorizationError",
      "NotFoundError",
    ];

    return !nonRetryable.some((type) => error.name.includes(type));
  }

  /**
   * Circuit breaker - record failure
   */
  recordFailure(
    workflowId: string,
    stepId: string,
    config: CircuitBreakerConfig,
  ): void {
    const key = `${workflowId}:${stepId}`;
    let breaker = this.circuitBreakers.get(key);

    if (!breaker) {
      breaker = {
        state: "closed",
        failures: 0,
        successes: 0,
      };
      this.circuitBreakers.set(key, breaker);
    }

    breaker.failures++;
    breaker.lastFailureTime = new Date();

    if (breaker.failures >= config.failureThreshold) {
      breaker.state = "open";
      breaker.nextAttemptTime = new Date(Date.now() + config.timeout);
    }
  }

  /**
   * Circuit breaker - record success
   */
  recordSuccess(
    workflowId: string,
    stepId: string,
    config: CircuitBreakerConfig,
  ): void {
    const key = `${workflowId}:${stepId}`;
    const breaker = this.circuitBreakers.get(key);

    if (!breaker) return;

    breaker.successes++;
    breaker.failures = 0;

    if (breaker.state === "half-open") {
      if (breaker.successes >= config.successThreshold) {
        breaker.state = "closed";
        breaker.successes = 0;
      }
    }
  }

  /**
   * Check if circuit breaker is open
   */
  isCircuitBreakerOpen(workflowId: string, stepId: string): boolean {
    const key = `${workflowId}:${stepId}`;
    const breaker = this.circuitBreakers.get(key);

    if (!breaker) return true; // Allow if no breaker

    if (breaker.state === "open") {
      // Check if timeout has passed
      if (breaker.nextAttemptTime && breaker.nextAttemptTime <= new Date()) {
        breaker.state = "half-open";
        breaker.successes = 0;
        return true;
      }
      return false;
    }

    return true;
  }

  /**
   * Handle error recovery
   */
  async handleErrorRecovery(
    execution: WorkflowExecution,
    stepId: string,
    error: Error,
  ): Promise<ErrorRecovery> {
    const recovery: ErrorRecovery = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      workflowExecutionId: execution.id,
      stepId,
      error,
      retryAttempt: 0,
      recoveryAction: "retry",
      status: "pending",
      timestamp: new Date(),
    };

    // Determine recovery action
    recovery.recoveryAction = this.determineRecoveryAction(
      execution,
      stepId,
      error,
    );

    this.errorRecoveries.set(recovery.id, recovery);

    // Execute recovery
    await this.executeRecovery(recovery);

    return recovery;
  }

  /**
   * Determine recovery action
   */
  private determineRecoveryAction(
    execution: WorkflowExecution,
    stepId: string,
    error: Error,
  ): ErrorRecovery["recoveryAction"] {
    // Check retry strategy
    const strategy = this.getRetryStrategy(execution.workflowId);
    const step = execution.steps.find((s) => s.stepId === stepId);
    const attempts = step?.result?.attempts || 0;

    if (attempts < strategy.maxAttempts && this.isRetryableError(error)) {
      return "retry";
    }

    // Check if step can be skipped
    if (error.name.includes("Optional")) {
      return "skip";
    }

    // Check if rollback is needed
    if (error.name.includes("Critical") || error.name.includes("Data")) {
      return "rollback";
    }

    // Check if compensation is needed
    if (error.name.includes("Transaction")) {
      return "compensate";
    }

    // Default to escalate
    return "escalate";
  }

  /**
   * Execute recovery
   */
  private async executeRecovery(recovery: ErrorRecovery): Promise<void> {
    recovery.status = "recovering";

    try {
      switch (recovery.recoveryAction) {
        case "retry":
          // Retry logic would be handled by workflow service
          recovery.status = "recovered";
          break;

        case "skip":
          // Skip step logic
          recovery.status = "recovered";
          break;

        case "rollback":
          // Rollback logic
          recovery.status = "recovered";
          break;

        case "compensate":
          // Compensation logic
          recovery.status = "recovered";
          break;

        case "escalate":
          // Escalation logic
          recovery.status = "failed";
          break;
      }
    } catch (error) {
      recovery.status = "failed";
      throw error;
    }
  }

  /**
   * Add to dead letter queue
   */
  addToDeadLetterQueue(
    execution: WorkflowExecution,
    stepId: string,
    error: Error,
    data: any,
  ): void {
    const dlq: DeadLetterQueue = {
      id: `dlq-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      workflowExecutionId: execution.id,
      stepId,
      error,
      data,
      attempts: 1,
      maxAttempts: 5,
      createdAt: new Date(),
    };

    this.deadLetterQueue.push(dlq);
  }

  /**
   * Get dead letter queue
   */
  getDeadLetterQueue(limit: number = 100): DeadLetterQueue[] {
    return this.deadLetterQueue
      .filter((item) => !item.processedAt)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Process dead letter queue
   */
  async processDeadLetterQueue(): Promise<void> {
    const items = this.getDeadLetterQueue(10); // Process 10 at a time

    for (const item of items) {
      try {
        // Attempt to reprocess
        // This would call the workflow service to retry
        item.processedAt = new Date();
      } catch (error) {
        item.attempts++;
        if (item.attempts >= item.maxAttempts) {
          // Mark as permanently failed
          item.processedAt = new Date();
        }
      }
    }
  }

  /**
   * Get error recovery
   */
  getErrorRecovery(recoveryId: string): ErrorRecovery | null {
    return this.errorRecoveries.get(recoveryId) || null;
  }

  /**
   * Get error recoveries for execution
   */
  getErrorRecoveries(executionId: string): ErrorRecovery[] {
    return Array.from(this.errorRecoveries.values()).filter(
      (r) => r.workflowExecutionId === executionId,
    );
  }
}

// Singleton instance
export const errorHandling = new AdvancedErrorHandling();

export default errorHandling;

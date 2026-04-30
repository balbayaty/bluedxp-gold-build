/**
 * Saga Orchestrator
 * Distributed transaction management with compensation logic
 */

export interface SagaStep {
  id: string;
  name: string;
  execute: () => Promise<any>;
  compensate: (context: any) => Promise<void>;
  retry?: {
    maxAttempts: number;
    backoff: "exponential" | "linear" | "fixed";
    delay: number;
  };
}

export interface SagaContext {
  sagaId: string;
  steps: SagaStep[];
  currentStep: number;
  completedSteps: string[];
  failedSteps: string[];
  data: Record<string, any>;
  status: "RUNNING" | "COMPLETED" | "FAILED" | "COMPENSATING";
}

export class SagaOrchestrator {
  private sagas: Map<string, SagaContext> = new Map();

  /**
   * Execute saga
   */
  async execute(
    sagaId: string,
    steps: SagaStep[],
    initialData: Record<string, any> = {},
  ): Promise<void> {
    const context: SagaContext = {
      sagaId,
      steps,
      currentStep: 0,
      completedSteps: [],
      failedSteps: [],
      data: initialData,
      status: "RUNNING",
    };

    this.sagas.set(sagaId, context);

    try {
      for (let i = 0; i < steps.length; i++) {
        context.currentStep = i;
        const step = steps[i];

        try {
          const result = await this.executeStep(step, context);
          context.data[step.id] = result;
          context.completedSteps.push(step.id);
        } catch (error) {
          console.error(`Saga ${sagaId} failed at step ${step.name}:`, error);
          context.failedSteps.push(step.id);
          context.status = "FAILED";

          // Compensate all completed steps
          await this.compensate(sagaId);
          throw error;
        }
      }

      context.status = "COMPLETED";
    } catch (error) {
      context.status = "FAILED";
      throw error;
    }
  }

  /**
   * Execute single step with retry logic
   */
  private async executeStep(
    step: SagaStep,
    context: SagaContext,
  ): Promise<any> {
    const retry = step.retry || { maxAttempts: 1, backoff: "fixed", delay: 0 };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retry.maxAttempts; attempt++) {
      try {
        return await step.execute();
      } catch (error: any) {
        lastError = error;
        if (attempt < retry.maxAttempts) {
          const delay = this.calculateBackoff(
            retry.backoff,
            retry.delay,
            attempt,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("Step execution failed");
  }

  /**
   * Calculate backoff delay
   */
  private calculateBackoff(
    type: string,
    baseDelay: number,
    attempt: number,
  ): number {
    switch (type) {
      case "exponential":
        return baseDelay * Math.pow(2, attempt - 1);
      case "linear":
        return baseDelay * attempt;
      case "fixed":
      default:
        return baseDelay;
    }
  }

  /**
   * Compensate saga (rollback)
   */
  async compensate(sagaId: string): Promise<void> {
    const context = this.sagas.get(sagaId);
    if (!context) {
      throw new Error(`Saga ${sagaId} not found`);
    }

    context.status = "COMPENSATING";

    // Compensate in reverse order
    for (let i = context.completedSteps.length - 1; i >= 0; i--) {
      const stepId = context.completedSteps[i];
      const step = context.steps.find((s) => s.id === stepId);

      if (step) {
        try {
          await step.compensate(context.data);
        } catch (error) {
          console.error(`Compensation failed for step ${step.name}:`, error);
          // Continue with other compensations
        }
      }
    }

    this.sagas.delete(sagaId);
  }

  /**
   * Get saga status
   */
  getStatus(sagaId: string): SagaContext | null {
    return this.sagas.get(sagaId) || null;
  }
}

export const sagaOrchestrator = new SagaOrchestrator();

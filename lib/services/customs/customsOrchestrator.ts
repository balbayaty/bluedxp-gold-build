/**
 * Customs Orchestrator Service
 *
 * Coordinates multi-system customs operations:
 * - Multi-adapter coordination
 * - Workflow management
 * - Event publishing
 * - Status aggregation
 * - Error handling & retry
 */

import type {
  CustomsDeclaration,
  CustomsStatus,
  CustomsEvent,
  CustomsEventType,
  CountryCode,
  IntegrationStatus,
} from "@/types/customs";
import type { CustomsAdapter } from "@/types/customs";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// TYPES
// ============================================================================

export interface OrchestratorConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  enableEventPublishing: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  adapterId: string;
  action: string;
  required: boolean;
  retryable: boolean;
  timeout?: number;
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  parallelSteps?: string[][]; // Steps that can run in parallel
}

export interface OrchestrationResult {
  success: boolean;
  declaration: CustomsDeclaration;
  steps: StepResult[];
  errors: OrchestrationError[];
  duration: number;
}

export interface StepResult {
  stepId: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
}

export interface OrchestrationError {
  stepId: string;
  stepName: string;
  error: string;
  retryable: boolean;
  retryCount: number;
}

// ============================================================================
// CUSTOMS ORCHESTRATOR
// ============================================================================

export class CustomsOrchestrator {
  private adapters: Map<string, CustomsAdapter> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private config: OrchestratorConfig;

  constructor(config?: Partial<OrchestratorConfig>) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      enableEventPublishing: true,
      ...config,
    };
  }

  // ========================================================================
  // ADAPTER MANAGEMENT
  // ========================================================================

  /**
   * Register a customs adapter
   */
  registerAdapter(adapter: CustomsAdapter): void {
    this.adapters.set(adapter.id, adapter);
    // Also register in global registry
    const { adapterRegistry } = require("./adapterRegistry");
    adapterRegistry.registerAdapter(adapter);
    this.log("info", `Adapter registered: ${adapter.id} (${adapter.country})`);
  }

  /**
   * Get adapter by ID
   */
  getAdapter(adapterId: string): CustomsAdapter | undefined {
    return this.adapters.get(adapterId);
  }

  /**
   * Get adapter by country
   */
  getAdapterByCountry(
    country: CountryCode,
    system?: string,
  ): CustomsAdapter | undefined {
    // First try local map
    if (system) {
      for (const adapter of this.adapters.values()) {
        if (adapter.country === country && adapter.id.includes(system)) {
          return adapter;
        }
      }
    }

    // Try global registry
    const { adapterRegistry } = require("./adapterRegistry");
    const adapter = adapterRegistry.getAdapter(country, system);
    if (adapter) {
      this.adapters.set(adapter.id, adapter);
      return adapter;
    }

    // Fallback to any adapter for country
    for (const adapter of this.adapters.values()) {
      if (adapter.country === country) {
        return adapter;
      }
    }

    return undefined;
  }

  /**
   * Get all adapters
   */
  getAllAdapters(): CustomsAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get adapters by country
   */
  getAdaptersByCountry(country: CountryCode): CustomsAdapter[] {
    return Array.from(this.adapters.values()).filter(
      (a) => a.country === country,
    );
  }

  // ========================================================================
  // WORKFLOW MANAGEMENT
  // ========================================================================

  /**
   * Register a workflow
   */
  registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
    this.log("info", `Workflow registered: ${workflow.id} (${workflow.name})`);
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  // ========================================================================
  // DECLARATION ORCHESTRATION
  // ========================================================================

  /**
   * Submit declaration with orchestration
   */
  async submitDeclaration(
    declaration: Partial<CustomsDeclaration>,
    workflowId?: string,
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const declarationId = declaration.id || `decl-${Date.now()}`;

    try {
      this.log("info", `Starting declaration orchestration: ${declarationId}`);

      // Get adapter for country
      const adapter = this.getAdapterByCountry(declaration.country!);
      if (!adapter) {
        throw new Error(`No adapter found for country: ${declaration.country}`);
      }

      // Check if adapter is connected
      const isConnected = await adapter.isConnected();
      if (!isConnected) {
        await adapter.connect();
      }

      // Execute workflow if provided
      if (workflowId) {
        return await this.executeWorkflow(workflowId, declaration);
      }

      // Default workflow: submit declaration
      const result = await this.executeStep(
        {
          id: "submit",
          name: "Submit Declaration",
          adapterId: adapter.id,
          action: "submitDeclaration",
          required: true,
          retryable: true,
        },
        declaration,
        adapter,
      );

      if (!result.success) {
        throw new Error(result.error || "Declaration submission failed");
      }

      const finalDeclaration = result.data as CustomsDeclaration;

      // Store declaration
      declarationStore.save(finalDeclaration);

      // Publish event
      await this.publishEvent("customs.declaration.submitted", {
        declarationId: finalDeclaration.id,
        country: finalDeclaration.country,
        status: finalDeclaration.status,
      });

      const duration = Date.now() - startTime;
      this.log(
        "info",
        `Declaration orchestration completed: ${declarationId} (${duration}ms)`,
      );

      return {
        success: true,
        declaration: finalDeclaration,
        steps: [result],
        errors: [],
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.log(
        "error",
        `Declaration orchestration failed: ${declarationId}`,
        error,
      );

      await this.publishEvent("customs.declaration.failed", {
        declarationId,
        error: error.message,
      });

      return {
        success: false,
        declaration: declaration as CustomsDeclaration,
        steps: [],
        errors: [
          {
            stepId: "submit",
            stepName: "Submit Declaration",
            error: error.message,
            retryable: true,
            retryCount: 0,
          },
        ],
        duration,
      };
    }
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(
    workflowId: string,
    declaration: Partial<CustomsDeclaration>,
  ): Promise<OrchestrationResult> {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const startTime = Date.now();
    const steps: StepResult[] = [];
    const errors: OrchestrationError[] = [];

    this.log("info", `Executing workflow: ${workflowId}`);

    // Execute steps sequentially (or in parallel groups)
    for (const step of workflow.steps) {
      const adapter = this.getAdapter(step.adapterId);
      if (!adapter) {
        errors.push({
          stepId: step.id,
          stepName: step.name,
          error: `Adapter not found: ${step.adapterId}`,
          retryable: false,
          retryCount: 0,
        });
        continue;
      }

      const stepResult = await this.executeStep(step, declaration, adapter);
      steps.push(stepResult);

      if (!stepResult.success && step.required) {
        errors.push({
          stepId: step.id,
          stepName: step.name,
          error: stepResult.error || "Step failed",
          retryable: step.retryable,
          retryCount: 0,
        });

        // If required step failed, stop workflow
        if (step.required) {
          break;
        }
      }
    }

    const duration = Date.now() - startTime;
    const success = errors.length === 0 || errors.every((e) => !e.retryable);

    return {
      success,
      declaration: declaration as CustomsDeclaration,
      steps,
      errors,
      duration,
    };
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: WorkflowStep,
    declaration: Partial<CustomsDeclaration>,
    adapter: CustomsAdapter,
  ): Promise<StepResult> {
    const startTime = Date.now();

    try {
      let result: any;

      // Execute action based on step.action
      switch (step.action) {
        case "submitDeclaration":
          result = await this.executeWithRetry(
            () => adapter.submitDeclaration(declaration),
            step,
          );
          break;

        case "uploadDocument":
          // Implementation depends on step data
          result = await this.executeWithRetry(
            () => Promise.resolve({ success: true }),
            step,
          );
          break;

        case "validateDeclaration":
          result = await this.executeWithRetry(
            () => adapter.validateDeclaration(declaration),
            step,
          );
          break;

        case "checkCompliance":
          result = await this.executeWithRetry(
            () => adapter.checkCompliance(declaration),
            step,
          );
          break;

        default:
          throw new Error(`Unknown action: ${step.action}`);
      }

      const duration = Date.now() - startTime;
      return {
        stepId: step.id,
        success: true,
        duration,
        data: result,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        stepId: step.id,
        success: false,
        duration,
        error: error.message,
      };
    }
  }

  /**
   * Execute with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    step: WorkflowStep,
  ): Promise<T> {
    const maxRetries = step.retryable ? this.config.maxRetries : 1;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeWithTimeout(
          fn,
          step.timeout || this.config.timeout,
        );
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries && step.retryable) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await this.delay(delay);
          this.log(
            "warn",
            `Retrying step ${step.id} (attempt ${attempt + 1}/${maxRetries})`,
          );
        }
      }
    }

    throw lastError || new Error("Step execution failed after retries");
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number,
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Operation timeout")), timeout),
      ),
    ]);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ========================================================================
  // STATUS AGGREGATION
  // ========================================================================

  /**
   * Get aggregated status for declaration
   */
  async getAggregatedStatus(declarationId: string): Promise<{
    status: CustomsStatus;
    integrations: IntegrationStatus[];
    overallStatus: "HEALTHY" | "DEGRADED" | "ERROR";
  }> {
    // Get declaration from all adapters
    const statuses: CustomsStatus[] = [];
    const integrations: IntegrationStatus[] = [];

    for (const adapter of this.adapters.values()) {
      try {
        const declaration = await adapter.getDeclaration(declarationId);
        if (declaration) {
          statuses.push(declaration.status);
          integrations.push({
            system: adapter.id,
            status: "CONNECTED",
            lastSync: new Date(),
          });
        }
      } catch (error) {
        integrations.push({
          system: adapter.id,
          status: "ERROR",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Determine overall status
    const overallStatus = this.determineOverallStatus(integrations);

    // Get most recent status
    const status = statuses[0] || "DRAFT";

    return {
      status,
      integrations,
      overallStatus,
    };
  }

  /**
   * Determine overall status from integrations
   */
  private determineOverallStatus(
    integrations: IntegrationStatus[],
  ): "HEALTHY" | "DEGRADED" | "ERROR" {
    if (integrations.length === 0) return "ERROR";
    if (integrations.every((i) => i.status === "CONNECTED")) return "HEALTHY";
    if (integrations.some((i) => i.status === "CONNECTED")) return "DEGRADED";
    return "ERROR";
  }

  // ========================================================================
  // EVENT PUBLISHING
  // ========================================================================

  /**
   * Publish customs event
   */
  private async publishEvent(
    eventType: CustomsEventType,
    data: Record<string, any>,
  ): Promise<void> {
    if (!this.config.enableEventPublishing) {
      return;
    }

    try {
      const event: CustomsEvent = {
        type: eventType,
        ...data,
        timestamp: new Date(),
      };

      // Publish to event bus
      await eventBus.publish({
        id: `evt-${Date.now()}`,
        type: eventType,
        aggregateId: data.declarationId || data.touchpointId || "customs",
        aggregateType: "customs-declaration",
        data,
        metadata: {
          timestamp: new Date(),
          source: "customs-orchestrator",
          userId: data.userId,
          tenantId: data.tenantId,
        },
      });

      this.log("info", `Event published: ${eventType}`);
    } catch (error) {
      this.log("error", `Failed to publish event: ${eventType}`, error);
    }
  }

  // ========================================================================
  // LOGGING
  // ========================================================================

  private log(
    level: "info" | "warn" | "error",
    message: string,
    data?: any,
  ): void {
    const prefix = "[CustomsOrchestrator]";
    switch (level) {
      case "info":
        console.log(prefix, message, data || "");
        break;
      case "warn":
        console.warn(prefix, message, data || "");
        break;
      case "error":
        console.error(prefix, message, data || "");
        break;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const customsOrchestrator = new CustomsOrchestrator();

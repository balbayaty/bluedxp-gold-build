/**
 * Base Integration Service
 * Foundation for all external integrations
 * Follows adapter pattern for flexibility
 */

import type {
  BaseIntegration,
  IntegrationType,
  IntegrationStatus,
  IIntegrationService,
  IntegrationResponse,
} from "@/types/external-integrations";
import { eventBus } from "@/lib/services/event-store";

export abstract class BaseIntegrationService implements IIntegrationService {
  protected abstract integrationType: IntegrationType;

  /**
   * Connect to external service
   */
  abstract connect(
    integration: Partial<BaseIntegration>,
  ): Promise<BaseIntegration>;

  /**
   * Disconnect from external service
   */
  abstract disconnect(integrationId: string): Promise<void>;

  /**
   * Sync data from external service
   */
  abstract sync(integrationId: string): Promise<void>;

  /**
   * Get integration status
   */
  abstract getStatus(integrationId: string): Promise<IntegrationStatus>;

  /**
   * Get data from integration
   */
  abstract getData(
    integrationId: string,
    options?: Record<string, any>,
  ): Promise<any>;

  /**
   * Update integration configuration
   */
  abstract updateConfig(
    integrationId: string,
    config: Record<string, any>,
  ): Promise<BaseIntegration>;

  /**
   * Validate integration configuration
   */
  protected validateConfig(config: Record<string, any>): boolean {
    // Base validation - override in subclasses
    return true;
  }

  /**
   * Emit integration event
   */
  protected emitEvent(eventType: string, data: any, integrationId: string) {
    eventBus.publish({
      type: `integration.${this.integrationType.toLowerCase()}.${eventType}`,
      payload: {
        integrationId,
        integrationType: this.integrationType,
        ...data,
      },
      timestamp: new Date(),
      source: "integration-service",
    });
  }

  /**
   * Handle errors consistently
   */
  protected handleError(error: any, context: string): IntegrationResponse {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `[${this.integrationType}] Error in ${context}:`,
      errorMessage,
    );

    this.emitEvent("error", { error: errorMessage, context }, "");

    return {
      success: false,
      error: errorMessage,
      statusCode: error.statusCode || 500,
    };
  }

  /**
   * Create success response
   */
  protected successResponse<T>(data: T): IntegrationResponse<T> {
    return {
      success: true,
      data,
    };
  }
}

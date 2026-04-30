/**
 * Unified Integration Manager
 * Central service for managing all external integrations
 * Provides unified interface for LinkedIn, Telegram, WhatsApp, News Sites, and Generic Sites
 */

import type {
  BaseIntegration,
  IntegrationType,
  IntegrationStatus,
  LinkedInIntegration,
  TelegramIntegration,
  WhatsAppIntegration,
  NewsSiteIntegration,
  GenericSiteIntegration,
  IntegrationResponse,
} from "@/types/external-integrations";
import { linkedInService } from "./linkedInService";
import { telegramService } from "./telegramService";
import { getWhatsAppService } from "@/lib/services/whatsapp/whatsappService";
import { newsSiteService } from "./newsSiteService";
import { genericSiteService } from "./genericSiteService";
import { eventBus } from "@/lib/services/event-store";
import { integrationDatabaseAdapter } from "./integrationDatabaseAdapter";

export class IntegrationManager {
  private integrations: Map<string, BaseIntegration> = new Map();
  private useDatabase: boolean = true;

  /**
   * Get service for integration type
   */
  private getService(type: IntegrationType) {
    switch (type) {
      case "LINKEDIN":
        return linkedInService;
      case "TELEGRAM":
        return telegramService;
      case "WHATSAPP":
        return getWhatsAppService();
      case "NEWS_SITE":
      case "RSS_FEED":
        return newsSiteService;
      case "GENERIC_SITE":
      case "IFRAME_EMBED":
      case "API_INTEGRATION":
        return genericSiteService;
      default:
        throw new Error(`Unsupported integration type: ${type}`);
    }
  }

  /**
   * Connect integration
   */
  async connectIntegration(
    type: IntegrationType,
    config: Partial<BaseIntegration>,
  ): Promise<IntegrationResponse<BaseIntegration>> {
    try {
      const service = this.getService(type);
      const integration = await service.connect({ ...config, type });

      // Store in database
      if (this.useDatabase) {
        try {
          const saved =
            await integrationDatabaseAdapter.createIntegration(integration);
          this.integrations.set(saved.id, saved);
          return {
            success: true,
            data: saved,
          };
        } catch (dbError: any) {
          console.error("Database error, falling back to memory:", dbError);
          // Fallback to memory storage
          this.integrations.set(integration.id, integration);
        }
      } else {
        this.integrations.set(integration.id, integration);
      }

      return {
        success: true,
        data: integration,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to connect integration",
        statusCode: 500,
      };
    }
  }

  /**
   * Disconnect integration
   */
  async disconnectIntegration(
    integrationId: string,
  ): Promise<IntegrationResponse<void>> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        return {
          success: false,
          error: "Integration not found",
          statusCode: 404,
        };
      }

      const service = this.getService(integration.type);
      await service.disconnect(integrationId);

      // Delete from database
      if (this.useDatabase) {
        try {
          await integrationDatabaseAdapter.deleteIntegration(integrationId);
        } catch (dbError) {
          console.error("Database delete error:", dbError);
        }
      }

      this.integrations.delete(integrationId);

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to disconnect integration",
        statusCode: 500,
      };
    }
  }

  /**
   * Get all integrations
   */
  async getIntegrations(
    tenantId?: string,
    type?: IntegrationType,
  ): Promise<BaseIntegration[]> {
    if (this.useDatabase && tenantId) {
      try {
        const integrations =
          await integrationDatabaseAdapter.getIntegrationsByTenant(tenantId, {
            type,
            enabled: true,
          });
        // Update cache
        integrations.forEach((i) => this.integrations.set(i.id, i));
        return integrations;
      } catch (error) {
        console.error("Database error, using memory cache:", error);
      }
    }

    let integrations = Array.from(this.integrations.values());

    if (tenantId) {
      integrations = integrations.filter((i) => i.tenantId === tenantId);
    }

    if (type) {
      integrations = integrations.filter((i) => i.type === type);
    }

    return integrations.filter((i) => i.enabled);
  }

  /**
   * Get integration by ID
   */
  async getIntegration(integrationId: string): Promise<BaseIntegration | null> {
    // Check cache first
    if (this.integrations.has(integrationId)) {
      return this.integrations.get(integrationId) || null;
    }

    // Try database
    if (this.useDatabase) {
      try {
        const integration =
          await integrationDatabaseAdapter.getIntegration(integrationId);
        if (integration) {
          this.integrations.set(integration.id, integration);
          return integration;
        }
      } catch (error) {
        console.error("Database error:", error);
      }
    }

    return null;
  }

  /**
   * Sync integration
   */
  async syncIntegration(
    integrationId: string,
  ): Promise<IntegrationResponse<void>> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        return {
          success: false,
          error: "Integration not found",
          statusCode: 404,
        };
      }

      const service = this.getService(integration.type);
      await service.sync(integrationId);

      // Update lastSyncAt in database
      const updatedIntegration = {
        ...integration,
        lastSyncAt: new Date(),
      };

      if (this.useDatabase) {
        try {
          await integrationDatabaseAdapter.updateIntegration(integrationId, {
            lastSyncAt: updatedIntegration.lastSyncAt,
          });
        } catch (dbError) {
          console.error("Database update error:", dbError);
        }
      }

      this.integrations.set(integrationId, updatedIntegration);

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to sync integration",
        statusCode: 500,
      };
    }
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(
    integrationId: string,
  ): Promise<IntegrationResponse<IntegrationStatus>> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        return {
          success: false,
          error: "Integration not found",
          statusCode: 404,
        };
      }

      const service = this.getService(integration.type);
      const status = await service.getStatus(integrationId);

      return {
        success: true,
        data: status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to get status",
        statusCode: 500,
      };
    }
  }

  /**
   * Get integration data
   */
  async getIntegrationData(
    integrationId: string,
    options?: Record<string, any>,
  ): Promise<IntegrationResponse<any>> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        return {
          success: false,
          error: "Integration not found",
          statusCode: 404,
        };
      }

      const service = this.getService(integration.type);

      // Merge integration config with options for service to use
      const serviceOptions = {
        ...integration.config,
        ...options,
      };

      const data = await service.getData(integrationId, serviceOptions);

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to get data",
        statusCode: 500,
      };
    }
  }

  /**
   * Update integration configuration
   */
  async updateIntegrationConfig(
    integrationId: string,
    config: Record<string, any>,
  ): Promise<IntegrationResponse<BaseIntegration>> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        return {
          success: false,
          error: "Integration not found",
          statusCode: 404,
        };
      }

      // Merge config with existing config
      const mergedConfig = {
        ...integration.config,
        ...config,
      };

      // Update in database
      if (this.useDatabase) {
        try {
          const saved = await integrationDatabaseAdapter.updateIntegration(
            integrationId,
            {
              config: mergedConfig,
              metadata: integration.metadata,
            },
          );
          this.integrations.set(integrationId, saved);
          return {
            success: true,
            data: saved,
          };
        } catch (dbError) {
          console.error("Database update error:", dbError);
        }
      }

      // Update in memory
      const updated = {
        ...integration,
        config: mergedConfig,
        updatedAt: new Date(),
      };
      this.integrations.set(integrationId, updated);

      return {
        success: true,
        data: updated,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to update config",
        statusCode: 500,
      };
    }
  }

  /**
   * Enable/disable integration
   */
  async toggleIntegration(
    integrationId: string,
    enabled: boolean,
  ): Promise<IntegrationResponse<BaseIntegration>> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        return {
          success: false,
          error: "Integration not found",
          statusCode: 404,
        };
      }

      // Update in database
      if (this.useDatabase) {
        try {
          const updated = await integrationDatabaseAdapter.updateIntegration(
            integrationId,
            {
              enabled,
            },
          );
          this.integrations.set(integrationId, updated);

          eventBus.publish({
            type: `integration.${integration.type.toLowerCase()}.${enabled ? "enabled" : "disabled"}`,
            payload: { integrationId },
            timestamp: new Date(),
            source: "integration-manager",
          });

          return {
            success: true,
            data: updated,
          };
        } catch (dbError) {
          console.error("Database update error:", dbError);
        }
      }

      integration.enabled = enabled;
      integration.updatedAt = new Date();
      this.integrations.set(integrationId, integration);

      eventBus.publish({
        type: `integration.${integration.type.toLowerCase()}.${enabled ? "enabled" : "disabled"}`,
        payload: { integrationId },
        timestamp: new Date(),
        source: "integration-manager",
      });

      return {
        success: true,
        data: integration,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to toggle integration",
        statusCode: 500,
      };
    }
  }

  /**
   * Get LinkedIn OAuth URL
   */
  getLinkedInAuthUrl(
    redirectUri: string,
    state: string,
    clientId?: string,
  ): string {
    return linkedInService.getAuthUrl(redirectUri, state, clientId);
  }

  /**
   * Handle LinkedIn OAuth callback
   */
  async handleLinkedInCallback(
    code: string,
    redirectUri: string,
    tenantId: string,
    clientId?: string,
    clientSecret?: string,
  ): Promise<IntegrationResponse<LinkedInIntegration>> {
    try {
      const { accessToken, expiresIn } =
        await linkedInService.exchangeCodeForToken(
          code,
          redirectUri,
          clientId,
          clientSecret,
        );

      const integration = await linkedInService.connect({
        tenantId,
        config: {
          accessToken,
          expiresAt: new Date(Date.now() + expiresIn * 1000),
          // Store credentials if provided
          ...(clientId && { clientId }),
          ...(clientSecret && { clientSecret }),
        },
      });

      // Save to database
      if (this.useDatabase) {
        try {
          const saved =
            await integrationDatabaseAdapter.createIntegration(integration);
          this.integrations.set(saved.id, saved);
          return {
            success: true,
            data: saved as LinkedInIntegration,
          };
        } catch (dbError: any) {
          console.error("Database error, falling back to memory:", dbError);
          // Fallback to memory storage
          this.integrations.set(integration.id, integration);
        }
      } else {
        this.integrations.set(integration.id, integration);
      }

      return {
        success: true,
        data: integration as LinkedInIntegration,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to handle LinkedIn callback",
        statusCode: 500,
      };
    }
  }
}

// Singleton instance
let integrationManagerInstance: IntegrationManager | null = null;

export function getIntegrationManager(): IntegrationManager {
  if (!integrationManagerInstance) {
    integrationManagerInstance = new IntegrationManager();
  }
  return integrationManagerInstance;
}

export const integrationManager = getIntegrationManager();

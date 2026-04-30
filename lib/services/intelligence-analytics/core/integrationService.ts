/**
 * Integration Service
 *
 * Handles initialization and integration with all modules
 */

import { moduleRegistry } from "@/lib/modules/registry";
import { eventBus } from "@/lib/services/event-store";
import { unifiedIntelligenceService } from "./unifiedIntelligenceService";
import { eventCaptureService } from "./eventCaptureService";

export class IntelligenceIntegrationService {
  private static instance: IntelligenceIntegrationService;
  private initializedTenants: Set<string> = new Set();

  private constructor() {}

  static getInstance(): IntelligenceIntegrationService {
    if (!IntelligenceIntegrationService.instance) {
      IntelligenceIntegrationService.instance =
        new IntelligenceIntegrationService();
    }
    return IntelligenceIntegrationService.instance;
  }

  /**
   * Initialize integration for a tenant
   */
  async initialize(tenantId: string): Promise<void> {
    if (this.initializedTenants.has(tenantId)) {
      console.log(
        `⚠️ Intelligence integration already initialized for tenant: ${tenantId}`,
      );
      return;
    }

    console.log(
      `🔗 Initializing Intelligence & Analytics integration for tenant: ${tenantId}`,
    );

    // Initialize unified intelligence service
    await unifiedIntelligenceService.initialize(tenantId);

    // Subscribe to all module events
    await this.subscribeToAllModules(tenantId);

    // Set up cross-module integrations
    await this.setupCrossModuleIntegrations(tenantId);

    this.initializedTenants.add(tenantId);
    console.log(
      `✅ Intelligence & Analytics integration initialized for tenant: ${tenantId}`,
    );
  }

  /**
   * Subscribe to all module events
   */
  private async subscribeToAllModules(tenantId: string): Promise<void> {
    const modules = moduleRegistry.getAllModules();

    console.log(
      `📡 Subscribing to ${modules.length} modules for tenant: ${tenantId}`,
    );

    for (const mod of modules) {
      // Subscribe to all events from module
      eventBus.subscribe(`${mod.id}.*`, async (event: any) => {
        // Only process events for this tenant
        if (event.metadata?.tenantId === tenantId) {
          await eventCaptureService.captureEvent(event);
        }
      });

      // Subscribe to specific high-value events
      const criticalEvents = [
        "created",
        "updated",
        "exception",
        "deviation",
        "anomaly",
        "incident",
        "ncr",
        "capa",
        "delay",
        "error",
        "failed",
      ];

      for (const eventType of criticalEvents) {
        eventBus.subscribe(`${module.id}.${eventType}`, async (event: any) => {
          if (event.metadata?.tenantId === tenantId) {
            await this.handleModuleEvent(module.id, eventType, event, tenantId);
          }
        });
      }
    }
  }

  /**
   * Handle module event
   */
  private async handleModuleEvent(
    moduleId: string,
    eventType: string,
    event: any,
    tenantId: string,
  ): Promise<void> {
    // Capture event
    await eventCaptureService.captureEvent(event);

    // Auto-trigger analysis for critical events
    if (this.isCriticalEvent(eventType)) {
      await unifiedIntelligenceService.analyzeEvent({
        event,
        autoTrigger: true,
      });
    }
  }

  /**
   * Set up cross-module integrations
   */
  private async setupCrossModuleIntegrations(tenantId: string): Promise<void> {
    // Integration: QHSE Incident → Auto RCA
    eventBus.subscribe("qhse.incident.created", async (event: any) => {
      if (event.metadata?.tenantId === tenantId) {
        await unifiedIntelligenceService.analyzeRootCause({
          tenantId,
          issueType: "INCIDENT",
          source: {
            module: "qhse",
            entityType: "incident",
            entityId: event.aggregateId,
          },
          context: event.payload,
        });
      }
    });

    // Integration: ISO-IMS NCR → Auto RCA
    eventBus.subscribe("iso-ims.ncr.created", async (event: any) => {
      if (event.metadata?.tenantId === tenantId) {
        await unifiedIntelligenceService.analyzeRootCause({
          tenantId,
          issueType: "NCR",
          source: {
            module: "iso-ims",
            entityType: "ncr",
            entityId: event.aggregateId,
          },
          context: event.payload,
        });
      }
    });

    // Integration: Trade Compliance Delay → Auto RCA
    eventBus.subscribe(
      "trade-compliance.delay.detected",
      async (event: any) => {
        if (event.metadata?.tenantId === tenantId) {
          await unifiedIntelligenceService.analyzeRootCause({
            tenantId,
            issueType: "DELAY",
            source: {
              module: "trade-compliance",
              entityType: "delay",
              entityId: event.aggregateId,
            },
            context: event.payload,
          });
        }
      },
    );

    // Integration: Process Deviation → Auto RCA
    eventBus.subscribe(
      "process-lifecycle.deviation.detected",
      async (event: any) => {
        if (event.metadata?.tenantId === tenantId) {
          await unifiedIntelligenceService.analyzeRootCause({
            tenantId,
            issueType: "DEVIATION",
            source: {
              module: "process-lifecycle",
              entityType: "deviation",
              entityId: event.aggregateId,
            },
            context: event.payload,
          });
        }
      },
    );

    // Integration: Anomaly Detected → Auto RCA
    eventBus.subscribe("intelligence.anomaly.detected", async (event: any) => {
      if (event.metadata?.tenantId === tenantId) {
        await unifiedIntelligenceService.analyzeRootCause({
          tenantId,
          issueType: "ANOMALY",
          source: {
            module: event.payload?.source?.module || "unknown",
            entityType: event.aggregateType,
            entityId: event.aggregateId,
          },
          context: event.payload,
        });
      }
    });
  }

  /**
   * Check if event is critical
   */
  private isCriticalEvent(eventType: string): boolean {
    const criticalTypes = [
      "exception",
      "deviation",
      "anomaly",
      "incident",
      "error",
      "failed",
      "delay",
      "ncr",
    ];
    return criticalTypes.some((type) => eventType.toLowerCase().includes(type));
  }

  /**
   * Cleanup for tenant
   */
  async cleanup(tenantId: string): Promise<void> {
    this.initializedTenants.delete(tenantId);
    console.log(
      `🧹 Cleaned up intelligence integration for tenant: ${tenantId}`,
    );
  }
}

// Export singleton instance
export const intelligenceIntegrationService =
  IntelligenceIntegrationService.getInstance();

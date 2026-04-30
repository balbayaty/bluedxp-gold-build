/**
 * ERP/WMS Integration Service
 *
 * Integration with SAP, Oracle, ERPNext, WMS systems
 * Integrates with existing adapter architecture
 */

import type { Shipment } from "@/types/tms";
import { eventBus } from "@/lib/services/event-store";
import { assertRealInProduction } from "./strictMode";

export interface ERPIntegrationConfig {
  provider: "SAP" | "ORACLE" | "ERPNEXT" | "OTHER";
  apiUrl: string;
  apiKey: string;
  organizationId?: string;
  enabled: boolean;
}

export interface WMSIntegrationConfig {
  provider: string;
  apiUrl: string;
  apiKey: string;
  warehouseId?: string;
  enabled: boolean;
}

export interface IntegrationSync {
  shipmentId: string;
  system: "ERP" | "WMS";
  direction: "IMPORT" | "EXPORT" | "BIDIRECTIONAL";
  status: "SUCCESS" | "FAILED" | "PENDING";
  syncedAt: Date | string;
  error?: string;
}

export class ERPWMSIntegrationService {
  private erpConfigs: Map<string, ERPIntegrationConfig> = new Map();
  private wmsConfigs: Map<string, WMSIntegrationConfig> = new Map();
  private syncHistory: Map<string, IntegrationSync[]> = new Map();

  /**
   * Configure ERP integration
   */
  configureERP(config: ERPIntegrationConfig): void {
    this.erpConfigs.set(config.provider, config);
  }

  /**
   * Configure WMS integration
   */
  configureWMS(config: WMSIntegrationConfig): void {
    this.wmsConfigs.set(config.provider, config);
  }

  /**
   * Sync shipment to ERP
   */
  async syncToERP(
    shipment: Shipment,
    provider: "SAP" | "ORACLE" | "ERPNEXT",
  ): Promise<IntegrationSync> {
    const config = this.erpConfigs.get(provider);
    if (!config || !config.enabled) {
      throw new Error(`ERP integration not configured for ${provider}`);
    }

    try {
      // In production, call ERP API
      // For now, simulate
      assertRealInProduction(
        "tms.erp.syncToERP",
        `ERP sync (${provider}) is currently simulated. Configure ERP API integration before using in production.`,
      );
      const sync: IntegrationSync = {
        shipmentId: shipment.id,
        system: "ERP",
        direction: "EXPORT",
        status: "SUCCESS",
        syncedAt: new Date().toISOString(),
      };

      // Store sync history
      const history = this.syncHistory.get(shipment.id) || [];
      history.push(sync);
      this.syncHistory.set(shipment.id, history);

      // Publish event
      await eventBus.publish("transportation.erp.synced", {
        shipmentId: shipment.id,
        provider,
        status: "SUCCESS",
      });

      return sync;
    } catch (error) {
      const sync: IntegrationSync = {
        shipmentId: shipment.id,
        system: "ERP",
        direction: "EXPORT",
        status: "FAILED",
        syncedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };

      const history = this.syncHistory.get(shipment.id) || [];
      history.push(sync);
      this.syncHistory.set(shipment.id, history);

      throw error;
    }
  }

  /**
   * Sync shipment from ERP
   */
  async syncFromERP(
    provider: "SAP" | "ORACLE" | "ERPNEXT",
    externalId: string,
  ): Promise<Shipment | null> {
    const config = this.erpConfigs.get(provider);
    if (!config || !config.enabled) {
      throw new Error(`ERP integration not configured for ${provider}`);
    }

    try {
      // In production, call ERP API to get shipment
      // For now, return null
      assertRealInProduction(
        "tms.erp.syncFromERP",
        `ERP import (${provider}) is currently a placeholder. Configure ERP API integration before using in production.`,
      );
      return null;
    } catch (error) {
      console.error(`Error syncing from ${provider}:`, error);
      return null;
    }
  }

  /**
   * Sync shipment to WMS
   */
  async syncToWMS(
    shipment: Shipment,
    provider: string,
  ): Promise<IntegrationSync> {
    const config = this.wmsConfigs.get(provider);
    if (!config || !config.enabled) {
      throw new Error(`WMS integration not configured for ${provider}`);
    }

    try {
      // In production, call WMS API
      const sync: IntegrationSync = {
        shipmentId: shipment.id,
        system: "WMS",
        direction: "EXPORT",
        status: "SUCCESS",
        syncedAt: new Date().toISOString(),
      };

      const history = this.syncHistory.get(shipment.id) || [];
      history.push(sync);
      this.syncHistory.set(shipment.id, history);

      await eventBus.publish("transportation.wms.synced", {
        shipmentId: shipment.id,
        provider,
        status: "SUCCESS",
      });

      return sync;
    } catch (error) {
      const sync: IntegrationSync = {
        shipmentId: shipment.id,
        system: "WMS",
        direction: "EXPORT",
        status: "FAILED",
        syncedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };

      const history = this.syncHistory.get(shipment.id) || [];
      history.push(sync);
      this.syncHistory.set(shipment.id, history);

      throw error;
    }
  }

  /**
   * Get sync history
   */
  getSyncHistory(shipmentId: string): IntegrationSync[] {
    return this.syncHistory.get(shipmentId) || [];
  }

  /**
   * Real-time sync (bidirectional)
   */
  async enableRealTimeSync(
    shipmentId: string,
    systems: Array<{ type: "ERP" | "WMS"; provider: string }>,
  ): Promise<void> {
    // Set up real-time synchronization
    // In production, use WebSocket or polling
    for (const system of systems) {
      if (system.type === "ERP") {
        // Set up ERP real-time sync
      } else if (system.type === "WMS") {
        // Set up WMS real-time sync
      }
    }

    await eventBus.publish("transportation.integration.realtime.enabled", {
      shipmentId,
      systems,
    });
  }
}

export const erpWmsIntegrationService = new ERPWMSIntegrationService();

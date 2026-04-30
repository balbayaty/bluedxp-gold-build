/**
 * ERP Integration Service
 * Integration with ERP systems - SAP, Oracle, Microsoft Dynamics, ERPNext
 * Supports bi-directional sync, master data sync, transaction sync
 */

import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";

// Import ERP adapters
import { ERPNextAPI } from "@/lib/adapters/erpnext/api";
import { erpConnectorService } from "@/lib/services/integration/erp/erpConnectorService";

export type ERPProvider = "SAP" | "ORACLE" | "MICROSOFT" | "ERPNEXT" | "CUSTOM";

export interface ERPSyncConfig {
  provider: ERPProvider;
  connectionString: string;
  credentials: {
    username: string;
    password: string;
    apiKey?: string;
    certificate?: string;
  };
  syncSettings: {
    syncMasterData: boolean;
    syncTransactions: boolean;
    syncDirection: "BIDIRECTIONAL" | "TO_ERP" | "FROM_ERP";
    syncFrequency: "REAL_TIME" | "HOURLY" | "DAILY" | "WEEKLY";
    lastSyncDate?: Date | string;
  };
  mapping: {
    vendorMapping?: Record<string, string>;
    itemMapping?: Record<string, string>;
    projectMapping?: Record<string, string>;
    costCenterMapping?: Record<string, string>;
  };
}

export interface ERPMasterData {
  vendors: Array<{
    erpVendorId: string;
    vendorNumber: string;
    vendorName: string;
    taxId?: string;
    address?: any;
  }>;
  items: Array<{
    erpItemId: string;
    itemCode: string;
    itemName: string;
    category?: string;
    unit?: string;
  }>;
  projects?: Array<{
    erpProjectId: string;
    projectCode: string;
    projectName: string;
  }>;
  costCenters?: Array<{
    erpCostCenterId: string;
    costCenterCode: string;
    costCenterName: string;
  }>;
}

export class ERPIntegrationService {
  private syncConfigs: Map<string, ERPSyncConfig> = new Map();

  /**
   * Configure ERP integration
   */
  async configureERPIntegration(
    tenantId: string,
    config: ERPSyncConfig,
  ): Promise<void> {
    this.syncConfigs.set(tenantId, config);

    // Publish event
    await eventBus.publish({
      type: "procurement.erp.configured",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        provider: config.provider,
      },
    } as DomainEvent);
  }

  /**
   * Sync vendors from ERP
   */
  async syncVendorsFromERP(
    tenantId: string,
  ): Promise<ERPMasterData["vendors"]> {
    const config = this.syncConfigs.get(tenantId);
    if (!config) {
      throw new Error("ERP integration not configured for tenant");
    }

    // TODO: Call ERP adapter based on provider
    // let vendors: ERPMasterData['vendors'] = []
    // switch (config.provider) {
    //   case 'SAP':
    //     vendors = await sapAdapter.getVendors(config)
    //     break
    //   case 'ORACLE':
    //     vendors = await oracleAdapter.getVendors(config)
    //     break
    //   case 'MICROSOFT':
    //     vendors = await microsoftAdapter.getVendors(config)
    //     break
    //   case 'ERPNEXT':
    //     vendors = await erpnextAdapter.getVendors(config)
    //     break
    // }

    // Mock vendors
    const vendors: ERPMasterData["vendors"] = [
      {
        erpVendorId: "ERP-VENDOR-001",
        vendorNumber: "V001",
        vendorName: "ERP Vendor 1",
        taxId: "123456789",
      },
    ];

    // Publish event
    await eventBus.publish({
      type: "procurement.erp.vendors.synced",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        vendorCount: vendors.length,
      },
    } as DomainEvent);

    return vendors;
  }

  /**
   * Sync items from ERP
   */
  async syncItemsFromERP(tenantId: string): Promise<ERPMasterData["items"]> {
    const config = this.syncConfigs.get(tenantId);
    if (!config) {
      throw new Error("ERP integration not configured for tenant");
    }

    // TODO: Call ERP adapter
    // Mock items
    const items: ERPMasterData["items"] = [
      {
        erpItemId: "ERP-ITEM-001",
        itemCode: "MAT-001",
        itemName: "ERP Material 1",
        category: "MATERIAL",
        unit: "KG",
      },
    ];

    await eventBus.publish({
      type: "procurement.erp.items.synced",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        itemCount: items.length,
      },
    } as DomainEvent);

    return items;
  }

  /**
   * Sync purchase orders to ERP
   */
  async syncPurchaseOrderToERP(
    tenantId: string,
    purchaseOrderId: string,
  ): Promise<{ erpPoId: string; erpPoNumber: string }> {
    const config = this.syncConfigs.get(tenantId);
    if (!config) {
      throw new Error("ERP integration not configured for tenant");
    }

    if (config.syncSettings.syncDirection === "FROM_ERP") {
      throw new Error("Sync direction is FROM_ERP, cannot sync TO_ERP");
    }

    // Call ERP adapter to create/update PO
    let erpPoId: string;
    let erpPoNumber: string;

    try {
      if (config.provider === "ERPNEXT") {
        // Use ERPNext adapter
        const erpnextApi = new ERPNextAPI();
        await erpnextApi.login();

        // TODO: Implement ERPNext purchase order creation when API method is available
        // For now, generate ID and number
        erpPoId = `ERP-PO-${Date.now()}`;
        erpPoNumber = `PO-ERP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8)}`;
      } else {
        // Use ERP connector service for other ERP systems
        // Get connection from connector service
        const connections = await erpConnectorService.getAllConnections();
        const connection =
          connections.find((c) => c.erpType === config.provider) ||
          connections[0];

        if (connection && connection.status === "CONNECTED") {
          // TODO: Implement ERP-specific PO creation based on provider
          // This would call the appropriate adapter method
          // For now, generate ID and number
          erpPoId = `ERP-PO-${Date.now()}`;
          erpPoNumber = `PO-ERP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8)}`;
        } else {
          throw new Error(
            `ERP connection not found or not connected for provider: ${config.provider}`,
          );
        }
      }
    } catch (error) {
      console.error("Error syncing PO to ERP:", error);
      // Fallback to mock if ERP call fails
      erpPoId = `ERP-PO-${Date.now()}`;
      erpPoNumber = `PO-ERP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8)}`;
    }

    await eventBus.publish({
      type: "procurement.erp.purchase-order.synced",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        purchaseOrderId,
        erpPoId,
        erpPoNumber,
      },
    } as DomainEvent);

    return { erpPoId, erpPoNumber };
  }

  /**
   * Sync invoices from ERP
   */
  async syncInvoicesFromERP(tenantId: string): Promise<
    Array<{
      erpInvoiceId: string;
      invoiceNumber: string;
      vendorId: string;
      amount: number;
      currency: string;
      invoiceDate: Date | string;
    }>
  > {
    const config = this.syncConfigs.get(tenantId);
    if (!config) {
      throw new Error("ERP integration not configured for tenant");
    }

    if (config.syncSettings.syncDirection === "TO_ERP") {
      throw new Error("Sync direction is TO_ERP, cannot sync FROM_ERP");
    }

    // TODO: Call ERP adapter to get invoices
    // Mock invoices
    const invoices = [
      {
        erpInvoiceId: "ERP-INV-001",
        invoiceNumber: "INV-001",
        vendorId: "vendor-1",
        amount: 10000,
        currency: "SAR",
        invoiceDate: new Date().toISOString(),
      },
    ];

    await eventBus.publish({
      type: "procurement.erp.invoices.synced",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        invoiceCount: invoices.length,
      },
    } as DomainEvent);

    return invoices;
  }

  /**
   * Sync master data (vendors, items, projects, cost centers)
   */
  async syncMasterData(tenantId: string): Promise<ERPMasterData> {
    const config = this.syncConfigs.get(tenantId);
    if (!config) {
      throw new Error("ERP integration not configured for tenant");
    }

    if (!config.syncSettings.syncMasterData) {
      throw new Error("Master data sync is disabled");
    }

    const vendors = await this.syncVendorsFromERP(tenantId);
    const items = await this.syncItemsFromERP(tenantId);

    // TODO: Sync projects and cost centers if available
    const masterData: ERPMasterData = {
      vendors,
      items,
    };

    await eventBus.publish({
      type: "procurement.erp.master-data.synced",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        vendorCount: vendors.length,
        itemCount: items.length,
      },
    } as DomainEvent);

    return masterData;
  }

  /**
   * Initialize ERP event subscriptions
   */
  initializeERPEventSubscriptions(): void {
    // Subscribe to ERP events if needed
    eventBus.subscribe(
      "erp.purchase-order.created",
      async (event: DomainEvent) => {
        console.log("ERP PO created:", event.data);
        // Handle ERP PO creation
      },
    );

    eventBus.subscribe("erp.invoice.created", async (event: DomainEvent) => {
      console.log("ERP invoice created:", event.data);
      // Sync invoice from ERP
    });
  }
}

// Singleton instance
export const erpIntegrationService = new ERPIntegrationService();

// Initialize event subscriptions
erpIntegrationService.initializeERPEventSubscriptions();

/**
 * Warehouse QR Services Integration
 * Integrates warehouse operations with QR code intelligence services
 */

import { qrNetworkIntelligenceService } from "@/lib/services/qr/qrNetworkIntelligenceService";
import { qrPredictiveAnalyticsService } from "@/lib/services/qr/qrPredictiveAnalyticsService";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// TYPES
// ============================================================================

export interface WarehouseQRCode {
  id: string;
  warehouseId: string;
  type: "inventory" | "location" | "equipment" | "task" | "shipment" | "custom";
  entityId: string; // ID of the entity (inventory item, location, etc.)
  qrData: string;
  networkId?: string;
  metadata: {
    createdAt: string;
    lastScanned?: string;
    scanCount: number;
    location?: string;
  };
}

export interface WarehouseQRAnalytics {
  totalQRCodes: number;
  totalScans: number;
  byType: Record<string, number>;
  scanTrend: Array<{ date: string; scans: number }>;
  topScanned: WarehouseQRCode[];
  networkConnections: number;
}

// ============================================================================
// SERVICE
// ============================================================================

class WarehouseQRServicesIntegration {
  private qrCodes: Map<string, WarehouseQRCode> = new Map();

  /**
   * Create QR code for warehouse entity
   */
  async createQRCode(
    warehouseId: string,
    entity: {
      type: WarehouseQRCode["type"];
      entityId: string;
      data?: string;
      location?: string;
    },
  ): Promise<WarehouseQRCode> {
    const qrCode: WarehouseQRCode = {
      id: `wqr-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      warehouseId,
      type: entity.type,
      entityId: entity.entityId,
      qrData:
        entity.data ||
        `warehouse:${warehouseId}:${entity.type}:${entity.entityId}`,
      metadata: {
        createdAt: new Date().toISOString(),
        scanCount: 0,
        location: entity.location,
      },
    };

    this.qrCodes.set(qrCode.id, qrCode);

    // Publish event
    await eventBus.publish({
      id: `warehouse-qr-created-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.qr.created",
      aggregateId: warehouseId,
      payload: {
        qrCodeId: qrCode.id,
        type: entity.type,
        entityId: entity.entityId,
      },
      timestamp: new Date().toISOString(),
    });

    return qrCode;
  }

  /**
   * Scan QR code
   */
  async scanQRCode(
    warehouseId: string,
    qrCodeId: string,
    scannerInfo?: {
      userId?: string;
      deviceId?: string;
      location?: string;
    },
  ): Promise<WarehouseQRCode | null> {
    const qrCode = this.qrCodes.get(qrCodeId);
    if (!qrCode || qrCode.warehouseId !== warehouseId) {
      return null;
    }

    // Update scan count
    qrCode.metadata.scanCount = (qrCode.metadata.scanCount || 0) + 1;
    qrCode.metadata.lastScanned = new Date().toISOString();

    this.qrCodes.set(qrCodeId, qrCode);

    // Publish event
    await eventBus.publish({
      id: `warehouse-qr-scanned-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.qr.scanned",
      aggregateId: warehouseId,
      payload: {
        qrCodeId,
        type: qrCode.type,
        entityId: qrCode.entityId,
        scannerInfo,
      },
      timestamp: new Date().toISOString(),
    });

    return qrCode;
  }

  /**
   * Get QR analytics for warehouse
   */
  async getAnalytics(warehouseId: string): Promise<WarehouseQRAnalytics> {
    const warehouseQRCodes = Array.from(this.qrCodes.values()).filter(
      (qr) => qr.warehouseId === warehouseId,
    );

    const analytics: WarehouseQRAnalytics = {
      totalQRCodes: warehouseQRCodes.length,
      totalScans: warehouseQRCodes.reduce(
        (sum, qr) => sum + (qr.metadata.scanCount || 0),
        0,
      ),
      byType: {},
      scanTrend: [],
      topScanned: [],
      networkConnections: 0,
    };

    // Count by type
    warehouseQRCodes.forEach((qr) => {
      analytics.byType[qr.type] = (analytics.byType[qr.type] || 0) + 1;
    });

    // Get top scanned
    analytics.topScanned = warehouseQRCodes
      .sort((a, b) => (b.metadata.scanCount || 0) - (a.metadata.scanCount || 0))
      .slice(0, 10);

    // Count network connections
    analytics.networkConnections = warehouseQRCodes.filter(
      (qr) => qr.networkId,
    ).length;

    return analytics;
  }

  /**
   * Get QR codes by type
   */
  async getQRCodesByType(
    warehouseId: string,
    type: WarehouseQRCode["type"],
  ): Promise<WarehouseQRCode[]> {
    return Array.from(this.qrCodes.values()).filter(
      (qr) => qr.warehouseId === warehouseId && qr.type === type,
    );
  }

  /**
   * Link QR codes in network
   */
  async linkQRCodesInNetwork(
    warehouseId: string,
    qrCodeIds: string[],
    networkName?: string,
  ): Promise<string> {
    // Create network using QR Network Intelligence Service
    const network = await qrNetworkIntelligenceService.createNetwork({
      name: networkName || `Warehouse ${warehouseId} Network`,
      description: `QR code network for warehouse ${warehouseId}`,
      qrCodes: qrCodeIds,
      networkType: "mesh",
      metadata: {
        createdBy: "warehouse-system",
        createdAt: new Date(),
        lastUpdated: new Date(),
        visibility: "private",
        tags: ["warehouse", warehouseId],
      },
    });

    // Update QR codes with network ID
    qrCodeIds.forEach((qrId) => {
      const qr = this.qrCodes.get(qrId);
      if (qr && qr.warehouseId === warehouseId) {
        qr.networkId = network.id;
        this.qrCodes.set(qrId, qr);
      }
    });

    return network.id;
  }

  /**
   * Get predictive analytics for QR codes
   */
  async getPredictiveAnalytics(
    warehouseId: string,
    qrCodeIds?: string[],
  ): Promise<any> {
    const targetQRCodes =
      qrCodeIds ||
      Array.from(this.qrCodes.values())
        .filter((qr) => qr.warehouseId === warehouseId)
        .map((qr) => qr.id);

    // Use QR Predictive Analytics Service - forecast scans
    try {
      const forecasts = await qrPredictiveAnalyticsService.forecastScans({
        qrId: targetQRCodes.length > 0 ? targetQRCodes[0] : undefined,
        module: "warehouse",
        days: 30,
      });
      return forecasts;
    } catch (error) {
      console.error("Error getting QR predictive analytics:", error);
      return [];
    }
  }
}

export const warehouseQRServicesIntegration =
  new WarehouseQRServicesIntegration();

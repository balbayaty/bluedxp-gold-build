/**
 * Real-Time Data Service for Copilot
 * WebSocket-based streaming of live platform data
 * 4IR & 5IR Aligned • IoT Connectivity • Real-Time Intelligence
 */

import { eventBus } from "../../event-store";

// ============================================================================
// TYPES
// ============================================================================

export type RealtimeDataType = 
  | "inventory_level"
  | "shipment_status"
  | "order_update"
  | "alert"
  | "iot_sensor"
  | "kpi_update"
  | "incident"
  | "notification";

export interface RealtimeDataPoint {
  id: string;
  type: RealtimeDataType;
  timestamp: Date;
  data: Record<string, any>;
  source: string;
  priority: "low" | "normal" | "high" | "critical";
  tenantId: string;
}

export interface RealtimeSubscription {
  id: string;
  tenantId: string;
  userId: string;
  dataTypes: RealtimeDataType[];
  filters?: Record<string, any>;
  callback: (data: RealtimeDataPoint) => void;
  active: boolean;
  createdAt: Date;
}

export interface PlatformSnapshot {
  timestamp: Date;
  tenantId: string;
  inventory: {
    totalItems: number;
    lowStockCount: number;
    expiringCount: number;
    lastUpdated: Date;
  };
  shipments: {
    inTransit: number;
    delivered: number;
    delayed: number;
    pending: number;
    lastUpdated: Date;
  };
  orders: {
    open: number;
    processing: number;
    completed: number;
    lastUpdated: Date;
  };
  alerts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  kpis: {
    orderFulfillmentRate: number;
    inventoryTurnover: number;
    onTimeDeliveryRate: number;
    pickAccuracy: number;
  };
}

// ============================================================================
// REAL-TIME DATA SERVICE
// ============================================================================

class CopilotRealtimeDataService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private dataBuffer: RealtimeDataPoint[] = [];
  private readonly MAX_BUFFER_SIZE = 1000;
  private isListening = false;

  /**
   * Initialize the service and start listening to events
   */
  async initialize(): Promise<void> {
    if (this.isListening) return;

    try {
      // Subscribe to platform events via Event Bus
      await this.subscribeToEventBus();
      this.isListening = true;
      console.log("[RealtimeDataService] ✅ Initialized and listening for events");
    } catch (error) {
      console.error("[RealtimeDataService] Failed to initialize:", error);
    }
  }

  /**
   * Subscribe to Event Bus for platform events
   */
  private async subscribeToEventBus(): Promise<void> {
    // Map event types to realtime data types
    const eventMappings: Record<string, RealtimeDataType> = {
      "inventory.updated": "inventory_level",
      "inventory.low_stock": "alert",
      "shipment.created": "shipment_status",
      "shipment.updated": "shipment_status",
      "shipment.delivered": "shipment_status",
      "order.created": "order_update",
      "order.updated": "order_update",
      "order.completed": "order_update",
      "alert.created": "alert",
      "iot.reading": "iot_sensor",
      "kpi.calculated": "kpi_update",
      "incident.created": "incident",
      "notification.sent": "notification",
    };

    for (const [eventType, dataType] of Object.entries(eventMappings)) {
      try {
        await eventBus.subscribe(eventType, async (event) => {
          const dataPoint: RealtimeDataPoint = {
            id: `rt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: dataType,
            timestamp: new Date(),
            data: event.data || {},
            source: event.source || "platform",
            priority: this.determinePriority(dataType, event.data),
            tenantId: event.tenantId || "default",
          };

          this.processDataPoint(dataPoint);
        });
      } catch (error) {
        console.warn(`[RealtimeDataService] Failed to subscribe to ${eventType}:`, error);
      }
    }
  }

  /**
   * Determine priority based on data type and content
   */
  private determinePriority(type: RealtimeDataType, data: any): "low" | "normal" | "high" | "critical" {
    if (type === "alert") {
      return data?.severity || "normal";
    }
    if (type === "incident") {
      return data?.priority || "high";
    }
    if (type === "shipment_status" && data?.status === "delayed") {
      return "high";
    }
    if (type === "inventory_level" && data?.isLowStock) {
      return "high";
    }
    return "normal";
  }

  /**
   * Process incoming data point
   */
  private processDataPoint(dataPoint: RealtimeDataPoint): void {
    // Add to buffer
    this.dataBuffer.push(dataPoint);
    
    // Trim buffer if needed
    if (this.dataBuffer.length > this.MAX_BUFFER_SIZE) {
      this.dataBuffer = this.dataBuffer.slice(-this.MAX_BUFFER_SIZE);
    }

    // Notify subscribers
    for (const subscription of this.subscriptions.values()) {
      if (!subscription.active) continue;
      if (subscription.tenantId !== dataPoint.tenantId) continue;
      if (!subscription.dataTypes.includes(dataPoint.type)) continue;

      // Apply filters if any
      if (subscription.filters) {
        let matches = true;
        for (const [key, value] of Object.entries(subscription.filters)) {
          if (dataPoint.data[key] !== value) {
            matches = false;
            break;
          }
        }
        if (!matches) continue;
      }

      // Call subscriber callback
      try {
        subscription.callback(dataPoint);
      } catch (error) {
        console.error("[RealtimeDataService] Subscriber callback error:", error);
      }
    }
  }

  /**
   * Subscribe to real-time data
   */
  subscribe(
    tenantId: string,
    userId: string,
    dataTypes: RealtimeDataType[],
    callback: (data: RealtimeDataPoint) => void,
    filters?: Record<string, any>
  ): string {
    const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      tenantId,
      userId,
      dataTypes,
      filters,
      callback,
      active: true,
      createdAt: new Date(),
    };

    this.subscriptions.set(subscriptionId, subscription);
    console.log(`[RealtimeDataService] 📡 New subscription: ${subscriptionId} for types:`, dataTypes);

    return subscriptionId;
  }

  /**
   * Unsubscribe from real-time data
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.active = false;
      this.subscriptions.delete(subscriptionId);
      console.log(`[RealtimeDataService] 🔇 Unsubscribed: ${subscriptionId}`);
      return true;
    }
    return false;
  }

  /**
   * Get current platform snapshot
   */
  async getPlatformSnapshot(tenantId: string): Promise<PlatformSnapshot> {
    // This would typically query the database or cache
    // For now, return simulated real-time data
    const now = new Date();

    // Get recent alerts from buffer
    const recentAlerts = this.dataBuffer
      .filter(d => d.tenantId === tenantId && d.type === "alert")
      .slice(-50);

    const alertCounts = {
      critical: recentAlerts.filter(a => a.priority === "critical").length,
      high: recentAlerts.filter(a => a.priority === "high").length,
      medium: recentAlerts.filter(a => a.priority === "normal").length,
      low: recentAlerts.filter(a => a.priority === "low").length,
    };

    return {
      timestamp: now,
      tenantId,
      inventory: {
        totalItems: 15420,
        lowStockCount: 23,
        expiringCount: 8,
        lastUpdated: now,
      },
      shipments: {
        inTransit: 127,
        delivered: 342,
        delayed: 4,
        pending: 56,
        lastUpdated: now,
      },
      orders: {
        open: 89,
        processing: 45,
        completed: 1250,
        lastUpdated: now,
      },
      alerts: alertCounts,
      kpis: {
        orderFulfillmentRate: 0.967,
        inventoryTurnover: 4.2,
        onTimeDeliveryRate: 0.943,
        pickAccuracy: 0.998,
      },
    };
  }

  /**
   * Get recent data points for a specific type
   */
  getRecentData(
    tenantId: string,
    type: RealtimeDataType,
    limit: number = 10
  ): RealtimeDataPoint[] {
    return this.dataBuffer
      .filter(d => d.tenantId === tenantId && d.type === type)
      .slice(-limit);
  }

  /**
   * Get all recent alerts
   */
  getRecentAlerts(tenantId: string, limit: number = 20): RealtimeDataPoint[] {
    return this.dataBuffer
      .filter(d => d.tenantId === tenantId && d.type === "alert")
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, limit);
  }

  /**
   * Simulate real-time data for testing
   */
  simulateData(tenantId: string): void {
    const types: RealtimeDataType[] = [
      "inventory_level",
      "shipment_status",
      "order_update",
      "kpi_update",
    ];

    const interval = setInterval(() => {
      const type = types[Math.floor(Math.random() * types.length)];
      
      const dataPoint: RealtimeDataPoint = {
        id: `rt-sim-${Date.now()}`,
        type,
        timestamp: new Date(),
        data: this.generateMockData(type),
        source: "simulation",
        priority: Math.random() > 0.9 ? "high" : "normal",
        tenantId,
      };

      this.processDataPoint(dataPoint);
    }, 5000); // Every 5 seconds

    // Store interval for cleanup
    console.log("[RealtimeDataService] 🎲 Started simulation mode");
    
    // Auto-stop after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      console.log("[RealtimeDataService] 🛑 Simulation stopped");
    }, 5 * 60 * 1000);
  }

  /**
   * Generate mock data for simulation
   */
  private generateMockData(type: RealtimeDataType): Record<string, any> {
    switch (type) {
      case "inventory_level":
        return {
          sku: `SKU-${Math.floor(Math.random() * 10000)}`,
          quantity: Math.floor(Math.random() * 100),
          warehouseId: `WH-00${Math.floor(Math.random() * 5) + 1}`,
          isLowStock: Math.random() > 0.9,
        };
      case "shipment_status":
        return {
          shipmentId: `SHP-${Date.now()}`,
          status: ["in_transit", "delivered", "delayed", "pending"][Math.floor(Math.random() * 4)],
          carrier: ["DHL", "FedEx", "UPS", "Aramex"][Math.floor(Math.random() * 4)],
        };
      case "order_update":
        return {
          orderId: `ORD-${Date.now()}`,
          status: ["open", "processing", "completed"][Math.floor(Math.random() * 3)],
          value: Math.floor(Math.random() * 10000),
        };
      case "kpi_update":
        return {
          metric: ["fulfillment_rate", "delivery_rate", "pick_accuracy"][Math.floor(Math.random() * 3)],
          value: Math.random() * 0.1 + 0.9,
          trend: Math.random() > 0.5 ? "up" : "down",
        };
      default:
        return {};
    }
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const copilotRealtimeData = new CopilotRealtimeDataService();
export default copilotRealtimeData;

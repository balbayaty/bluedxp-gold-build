/**
 * Real-Time Service
 * WebSocket and real-time data streaming for trade compliance
 */

export interface RealTimeUpdate {
  type:
    | "record_created"
    | "record_updated"
    | "license_status_changed"
    | "risk_alert"
    | "compliance_score_updated";
  entityId: string;
  entityType: string;
  data: any;
  timestamp: string;
  priority: "low" | "medium" | "high" | "critical";
}

class RealTimeService {
  private listeners: Map<string, Set<(update: RealTimeUpdate) => void>> =
    new Map();
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Connect to WebSocket server
   */
  connect(tenantId: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    // In production, this would connect to actual WebSocket server
    // For now, simulate with polling
    this.startPolling(tenantId);
  }

  /**
   * Start polling for updates (fallback when WebSocket not available)
   */
  private startPolling(tenantId: string): void {
    // Poll every 5 seconds for updates
    setInterval(async () => {
      try {
        const response = await fetch(
          `/api/trade-compliance/updates?tenantId=${tenantId}&since=${Date.now() - 10000}`,
        );
        const data = await response.json();

        if (data.success && data.updates) {
          data.updates.forEach((update: RealTimeUpdate) => {
            this.notifyListeners(update.type, update);
          });
        }
      } catch (error) {
        console.error("Error polling for updates:", error);
      }
    }, 5000);
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(
    updateType: string,
    callback: (update: RealTimeUpdate) => void,
  ): () => void {
    if (!this.listeners.has(updateType)) {
      this.listeners.set(updateType, new Set());
    }

    this.listeners.get(updateType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(updateType)?.delete(callback);
    };
  }

  /**
   * Notify listeners of an update
   */
  private notifyListeners(updateType: string, update: RealTimeUpdate): void {
    const listeners = this.listeners.get(updateType);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(update);
        } catch (error) {
          console.error("Error in update listener:", error);
        }
      });
    }

    // Also notify 'all' listeners
    const allListeners = this.listeners.get("all");
    if (allListeners) {
      allListeners.forEach((callback) => {
        try {
          callback(update);
        } catch (error) {
          console.error("Error in update listener:", error);
        }
      });
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  /**
   * Emit a real-time update (for testing/simulation)
   */
  emit(update: RealTimeUpdate): void {
    this.notifyListeners(update.type, update);
  }
}

export const realTimeService = new RealTimeService();

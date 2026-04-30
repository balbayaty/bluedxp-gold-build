/**
 * Real-Time Load Monitoring Service
 *
 * WebSocket-based real-time updates for load design:
 * - Live load status tracking
 * - Real-time utilization updates
 * - Live route tracking
 * - Real-time compliance alerts
 * - Live carrier status updates
 * - Real-time cost updates
 *
 * 4IR & 5IR Aligned - Real-time connectivity and monitoring
 */

import type { LoadPlan } from "@/types/load-design";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// REAL-TIME TYPES
// ============================================================================

export interface RealtimeLoadUpdate {
  loadPlanId: string;
  status: LoadPlan["status"];
  utilization: {
    overall: number;
    weight: number;
    volume: number;
    cube: number;
  };
  location?: {
    lat: number;
    lng: number;
    address: string;
    timestamp: Date;
  };
  compliance?: {
    score: number;
    warnings: number;
    errors: number;
  };
  cost?: {
    total: number;
    updated: Date;
  };
  carrier?: {
    id: string;
    name: string;
    status: string;
    estimatedArrival?: Date;
  };
  timestamp: Date;
}

export interface RealtimeAlert {
  id: string;
  type: "COMPLIANCE" | "ROUTE" | "COST" | "CARRIER" | "UTILIZATION" | "DELAY";
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  message: string;
  loadPlanId: string;
  timestamp: Date;
  acknowledged: boolean;
}

export type RealtimeEventListener = (
  update: RealtimeLoadUpdate | RealtimeAlert,
) => void;

// ============================================================================
// REAL-TIME SERVICE
// ============================================================================

export class RealtimeService {
  private listeners: Map<string, Set<RealtimeEventListener>> = new Map();
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;

  /**
   * Connect to real-time updates
   */
  connect(loadPlanIds?: string[]): void {
    if (this.isConnected && this.websocket) {
      return;
    }

    try {
      // Try to use Socket.io if available
      if (typeof window !== "undefined") {
        try {
          const { io } = require("socket.io-client");
          const wsUrl =
            process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
            process.env.NEXT_PUBLIC_VERCEL_URL ||
            "http://localhost:3000";

          this.websocket = io(wsUrl, {
            transports: ["websocket", "polling"],
            auth: {
              tenantId: process.env.TENANT_ID,
            },
          }) as any;

          this.websocket.on("connect", () => {
            console.log("✅ Connected to WebSocket server");
            this.isConnected = true;
            this.reconnectAttempts = 0;

            // Subscribe to load plans
            if (loadPlanIds) {
              loadPlanIds.forEach((id) => {
                this.websocket?.emit("subscribe-load-plan", id);
              });
            }

            // Subscribe to alerts
            this.websocket?.emit("subscribe-alerts");

            // Listen for updates
            this.websocket?.on(
              "load-plan-update",
              (update: RealtimeLoadUpdate) => {
                this.notifyListeners(update.loadPlanId, update);
              },
            );

            this.websocket?.on("alert", (alert: RealtimeAlert) => {
              this.notifyListeners("__alerts__", alert);
            });
          });

          this.websocket.on("disconnect", () => {
            console.log("❌ Disconnected from WebSocket server");
            this.isConnected = false;
            this.scheduleReconnect(loadPlanIds);
          });

          this.websocket.on("error", (error: Error) => {
            console.error("WebSocket error:", error);
          });

          return;
        } catch (e) {
          console.warn("Socket.io not available, using polling fallback");
        }
      }

      // Fallback to polling
      this.startPolling(loadPlanIds);
      this.isConnected = true;
    } catch (error) {
      console.error("Failed to connect to real-time service:", error);
      this.scheduleReconnect(loadPlanIds);
    }
  }

  /**
   * Disconnect from real-time updates
   */
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
    this.stopPolling();
  }

  /**
   * Subscribe to updates for a load plan
   */
  subscribe(loadPlanId: string, listener: RealtimeEventListener): () => void {
    if (!this.listeners.has(loadPlanId)) {
      this.listeners.set(loadPlanId, new Set());
    }
    this.listeners.get(loadPlanId)!.add(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(loadPlanId);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.listeners.delete(loadPlanId);
        }
      }
    };
  }

  /**
   * Subscribe to all alerts
   */
  subscribeToAlerts(listener: RealtimeEventListener): () => void {
    return this.subscribe("__alerts__", listener);
  }

  /**
   * Start polling for updates (fallback when WebSocket not available)
   */
  private startPolling(loadPlanIds?: string[]): void {
    // Poll every 5 seconds for updates
    const interval = setInterval(async () => {
      if (!this.isConnected) {
        clearInterval(interval);
        return;
      }

      const ids =
        loadPlanIds ||
        Array.from(this.listeners.keys()).filter((id) => id !== "__alerts__");

      for (const loadPlanId of ids) {
        try {
          // In production, this would fetch from API
          // For now, we'll simulate updates
          const update = await this.fetchLoadPlanUpdate(loadPlanId);
          if (update) {
            this.notifyListeners(loadPlanId, update);
          }
        } catch (error) {
          console.error(`Failed to fetch update for ${loadPlanId}:`, error);
        }
      }
    }, 5000);

    // Store interval ID for cleanup
    (this as any).pollingInterval = interval;
  }

  /**
   * Stop polling
   */
  private stopPolling(): void {
    const interval = (this as any).pollingInterval;
    if (interval) {
      clearInterval(interval);
      (this as any).pollingInterval = null;
    }
  }

  /**
   * Fetch load plan update (would call API in production)
   */
  private async fetchLoadPlanUpdate(
    loadPlanId: string,
  ): Promise<RealtimeLoadUpdate | null> {
    // TODO: Call actual API endpoint
    // For now, return null (no updates)
    return null;
  }

  /**
   * Notify listeners of an update
   */
  private notifyListeners(
    loadPlanId: string,
    update: RealtimeLoadUpdate | RealtimeAlert,
  ): void {
    const listeners = this.listeners.get(loadPlanId);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(update);
        } catch (error) {
          console.error("Error in real-time listener:", error);
        }
      });
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(loadPlanIds?: string[]): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect(loadPlanIds);
    }, delay);
  }

  /**
   * Publish a load plan update (called by backend/API)
   */
  publishUpdate(update: RealtimeLoadUpdate): void {
    this.notifyListeners(update.loadPlanId, update);

    // Also publish to event bus for cross-module communication
    eventBus.publish("load-plan:updated", {
      loadPlanId: update.loadPlanId,
      update,
    });
  }

  /**
   * Publish an alert
   */
  publishAlert(alert: RealtimeAlert): void {
    this.notifyListeners("__alerts__", alert);

    // Also publish to event bus
    eventBus.publish("load-plan:alert", {
      alert,
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; reconnectAttempts: number } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

export const realtimeService = new RealtimeService();

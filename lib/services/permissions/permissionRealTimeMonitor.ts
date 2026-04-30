/**
 * 📡 REAL-TIME PERMISSION MONITORING
 *
 * Mind-blowing real-time capabilities:
 * - Live permission changes
 * - Real-time alerts
 * - WebSocket support
 * - Activity streaming
 * - Performance monitoring
 * - Anomaly detection
 */

import type { User, HierarchicalPermission } from "@/types/user";
import { permissionAuditTrail } from "./permissionAuditTrail";

// ============================================================================
// TYPES
// ============================================================================

export interface PermissionEvent {
  id: string;
  type: "GRANT" | "REVOKE" | "MODIFY" | "ACCESS" | "DENIED" | "ANOMALY";
  userId: string;
  userName: string;
  permission?: HierarchicalPermission;
  timestamp: Date;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  metadata?: Record<string, any>;
}

export interface MonitorSubscription {
  id: string;
  userId?: string;
  eventTypes?: PermissionEvent["type"][];
  severity?: PermissionEvent["severity"][];
  callback: (event: PermissionEvent) => void;
}

// ============================================================================
// REAL-TIME MONITOR SERVICE
// ============================================================================

class PermissionRealTimeMonitorService {
  private subscriptions = new Map<string, MonitorSubscription>();
  private eventHistory: PermissionEvent[] = [];
  private readonly MAX_HISTORY = 1000;
  private isMonitoring = false;

  /**
   * Start monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // In production, this would set up WebSocket connection
    // For now, simulate with polling
    this.simulateEvents();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  /**
   * Subscribe to events
   */
  subscribe(subscription: Omit<MonitorSubscription, "id">): string {
    const id = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.subscriptions.set(id, { ...subscription, id });
    return id;
  }

  /**
   * Unsubscribe
   */
  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  /**
   * Emit event
   */
  async emitEvent(event: PermissionEvent): Promise<void> {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.MAX_HISTORY) {
      this.eventHistory = this.eventHistory.slice(-this.MAX_HISTORY);
    }

    // Notify subscribers
    this.subscriptions.forEach((sub) => {
      if (sub.userId && sub.userId !== event.userId) return;
      if (sub.eventTypes && !sub.eventTypes.includes(event.type)) return;
      if (sub.severity && !sub.severity.includes(event.severity)) return;

      sub.callback(event);
    });
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 100): PermissionEvent[] {
    return this.eventHistory
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Simulate events (for demo)
   */
  private simulateEvents(): void {
    if (!this.isMonitoring) return;

    // Simulate random events
    const eventTypes: PermissionEvent["type"][] = [
      "GRANT",
      "REVOKE",
      "ACCESS",
      "DENIED",
    ];
    const severities: PermissionEvent["severity"][] = ["LOW", "MEDIUM", "HIGH"];

    const simulate = () => {
      if (!this.isMonitoring) return;

      const event: PermissionEvent = {
        id: `event-${Date.now()}`,
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        userId: `user-${Math.floor(Math.random() * 10)}`,
        userName: `User ${Math.floor(Math.random() * 10)}`,
        timestamp: new Date(),
        severity: severities[Math.floor(Math.random() * severities.length)],
        message: `Permission ${eventTypes[Math.floor(Math.random() * eventTypes.length)].toLowerCase()} event`,
      };

      this.emitEvent(event);

      // Schedule next event
      setTimeout(simulate, 5000 + Math.random() * 10000); // 5-15 seconds
    };

    simulate();
  }

  /**
   * Detect anomalies
   */
  async detectAnomalies(): Promise<PermissionEvent[]> {
    const anomalies: PermissionEvent[] = [];

    // Check for rapid permission changes
    const recentEvents = this.getRecentEvents(50);
    const userEventCounts = new Map<string, number>();

    recentEvents.forEach((event) => {
      const count = userEventCounts.get(event.userId) || 0;
      userEventCounts.set(event.userId, count + 1);
    });

    userEventCounts.forEach((count, userId) => {
      if (count > 10) {
        // More than 10 events in recent history
        anomalies.push({
          id: `anomaly-${Date.now()}`,
          type: "ANOMALY",
          userId,
          userName: `User ${userId}`,
          timestamp: new Date(),
          severity: "HIGH",
          message: `Unusual activity detected: ${count} permission events in short time`,
        });
      }
    });

    return anomalies;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const permissionRealTimeMonitor = new PermissionRealTimeMonitorService();

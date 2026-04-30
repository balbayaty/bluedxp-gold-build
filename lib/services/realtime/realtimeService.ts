/**
 * Real-Time Service
 * High-level real-time service for live updates
 */

import { websocketService, WebSocketEvent } from "./websocketService";

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

export class RealtimeService {
  private ws: typeof websocketService;

  constructor() {
    this.ws = websocketService;
  }

  /**
   * Initialize real-time service
   */
  async initialize(token?: string): Promise<void> {
    await this.ws.connect(token);
  }

  /**
   * Subscribe to inventory updates
   */
  onInventoryUpdate(handler: (data: any) => void): RealtimeSubscription {
    return {
      unsubscribe: this.ws.on("inventory_update", (event) => {
        handler(event.data);
      }),
    };
  }

  /**
   * Subscribe to container movements
   */
  onContainerMoved(handler: (data: any) => void): RealtimeSubscription {
    return {
      unsubscribe: this.ws.on("container_moved", (event) => {
        handler(event.data);
      }),
    };
  }

  /**
   * Subscribe to MSDS approvals
   */
  onMSDSApproved(handler: (data: any) => void): RealtimeSubscription {
    return {
      unsubscribe: this.ws.on("msds_approved", (event) => {
        handler(event.data);
      }),
    };
  }

  /**
   * Subscribe to notifications
   */
  onNotification(handler: (data: any) => void): RealtimeSubscription {
    return {
      unsubscribe: this.ws.on("notification", (event) => {
        handler(event.data);
      }),
    };
  }

  /**
   * Subscribe to compliance alerts
   */
  onComplianceAlert(handler: (data: any) => void): RealtimeSubscription {
    return {
      unsubscribe: this.ws.on("compliance_alert", (event) => {
        handler(event.data);
      }),
    };
  }

  /**
   * Subscribe to user activity
   */
  onUserActivity(handler: (data: any) => void): RealtimeSubscription {
    return {
      unsubscribe: this.ws.on("user_activity", (event) => {
        handler(event.data);
      }),
    };
  }

  /**
   * Subscribe to all events
   */
  onAll(handler: (event: WebSocketEvent) => void): RealtimeSubscription {
    return {
      unsubscribe: this.ws.on("*" as any, handler),
    };
  }

  /**
   * Send inventory update
   */
  sendInventoryUpdate(data: any): void {
    this.ws.send("inventory_update", data);
  }

  /**
   * Send container movement
   */
  sendContainerMoved(data: any): void {
    this.ws.send("container_moved", data);
  }

  /**
   * Send MSDS approval
   */
  sendMSDSApproved(data: any): void {
    this.ws.send("msds_approved", data);
  }

  /**
   * Send notification
   */
  sendNotification(data: any): void {
    this.ws.send("notification", data);
  }

  /**
   * Send compliance alert
   */
  sendComplianceAlert(data: any): void {
    this.ws.send("compliance_alert", data);
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    this.ws.disconnect();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws.isConnected();
  }
}

export const realtimeService = new RealtimeService();

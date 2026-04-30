/**
 * Notification Event Bus Integration
 * Deep integration with platform Event Bus for real-time notifications
 * Subscribes to all module events and creates intelligent notifications
 */

import { eventBus } from "@/lib/services/event-bus";
import {
  notificationService,
  Notification,
  NotificationType,
} from "./notificationService";
import type { DomainEvent, Subscription } from "@/types/cqrs";

interface EventNotificationMapping {
  eventPattern: string;
  notificationType: NotificationType;
  priority: Notification["priority"];
  getTitle: (event: DomainEvent) => string;
  getMessage: (event: DomainEvent) => string;
  getDetails?: (event: DomainEvent) => string;
  getActionUrl?: (event: DomainEvent) => string;
  getActionLabel?: (event: DomainEvent) => string;
  getCategory?: (event: DomainEvent) => string;
  getSource?: (event: DomainEvent) => string;
  filter?: (event: DomainEvent) => boolean;
}

// ============================================================================
// EVENT TO NOTIFICATION MAPPINGS
// ============================================================================

const eventMappings: EventNotificationMapping[] = [
  // WMS Events
  {
    eventPattern: "wms.asn.*",
    notificationType: "info",
    priority: "medium",
    getTitle: (event) => {
      if (event.type.includes("created")) return "New ASN Created";
      if (event.type.includes("completed")) return "ASN Completed";
      if (event.type.includes("error")) return "ASN Error";
      return "ASN Update";
    },
    getMessage: (event) => {
      const data = event.data || {};
      if (event.type.includes("created")) {
        return `ASN ${data.asnNumber || data.id || "N/A"} has been created`;
      }
      if (event.type.includes("completed")) {
        return `ASN ${data.asnNumber || data.id || "N/A"} has been completed successfully`;
      }
      return `ASN ${data.asnNumber || data.id || "N/A"} has been updated`;
    },
    getDetails: (event) => {
      const data = event.data || {};
      return data.status ? `Status: ${data.status}` : undefined;
    },
    getActionUrl: (event) => {
      const data = event.data || {};
      return data.asnId
        ? `/asn/${data.asnId}`
        : data.id
          ? `/asn/${data.id}`
          : "/asn";
    },
    getActionLabel: () => "View ASN",
    getCategory: () => "WMS",
    getSource: () => "Warehouse Management",
  },
  {
    eventPattern: "wms.inventory.*",
    notificationType: "alert",
    priority: "high",
    getTitle: (event) => {
      if (event.type.includes("low_stock")) return "Low Stock Alert";
      if (event.type.includes("out_of_stock")) return "Out of Stock";
      return "Inventory Update";
    },
    getMessage: (event) => {
      const data = event.data || {};
      if (event.type.includes("low_stock")) {
        return `SKU ${data.sku || data.skuId || "N/A"} is running low (${data.quantity || 0} remaining)`;
      }
      if (event.type.includes("out_of_stock")) {
        return `SKU ${data.sku || data.skuId || "N/A"} is out of stock`;
      }
      return `Inventory updated for ${data.sku || data.skuId || "SKU"}`;
    },
    getActionUrl: (event) => {
      const data = event.data || {};
      return data.skuId ? `/inventory?sku=${data.skuId}` : "/inventory";
    },
    getActionLabel: () => "View Inventory",
    getCategory: () => "WMS",
    getSource: () => "Warehouse Management",
  },

  // TMS Events
  {
    eventPattern: "tms.shipment.*",
    notificationType: "info",
    priority: "medium",
    getTitle: (event) => {
      if (event.type.includes("created")) return "New Shipment Created";
      if (event.type.includes("dispatched")) return "Shipment Dispatched";
      if (event.type.includes("delivered")) return "Shipment Delivered";
      if (event.type.includes("delayed")) return "Shipment Delayed";
      return "Shipment Update";
    },
    getMessage: (event) => {
      const data = event.data || {};
      const shipmentId =
        data.shipmentNumber || data.trackingNumber || data.id || "N/A";
      if (event.type.includes("delivered")) {
        return `Shipment ${shipmentId} has been delivered`;
      }
      if (event.type.includes("dispatched")) {
        return `Shipment ${shipmentId} has been dispatched`;
      }
      if (event.type.includes("delayed")) {
        return `Shipment ${shipmentId} is delayed: ${data.reason || "Unknown reason"}`;
      }
      return `Shipment ${shipmentId} has been updated`;
    },
    getActionUrl: (event) => {
      const data = event.data || {};
      return data.shipmentId
        ? `/shipments/${data.shipmentId}`
        : data.id
          ? `/shipments/${data.id}`
          : "/shipments";
    },
    getActionLabel: () => "View Shipment",
    getCategory: () => "TMS",
    getSource: () => "Transportation Management",
  },
  {
    eventPattern: "tms.geofence.*",
    notificationType: "alert",
    priority: "high",
    getTitle: (event) => {
      if (event.type.includes("entered")) return "Geofence Entry";
      if (event.type.includes("exited")) return "Geofence Exit";
      if (event.type.includes("violation")) return "Geofence Violation";
      return "Geofence Update";
    },
    getMessage: (event) => {
      const data = event.data || {};
      if (event.type.includes("entered")) {
        return `Vehicle entered geofence: ${data.geofenceName || data.geofenceId || "Unknown"}`;
      }
      if (event.type.includes("exited")) {
        return `Vehicle exited geofence: ${data.geofenceName || data.geofenceId || "Unknown"}`;
      }
      if (event.type.includes("violation")) {
        return `Geofence violation detected: ${data.violationType || "Unknown"}`;
      }
      return `Geofence event: ${data.geofenceName || data.geofenceId || "Unknown"}`;
    },
    getActionUrl: (event) => {
      const data = event.data || {};
      return data.vehicleId
        ? `/transportation/vehicles/${data.vehicleId}`
        : "/transportation";
    },
    getActionLabel: () => "View Details",
    getCategory: () => "TMS",
    getSource: () => "Transportation Management",
  },

  // QHSE Events
  {
    eventPattern: "qhse.incident.*",
    notificationType: "alert",
    priority: "high",
    getTitle: (event) => {
      if (event.type.includes("created")) return "New Incident Reported";
      if (event.type.includes("resolved")) return "Incident Resolved";
      return "Incident Update";
    },
    getMessage: (event) => {
      const data = event.data || {};
      const severity = data.severity || "Unknown";
      if (event.type.includes("created")) {
        return `New ${severity} incident reported: ${data.title || data.description || "N/A"}`;
      }
      if (event.type.includes("resolved")) {
        return `Incident ${data.incidentNumber || data.id || "N/A"} has been resolved`;
      }
      return `Incident ${data.incidentNumber || data.id || "N/A"} has been updated`;
    },
    getActionUrl: (event) => {
      const data = event.data || {};
      return data.incidentId
        ? `/qhse/incidents/${data.incidentId}`
        : data.id
          ? `/qhse/incidents/${data.id}`
          : "/qhse/incidents";
    },
    getActionLabel: () => "View Incident",
    getCategory: () => "QHSE",
    getSource: () => "Quality, Health, Safety & Environment",
  },
  {
    eventPattern: "qhse.audit.*",
    notificationType: "info",
    priority: "medium",
    getTitle: (event) => {
      if (event.type.includes("scheduled")) return "Audit Scheduled";
      if (event.type.includes("completed")) return "Audit Completed";
      return "Audit Update";
    },
    getMessage: (event) => {
      const data = event.data || {};
      if (event.type.includes("scheduled")) {
        return `Audit scheduled: ${data.auditType || "N/A"} on ${data.scheduledDate || "TBD"}`;
      }
      if (event.type.includes("completed")) {
        return `Audit ${data.auditNumber || data.id || "N/A"} has been completed`;
      }
      return `Audit ${data.auditNumber || data.id || "N/A"} has been updated`;
    },
    getActionUrl: (event) => {
      const data = event.data || {};
      return data.auditId
        ? `/qhse/audits/${data.auditId}`
        : data.id
          ? `/qhse/audits/${data.id}`
          : "/qhse/audits";
    },
    getActionLabel: () => "View Audit",
    getCategory: () => "QHSE",
    getSource: () => "Quality, Health, Safety & Environment",
  },

  // ISO-IMS Events
  {
    eventPattern: "iso-ims.ncr.*",
    notificationType: "alert",
    priority: "high",
    getTitle: (event) => {
      if (event.type.includes("created")) return "New NCR Created";
      if (event.type.includes("resolved")) return "NCR Resolved";
      return "NCR Update";
    },
    getMessage: (event) => {
      const data = event.data || {};
      if (event.type.includes("created")) {
        return `New Non-Conformance Report ${data.ncrNumber || data.id || "N/A"} has been created`;
      }
      if (event.type.includes("resolved")) {
        return `NCR ${data.ncrNumber || data.id || "N/A"} has been resolved`;
      }
      return `NCR ${data.ncrNumber || data.id || "N/A"} has been updated`;
    },
    getActionUrl: (event) => {
      const data = event.data || {};
      return data.ncrId
        ? `/ncr-management/${data.ncrId}`
        : data.id
          ? `/ncr-management/${data.id}`
          : "/ncr-management";
    },
    getActionLabel: () => "View NCR",
    getCategory: () => "ISO-IMS",
    getSource: () => "ISO Integrated Management System",
  },
  {
    eventPattern: "iso-ims.capa.*",
    notificationType: "alert",
    priority: "high",
    getTitle: (event) => {
      if (event.type.includes("created")) return "New CAPA Created";
      if (event.type.includes("completed")) return "CAPA Completed";
      if (event.type.includes("overdue")) return "CAPA Overdue";
      return "CAPA Update";
    },
    getMessage: (event) => {
      const data = event.data || {};
      if (event.type.includes("overdue")) {
        return `CAPA ${data.capaNumber || data.id || "N/A"} is overdue`;
      }
      if (event.type.includes("completed")) {
        return `CAPA ${data.capaNumber || data.id || "N/A"} has been completed`;
      }
      return `CAPA ${data.capaNumber || data.id || "N/A"} has been updated`;
    },
    getActionUrl: (event) => {
      const data = event.data || {};
      return data.capaId
        ? `/capa-management/${data.capaId}`
        : data.id
          ? `/capa-management/${data.id}`
          : "/capa-management";
    },
    getActionLabel: () => "View CAPA",
    getCategory: () => "ISO-IMS",
    getSource: () => "ISO Integrated Management System",
  },
  {
    eventPattern: "iso-ims.training.*",
    notificationType: "info",
    priority: "medium",
    getTitle: (event) => {
      if (event.type.includes("expiring")) return "Training Expiring Soon";
      if (event.type.includes("expired")) return "Training Expired";
      if (event.type.includes("completed")) return "Training Completed";
      return "Training Update";
    },
    getMessage: (event) => {
      const data = event.data || {};
      if (event.type.includes("expiring")) {
        return `Training "${data.trainingName || "N/A"}" is expiring in ${data.daysRemaining || "N"} days`;
      }
      if (event.type.includes("expired")) {
        return `Training "${data.trainingName || "N/A"}" has expired`;
      }
      if (event.type.includes("completed")) {
        return `Training "${data.trainingName || "N/A"}" has been completed`;
      }
      return `Training "${data.trainingName || "N/A"}" has been updated`;
    },
    getActionUrl: (event) => {
      const data = event.data || {};
      return data.trainingId
        ? `/iso-ims/training/${data.trainingId}`
        : "/iso-ims/training";
    },
    getActionLabel: () => "View Training",
    getCategory: () => "ISO-IMS",
    getSource: () => "ISO Integrated Management System",
  },

  // MSDS Events
  {
    eventPattern: "msds.*",
    notificationType: "info",
    priority: "medium",
    getTitle: (event) => {
      if (event.type.includes("approved")) return "MSDS Approved";
      if (event.type.includes("rejected")) return "MSDS Rejected";
      if (event.type.includes("expiring")) return "MSDS Expiring Soon";
      return "MSDS Update";
    },
    getMessage: (event) => {
      const data = event.data || {};
      if (event.type.includes("approved")) {
        return `MSDS for ${data.chemicalName || data.sku || "N/A"} has been approved`;
      }
      if (event.type.includes("rejected")) {
        return `MSDS for ${data.chemicalName || data.sku || "N/A"} has been rejected: ${data.reason || "N/A"}`;
      }
      if (event.type.includes("expiring")) {
        return `MSDS for ${data.chemicalName || data.sku || "N/A"} is expiring soon`;
      }
      return `MSDS for ${data.chemicalName || data.sku || "N/A"} has been updated`;
    },
    getActionUrl: (event) => {
      const data = event.data || {};
      return data.msdsId
        ? `/msds/${data.msdsId}`
        : data.id
          ? `/msds/${data.id}`
          : "/msds";
    },
    getActionLabel: () => "View MSDS",
    getCategory: () => "MSDS",
    getSource: () => "Material Safety Data Sheet",
  },

  // System Events
  {
    eventPattern: "system.*",
    notificationType: "alert",
    priority: "high",
    getTitle: (event) => {
      if (event.type.includes("error")) return "System Error";
      if (event.type.includes("warning")) return "System Warning";
      return "System Notification";
    },
    getMessage: (event) => {
      const data = event.data || {};
      return data.message || event.data?.description || "System event occurred";
    },
    getCategory: () => "System",
    getSource: () => "Platform",
  },

  // Generic fallback for any unhandled events
  {
    eventPattern: "*",
    notificationType: "info",
    priority: "low",
    getTitle: (event) => {
      const moduleName = event.type.split(".")[0] || "System";
      return `${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Event`;
    },
    getMessage: (event) => {
      const data = event.data || {};
      return data.message || data.description || `Event: ${event.type}`;
    },
    filter: (event) => {
      // Only show generic notifications for important events
      const importantPatterns = [
        "created",
        "completed",
        "error",
        "warning",
        "alert",
      ];
      return importantPatterns.some((pattern) => event.type.includes(pattern));
    },
  },
];

// ============================================================================
// EVENT BUS INTEGRATION SERVICE
// ============================================================================

class NotificationEventBusIntegration {
  private subscriptions: Array<{ unsubscribe: () => void }> = [];
  private initialized = false;

  /**
   * Initialize event bus integration
   */
  async initialize(tenantId?: string): Promise<void> {
    if (this.initialized) {
      console.warn("[NotificationEventBus] Already initialized");
      return;
    }

    console.log(
      "[NotificationEventBus] Initializing notification event bus integration...",
    );

    // Subscribe to all event patterns
    for (const mapping of eventMappings) {
      try {
        const subscription = eventBus.subscribe(
          mapping.eventPattern,
          async (event: DomainEvent) => {
            await this.handleEvent(event, mapping, tenantId);
          },
        );
        this.subscriptions.push({ unsubscribe: subscription.unsubscribe });
      } catch (error) {
        console.error(
          `[NotificationEventBus] Failed to subscribe to ${mapping.eventPattern}:`,
          error,
        );
      }
    }

    this.initialized = true;
    console.log(
      `[NotificationEventBus] Initialized with ${this.subscriptions.length} subscriptions`,
    );
  }

  /**
   * Handle event and create notification
   */
  private async handleEvent(
    event: DomainEvent,
    mapping: EventNotificationMapping,
    tenantId?: string,
  ): Promise<void> {
    try {
      // Apply filter if provided
      if (mapping.filter && !mapping.filter(event)) {
        return;
      }

      // Extract user/tenant from event data
      const eventData = event.data || {};
      const userId =
        eventData.userId || eventData.createdBy || eventData.assignedTo;
      const eventTenantId = eventData.tenantId || tenantId;

      // Create notification
      const notification: Omit<
        Notification,
        "id" | "createdAt" | "read" | "dismissed"
      > = {
        type: mapping.notificationType,
        priority: mapping.priority,
        channel: "in-app",
        title: mapping.getTitle(event),
        message: mapping.getMessage(event),
        details: mapping.getDetails?.(event),
        userId,
        tenantId: eventTenantId,
        data: eventData,
        actionUrl: mapping.getActionUrl?.(event),
        actionLabel: mapping.getActionLabel?.(event),
        category: mapping.getCategory?.(event),
        source: mapping.getSource?.(event),
        icon: this.getIconForType(mapping.notificationType),
        duration: mapping.priority === "critical" ? undefined : 5000, // Auto-dismiss after 5s for non-critical
      };

      await notificationService.send(notification);
    } catch (error) {
      console.error("[NotificationEventBus] Error handling event:", error);
    }
  }

  /**
   * Get icon for notification type
   */
  private getIconForType(type: NotificationType): string {
    switch (type) {
      case "success":
        return "ri-checkbox-circle-fill";
      case "error":
        return "ri-error-warning-fill";
      case "warning":
        return "ri-alert-fill";
      case "alert":
        return "ri-alarm-warning-fill";
      default:
        return "ri-information-fill";
    }
  }

  /**
   * Cleanup subscriptions
   */
  cleanup(): void {
    this.subscriptions.forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch (error) {
        console.error("[NotificationEventBus] Error unsubscribing:", error);
      }
    });
    this.subscriptions = [];
    this.initialized = false;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const notificationEventBusIntegration =
  new NotificationEventBusIntegration();

// Auto-initialize when module loads (client-side only)
if (typeof window !== "undefined") {
  // Initialize after a short delay to ensure event bus is ready
  setTimeout(() => {
    notificationEventBusIntegration.initialize().catch((error) => {
      console.error("[NotificationEventBus] Failed to auto-initialize:", error);
    });
  }, 1000);
}

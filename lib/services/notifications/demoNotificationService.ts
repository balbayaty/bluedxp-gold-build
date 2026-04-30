/**
 * Intelligent Demo Notification Service
 * Creates realistic, interconnected notifications based on platform modules
 * Demonstrates deep ecosystem integration
 */

import {
  notificationService,
  Notification,
  NotificationType,
} from "./notificationService";
import { prisma } from "@/lib/services/database/prismaClient";

interface DemoNotificationConfig {
  userId?: string;
  tenantId?: string;
  count?: number;
  includeAllModules?: boolean;
}

// ============================================================================
// INTELLIGENT NOTIFICATION GENERATORS
// ============================================================================

class IntelligentDemoNotificationService {
  /**
   * Generate intelligent demo notifications
   * Creates realistic notifications based on actual platform data when available
   */
  async generateDemoNotifications(
    config: DemoNotificationConfig = {},
  ): Promise<Notification[]> {
    const { userId, tenantId, count = 10, includeAllModules = true } = config;

    console.log(
      "[DemoNotifications] Generating intelligent demo notifications...",
    );

    const notifications: Notification[] = [];
    const now = new Date();

    // Try to get real data from database to make notifications more realistic
    let realASNs: any[] = [];
    let realShipments: any[] = [];
    let realTenants: any[] = [];
    let realUsers: any[] = [];

    try {
      // Get real ASN data if available
      if (tenantId) {
        realASNs = await prisma.aSN
          .findMany({
            where: { tenantId },
            take: 5,
            orderBy: { createdAt: "desc" },
          })
          .catch(() => []);
      }

      // Get real shipment data if available
      if (tenantId) {
        realShipments = await prisma.shipment
          .findMany({
            where: { tenantId },
            take: 5,
            orderBy: { createdAt: "desc" },
          })
          .catch(() => []);
      }

      // Get tenant data
      realTenants = await prisma.tenant
        .findMany({
          take: 3,
        })
        .catch(() => []);

      // Get user data
      if (tenantId) {
        realUsers = await prisma.user
          .findMany({
            where: { tenantId },
            take: 5,
          })
          .catch(() => []);
      }
    } catch (error) {
      console.warn(
        "[DemoNotifications] Could not fetch real data, using generated data:",
        error,
      );
    }

    const targetTenantId = tenantId || realTenants[0]?.id || "demo-tenant-1";
    const targetUserId = userId || realUsers[0]?.id || "demo-user-1";

    // ========================================================================
    // WMS - ASN NOTIFICATIONS (Intelligent)
    // ========================================================================
    if (includeAllModules || Math.random() > 0.5) {
      const asn = realASNs[0] || {
        id: "asn-demo-001",
        asnNumber: `ASN-${Date.now().toString().slice(-6)}`,
        status: "completed",
      };

      notifications.push({
        id: `notif-asn-completed-${Date.now()}`,
        type: "success",
        priority: "medium",
        channel: "in-app",
        title: "ASN Completed Successfully",
        message: `ASN ${asn.asnNumber || "ASN-001"} has been completed and all items have been received`,
        userId: targetUserId,
        tenantId: targetTenantId,
        category: "WMS",
        source: "Warehouse Management System",
        icon: "ri-checkbox-circle-fill",
        actionUrl: `/asn/${asn.id || "demo-001"}`,
        actionLabel: "View ASN",
        createdAt: new Date(now.getTime() - 5 * 60000).toISOString(), // 5 minutes ago
        read: false,
        dismissed: false,
        data: { asnId: asn.id, asnNumber: asn.asnNumber },
      });

      // ASN Created notification
      notifications.push({
        id: `notif-asn-created-${Date.now()}`,
        type: "info",
        priority: "medium",
        channel: "in-app",
        title: "New ASN Created",
        message: `New ASN ${asn.asnNumber || "ASN-002"} has been created and is pending receipt`,
        userId: targetUserId,
        tenantId: targetTenantId,
        category: "WMS",
        source: "Warehouse Management System",
        icon: "ri-file-add-fill",
        actionUrl: `/asn/${asn.id || "demo-002"}`,
        actionLabel: "View ASN",
        createdAt: new Date(now.getTime() - 30 * 60000).toISOString(), // 30 minutes ago
        read: false,
        dismissed: false,
        data: { asnId: asn.id, asnNumber: asn.asnNumber },
      });
    }

    // ========================================================================
    // WMS - INVENTORY ALERTS (Intelligent)
    // ========================================================================
    if (includeAllModules || Math.random() > 0.5) {
      const skus = ["SKU-ABC-123", "SKU-XYZ-789", "SKU-DEF-456", "SKU-GHI-012"];
      const lowStockSku = skus[Math.floor(Math.random() * skus.length)];
      const quantity = Math.floor(Math.random() * 50) + 5;

      notifications.push({
        id: `notif-low-stock-${Date.now()}`,
        type: "alert",
        priority: "medium", // Changed from 'high' to reduce toast spam
        channel: "in-app",
        title: "Low Stock Alert",
        message: `${lowStockSku} is running low on inventory. Only ${quantity} units remaining.`,
        details: `Current stock: ${quantity} units. Reorder point: 100 units.`,
        userId: targetUserId,
        tenantId: targetTenantId,
        category: "WMS",
        source: "Inventory Management",
        icon: "ri-alarm-warning-fill",
        actionUrl: `/inventory?sku=${lowStockSku}`,
        actionLabel: "View Inventory",
        createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(), // 2 hours ago
        read: false,
        dismissed: false,
        data: { sku: lowStockSku, quantity, reorderPoint: 100 },
      });
    }

    // ========================================================================
    // TMS - SHIPMENT NOTIFICATIONS (Intelligent)
    // ========================================================================
    if (includeAllModules || Math.random() > 0.5) {
      const shipment = realShipments[0] || {
        id: "ship-demo-001",
        trackingNumber: `TRK-${Date.now().toString().slice(-8)}`,
        status: "in_transit",
      };

      notifications.push({
        id: `notif-shipment-dispatched-${Date.now()}`,
        type: "info",
        priority: "medium",
        channel: "in-app",
        title: "Shipment Dispatched",
        message: `Shipment ${shipment.trackingNumber || "TRK-001"} has been dispatched and is in transit`,
        details: "Estimated delivery: Tomorrow, 2:00 PM",
        userId: targetUserId,
        tenantId: targetTenantId,
        category: "TMS",
        source: "Transportation Management System",
        icon: "ri-truck-line",
        actionUrl: `/shipments/${shipment.id || "demo-001"}`,
        actionLabel: "Track Shipment",
        createdAt: new Date(now.getTime() - 1 * 3600000).toISOString(), // 1 hour ago
        read: false,
        dismissed: false,
        data: {
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
        },
      });

      // Shipment Delivered
      notifications.push({
        id: `notif-shipment-delivered-${Date.now()}`,
        type: "success",
        priority: "medium",
        channel: "in-app",
        title: "Shipment Delivered",
        message: `Shipment ${shipment.trackingNumber || "TRK-002"} has been successfully delivered`,
        details: "Delivered to: Warehouse A, Dock 3",
        userId: targetUserId,
        tenantId: targetTenantId,
        category: "TMS",
        source: "Transportation Management System",
        icon: "ri-checkbox-circle-fill",
        actionUrl: `/shipments/${shipment.id || "demo-002"}`,
        actionLabel: "View Details",
        createdAt: new Date(now.getTime() - 3 * 3600000).toISOString(), // 3 hours ago
        read: true,
        dismissed: false,
        data: {
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
        },
      });
    }

    // ========================================================================
    // TMS - GEOFENCE ALERTS (Intelligent)
    // ========================================================================
    if (includeAllModules || Math.random() > 0.5) {
      const geofences = [
        "Warehouse A",
        "Distribution Center B",
        "Customer Site C",
      ];
      const geofence = geofences[Math.floor(Math.random() * geofences.length)];

      notifications.push({
        id: `notif-geofence-entry-${Date.now()}`,
        type: "alert",
        priority: "medium", // Changed from 'high' to reduce toast spam
        channel: "in-app",
        title: "Geofence Entry Detected",
        message: `Vehicle TRK-${Date.now().toString().slice(-6)} has entered geofence: ${geofence}`,
        details: "Location: 24.7136° N, 46.6753° E",
        userId: targetUserId,
        tenantId: targetTenantId,
        category: "TMS",
        source: "Geofence Monitoring",
        icon: "ri-map-pin-fill",
        actionUrl: "/transportation/geofences",
        actionLabel: "View Geofence",
        createdAt: new Date(now.getTime() - 15 * 60000).toISOString(), // 15 minutes ago
        read: false,
        dismissed: false,
        data: { geofenceName: geofence, vehicleId: "vehicle-001" },
      });
    }

    // ========================================================================
    // QHSE - INCIDENT NOTIFICATIONS (Intelligent)
    // ========================================================================
    if (includeAllModules || Math.random() > 0.5) {
      const severities = ["Low", "Medium", "High", "Critical"];
      const severity =
        severities[Math.floor(Math.random() * severities.length)];

      notifications.push({
        id: `notif-incident-${Date.now()}`,
        type: severity === "Critical" ? "error" : "alert",
        priority: severity === "Critical" ? "critical" : "medium", // Only critical shows as toast
        channel: "in-app",
        title: "New Incident Reported",
        message: `A ${severity.toLowerCase()} severity incident has been reported`,
        details: `Incident Type: Safety | Location: Warehouse Floor | Reported by: ${realUsers[0]?.name || "John Doe"}`,
        userId: targetUserId,
        tenantId: targetTenantId,
        category: "QHSE",
        source: "Quality, Health, Safety & Environment",
        icon: "ri-error-warning-fill",
        actionUrl: "/qhse/incidents",
        actionLabel: "View Incident",
        createdAt: new Date(now.getTime() - 45 * 60000).toISOString(), // 45 minutes ago
        read: false,
        dismissed: false,
        data: { incidentId: "incident-001", severity },
      });
    }

    // ========================================================================
    // ISO-IMS - NCR NOTIFICATIONS (Intelligent)
    // ========================================================================
    if (includeAllModules || Math.random() > 0.5) {
      notifications.push({
        id: `notif-ncr-${Date.now()}`,
        type: "alert",
        priority: "medium", // Changed from 'high' to reduce toast spam
        channel: "in-app",
        title: "New Non-Conformance Report",
        message: "NCR-2024-001 has been created and requires your attention",
        details:
          "Type: Process Non-Conformance | Status: Open | Assigned to: Quality Team",
        userId: targetUserId,
        tenantId: targetTenantId,
        category: "ISO-IMS",
        source: "ISO Integrated Management System",
        icon: "ri-file-warning-fill",
        actionUrl: "/ncr-management",
        actionLabel: "View NCR",
        createdAt: new Date(now.getTime() - 4 * 3600000).toISOString(), // 4 hours ago
        read: false,
        dismissed: false,
        data: { ncrId: "ncr-001", ncrNumber: "NCR-2024-001" },
      });
    }

    // ========================================================================
    // ISO-IMS - CAPA NOTIFICATIONS (Intelligent)
    // ========================================================================
    if (includeAllModules || Math.random() > 0.5) {
      notifications.push({
        id: `notif-capa-overdue-${Date.now()}`,
        type: "warning",
        priority: "medium", // Changed from 'high' to reduce toast spam
        channel: "in-app",
        title: "CAPA Overdue",
        message: "CAPA-2024-005 is overdue and requires immediate action",
        details: "Due date: Yesterday | Days overdue: 1 | Status: In Progress",
        userId: targetUserId,
        tenantId: targetTenantId,
        category: "ISO-IMS",
        source: "ISO Integrated Management System",
        icon: "ri-time-alarm-fill",
        actionUrl: "/capa-management",
        actionLabel: "View CAPA",
        createdAt: new Date(now.getTime() - 6 * 3600000).toISOString(), // 6 hours ago
        read: false,
        dismissed: false,
        data: { capaId: "capa-001", capaNumber: "CAPA-2024-005" },
      });
    }

    // ========================================================================
    // ISO-IMS - TRAINING NOTIFICATIONS (Intelligent)
    // ========================================================================
    if (includeAllModules || Math.random() > 0.5) {
      const trainings = [
        "Safety Training - Forklift Operation",
        "ISO 9001:2015 Awareness",
        "Hazardous Material Handling",
        "First Aid & CPR Certification",
      ];
      const training = trainings[Math.floor(Math.random() * trainings.length)];
      const daysRemaining = Math.floor(Math.random() * 30) + 1;

      notifications.push({
        id: `notif-training-expiring-${Date.now()}`,
        type: "warning",
        priority: "medium",
        channel: "in-app",
        title: "Training Expiring Soon",
        message: `"${training}" is expiring in ${daysRemaining} days`,
        details: `Expiration date: ${new Date(now.getTime() + daysRemaining * 24 * 3600000).toLocaleDateString()}`,
        userId: targetUserId,
        tenantId: targetTenantId,
        category: "ISO-IMS",
        source: "Training Management",
        icon: "ri-calendar-todo-fill",
        actionUrl: "/iso-ims/training",
        actionLabel: "View Training",
        createdAt: new Date(now.getTime() - 12 * 3600000).toISOString(), // 12 hours ago
        read: false,
        dismissed: false,
        data: {
          trainingId: "training-001",
          trainingName: training,
          daysRemaining,
        },
      });
    }

    // ========================================================================
    // MSDS NOTIFICATIONS (Intelligent)
    // ========================================================================
    if (includeAllModules || Math.random() > 0.5) {
      const chemicals = [
        "Sodium Hydroxide",
        "Hydrochloric Acid",
        "Ethanol",
        "Acetone",
      ];
      const chemical = chemicals[Math.floor(Math.random() * chemicals.length)];

      notifications.push({
        id: `notif-msds-approved-${Date.now()}`,
        type: "success",
        priority: "medium",
        channel: "in-app",
        title: "MSDS Approved",
        message: `MSDS for ${chemical} has been approved and is now active`,
        details: "Approved by: Safety Officer | Date: Today",
        userId: targetUserId,
        tenantId: targetTenantId,
        category: "MSDS",
        source: "Material Safety Data Sheet",
        icon: "ri-file-check-fill",
        actionUrl: "/msds",
        actionLabel: "View MSDS",
        createdAt: new Date(now.getTime() - 8 * 3600000).toISOString(), // 8 hours ago
        read: true,
        dismissed: false,
        data: { msdsId: "msds-001", chemicalName: chemical },
      });
    }

    // ========================================================================
    // SYSTEM NOTIFICATIONS (Intelligent)
    // ========================================================================
    if (includeAllModules || Math.random() > 0.5) {
      notifications.push({
        id: `notif-system-update-${Date.now()}`,
        type: "info",
        priority: "low",
        channel: "in-app",
        title: "System Update Available",
        message:
          "A new platform update is available. New features include enhanced notifications and improved performance.",
        details: "Version 2.1.0 | Release date: Today",
        userId: targetUserId,
        tenantId: targetTenantId,
        category: "System",
        source: "Platform",
        icon: "ri-download-cloud-fill",
        actionUrl: "/settings",
        actionLabel: "View Updates",
        createdAt: new Date(now.getTime() - 24 * 3600000).toISOString(), // 24 hours ago
        read: false,
        dismissed: false,
        data: { version: "2.1.0" },
      });
    }

    // ========================================================================
    // CRITICAL ALERT (High Priority)
    // ========================================================================
    notifications.push({
      id: `notif-critical-${Date.now()}`,
      type: "error",
      priority: "critical",
      channel: "in-app",
      title: "Critical System Alert",
      message:
        "High-priority action required: Inventory discrepancy detected in Warehouse A",
      details:
        "Discrepancy: 50 units | Location: Zone 3, Shelf 5 | Requires immediate attention",
      userId: targetUserId,
      tenantId: targetTenantId,
      category: "WMS",
      source: "Inventory Control System",
      icon: "ri-error-warning-fill",
      actionUrl: "/inventory",
      actionLabel: "Investigate Now",
      createdAt: new Date(now.getTime() - 10 * 60000).toISOString(), // 10 minutes ago
      read: false,
      dismissed: false,
      data: { alertType: "inventory_discrepancy", severity: "critical" },
    });

    // Limit to requested count
    const finalNotifications = notifications.slice(0, count);

    // Send all notifications
    console.log(
      `[DemoNotifications] Sending ${finalNotifications.length} intelligent notifications...`,
    );
    for (const notification of finalNotifications) {
      try {
        await notificationService.send(notification);
      } catch (error) {
        console.error(
          `[DemoNotifications] Failed to send notification ${notification.id}:`,
          error,
        );
      }
    }

    console.log(
      `[DemoNotifications] Successfully generated ${finalNotifications.length} intelligent notifications`,
    );
    return finalNotifications;
  }

  /**
   * Clear all demo notifications
   */
  async clearDemoNotifications(
    userId?: string,
    tenantId?: string,
  ): Promise<void> {
    try {
      await notificationService.clearAll(userId);
      console.log("[DemoNotifications] Cleared all demo notifications");
    } catch (error) {
      console.error(
        "[DemoNotifications] Failed to clear notifications:",
        error,
      );
    }
  }

  /**
   * Generate notifications for a specific module
   */
  async generateModuleNotifications(
    module: "wms" | "tms" | "qhse" | "iso-ims" | "msds" | "system",
    userId?: string,
    tenantId?: string,
  ): Promise<Notification[]> {
    const moduleConfig: Record<string, boolean> = {
      wms: false,
      tms: false,
      qhse: false,
      "iso-ims": false,
      msds: false,
      system: false,
    };
    moduleConfig[module] = true;

    return this.generateDemoNotifications({
      userId,
      tenantId,
      count: 5,
      includeAllModules: false,
    });
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const demoNotificationService = new IntelligentDemoNotificationService();

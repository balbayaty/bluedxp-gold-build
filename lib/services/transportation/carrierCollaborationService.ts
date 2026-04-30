/**
 * Carrier Collaboration Service
 *
 * Self-service portal for carriers
 * Real-time status updates, document exchange, communication
 * Fully integrated with ecosystem - no duplication
 */

import { eventBus } from "@/lib/services/event-store";
import { transportationRealtimeService } from "./realtimeService";
import { transportationWebhookService } from "./webhookService";
import type { Shipment } from "@/types/tms";

export interface Carrier {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  portalAccess: {
    enabled: boolean;
    username?: string;
    lastLogin?: Date;
  };
  preferences: {
    notifications: boolean;
    notificationTypes: string[];
    preferredCommunication: "EMAIL" | "SMS" | "PORTAL" | "API";
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CarrierPortalSession {
  id: string;
  carrierId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface CarrierShipmentView {
  shipmentId: string;
  shipmentNumber: string;
  status: Shipment["status"];
  origin: Shipment["origin"];
  destination: Shipment["destination"];
  pickupDate?: Date;
  deliveryDate?: Date;
  currentLocation?: Shipment["currentLocation"];
  trackingEvents: Shipment["trackingEvents"];
  documents: Shipment["documents"];
  exceptions: Shipment["exceptions"];
  freightCharges?: Shipment["freightCharges"];
  assignedToCarrier: boolean;
  canUpdateStatus: boolean;
  canUploadDocuments: boolean;
  canAddTrackingEvent: boolean;
}

export interface CarrierUpdate {
  type:
    | "STATUS_UPDATE"
    | "LOCATION_UPDATE"
    | "DOCUMENT_UPLOAD"
    | "EXCEPTION_REPORT"
    | "PROOF_OF_DELIVERY";
  shipmentId: string;
  data: any;
  timestamp: Date;
  carrierId: string;
}

export interface CarrierDocument {
  id: string;
  shipmentId: string;
  type:
    | "POD"
    | "BILL_OF_LADING"
    | "INVOICE"
    | "CUSTOMS"
    | "CERTIFICATE"
    | "OTHER";
  name: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  status: "PENDING" | "APPROVED" | "REJECTED";
  metadata?: Record<string, any>;
}

export interface CarrierNotification {
  id: string;
  carrierId: string;
  type:
    | "SHIPMENT_ASSIGNED"
    | "STATUS_CHANGE"
    | "DOCUMENT_REQUEST"
    | "EXCEPTION"
    | "PAYMENT"
    | "CUSTOM";
  title: string;
  message: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}

export interface CarrierDashboard {
  carrierId: string;
  statistics: {
    totalShipments: number;
    activeShipments: number;
    completedShipments: number;
    onTimeRate: number;
    averageTransitTime: number;
    totalRevenue: number;
    pendingPayments: number;
  };
  recentShipments: CarrierShipmentView[];
  pendingActions: {
    documentsToUpload: number;
    statusUpdates: number;
    exceptionsToReport: number;
  };
  notifications: CarrierNotification[];
  generatedAt: Date;
}

export class CarrierCollaborationService {
  private carriers: Map<string, Carrier> = new Map();
  private sessions: Map<string, CarrierPortalSession> = new Map();
  private documents: Map<string, CarrierDocument> = new Map();
  private notifications: Map<string, CarrierNotification> = new Map();

  /**
   * Register carrier for portal access
   */
  async registerCarrier(
    carrier: Omit<Carrier, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    const carrierId = `carrier-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const newCarrier: Carrier = {
      ...carrier,
      id: carrierId,
      portalAccess: {
        enabled: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.carriers.set(carrierId, newCarrier);

    await eventBus.publish("transportation.carrier.registered", {
      carrierId,
      name: carrier.name,
      timestamp: new Date().toISOString(),
    });

    return carrierId;
  }

  /**
   * Authenticate carrier for portal
   */
  async authenticateCarrier(
    carrierId: string,
    credentials: { username?: string; password?: string; apiKey?: string },
  ): Promise<{ session: CarrierPortalSession; carrier: Carrier }> {
    const carrier = this.carriers.get(carrierId);
    if (!carrier || !carrier.portalAccess.enabled) {
      throw new Error("Carrier not found or portal access disabled");
    }

    // In production, validate credentials against database
    // For now, simple validation
    if (credentials.apiKey) {
      // Validate API key
    }

    // Create session
    const session: CarrierPortalSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      carrierId,
      token: `token-${Date.now()}-${Math.random().toString(36).substring(2, 18)}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date(),
    };

    this.sessions.set(session.id, session);

    // Update carrier last login
    carrier.portalAccess.lastLogin = new Date();
    this.carriers.set(carrierId, carrier);

    await eventBus.publish("transportation.carrier.authenticated", {
      carrierId,
      sessionId: session.id,
      timestamp: new Date().toISOString(),
    });

    return { session, carrier };
  }

  /**
   * Get carrier dashboard
   */
  async getCarrierDashboard(carrierId: string): Promise<CarrierDashboard> {
    const carrier = this.carriers.get(carrierId);
    if (!carrier) {
      throw new Error("Carrier not found");
    }

    // In production, fetch from database
    const statistics = {
      totalShipments: 0,
      activeShipments: 0,
      completedShipments: 0,
      onTimeRate: 0,
      averageTransitTime: 0,
      totalRevenue: 0,
      pendingPayments: 0,
    };

    const recentShipments: CarrierShipmentView[] = [];
    const pendingActions = {
      documentsToUpload: 0,
      statusUpdates: 0,
      exceptionsToReport: 0,
    };

    const carrierNotifications = Array.from(this.notifications.values()).filter(
      (n) => n.carrierId === carrierId && !n.read,
    );

    return {
      carrierId,
      statistics,
      recentShipments,
      pendingActions,
      notifications: carrierNotifications,
      generatedAt: new Date(),
    };
  }

  /**
   * Get shipments assigned to carrier
   */
  async getCarrierShipments(
    carrierId: string,
    filters?: {
      status?: Shipment["status"][];
      dateFrom?: Date;
      dateTo?: Date;
    },
  ): Promise<CarrierShipmentView[]> {
    // In production, fetch from database
    // For now, return empty array
    const shipments: CarrierShipmentView[] = [];

    // Filter by status
    if (filters?.status) {
      return shipments.filter((s) => filters.status!.includes(s.status));
    }

    return shipments;
  }

  /**
   * Update shipment status (carrier)
   */
  async updateShipmentStatus(
    carrierId: string,
    shipmentId: string,
    status: Shipment["status"],
    notes?: string,
  ): Promise<void> {
    const carrier = this.carriers.get(carrierId);
    if (!carrier) {
      throw new Error("Carrier not found");
    }

    // In production, update in database
    // For now, publish event

    await eventBus.publish("transportation.shipment.status.updated", {
      shipmentId,
      carrierId,
      status,
      notes,
      updatedBy: "carrier",
      timestamp: new Date().toISOString(),
    });

    // Send real-time update
    await transportationRealtimeService.broadcastUpdate({
      type: "SHIPMENT_STATUS",
      shipmentId,
      data: { status, notes },
      timestamp: new Date().toISOString(),
    });

    // Send webhook if configured
    await transportationWebhookService.triggerWebhook({
      type: "shipment.status.changed",
      data: { shipmentId, status, carrierId },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Add tracking event (carrier)
   */
  async addTrackingEvent(
    carrierId: string,
    shipmentId: string,
    event: {
      status: string;
      location?: Shipment["currentLocation"];
      description: string;
      timestamp: Date;
    },
  ): Promise<void> {
    const carrier = this.carriers.get(carrierId);
    if (!carrier) {
      throw new Error("Carrier not found");
    }

    await eventBus.publish("transportation.shipment.tracking.event.added", {
      shipmentId,
      carrierId,
      event,
      timestamp: new Date().toISOString(),
    });

    // Send real-time update
    await transportationRealtimeService.broadcastUpdate({
      type: "LOCATION_UPDATE",
      shipmentId,
      data: { location: event.location, status: event.status },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Upload document (carrier)
   */
  async uploadDocument(
    carrierId: string,
    shipmentId: string,
    document: {
      type: CarrierDocument["type"];
      name: string;
      url: string;
      metadata?: Record<string, any>;
    },
  ): Promise<string> {
    const carrier = this.carriers.get(carrierId);
    if (!carrier) {
      throw new Error("Carrier not found");
    }

    const documentId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const newDocument: CarrierDocument = {
      id: documentId,
      shipmentId,
      type: document.type,
      name: document.name,
      url: document.url,
      uploadedBy: carrierId,
      uploadedAt: new Date(),
      status: "PENDING",
      metadata: document.metadata,
    };

    this.documents.set(documentId, newDocument);

    await eventBus.publish("transportation.carrier.document.uploaded", {
      documentId,
      shipmentId,
      carrierId,
      documentType: document.type,
      timestamp: new Date().toISOString(),
    });

    // Notify shipper
    await this.createNotification({
      carrierId,
      type: "DOCUMENT_UPLOADED",
      title: "Document Uploaded",
      message: `Carrier ${carrier.name} uploaded ${document.type} for shipment ${shipmentId}`,
      priority: "MEDIUM",
      read: false,
      createdAt: new Date(),
    });

    return documentId;
  }

  /**
   * Report exception (carrier)
   */
  async reportException(
    carrierId: string,
    shipmentId: string,
    exception: {
      type: string;
      severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      description: string;
      location?: Shipment["currentLocation"];
      estimatedImpact?: string;
    },
  ): Promise<void> {
    const carrier = this.carriers.get(carrierId);
    if (!carrier) {
      throw new Error("Carrier not found");
    }

    await eventBus.publish("transportation.shipment.exception", {
      shipmentId,
      carrierId,
      exception,
      reportedBy: "carrier",
      timestamp: new Date().toISOString(),
    });

    // Create notification for shipper
    await this.createNotification({
      carrierId,
      type: "EXCEPTION",
      title: "Exception Reported",
      message: `Carrier ${carrier.name} reported ${exception.type} for shipment ${shipmentId}`,
      priority: exception.severity === "CRITICAL" ? "URGENT" : "HIGH",
      read: false,
      createdAt: new Date(),
    });
  }

  /**
   * Create notification
   */
  private async createNotification(
    notification: Omit<CarrierNotification, "id">,
  ): Promise<string> {
    const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const newNotification: CarrierNotification = {
      ...notification,
      id: notificationId,
    };

    this.notifications.set(notificationId, newNotification);

    // Send real-time notification if carrier is connected
    await transportationRealtimeService.broadcastUpdate({
      type: "NOTIFICATION",
      shipmentId: undefined,
      data: { notification: newNotification },
      timestamp: new Date().toISOString(),
    });

    return notificationId;
  }

  /**
   * Get carrier by ID
   */
  getCarrier(carrierId: string): Carrier | undefined {
    return this.carriers.get(carrierId);
  }

  /**
   * Get session by token
   */
  getSession(token: string): CarrierPortalSession | undefined {
    return Array.from(this.sessions.values()).find((s) => s.token === token);
  }

  /**
   * List all carriers
   */
  listCarriers(): Carrier[] {
    return Array.from(this.carriers.values());
  }
}

export const carrierCollaborationService = new CarrierCollaborationService();

/**
 * WhatsApp Geofence Integration
 *
 * WhatsApp notifications for geofence events
 * Already integrated in geofence service
 *
 * @module whatsapp
 */

// This is already implemented in lib/services/geofence/whatsapp-integration.ts
// Re-export for convenience

export {
  GEOFENCE_WHATSAPP_TEMPLATES,
  sendGeofenceWhatsAppNotification,
  handleGeofenceQuantumTrigger,
} from "@/lib/services/geofence/whatsapp-integration";

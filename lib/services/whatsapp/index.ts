/**
 * WhatsApp Service
 *
 * Main export file
 *
 * @module whatsapp
 */

export * from "./quantum-integration";
export * from "./geofence-integration";

export {
  WHATSAPP_ARABIC_TEMPLATES,
  handleWhatsAppMessageForQuantum,
  sendQuantumStateWhatsAppNotification,
  handleWhatsAppCommand,
} from "./quantum-integration";

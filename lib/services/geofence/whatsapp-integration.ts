/**
 * Geofence WhatsApp Integration
 *
 * WhatsApp notifications for geofence events
 * Arabic templates, quantum triggers
 *
 * @module geofence
 */

import { eventBus, createEvent } from "@/lib/services/event-store";
import type { GeofenceEvent, GeofenceZone } from "./types";
import type { CollapseTrigger } from "@/lib/services/schrodingers-truck/types";

/**
 * WhatsApp message templates
 */
export const GEOFENCE_WHATSAPP_TEMPLATES = {
  ZONE_ENTRY: {
    ar: "🚚 السائق {driver_name} وصل إلى {zone_name} في {time}",
    en: "🚚 Driver {driver_name} arrived at {zone_name} at {time}",
  },
  ZONE_EXIT: {
    ar: "🚚 السائق {driver_name} غادر {zone_name} في {time}",
    en: "🚚 Driver {driver_name} left {zone_name} at {time}",
  },
  DWELL_TIME_WARNING: {
    ar: "⚠️ تجاوز وقت الانتظار المتوقع في {zone_name}",
    en: "⚠️ Expected dwell time exceeded at {zone_name}",
  },
  DWELL_TIME_EXCEEDED: {
    ar: "🚨 تجاوز وقت الانتظار الأقصى في {zone_name}",
    en: "🚨 Maximum dwell time exceeded at {zone_name}",
  },
};

/**
 * Send WhatsApp notification for geofence event
 */
export async function sendGeofenceWhatsAppNotification(
  event: GeofenceEvent,
  zone: GeofenceZone,
  driverName: string,
  tenantId: string,
): Promise<void> {
  try {
    // Get template
    const template =
      GEOFENCE_WHATSAPP_TEMPLATES[event.eventType] ||
      GEOFENCE_WHATSAPP_TEMPLATES.ZONE_ENTRY;

    // Format message
    const messageAr = template.ar
      .replace("{driver_name}", driverName)
      .replace("{zone_name}", zone.name)
      .replace("{time}", event.timestamp.toLocaleTimeString("ar-SA"));

    const messageEn = template.en
      .replace("{driver_name}", driverName)
      .replace("{zone_name}", zone.name)
      .replace("{time}", event.timestamp.toLocaleTimeString("en-US"));

    // Send WhatsApp (would integrate with WhatsApp service)
    await eventBus.publish(
      createEvent(
        "WhatsAppMessageSent",
        event.shipmentId || "system",
        "Shipment",
        {
          to: zone.metadata.contacts?.[0]?.phone || "",
          messageAr,
          messageEn,
          type: "geofence_notification",
          eventType: event.eventType,
        },
        1,
        {
          tenantId,
          correlationId: `whatsapp-${Date.now()}`,
          userId: "geofence-service",
        },
      ),
    );
  } catch (error) {
    console.warn("Error sending WhatsApp notification:", error);
  }
}

/**
 * Handle quantum state triggers from geofence
 */
export async function handleGeofenceQuantumTrigger(
  event: GeofenceEvent,
  zone: GeofenceZone,
  shipmentId: string,
  tenantId: string,
): Promise<void> {
  try {
    const { schrodingersTruckService } =
      await import("@/lib/services/schrodingers-truck/service");

    if (event.eventType === "ZONE_ENTRY") {
      // Positive signal for expected zone
      const trigger: CollapseTrigger = "GEOFENCE_ENTRY";
      await schrodingersTruckService.updateQuantumState(shipmentId, trigger, {
        zoneId: zone.id,
        positiveSignal: true,
      });
    } else if (event.eventType === "ZONE_EXIT") {
      // Update based on dwell time
      if (event.dwellTime && zone.metadata.expectedDwellTime) {
        const dwellRatio = event.dwellTime / zone.metadata.expectedDwellTime;
        if (dwellRatio > 1.5) {
          // Negative signal - exceeded expected time
          const trigger: CollapseTrigger = "GEOFENCE_EXIT";
          await schrodingersTruckService.updateQuantumState(
            shipmentId,
            trigger,
            {
              zoneId: zone.id,
              negativeSignal: true,
              adjustment: -0.1,
            },
          );
        }
      }
    }
  } catch (error) {
    console.warn("Error handling geofence quantum trigger:", error);
  }
}

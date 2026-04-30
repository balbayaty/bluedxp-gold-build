/**
 * WhatsApp Location Handler for Geofence
 *
 * Processes WhatsApp location messages and automatically:
 * - Extracts location data
 * - Creates zone drafts using AI location intelligence
 * - Sends confirmation messages
 * - Learns from corrections
 */

import { locationIntelligenceService } from "../ai/locationIntelligenceService";
import { geofenceZoneService } from "../zone-service";
import { eventBus } from "@/lib/services/event-store";
import type { LocationInput } from "../ai/locationIntelligenceService";

// ============================================================================
// TYPES
// ============================================================================

export interface WhatsAppLocationMessage {
  messageId: string;
  from: string;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number; // meters
    address?: string;
  };
  context?: {
    text?: string; // Accompanying text message
    shipmentId?: string;
    customerId?: string;
    zoneTypeHint?: string;
  };
}

export interface LocationProcessingResult {
  success: boolean;
  messageId: string;
  locationIntelligence: any; // LocationIntelligenceResult
  zoneDraft?: {
    id: string;
    name: string;
    type: string;
    confidence: number;
    autoCreated: boolean;
  };
  responseMessage: string;
  requiresConfirmation: boolean;
}

// ============================================================================
// SERVICE
// ============================================================================

class WhatsAppLocationHandler {
  /**
   * Process WhatsApp location message
   */
  async processLocationMessage(
    message: WhatsAppLocationMessage,
    tenantId: string,
  ): Promise<LocationProcessingResult> {
    try {
      // Convert WhatsApp location to LocationInput
      const locationInput: LocationInput = {
        type: "WHATSAPP_LOCATION",
        source: "whatsapp",
        data: {
          location: {
            lat: message.location.latitude,
            lng: message.location.longitude,
            accuracy: message.location.accuracy,
            address: message.location.address,
          },
          context: message.context,
        },
        metadata: {
          senderId: message.from,
          timestamp: message.timestamp,
        },
      };

      // Process with location intelligence
      const intelligence = await locationIntelligenceService.processLocation(
        locationInput,
        tenantId,
      );

      // Auto-create zone if confidence is high
      let zoneDraft;
      let autoCreated = false;
      if (
        intelligence.confidence >= 0.8 &&
        intelligence.accuracy.level !== "LOW" &&
        intelligence.accuracy.level !== "VERY_LOW"
      ) {
        try {
          const zone = await geofenceZoneService.createZone({
            name: intelligence.zoneDraft.name,
            type: intelligence.zoneDraft.type,
            geometry: intelligence.zoneDraft.suggestedGeometry,
            metadata: intelligence.zoneDraft.suggestedMetadata,
            tenantId,
            enabled: true,
          });

          zoneDraft = {
            id: zone.id,
            name: zone.name,
            type: zone.type,
            confidence: intelligence.confidence,
            autoCreated: true,
          };
          autoCreated = true;
        } catch (error) {
          console.warn("Could not auto-create zone:", error);
        }
      }

      // Generate response message
      const responseMessage = this.generateResponseMessage(
        intelligence,
        zoneDraft,
        autoCreated,
      );

      // Publish event
      await eventBus.publish({
        type: "geofence.whatsapp.location.processed",
        data: {
          messageId: message.messageId,
          intelligence,
          zoneDraft,
          autoCreated,
        },
        metadata: {
          source: "whatsapp-location-handler",
          timestamp: new Date().toISOString(),
        },
      });

      return {
        success: true,
        messageId: message.messageId,
        locationIntelligence: intelligence,
        zoneDraft,
        responseMessage,
        requiresConfirmation: !autoCreated && intelligence.confidence < 0.8,
      };
    } catch (error) {
      console.error("Error processing WhatsApp location:", error);
      throw error;
    }
  }

  /**
   * Process text message that might contain location
   */
  async processTextLocation(
    text: string,
    from: string,
    context?: WhatsAppLocationMessage["context"],
    tenantId = "default",
  ): Promise<LocationProcessingResult> {
    const locationInput: LocationInput = {
      type: "TEXT",
      source: "whatsapp",
      data: {
        text,
        context,
      },
      metadata: {
        senderId: from,
        timestamp: new Date(),
      },
    };

    const intelligence = await locationIntelligenceService.processLocation(
      locationInput,
      tenantId,
    );

    const responseMessage = this.generateResponseMessage(
      intelligence,
      undefined,
      false,
    );

    return {
      success: true,
      messageId: `text-${Date.now()}`,
      locationIntelligence: intelligence,
      responseMessage,
      requiresConfirmation: true,
    };
  }

  /**
   * Confirm and create zone from draft
   */
  async confirmZoneCreation(
    messageId: string,
    zoneDraft: any,
    corrections?: {
      location?: { lat: number; lng: number };
      zoneType?: string;
      name?: string;
    },
    tenantId = "default",
  ): Promise<{ success: boolean; zoneId: string; message: string }> {
    try {
      // Apply corrections if provided
      const finalZone = {
        ...zoneDraft,
        ...(corrections?.location && {
          geometry: {
            ...zoneDraft.suggestedGeometry,
            coordinates: {
              ...zoneDraft.suggestedGeometry.coordinates,
              center: corrections.location,
            },
          },
        }),
        ...(corrections?.zoneType && { type: corrections.zoneType }),
        ...(corrections?.name && { name: corrections.name }),
      };

      // Create zone
      const zone = await geofenceZoneService.createZone({
        name: finalZone.name || zoneDraft.name,
        type: finalZone.type || zoneDraft.type,
        geometry: finalZone.suggestedGeometry || zoneDraft.suggestedGeometry,
        metadata: finalZone.suggestedMetadata || zoneDraft.suggestedMetadata,
        tenantId,
        enabled: true,
      });

      // Learn from corrections
      if (corrections?.location) {
        await locationIntelligenceService.learnFromCorrection(
          messageId,
          corrections.location,
          zone,
        );
      }

      return {
        success: true,
        zoneId: zone.id,
        message: `✅ Zone "${zone.name}" created successfully!`,
      };
    } catch (error) {
      console.error("Error confirming zone creation:", error);
      throw error;
    }
  }

  /**
   * Generate response message
   */
  private generateResponseMessage(
    intelligence: any,
    zoneDraft?: LocationProcessingResult["zoneDraft"],
    autoCreated = false,
  ): string {
    if (autoCreated && zoneDraft) {
      return (
        `✅ Zone "${zoneDraft.name}" created automatically!\n\n` +
        `📍 Location: ${intelligence.location.formattedAddress}\n` +
        `🎯 Type: ${zoneDraft.type}\n` +
        `📊 Confidence: ${(intelligence.confidence * 100).toFixed(0)}%\n` +
        `\nZone is now active and monitoring.`
      );
    }

    if (intelligence.confidence >= 0.7) {
      return (
        `📍 Location detected!\n\n` +
        `📍 Address: ${intelligence.location.formattedAddress}\n` +
        `🎯 Suggested Zone: ${intelligence.zoneDraft.name}\n` +
        `📊 Confidence: ${(intelligence.confidence * 100).toFixed(0)}%\n` +
        `\nReply "YES" to create this zone, or provide corrections.`
      );
    }

    return (
      `📍 Location received, but I need more information.\n\n` +
      `📍 Detected: ${intelligence.location.formattedAddress}\n` +
      `📊 Confidence: ${(intelligence.confidence * 100).toFixed(0)}%\n` +
      `\nPlease provide:\n` +
      `- Zone name\n` +
      `- Zone type (e.g., warehouse, border, customer site)\n` +
      `- Or send a more specific location`
    );
  }
}

export const whatsappLocationHandler = new WhatsAppLocationHandler();

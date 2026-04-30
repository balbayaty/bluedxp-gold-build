/**
 * Integration Layer for Schrödinger's Truck
 *
 * Integrates with WhatsApp, Geofence, GPS, Weather, Journey Analysis, and Event Store
 * Designed to work with existing services and prepare for future services
 *
 * @module schrodingers-truck
 */

import { eventStore, eventBus, createEvent } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import type {
  ShipmentQuantumState,
  CollapseTrigger,
  WhatsAppMessage,
  GeofenceEvent,
  GPSUpdate,
  WeatherAlert,
  TrafficAlert,
} from "./types";
import { probabilityEngine } from "./probability-engine";

// ============================================================================
// INTEGRATION HANDLERS
// ============================================================================

export class QuantumIntegrations {
  /**
   * Handle WhatsApp message - triggers waveform collapse
   * Integrates with existing WhatsApp service (when available)
   */
  async handleWhatsAppMessage(
    message: WhatsAppMessage,
    quantumState: ShipmentQuantumState,
  ): Promise<ShipmentQuantumState | null> {
    if (quantumState.collapsed) {
      return null; // Already collapsed, no update needed
    }

    const correlationId = `whatsapp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Analyze message sentiment and content
    const messageAnalysis = await this.analyzeWhatsAppMessage(message);

    // Trigger waveform collapse
    const updatedState = await probabilityEngine.collapseWaveform(
      quantumState,
      "WHATSAPP_PING",
      {
        messageType: message.type,
        messageText: message.message,
        responseTime: Date.now() - quantumState.lastObservation.getTime(),
        sentiment: messageAnalysis.sentiment,
        urgency: messageAnalysis.urgency,
        location: messageAnalysis.location,
      },
    );

    // Publish event
    await eventStore.append([
      createEvent(
        "QuantumStateCollapsed",
        quantumState.shipmentId,
        "Shipment",
        {
          trigger: "WHATSAPP_PING",
          previousState: quantumState.currentState,
          newState: updatedState.currentState,
          messageId: message.id,
        },
        quantumState.observationCount + 1,
        {
          tenantId: quantumState.tenantId,
          correlationId,
          userId: "whatsapp-service",
        },
      ),
    ]);

    // Store learning signal
    await this.storeCollapseLearning(
      quantumState,
      updatedState,
      "WHATSAPP_PING",
    );

    return updatedState;
  }

  /**
   * Handle geofence event - triggers waveform collapse
   * Works with future geofence service
   */
  async handleGeofenceEvent(
    event: GeofenceEvent,
    quantumState: ShipmentQuantumState,
  ): Promise<ShipmentQuantumState | null> {
    if (quantumState.collapsed) {
      return null;
    }

    const correlationId = `geofence-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Determine trigger type
    const trigger: CollapseTrigger =
      event.eventType === "entry" ? "GEOFENCE_ENTRY" : "GEOFENCE_EXIT";

    // Trigger waveform collapse
    const updatedState = await probabilityEngine.collapseWaveform(
      quantumState,
      trigger,
      {
        zoneId: event.zoneId,
        zoneName: event.zoneName,
        location: event.location,
        dwellTime: event.dwellTime,
        expected: await this.isExpectedZone(
          event.zoneId,
          quantumState.shipmentId,
        ),
      },
    );

    // Publish event
    await eventStore.append([
      createEvent(
        "QuantumStateCollapsed",
        quantumState.shipmentId,
        "Shipment",
        {
          trigger,
          previousState: quantumState.currentState,
          newState: updatedState.currentState,
          geofenceEventId: event.id,
        },
        quantumState.observationCount + 1,
        {
          tenantId: quantumState.tenantId,
          correlationId,
          userId: "geofence-service",
        },
      ),
    ]);

    // Store learning signal
    await this.storeCollapseLearning(quantumState, updatedState, trigger);

    return updatedState;
  }

  /**
   * Handle GPS update - triggers waveform collapse
   * Integrates with existing transportation services
   */
  async handleGPSUpdate(
    update: GPSUpdate,
    quantumState: ShipmentQuantumState,
  ): Promise<ShipmentQuantumState | null> {
    if (quantumState.collapsed) {
      return null;
    }

    const correlationId = `gps-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Check if on track (would integrate with route service)
    const onTrack = await this.checkIfOnTrack(update, quantumState.shipmentId);

    // Trigger waveform collapse
    const updatedState = await probabilityEngine.collapseWaveform(
      quantumState,
      "GPS_UPDATE",
      {
        location: update.location,
        speed: update.speed,
        heading: update.heading,
        onTrack,
        estimatedArrival: update.estimatedArrival,
        accuracy: update.location.accuracy,
      },
    );

    // Publish event
    await eventStore.append([
      createEvent(
        "QuantumStateCollapsed",
        quantumState.shipmentId,
        "Shipment",
        {
          trigger: "GPS_UPDATE",
          previousState: quantumState.currentState,
          newState: updatedState.currentState,
          onTrack,
        },
        quantumState.observationCount + 1,
        {
          tenantId: quantumState.tenantId,
          correlationId,
          userId: "gps-service",
        },
      ),
    ]);

    // Store learning signal
    await this.storeCollapseLearning(quantumState, updatedState, "GPS_UPDATE");

    return updatedState;
  }

  /**
   * Handle weather alert - triggers waveform collapse
   */
  async handleWeatherAlert(
    alert: WeatherAlert,
    quantumState: ShipmentQuantumState,
  ): Promise<ShipmentQuantumState | null> {
    if (quantumState.collapsed) {
      return null;
    }

    const correlationId = `weather-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Trigger waveform collapse
    const updatedState = await probabilityEngine.collapseWaveform(
      quantumState,
      "WEATHER_ALERT",
      {
        condition: alert.condition,
        severity: alert.severity,
        location: alert.location,
        forecast: alert.forecast,
      },
    );

    // Publish event
    await eventStore.append([
      createEvent(
        "QuantumStateCollapsed",
        quantumState.shipmentId,
        "Shipment",
        {
          trigger: "WEATHER_ALERT",
          previousState: quantumState.currentState,
          newState: updatedState.currentState,
          weatherAlertId: alert.id,
        },
        quantumState.observationCount + 1,
        {
          tenantId: quantumState.tenantId,
          correlationId,
          userId: "weather-service",
        },
      ),
    ]);

    // Store learning signal
    await this.storeCollapseLearning(
      quantumState,
      updatedState,
      "WEATHER_ALERT",
    );

    return updatedState;
  }

  /**
   * Handle traffic alert - triggers waveform collapse
   */
  async handleTrafficAlert(
    alert: TrafficAlert,
    quantumState: ShipmentQuantumState,
  ): Promise<ShipmentQuantumState | null> {
    if (quantumState.collapsed) {
      return null;
    }

    const correlationId = `traffic-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Trigger waveform collapse
    const updatedState = await probabilityEngine.collapseWaveform(
      quantumState,
      "TRAFFIC_ALERT",
      {
        congestionLevel: alert.congestionLevel,
        delayMinutes: alert.delayMinutes,
        location: alert.location,
        incident: alert.incident,
      },
    );

    // Publish event
    await eventStore.append([
      createEvent(
        "QuantumStateCollapsed",
        quantumState.shipmentId,
        "Shipment",
        {
          trigger: "TRAFFIC_ALERT",
          previousState: quantumState.currentState,
          newState: updatedState.currentState,
          trafficAlertId: alert.id,
        },
        quantumState.observationCount + 1,
        {
          tenantId: quantumState.tenantId,
          correlationId,
          userId: "traffic-service",
        },
      ),
    ]);

    // Store learning signal
    await this.storeCollapseLearning(
      quantumState,
      updatedState,
      "TRAFFIC_ALERT",
    );

    return updatedState;
  }

  /**
   * Handle Journey Analysis touchpoint - triggers waveform collapse
   * Integrates with existing Journey Analysis service
   */
  async handleJourneyTouchpoint(
    touchpointId: string,
    touchpointType: string,
    quantumState: ShipmentQuantumState,
  ): Promise<ShipmentQuantumState | null> {
    if (quantumState.collapsed) {
      return null;
    }

    const correlationId = `journey-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Trigger waveform collapse
    const updatedState = await probabilityEngine.collapseWaveform(
      quantumState,
      "JOURNEY_TOUCHPOINT",
      {
        touchpointId,
        touchpointType,
      },
    );

    // Publish event
    await eventStore.append([
      createEvent(
        "QuantumStateCollapsed",
        quantumState.shipmentId,
        "Shipment",
        {
          trigger: "JOURNEY_TOUCHPOINT",
          previousState: quantumState.currentState,
          newState: updatedState.currentState,
          touchpointId,
        },
        quantumState.observationCount + 1,
        {
          tenantId: quantumState.tenantId,
          correlationId,
          userId: "journey-analysis-service",
        },
      ),
    ]);

    // Store learning signal
    await this.storeCollapseLearning(
      quantumState,
      updatedState,
      "JOURNEY_TOUCHPOINT",
    );

    return updatedState;
  }

  /**
   * Handle exception detection - triggers waveform collapse
   * Integrates with existing exception handling
   */
  async handleException(
    exceptionId: string,
    exceptionType: string,
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    quantumState: ShipmentQuantumState,
  ): Promise<ShipmentQuantumState | null> {
    if (quantumState.collapsed) {
      return null;
    }

    const correlationId = `exception-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Trigger waveform collapse
    const updatedState = await probabilityEngine.collapseWaveform(
      quantumState,
      "EXCEPTION_DETECTED",
      {
        exceptionId,
        exceptionType,
        severity,
      },
    );

    // Publish event
    await eventStore.append([
      createEvent(
        "QuantumStateCollapsed",
        quantumState.shipmentId,
        "Shipment",
        {
          trigger: "EXCEPTION_DETECTED",
          previousState: quantumState.currentState,
          newState: updatedState.currentState,
          exceptionId,
        },
        quantumState.observationCount + 1,
        {
          tenantId: quantumState.tenantId,
          correlationId,
          userId: "exception-service",
        },
      ),
    ]);

    // Store learning signal
    await this.storeCollapseLearning(
      quantumState,
      updatedState,
      "EXCEPTION_DETECTED",
    );

    return updatedState;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Analyze WhatsApp message for sentiment and urgency
   */
  private async analyzeWhatsAppMessage(message: WhatsAppMessage): Promise<{
    sentiment: "positive" | "neutral" | "negative";
    urgency: "low" | "medium" | "high";
    location?: { lat: number; lng: number };
  }> {
    // Simple analysis (in production, would use NLP)
    const text = message.message.toLowerCase();

    let sentiment: "positive" | "neutral" | "negative" = "neutral";
    if (
      text.includes("ok") ||
      text.includes("yes") ||
      text.includes("تمام") ||
      text.includes("نعم")
    ) {
      sentiment = "positive";
    } else if (
      text.includes("no") ||
      text.includes("problem") ||
      text.includes("مشكلة") ||
      text.includes("لا")
    ) {
      sentiment = "negative";
    }

    let urgency: "low" | "medium" | "high" = "low";
    if (
      text.includes("urgent") ||
      text.includes("asap") ||
      text.includes("عاجل")
    ) {
      urgency = "high";
    } else if (
      text.includes("soon") ||
      text.includes("quick") ||
      text.includes("سريع")
    ) {
      urgency = "medium";
    }

    // Try to extract location from message
    let location: { lat: number; lng: number } | undefined;
    if (message.type === "location" && message.metadata?.location) {
      location = message.metadata.location;
    }

    return { sentiment, urgency, location };
  }

  /**
   * Check if geofence zone is expected for this shipment
   */
  private async isExpectedZone(
    zoneId: string,
    shipmentId: string,
  ): Promise<boolean> {
    // In production, would check against shipment route and expected zones
    // For now, return true (assume expected)
    try {
      const knowledge = await knowledgeBaseService.search({
        query: `shipment ${shipmentId} expected zones geofence`,
        limit: 1,
      });
      if (knowledge.length > 0 && knowledge[0].entry.metadata?.expectedZones) {
        return knowledge[0].entry.metadata.expectedZones.includes(zoneId);
      }
    } catch (error) {
      console.warn("Error checking expected zone:", error);
    }
    return true; // Default to expected
  }

  /**
   * Check if GPS location is on track
   */
  private async checkIfOnTrack(
    update: GPSUpdate,
    shipmentId: string,
  ): Promise<boolean> {
    // In production, would check against route and waypoints
    // For now, use the onTrack value if provided
    if (update.onTrack !== undefined) {
      return update.onTrack;
    }

    // Try to get from Knowledge Base
    try {
      const knowledge = await knowledgeBaseService.search({
        query: `shipment ${shipmentId} route waypoints`,
        limit: 1,
      });
      if (knowledge.length > 0 && knowledge[0].entry.metadata?.route) {
        // Simple distance check (in production, would use proper route matching)
        return true; // Simplified
      }
    } catch (error) {
      console.warn("Error checking if on track:", error);
    }

    return true; // Default to on track
  }

  /**
   * Store collapse learning signal in Knowledge Base
   */
  private async storeCollapseLearning(
    previousState: ShipmentQuantumState,
    newState: ShipmentQuantumState,
    trigger: CollapseTrigger,
  ): Promise<void> {
    try {
      const lastCollapse =
        newState.collapseHistory[newState.collapseHistory.length - 1];
      if (!lastCollapse) return;

      await knowledgeBaseService.learn({
        tenantId: newState.tenantId,
        agentId: "schrodingers-truck",
        type: "waveform_collapse",
        trigger: `Quantum state collapsed via ${trigger}`,
        input: {
          previousState: previousState.currentState,
          previousProbabilities: previousState.probabilities,
          trigger,
        },
        output: {
          newState: newState.currentState,
          newProbabilities: newState.probabilities,
        },
        confidence: lastCollapse.confidence,
        success: true,
      });
    } catch (error) {
      console.warn("Error storing collapse learning:", error);
    }
  }
}

// Export singleton instance
export const quantumIntegrations = new QuantumIntegrations();
